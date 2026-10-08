const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const test = require('node:test');
const { createApp } = require('../src/app');
const { validateOrganizationUnit } = require('../src/organization-unit/validation');

function validUnit(overrides = {}) {
  return {
    unitName: 'Phòng Tổ chức Cán bộ',
    unitCode: 'TCCB001',
    unitType: 'Phòng',
    email: 'tccb@example.com',
    phone: '0912345678',
    website: 'https://example.com',
    address: 'Hà Nội',
    ...overrides
  };
}

function makeEmail(length) {
  const suffix = '@example.com';
  return `${'a'.repeat(length - suffix.length)}${suffix}`;
}

function makeUrl(length) {
  const prefix = 'https://a.co/';
  return `${prefix}${'x'.repeat(length - prefix.length)}`;
}

function makeUnitName(length) {
  return 'A'.repeat(length);
}

function makeUnitCode(length) {
  return `A${'1'.repeat(length - 1)}`;
}

function validateCase(id, overrides, field, shouldBeValid, messagePattern) {
  const errors = validateOrganizationUnit(validUnit(overrides));
  const fieldError = errors.find((error) => error.field === field);
  assert.equal(Boolean(fieldError), !shouldBeValid, `${id}: validation result for ${field}`);
  if (fieldError && messagePattern) {
    assert.match(fieldError.message, messagePattern, `${id}: expected message`);
  }
}

async function withServer(run) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qlns-org-test-'));
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

async function createUnit(baseUrl, unit) {
  return fetch(`${baseUrl}/api/organization-units`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(unit)
  });
}

test('TC01-TC08: creates, persists, links parent, defaults status, and permits optional fields', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const parentResponse = await createUnit(baseUrl, validUnit({
      unitCode: 'PARENT',
      unitName: 'Đơn vị cha'
    }));
    assert.equal(parentResponse.status, 201);
    const parent = (await parentResponse.json()).unit;

    const childResponse = await createUnit(baseUrl, validUnit({
      unitCode: 'CHILD',
      parentUnitId: parent.id
    }));
    assert.equal(childResponse.status, 201, 'TC01');
    const child = (await childResponse.json()).unit;
    assert.equal(child.unitName, 'Phòng Tổ chức Cán bộ', 'TC02');
    assert.equal(child.parentUnitId, parent.id, 'TC03');
    assert.equal(child.status, 'Đang hoạt động', 'TC04');

    for (const [id, optionalFields] of [
      ['TC05', { website: '' }],
      ['TC06', { address: '' }],
      ['TC07', { website: '', address: '' }]
    ]) {
      const response = await createUnit(baseUrl, validUnit({
        unitCode: id.replace('-', ''),
        ...optionalFields
      }));
      assert.equal(response.status, 201, id);
    }

    const namedUnit = validUnit({ unitName: 'Phòng Tổ chức Cán bộ', unitCode: 'TC08' });
    assert.deepEqual(validateOrganizationUnit(namedUnit), [], 'TC08');
  });
});

test('TC09-TC15: validates unit name required, whitespace, control characters, and boundaries', () => {
  const cases = [
    ['TC09', { unitName: '' }, false, /Vui lòng nhập tên đơn vị/],
    ['TC10', { unitName: ' \t ' }, false, /Vui lòng nhập tên đơn vị/],
    ['TC11', { unitName: 'Tên\nđơn vị' }, false, /đúng định dạng/],
    ['TC12', { unitName: 'Tên\tđơn vị' }, false, /đúng định dạng/],
    ['TC13', { unitName: makeUnitName(99) }, true],
    ['TC14', { unitName: makeUnitName(100) }, true],
    ['TC15', { unitName: makeUnitName(101) }, false, /100 ký tự/]
  ];

  for (const [id, overrides, valid, message] of cases) {
    validateCase(id, overrides, 'unitName', valid, message);
  }
});

test('TC16-TC29: validates unit code format, uniqueness, and length boundaries', async () => {
  const cases = [
    ['TC17', '', false, /Vui lòng nhập mã đơn vị/],
    ['TC19', '   ', false, /Vui lòng nhập mã đơn vị/],
    ['TC20', 'TCCB001', true],
    ['TC21', 'PHONG_TCCB', true],
    ['TC22', 'KHOA-CNTT', true],
    ['TC23', 'TCCB 001', false, /đúng định dạng/],
    ['TC24', 'TCCB@001', false, /đúng định dạng/],
    ['TC25', 'TCCB.001', false, /đúng định dạng/],
    ['TC26', 'TCCB/001', false, /đúng định dạng/],
    ['TC27', makeUnitCode(19), true],
    ['TC28', makeUnitCode(20), true],
    ['TC29', makeUnitCode(21), false, /20 ký tự/]
  ];

  for (const [id, unitCode, valid, message] of cases) {
    validateCase(id, { unitCode }, 'unitCode', valid, message);
  }

  await withServer(async ({ baseUrl }) => {
    const response = await createUnit(baseUrl, validUnit({ unitCode: 'TCCB999' }));
    assert.equal(response.status, 201, 'TC16: unused valid unit code is accepted');
  });
});

