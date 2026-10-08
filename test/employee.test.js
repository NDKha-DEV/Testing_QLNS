const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const test = require('node:test');
const { createApp } = require('../src/app');
const { validateEmployee } = require('../src/employee/validation');

const pngContent = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00
]);
const jpegContent = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const pdfContent = Buffer.from('%PDF-1.4\n');
const TODAY = new Date();

function formatDate(date) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear()
  ].join('/');
}

function relativeDate({ years = 0, days = 0 } = {}) {
  const date = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  date.setFullYear(date.getFullYear() + years);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function upload(fieldname, originalname, content, size = content.length) {
  return { fieldname, originalname, buffer: content, size };
}

function employeeFiles(employee) {
  const files = [upload('portrait', 'portrait.png', pngContent)];
  if (employee.isForeignWorker) {
    files.push(upload('workPermitFile', 'permit.pdf', pdfContent));
  }
  for (const section of ['degrees', 'certificates']) {
    (employee[section] || []).forEach((entry, index) => {
      files.push(upload(`${section}[${index}].file`, 'document.pdf', pdfContent));
    });
  }
  return files;
}

function replaceUpload(files, fieldname, replacement) {
  const remaining = files.filter((file) => file.fieldname !== fieldname);
  if (replacement) {
    remaining.push(replacement);
  }
  return remaining;
}

function foreignWorker(overrides = {}) {
  return validEmployee({
    isForeignWorker: true,
    passportNumber: 'AB123456',
    workPermitNumber: 'WP123456',
    visaNumber: 'VISA123',
    passportExpiryDate: relativeDate({ years: 1 }),
    visaExpiryDate: relativeDate({ years: 1 }),
    workPermitExpiryDate: relativeDate({ years: 1 }),
    ...overrides
  });
}

function validEmployee(overrides = {}) {
  return {
    fullName: 'Nguyễn Văn An',
    gender: 'Nam',
    birthDate: '08/10/1990',
    hometown: 'Hà Nội',
    email: 'an@example.com',
    phone: '0912345678',
    address: 'Số 1, Hà Nội',
    nationalId: '123456789012',
    bankAccountNumber: '12345678',
    bankName: 'Vietcombank',
    partyJoinDate: '08/10/2010',
    partyDetails: 'Đảng viên',
    educationLevel: '12/12',
    academicTitle: 'Cử nhân',
    isForeignWorker: false,
    familyMembers: [{ name: 'Nguyễn Thị Hoa', relationship: 'Mẹ' }],
    workHistories: [{
      workplace: 'Đơn vị A',
      fromDate: '01/01/2020',
      toDate: '01/01/2021'
    }],
    degrees: [{ name: 'Cử nhân', issuer: 'Đại học A' }],
    certificates: [{ name: 'Tin học', issuer: 'Trung tâm B' }],
    ...overrides
  };
}

test('validates ADD02-ADD08 and the specified ADD10, ADD14, and ADD15 cases', () => {
  const cases = [
    ['ADD02', { fullName: '' }, 'fullName', /Không được để trống/],
    ['ADD03', { fullName: 'Nguyễn Văn 123' }, 'fullName', /chỉ được chứa chữ cái/],
    ['ADD04', { gender: 'Khác' }, 'gender', /Giá trị giới tính không hợp lệ/],
    ['ADD05', { birthDate: relativeDate({ years: -17 }) }, 'birthDate', /đủ 18 tuổi/],
    ['ADD07', { hometown: '' }, 'hometown', /Không được để trống/],
    ['ADD08', { email: 'abc@' }, 'email', /Email không đúng định dạng/],
    ['ADD10', { phone: '123456789' }, 'phone', /10 chữ số/],
    ['ADD14', { nationalId: '123 45678901' }, 'nationalId', /không được chứa khoảng trắng/],
    ['ADD15', { address: '' }, 'address', /Không được để trống/]
  ];

  for (const [testCase, overrides, field, message] of cases) {
    const errors = validateEmployee(validEmployee(overrides), employeeFiles(validEmployee()));
    const fieldError = errors.find((error) => error.field === field);
    assert.ok(fieldError, `${testCase} should reject ${field}`);
    assert.match(fieldError.message, message, `${testCase} should return its expected error`);
  }
});

test('validates all ADD16-ADD29 tax, phone, national ID, and bank-account boundaries', () => {
  const cases = [
    ['ADD16', { taxCode: '123456789' }, 'taxCode', true],
    ['ADD17', { taxCode: '1234567890' }, 'taxCode', false],
    ['ADD18', { taxCode: '1234567890123' }, 'taxCode', false],
    ['ADD19', { taxCode: '12345678901234' }, 'taxCode', true],
    ['ADD20', { phone: '123456789' }, 'phone', true],
    ['ADD21', { phone: '0912345678' }, 'phone', false],
    ['ADD22', { phone: '09123456789' }, 'phone', true],
    ['ADD23', { nationalId: '12345678901' }, 'nationalId', true],
    ['ADD24', { nationalId: '123456789012' }, 'nationalId', false],
    ['ADD25', { nationalId: '1234567890123' }, 'nationalId', true],
    ['ADD26', { bankAccountNumber: '1234567' }, 'bankAccountNumber', true],
    ['ADD27', { bankAccountNumber: '12345678' }, 'bankAccountNumber', false],
    ['ADD28', { bankAccountNumber: '123456789012345' }, 'bankAccountNumber', false],
    ['ADD29', { bankAccountNumber: '1234567890123456' }, 'bankAccountNumber', true]
  ];

  for (const [testCase, overrides, field, shouldFail] of cases) {
    const employee = validEmployee(overrides);
    const errors = validateEmployee(employee, employeeFiles(employee));
    const fieldError = errors.find((error) => error.field === field);
    assert.equal(Boolean(fieldError), shouldFail, `${testCase} boundary result`);
    if (fieldError && field === 'bankAccountNumber' &&
        !/^\d+$/.test(employee.bankAccountNumber)) {
      assert.match(fieldError.message, /chỉ được chứa chữ số/, testCase);
    }
  }
});

test('validates ADD30-ADD46 passport, foreign-worker, and file cases', () => {
  const cases = [
    ['ADD30', foreignWorker({ passportNumber: 'ABCDE' }), 'passportNumber', /6 đến 15/],
    ['ADD31', foreignWorker({ passportNumber: 'ABCDEF' }), 'passportNumber', null],
    ['ADD32', foreignWorker({ passportNumber: 'ABCDEFGHIJKLMNO' }), 'passportNumber', null],
    ['ADD33', foreignWorker({ passportNumber: 'ABCDEFGHIJKLMNOP' }), 'passportNumber', /6 đến 15/],
    ['ADD37', validEmployee(), 'portrait', /Định dạng ảnh không hợp lệ/],
    ['ADD39', foreignWorker(), 'workPermitFile', /nhỏ hơn 10MB/],
    ['ADD40', foreignWorker(), 'workPermitFile', /nhỏ hơn 10MB/],
    ['ADD41', foreignWorker(), 'workPermitFile', /Định dạng file không hợp lệ/],
    ['ADD43', foreignWorker({ passportNumber: '' }), 'passportNumber', /không được để trống/],
    ['ADD44', foreignWorker({ visaNumber: '' }), 'visaNumber', /không được để trống/],
    ['ADD45', foreignWorker({ passportExpiryDate: relativeDate() }), 'passportExpiryDate', /lớn hơn ngày hiện tại/]
  ];

  for (const [testCase, employee, field, message] of cases) {
    let files = employeeFiles(employee);
    if (testCase === 'ADD37') {
      files = replaceUpload(files, 'portrait', upload('portrait', 'portrait.pdf', pdfContent));
    } else if (testCase === 'ADD39') {
      files = replaceUpload(files, 'workPermitFile', upload(
        'workPermitFile', 'permit.pdf', pdfContent, 10 * 1024 * 1024
      ));
    } else if (testCase === 'ADD40') {
      files = replaceUpload(files, 'workPermitFile', upload(
        'workPermitFile', 'permit.pdf', pdfContent, 10 * 1024 * 1024 + 1
      ));
    } else if (testCase === 'ADD41') {
      files = replaceUpload(files, 'workPermitFile', upload(
        'workPermitFile', 'permit.pdf', pngContent
      ));
    }

    const errors = validateEmployee(employee, files);
    if (!message) {
      assert.ok(!errors.some((error) => error.field === field), `${testCase} should pass`);
    } else {
      const fieldError = errors.find((error) => error.field === field);
      assert.ok(fieldError, `${testCase} should reject ${field}`);
      assert.match(fieldError.message, message, testCase);
    }
  }

  const imageCases = [
    ['ADD34', 5 * 1024 * 1024 - 1, false, 'portrait.jpg', jpegContent],
    ['ADD35', 5 * 1024 * 1024, true, 'portrait.png', pngContent],
    ['ADD36', 5 * 1024 * 1024 + 1, true, 'portrait.jpeg', jpegContent]
  ];
  for (const [testCase, size, shouldFail, filename, content] of imageCases) {
    const employee = validEmployee();
    const files = replaceUpload(employeeFiles(employee), 'portrait',
      upload('portrait', filename, content, size));
    const error = validateEmployee(employee, files)
      .find((item) => item.field === 'portrait');
    assert.equal(Boolean(error), shouldFail, `${testCase} image boundary`);
    if (error) {
      assert.match(error.message, /nhỏ hơn 5MB/, testCase);
    }
  }

  const permitJustUnder = foreignWorker();
  const permitFiles = replaceUpload(employeeFiles(permitJustUnder), 'workPermitFile',
    upload('workPermitFile', 'permit.pdf', pdfContent, 10 * 1024 * 1024 - 1));
  assert.ok(!validateEmployee(permitJustUnder, permitFiles)
    .some((error) => error.field === 'workPermitFile'), 'ADD38 should pass');

  const notForeign = validEmployee({ isForeignWorker: false });
  assert.ok(!validateEmployee(notForeign, employeeFiles(notForeign))
    .some((error) => ['passportNumber', 'workPermitNumber', 'visaNumber']
      .includes(error.field)), 'ADD42 should skip foreign-worker fields');

  const validForeign = foreignWorker();
  assert.ok(!validateEmployee(validForeign, employeeFiles(validForeign))
    .some((error) => ['passportNumber', 'workPermitNumber', 'visaNumber',
      'passportExpiryDate', 'visaExpiryDate', 'workPermitExpiryDate', 'workPermitFile']
      .includes(error.field)), 'ADD46 should pass foreign-worker validation');
});

test('validates ADD49-ADD60 date, bank, education, degree, and certificate cases', () => {
  const cases = [
    ['ADD49', validEmployee({
      workHistories: [{ workplace: 'Đơn vị', fromDate: '02/01/2020', toDate: '01/01/2020' }]
    }), 'workHistories[0].fromDate', /nhỏ hơn hoặc bằng/],
    ['ADD50', validEmployee({
      workHistories: [{
        workplace: 'Đơn vị',
        fromDate: relativeDate(),
        toDate: relativeDate({ days: 1 })
      }]
    }), 'workHistories[0].fromDate', /nhỏ hơn ngày hiện tại/],
    ['ADD51', validEmployee({
      birthDate: '08/10/1990',
      partyJoinDate: '08/10/1990'
    }), 'partyJoinDate', /lớn hơn ngày sinh/],
    ['ADD52', validEmployee({ partyJoinDate: relativeDate({ days: 1 }) }),
      'partyJoinDate', /không được lớn hơn ngày hiện tại/],
    ['ADD53', validEmployee({ bankName: '' }), 'bankName', /Vui lòng chọn ngân hàng/],
    ['ADD54', validEmployee({ bankAccountNumber: '1234ABCD' }),
      'bankAccountNumber', /chỉ được chứa chữ số/],
    ['ADD55', validEmployee({ academicTitle: '' }), 'academicTitle', /Vui lòng chọn học hàm\/học vị/],
    ['ADD56', validEmployee({ degrees: [{ name: '', issuer: 'Đại học A' }] }),
      'degrees[0].name', /Không được để trống/],
    ['ADD57', validEmployee(), 'degrees[0].file', /Định dạng file không hợp lệ/],
    ['ADD58', validEmployee({ certificates: [{ name: '', issuer: 'Trung tâm B' }] }),
      'certificates[0].name', /Không được để trống/],
    ['ADD59', validEmployee(), 'certificates[0].file', /nhỏ hơn 10MB/]
  ];

  for (const [testCase, employee, field, message] of cases) {
    let files = employeeFiles(employee);
    if (testCase === 'ADD57') {
      files = replaceUpload(files, 'degrees[0].file',
        upload('degrees[0].file', 'degree.jpg', pngContent));
    } else if (testCase === 'ADD59') {
      files = replaceUpload(files, 'certificates[0].file', upload(
        'certificates[0].file', 'certificate.pdf', pdfContent,
        10 * 1024 * 1024 + 1
      ));
    }
    const fieldError = validateEmployee(employee, files)
      .find((error) => error.field === field);
    assert.ok(fieldError, `${testCase} should reject ${field}`);
    assert.match(fieldError.message, message, testCase);
  }

  const validEmployeeData = validEmployee();
  assert.deepEqual(validateEmployee(validEmployeeData, employeeFiles(validEmployeeData)), [],
    'ADD60 valid data passes validation');

  const sameDayWorkHistory = validEmployee({
    workHistories: [{
      workplace: 'Đơn vị',
      fromDate: '01/01/2020',
      toDate: '01/01/2020'
    }]
  });
  assert.ok(!validateEmployee(sameDayWorkHistory, employeeFiles(sameDayWorkHistory))
    .some((error) => error.field === 'workHistories[0].fromDate'),
  'fromDate equal to toDate meets the specified <= boundary');
});

function formRequest(employee, files = {}) {
  const form = new FormData();
  form.append('employee', JSON.stringify(employee));
  const portraitName = files.portraitName || 'portrait.png';
  const lowerPortraitName = portraitName.toLowerCase();
  const portraitMimeType = lowerPortraitName.endsWith('.png')
    ? 'image/png'
    : lowerPortraitName.endsWith('.jpg') || lowerPortraitName.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'application/octet-stream';
  form.append(
    'portrait',
    new Blob([files.portrait || pngContent], { type: portraitMimeType }),
    portraitName
  );

  if (files.workPermit) {
    form.append(
      'workPermitFile',
      new Blob([files.workPermit], { type: 'application/pdf' }),
      files.workPermitName || 'permit.pdf'
    );
  }

  for (const section of ['degrees', 'certificates']) {
    for (const [index] of (employee[section] || []).entries()) {
      const fieldName = `${section}[${index}].file`;
      const file = (files.otherFiles || {})[fieldName] || pdfContent;
      form.append(fieldName, new Blob([file], { type: 'application/pdf' }), 'document.pdf');
    }
  }

  return form;
}

async function withServer(run) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qlns-test-'));
  const app = createApp({
    databasePath: path.join(temporaryDirectory, 'test.sqlite'),
    uploadsDirectory: path.join(temporaryDirectory, 'uploads')
  });
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

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

test('creates and persists an employee with generated code and default statuses', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee(), {
        otherFiles: {
          'degrees[0].file': pdfContent,
          'certificates[0].file': pdfContent
        }
      })
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.employee.employeeCode, 'NS000001');
    assert.equal(body.employee.contractStatus, 'Chưa hợp đồng');
    assert.equal(body.employee.workStatus, 'Đang chờ xét');
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_history').get().count,
      1
    );
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_degree').get().count,
      1
    );
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_certificate').get().count,
      1
    );
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_family').get().count,
      1
    );
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_work_history')
        .get().count,
      1
    );
    const detailResponse = await fetch(`${baseUrl}/api/employees/1`);
    assert.equal(detailResponse.status, 200);
    const details = (await detailResponse.json()).employee;
    assert.equal(details.familyMembers[0].relationship, 'Mẹ');
    assert.equal(details.workHistories[0].workplace, 'Đơn vị A');
    assert.equal(details.bank.bankName, 'Vietcombank');
    assert.equal(details.degrees[0].name, 'Cử nhân');
    assert.equal(details.certificates[0].name, 'Tin học');
    const files = app.locals.database.prepare('SELECT storage_path FROM employee_file').all();
    assert.equal(files.length, 3);
    assert.ok(files.every((file) => fs.existsSync(file.storage_path)));
  });
});

