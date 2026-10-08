const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const test = require('node:test');
const { createApp } = require('../src/app');

function employeeFixture(database, employeeCode) {
  return database.prepare(`
    INSERT INTO employee (
      employee_code, full_name, gender, birth_date, hometown, email,
      phone, address, national_id, portrait_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employeeCode,
    'Nguyễn Văn A',
    'Nam',
    '1990-01-01',
    'Hà Nội',
    `${employeeCode.toLowerCase()}@employee.test`,
    '0900000000',
    'Hà Nội',
    employeeCode.padEnd(12, '0').slice(0, 12),
    'fixture.png'
  ).lastInsertRowid;
}

function accountInput(overrides = {}) {
  return {
    email: 'user@example.com',
    employeeCode: 'NS01',
    role: 'Cán bộ',
    ...overrides
  };
}

async function withServer(run) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qlns-user-test-'));
  const app = createApp({
    databasePath: path.join(temporaryDirectory, 'test.sqlite'),
    uploadsDirectory: path.join(temporaryDirectory, 'uploads')
  });
  const server = app.listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run({ app, baseUrl });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    app.locals.database.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function postAccount(baseUrl, input) {
  return fetch(`${baseUrl}/api/user-accounts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
}

function accountCount(database) {
  return database.prepare('SELECT COUNT(*) AS count FROM user_accounts').get().count;
}

test('ADD_U01: creates account, links employee, and defaults username/password to employee code', async () => {
  await withServer(async ({ app, baseUrl }) => {
    employeeFixture(app.locals.database, 'NS01');

    const response = await postAccount(baseUrl, accountInput());
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.message, 'Thêm tài khoản thành công');
    assert.equal(body.account.username, 'NS01');
    assert.equal(body.account.defaultPassword, 'NS01');
    assert.equal(body.account.role, 'Cán bộ');

    const saved = app.locals.database.prepare(`
      SELECT a.email, a.username, a.default_password AS defaultPassword, a.role,
        e.employee_code AS employeeCode
      FROM user_accounts a JOIN employee e ON e.id = a.employee_id
    `).get();
    assert.deepEqual(saved, {
      email: 'user@example.com',
      username: 'NS01',
      defaultPassword: 'NS01',
      role: 'Cán bộ',
      employeeCode: 'NS01'
    });
  });
});

test('ADD_U02: all fields blank returns each required error and creates no account', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postAccount(baseUrl, {
      email: '',
      employeeCode: '',
      role: ''
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.errors.some((error) =>
      error.field === 'email' && error.message === 'Vui lòng nhập email'));
    assert.ok(body.errors.some((error) =>
      error.field === 'employeeCode' && error.message === 'Vui lòng chọn hồ sơ nhân sự'));
    assert.ok(body.errors.some((error) =>
      error.field === 'role' && error.message === 'Vui lòng chọn phân quyền'));
    assert.equal(accountCount(app.locals.database), 0);
  });
});

test('ADD_U03: blank email returns the specified message and does not save', async () => {
  await withServer(async ({ app, baseUrl }) => {
    employeeFixture(app.locals.database, 'NS01');
    const response = await postAccount(baseUrl, accountInput({ email: '' }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Vui lòng nhập email');
    assert.equal(accountCount(app.locals.database), 0);
  });
});

for (const [testCase, email] of [
  ['ADD_U04', 'tungemail.com'],
  ['ADD_U05', 'tung@'],
  ['ADD_U06', 'tung ht@school.com']
]) {
  test(`${testCase}: rejects invalid email format without saving`, async () => {
    await withServer(async ({ app, baseUrl }) => {
      employeeFixture(app.locals.database, 'NS01');
      const response = await postAccount(baseUrl, accountInput({ email }));
      assert.equal(response.status, 400);
      assert.equal(
        (await response.json()).message,
        'Vui lòng nhập đúng định dạng email'
      );
      assert.equal(accountCount(app.locals.database), 0);
    });
  });
}

test('ADD_U07: missing employee profile returns the specified message and does not save', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postAccount(baseUrl, accountInput({ employeeCode: '' }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Vui lòng chọn hồ sơ nhân sự');
    assert.equal(accountCount(app.locals.database), 0);
  });
});

test('rejects an employee code that does not exist in the shared employee table', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postAccount(baseUrl, accountInput({ employeeCode: 'NS404' }));
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'Không tìm thấy hồ sơ nhân sự');
    assert.equal(accountCount(app.locals.database), 0);
  });
});

test('ADD_U08: rejects second account for employee with a linked account', async () => {
  await withServer(async ({ app, baseUrl }) => {
    employeeFixture(app.locals.database, 'NS02');
    const first = await postAccount(baseUrl, accountInput({
      email: 'first@example.com',
      employeeCode: 'NS02'
    }));
    assert.equal(first.status, 201);

    const second = await postAccount(baseUrl, accountInput({
      email: 'second@example.com',
      employeeCode: 'NS02'
    }));
    assert.equal(second.status, 409);
    assert.equal((await second.json()).message, 'Nhân sự đã có tài khoản');
    assert.equal(accountCount(app.locals.database), 1);
    assert.throws(() => {
      app.locals.database.prepare(`
        INSERT INTO user_accounts (
          email, employee_id, username, default_password, role
        ) VALUES (?, ?, ?, ?, ?)
      `).run('third@example.com', 1, 'NS02', 'NS02', 'Cán bộ');
    }, { code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });
});

test('ADD_U09: blank role returns the specified message and does not save', async () => {
  await withServer(async ({ app, baseUrl }) => {
    employeeFixture(app.locals.database, 'NS01');
    const response = await postAccount(baseUrl, accountInput({ role: '' }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Vui lòng chọn phân quyền');
    assert.equal(accountCount(app.locals.database), 0);
  });
});

for (const [testCase, role] of [
  ['ADD_U10', 'Quản trị viên'],
  ['ADD_U11', 'Nhân sự phòng TCCB']
]) {
  test(`${testCase}: accepts role ${role}`, async () => {
    await withServer(async ({ app, baseUrl }) => {
      employeeFixture(app.locals.database, 'NS01');
      const response = await postAccount(baseUrl, accountInput({ role }));
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.message, 'Thêm tài khoản thành công');
      assert.equal(body.account.role, role);
      assert.equal(body.account.username, 'NS01');
      assert.equal(body.account.defaultPassword, 'NS01');
      assert.equal(accountCount(app.locals.database), 1);
    });
  });
}

test('ADD_U12: not submitting account creation leaves database unchanged', async () => {
  await withServer(async ({ app }) => {
    employeeFixture(app.locals.database, 'NS01');
    const before = accountCount(app.locals.database);
    assert.equal(before, 0);
    assert.equal(accountCount(app.locals.database), before);
  });
});