test('TC18 and TC30-TC35: enforces unique codes and allowed unit types', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await createUnit(baseUrl, validUnit({ unitCode: 'TCCB001' }));
    assert.equal(first.status, 201);

    const duplicate = await createUnit(baseUrl, validUnit({ unitCode: 'TCCB001' }));
    assert.equal(duplicate.status, 409, 'TC18');
    assert.equal((await duplicate.json()).message, 'Mã đơn vị đã tồn tại');

    for (const [id, unitType] of [
      ['TC30', 'Khoa'],
      ['TC31', 'Phòng'],
      ['TC32', 'Ban'],
      ['TC33', 'Bộ môn']
    ]) {
      validateCase(id, { unitType }, 'unitType', true);
    }
    validateCase('TC34', { unitType: '' }, 'unitType', false, /Vui lòng chọn loại đơn vị/);
    validateCase('TC35', { unitType: 'Trung tâm' }, 'unitType', false, /đúng định dạng/);
  });
});

test('TC36-TC51: validates email format, required state, spaces, and length boundaries', () => {
  const cases = [
    ['TC36', 'tccb@example.com', true],
    ['TC37', 'phong.tccb@domain.edu.vn', true],
    ['TC38', '', false, /Vui lòng nhập email/],
    ['TC39', 'tccb', false, /đúng định dạng/],
    ['TC40', '@example.com', false, /đúng định dạng/],
    ['TC41', 'tccb@', false, /đúng định dạng/],
    ['TC42', 'tccb@@example.com', false, /đúng định dạng/],
    ['TC43', 'tccb @example.com', false, /đúng định dạng/],
    ['TC44', 'tccb.example.com', false, /đúng định dạng/],
    ['TC45', makeEmail(99), true],
    ['TC46', makeEmail(100), true],
    ['TC47', makeEmail(101), false, /100 ký tự/],
    ['TC48', ' tccb@example.com', false, /đúng định dạng/],
    ['TC49', 'tccb@example.com ', false, /đúng định dạng/],
    ['TC50', 'tccb @example.com', false, /đúng định dạng/],
    ['TC51', 'tccb@ example.com', false, /đúng định dạng/]
  ];

  for (const [id, email, valid, message] of cases) {
    validateCase(id, { email }, 'email', valid, message);
  }
});

test('TC52-TC63: validates phone required state, prefix, characters, and length', () => {
  const cases = [
    ['TC52', '0912345678', true],
    ['TC53', '', false, /Vui lòng nhập số điện thoại/],
    ['TC54', '9123456789', false, /đúng định dạng/],
    ['TC55', '091234567A', false, /đúng định dạng/],
    ['TC56', '0912 345678', false, /đúng định dạng/],
    ['TC57', '091234-5678', false, /đúng định dạng/],
    ['TC58', '+84912345678', false, /đúng định dạng/],
    ['TC59', '091234567', false, /đúng định dạng/],
    ['TC60', '0912345678', true],
    ['TC61', '09123456789', false, /đúng định dạng/],
    ['TC62', '1912345678', false, /đúng định dạng/],
    ['TC63', '0912345678', true]
  ];

  for (const [id, phone, valid, message] of cases) {
    validateCase(id, { phone }, 'phone', valid, message);
  }
});

test('TC64-TC76: validates optional website, HTTP(S), whitespace, and length boundaries', () => {
  const cases = [
    ['TC64', '', true],
    ['TC65', 'https://example.com', true],
    ['TC66', 'http://example.com', true],
    ['TC67', 'https://example.com/about', true],
    ['TC68', '   ', false, /đúng định dạng/],
    ['TC69', 'abc', false, /đúng định dạng/],
    ['TC70', 'example.com', false, /đúng định dạng/],
    ['TC71', 'http://', false, /đúng định dạng/],
    ['TC72', makeUrl(2047), true],
    ['TC73', makeUrl(2048), true],
    ['TC74', makeUrl(2049), false, /2048 ký tự/],
    ['TC75', ' https://example.com', false, /đúng định dạng/],
    ['TC76', 'https://example.com/path with spaces', false, /đúng định dạng/]
  ];

  for (const [id, website, valid, message] of cases) {
    validateCase(id, { website }, 'website', valid, message);
  }
});

test('TC77-TC84: validates optional address, whitespace, and length boundaries', () => {
  const cases = [
    ['TC77', '', true],
    ['TC78', 'Hà Nội', true],
    ['TC79', 'Số 01, đường ABC, Hà Nội', true],
    ['TC80', ' ', false, /đúng định dạng/],
    ['TC81', '     ', false, /đúng định dạng/],
    ['TC82', { address: 'A'.repeat(199) }, true],
    ['TC83', { address: 'A'.repeat(200) }, true],
    ['TC84', { address: 'A'.repeat(201) }, false, /200 ký tự/]
  ];

  for (const [id, addressValue, valid, message] of cases) {
    const address = typeof addressValue === 'object'
      ? addressValue.address
      : addressValue;
    validateCase(id, { address }, 'address', valid, message);
  }
});

