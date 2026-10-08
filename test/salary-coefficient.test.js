const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const test = require('node:test');
const { createApp } = require('../src/app');

function validCoefficient(overrides = {}) {
  return {
    coefficientCode: 'HSL_02',
    civilServantRank: 'GVCC',
    salaryStep: 2,
    coefficient: '4.40',
    ...overrides
  };
}

async function withServer(run) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qlns-salary-test-'));
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

async function postCoefficient(baseUrl, payload) {
  return fetch(`${baseUrl}/api/salary-coefficients`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function countCoefficients(database) {
  return database.prepare(
    'SELECT COUNT(*) AS count FROM salary_coefficients'
  ).get().count;
}

test('ADD_S01: creates and persists a valid salary coefficient', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient());
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.message, 'Hệ số lương đã được thêm thành công');
    assert.deepEqual(body.salaryCoefficient, {
      id: 1,
      coefficientCode: 'HSL_02',
      civilServantRank: 'GVCC',
      salaryStep: 2,
      coefficient: 4.4
    });
    assert.deepEqual(
      app.locals.database.prepare(`
        SELECT coefficient_code AS coefficientCode,
          civil_servant_rank AS civilServantRank,
          salary_step AS salaryStep, coefficient
        FROM salary_coefficients
      `).get(),
      {
        coefficientCode: 'HSL_02',
        civilServantRank: 'GVCC',
        salaryStep: 2,
        coefficient: 4.4
      }
    );
  });
});

test('ADD_S02: all required values blank reports every required field and does not save', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, {
      coefficientCode: '',
      civilServantRank: '',
      salaryStep: '',
      coefficient: ''
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    for (const field of [
      'coefficientCode', 'civilServantRank', 'salaryStep', 'coefficient'
    ]) {
      assert.ok(body.errors.some((error) => error.field === field), field);
    }
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S03: duplicate coefficient code is rejected without another row', async () => {
  await withServer(async ({ app, baseUrl }) => {
    assert.equal((await postCoefficient(baseUrl, validCoefficient())).status, 201);
    const response = await postCoefficient(baseUrl, validCoefficient({
      civilServantRank: 'GV',
      salaryStep: 1
    }));
    assert.equal(response.status, 409);
    assert.equal((await response.json()).message, 'Mã hệ số lương đã tồn tại');
    assert.equal(countCoefficients(app.locals.database), 1);
  });
});

test('ADD_S04: missing civil-servant rank returns its specified error', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      civilServantRank: ''
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Vui lòng điền ngạch viên chức');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S05: missing salary step returns its specified error', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      salaryStep: ''
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Vui lòng điền bậc lương');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S06: fractional salary step is rejected', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      salaryStep: 2.5
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Bậc lương phải là số nguyên');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S07: textual salary step is rejected', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      salaryStep: 'Hai'
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Bậc lương phải là số nguyên');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S08: same rank and step cannot be created twice', async () => {
  await withServer(async ({ app, baseUrl }) => {
    assert.equal((await postCoefficient(baseUrl, validCoefficient())).status, 201);
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficientCode: 'HSL_03'
    }));
    assert.equal(response.status, 409);
    assert.match((await response.json()).message, /Bậc lương đã tồn tại/);
    assert.equal(countCoefficients(app.locals.database), 1);
  });
});

test('ADD_S09: same salary step in a different rank is allowed', async () => {
  await withServer(async ({ app, baseUrl }) => {
    assert.equal((await postCoefficient(baseUrl, validCoefficient())).status, 201);
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficientCode: 'HSL_03',
      civilServantRank: 'GV',
      salaryStep: 2
    }));
    assert.equal(response.status, 201);
    assert.equal(countCoefficients(app.locals.database), 2);
  });
});

test('ADD_S10: zero coefficient is rejected', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficient: 0
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Hệ số lương phải là số thực lớn hơn 0');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S11: negative coefficient is rejected', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficient: -1
    }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /số thực lớn hơn 0/);
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S12: positive coefficient 0.01 is accepted and persisted', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficient: '0.01'
    }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).salaryCoefficient.coefficient, 0.01);
    assert.equal(countCoefficients(app.locals.database), 1);
  });
});

test('ADD_S13: nonnumeric coefficient is rejected', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await postCoefficient(baseUrl, validCoefficient({
      coefficient: 'abc'
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, 'Hệ số lương phải là số thực lớn hơn 0');
    assert.equal(countCoefficients(app.locals.database), 0);
  });
});

test('ADD_S14: not submitting the create request leaves the catalog unchanged', async () => {
  await withServer(async ({ app }) => {
    const before = countCoefficients(app.locals.database);
    assert.equal(before, 0);
    assert.equal(countCoefficients(app.locals.database), before);
  });
});