test('returns field validation errors and does not save invalid employees', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const employee = validEmployee({
      fullName: 'Nguyễn Văn 123',
      gender: 'Khác',
      birthDate: '08/10/2010',
      phone: '123456789',
      nationalId: '12345678901'
    });
    const response = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(employee)
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    const fields = body.errors.map((error) => error.field);
    assert.ok(fields.includes('fullName'));
    assert.ok(fields.includes('gender'));
    assert.ok(fields.includes('birthDate'));
    assert.ok(fields.includes('phone'));
    assert.ok(fields.includes('nationalId'));
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee').get().count,
      0
    );
  });
});

test('rejects duplicates at the API and SQLite constraint layers', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const first = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee())
    });
    assert.equal(first.status, 201);

    const duplicate = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        phone: '0912345679',
        nationalId: '123456789013'
      }))
    });
    assert.equal(duplicate.status, 409);
    assert.match((await duplicate.json()).message, /Email đã tồn tại/);

    const duplicatePhone = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'phone@example.com',
        nationalId: '123456789013'
      }))
    });
    assert.equal(duplicatePhone.status, 409);
    assert.match((await duplicatePhone.json()).message, /Số điện thoại đã tồn tại/);

    const duplicateNationalId = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'national-id@example.com',
        phone: '0912345685'
      }))
    });
    assert.equal(duplicateNationalId.status, 409);
    assert.match((await duplicateNationalId.json()).message, /CCCD đã tồn tại/);

    assert.throws(() => {
      app.locals.database.prepare(`
        INSERT INTO employee (
          full_name, gender, birth_date, hometown, email, phone, address,
          national_id, portrait_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'Test', 'Nam', '1990-10-08', 'Hà Nội', 'an@example.com',
        '0912345680', 'Hà Nội', '123456789014', 'none'
      );
    }, { code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });
});

test('accepts a person exactly 18 years old on the current date', async () => {
  await withServer(async ({ baseUrl }) => {
    const today = new Date();
    const birthDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    const formattedBirthDate = [
      String(birthDate.getDate()).padStart(2, '0'),
      String(birthDate.getMonth() + 1).padStart(2, '0'),
      birthDate.getFullYear()
    ].join('/');
    const response = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({ birthDate: formattedBirthDate }))
    });

    assert.equal(response.status, 201);
  });
});

test('enforces the portrait size boundary and rejects non-image content', async () => {
  await withServer(async ({ baseUrl }) => {
    const acceptedResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee(), {
        portrait: Buffer.concat([
          jpegContent,
          Buffer.alloc(5 * 1024 * 1024 - jpegContent.length - 1)
        ]),
        portraitName: 'portrait.jpg'
      })
    });
    assert.equal(acceptedResponse.status, 201);

    const exactBoundary = Buffer.alloc(5 * 1024 * 1024);
    pngContent.copy(exactBoundary);
    const tooLargeResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee(), { portrait: exactBoundary })
    });
    assert.equal(tooLargeResponse.status, 400);
    assert.match((await tooLargeResponse.json()).message, /nhỏ hơn 5MB/);

    const invalidTypeResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee(), {
        portrait: pdfContent,
        portraitName: 'portrait.pdf'
      })
    });
    assert.equal(invalidTypeResponse.status, 400);
    assert.match((await invalidTypeResponse.json()).message, /Định dạng ảnh không hợp lệ/);
  });
});

test('requires and validates foreign-worker data and stores permit uploads', async () => {
  await withServer(async ({ app, baseUrl }) => {
    const foreignEmployee = validEmployee({
      email: 'foreign@example.com',
      phone: '0912345681',
      nationalId: '123456789015',
      isForeignWorker: true,
      passportNumber: 'AB123456',
      workPermitNumber: 'WP123456',
      visaNumber: 'VISA123',
      passportExpiryDate: '08/10/2030',
      visaExpiryDate: '08/10/2030',
      workPermitExpiryDate: '08/10/2030'
    });
    const response = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(foreignEmployee, { workPermit: pdfContent })
    });

    assert.equal(response.status, 201);
    assert.equal(
      app.locals.database.prepare('SELECT COUNT(*) AS count FROM employee_foreign_worker')
        .get().count,
      1
    );
    const permit = app.locals.database.prepare(`
      SELECT work_permit_file_path AS filePath FROM employee_foreign_worker
    `).get();
    assert.ok(fs.existsSync(permit.filePath));

    const duplicatePassport = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'foreign-duplicate@example.com',
        phone: '0912345686',
        nationalId: '123456789019',
        isForeignWorker: true,
        passportNumber: 'AB123456',
        workPermitNumber: 'WP123460',
        visaNumber: 'VISA127',
        passportExpiryDate: '08/10/2030',
        visaExpiryDate: '08/10/2030',
        workPermitExpiryDate: '08/10/2030'
      }), { workPermit: pdfContent })
    });
    assert.equal(duplicatePassport.status, 409);
    assert.match((await duplicatePassport.json()).message, /Số hộ chiếu đã tồn tại/);

    const invalidExpiry = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'foreign2@example.com',
        phone: '0912345682',
        nationalId: '123456789016',
        isForeignWorker: true,
        passportNumber: 'CD123456',
        workPermitNumber: 'WP123457',
        visaNumber: 'VISA124',
        passportExpiryDate: '01/01/2000',
        visaExpiryDate: '08/10/2030',
        workPermitExpiryDate: '08/10/2030'
      }), { workPermit: pdfContent })
    });
    assert.equal(invalidExpiry.status, 400);
    assert.ok((await invalidExpiry.json()).errors.some(
      (error) => error.field === 'passportExpiryDate'
    ));
  });
});

test('accepts a work-permit PDF just below 10 MB and rejects the exact boundary', async () => {
  await withServer(async ({ baseUrl }) => {
    const validForeignEmployee = validEmployee({
      email: 'permit@example.com',
      phone: '0912345683',
      nationalId: '123456789017',
      isForeignWorker: true,
      passportNumber: 'EF123456',
      workPermitNumber: 'WP123458',
      visaNumber: 'VISA125',
      passportExpiryDate: '08/10/2030',
      visaExpiryDate: '08/10/2030',
      workPermitExpiryDate: '08/10/2030'
    });
    const belowBoundary = Buffer.alloc(10 * 1024 * 1024 - 1);
    pdfContent.copy(belowBoundary);
    const acceptedResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validForeignEmployee, { workPermit: belowBoundary })
    });
    assert.equal(acceptedResponse.status, 201);

    const exactBoundary = Buffer.alloc(10 * 1024 * 1024);
    pdfContent.copy(exactBoundary);
    const rejectedResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'permit2@example.com',
        phone: '0912345684',
        nationalId: '123456789018',
        isForeignWorker: true,
        passportNumber: 'GH123456',
        workPermitNumber: 'WP123459',
        visaNumber: 'VISA126',
        passportExpiryDate: '08/10/2030',
        visaExpiryDate: '08/10/2030',
        workPermitExpiryDate: '08/10/2030'
      }), { workPermit: exactBoundary })
    });
    assert.equal(rejectedResponse.status, 400);
    assert.match((await rejectedResponse.json()).message, /nhỏ hơn 10MB/);

    const beyondBoundary = Buffer.alloc(10 * 1024 * 1024 + 1);
    pdfContent.copy(beyondBoundary);
    const parserRejected = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        email: 'permit3@example.com',
        phone: '0912345687',
        nationalId: '123456789020',
        isForeignWorker: true,
        passportNumber: 'JK123456',
        workPermitNumber: 'WP123461',
        visaNumber: 'VISA128',
        passportExpiryDate: '08/10/2030',
        visaExpiryDate: '08/10/2030',
        workPermitExpiryDate: '08/10/2030'
      }), { workPermit: beyondBoundary })
    });
    assert.equal(parserRejected.status, 400);
    assert.match((await parserRejected.json()).message, /nhỏ hơn 10MB/);
  });
});

test('validates work history dates and family member relationships', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      body: formRequest(validEmployee({
        workHistories: [{
          workplace: 'Đơn vị A',
          fromDate: '01/01/2026',
          toDate: '01/01/2025'
        }],
        familyMembers: [{ name: 'Nguyễn Thị B', relationship: 'Bạn' }]
      }))
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.errors.some((error) => error.field === 'workHistories[0].fromDate'));
    assert.ok(body.errors.some((error) => error.field === 'familyMembers[0].relationship'));
  });
});