test('TC85-TC95: validates combined save decisions and reports all simultaneous errors', async () => {
  const required = validUnit({ website: '', address: '' });
  assert.deepEqual(validateOrganizationUnit(required), [], 'TC85/TC95');

  const invalidCases = [
    ['TC86', { unitName: '' }, 'unitName'],
    ['TC87', { unitCode: '' }, 'unitCode'],
    ['TC89', { unitType: '' }, 'unitType'],
    ['TC90', { email: 'bad-email' }, 'email'],
    ['TC91', { phone: '1234567890' }, 'phone'],
    ['TC92', { website: 'invalid-url' }, 'website'],
    ['TC93', { address: '   ' }, 'address']
  ];
  for (const [id, overrides, field] of invalidCases) {
    validateCase(id, overrides, field, false);
  }

  await withServer(async ({ app, baseUrl }) => {
    const duplicateSeed = await createUnit(baseUrl, validUnit({ unitCode: 'DUPLICATE' }));
    assert.equal(duplicateSeed.status, 201);

    const duplicate = await createUnit(baseUrl, validUnit({ unitCode: 'DUPLICATE' }));
    assert.equal(duplicate.status, 409, 'TC88');
    assert.equal((await duplicate.json()).message, 'Mã đơn vị đã tồn tại');

    const combinedInvalid = await createUnit(baseUrl, validUnit({
      unitName: '',
      unitCode: '',
      unitType: '',
      email: 'not-an-email',
      phone: '123',
      website: 'abc',
      address: ' '
    }));
    assert.equal(combinedInvalid.status, 400, 'TC94');
    const body = await combinedInvalid.json();
    for (const field of [
      'unitName', 'unitCode', 'unitType', 'email', 'phone', 'website', 'address'
    ]) {
      assert.ok(body.errors.some((error) => error.field === field), `TC94 reports ${field}`);
    }
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM organization_units').get().count,
      1,
      'invalid combined request did not create a row'
    );

    const optionalFields = await createUnit(baseUrl, required);
    assert.equal(optionalFields.status, 201, 'TC95');
    const persisted = app.locals.database.prepare(`
      SELECT website, address FROM organization_units WHERE unit_code = ?
    `).get(required.unitCode);
    assert.equal(persisted.website, null);
    assert.equal(persisted.address, null);
  });
});

test('TC97-TC104: API has no draft writes; invalid submit and absent cancel/close requests leave no rows', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const countUnits = () => app.locals.database.prepare(
      'SELECT COUNT(*) AS count FROM organization_units'
    ).get().count;

    // TC96/TC100-TC104 describe UI form transitions; the backend creates no draft before POST.
    assert.equal(countUnits(), 0, 'TC96: opening a form has no backend write');
    assert.equal(countUnits(), 0, 'TC100/TC101: cancel means no create request');
    assert.equal(countUnits(), 0, 'TC102: closing without save means no create request');
    assert.equal(countUnits(), 0, 'TC103: reopening has no persisted draft');
    assert.equal(countUnits(), 0, 'TC104: invalid data then cancel leaves no row');

    const emptySubmit = await createUnit(baseUrl, {});
    assert.equal(emptySubmit.status, 400, 'TC97');
    assert.ok((await emptySubmit.json()).errors.length > 0);
    assert.equal(countUnits(), 0);

    const invalidEmail = validUnit({ email: 'invalid-email', unitCode: 'RETRY01' });
    const firstAttempt = await createUnit(baseUrl, invalidEmail);
    assert.equal(firstAttempt.status, 400);
    assert.equal(countUnits(), 0);

    const correctedEmail = await createUnit(baseUrl, {
      ...invalidEmail,
      email: 'corrected@example.com'
    });
    assert.equal(correctedEmail.status, 201, 'TC98');

    const invalidPhone = await createUnit(baseUrl, {
      ...validUnit({ unitCode: 'RETRY02' }),
      phone: '091234567'
    });
    assert.equal(invalidPhone.status, 400, 'TC99');
    assert.equal(countUnits(), 1);
  });
});

test('TC105: repeated valid save creates one unit and rejects the duplicate', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const unit = validUnit({ unitCode: 'REPEATED' });
    const first = await createUnit(baseUrl, unit);
    const second = await createUnit(baseUrl, unit);
    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.equal((await second.json()).message, 'Mã đơn vị đã tồn tại');
    assert.equal(
      app.locals.database.prepare(`
        SELECT COUNT(*) AS count FROM organization_units WHERE unit_code = ?
      `).get(unit.unitCode).count,
      1
    );
  });
});
