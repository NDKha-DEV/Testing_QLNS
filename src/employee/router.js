const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { validateEmployee } = require('./validation');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function parseEmployee(request) {
  if (typeof request.body.employee === 'string') {
    return JSON.parse(request.body.employee);
  }
  return request.body.employee || request.body;
}

function findDuplicates(database, employee) {
  const fields = [
    ['email', 'email', 'Email đã tồn tại trong hệ thống.'],
    ['phone', 'phone', 'Số điện thoại đã tồn tại trong hệ thống.'],
    ['nationalId', 'national_id', 'CCCD đã tồn tại trong hệ thống.']
  ];
  const duplicates = [];

  // WB: Loop/DB use - truy vấn từng giá trị unique trước khi ghi.
  for (const [inputField, column, message] of fields) {
    if (employee[inputField]) {
      // WB: DB use - kết quả truy vấn quyết định nhánh duplicate.
      const existing = database
        .prepare(`SELECT id FROM employee WHERE ${column} = ?`)
        .get(employee[inputField]);
      if (existing) {
        duplicates.push({ field: inputField, message });
      }
    }
  }

  if (employee.isForeignWorker === true ||
      employee.isForeignWorker === 1 ||
      employee.isForeignWorker === 'true') {
    for (const [inputField, column, message] of [
      ['passportNumber', 'passport_number', 'Số hộ chiếu đã tồn tại trong hệ thống.'],
      ['workPermitNumber', 'work_permit_number', 'Số giấy phép lao động đã tồn tại trong hệ thống.']
    ]) {
      if (employee[inputField]) {
        const existing = database
          .prepare(`SELECT employee_id FROM employee_foreign_worker WHERE ${column} = ?`)
          .get(employee[inputField]);
        if (existing) {
          duplicates.push({ field: inputField, message });
        }
      }
    }
  }

  return duplicates;
}

function saveUpload(file, employeeId, category, uploadsDirectory, database, savedPaths) {
  if (!file) {
    return null;
  }
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${employeeId}-${randomUUID()}${extension}`;
  const storagePath = path.join(uploadsDirectory, filename);
  savedPaths.push(storagePath);
  fs.writeFileSync(storagePath, file.buffer, { flag: 'wx' });
  database.prepare(`
    INSERT INTO employee_file
      (employee_id, category, original_name, storage_path, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(employeeId, category, file.originalname, storagePath, file.mimetype, file.size);
  return storagePath;
}

function createEmployeeRouter({ database, uploadsDirectory }) {
  const router = express.Router();

  router.get('/', (request, response) => {
    const employees = database.prepare(`
      SELECT id, employee_code AS employeeCode, full_name AS fullName,
        email, phone, contract_status AS contractStatus,
        work_status AS workStatus, created_at AS createdAt
      FROM employee
      ORDER BY id
    `).all();
    response.json({ employees });
  });

  router.get('/:id', (request, response) => {
    const employee = database.prepare(`
      SELECT id, employee_code AS employeeCode, full_name AS fullName,
        gender, birth_date AS birthDate, hometown, email, phone, address,
        national_id AS nationalId, tax_code AS taxCode,
        social_insurance_number AS socialInsuranceNumber,
        health_insurance_number AS healthInsuranceNumber,
        is_foreign_worker AS isForeignWorker,
        contract_status AS contractStatus, work_status AS workStatus,
        portrait_path AS portraitPath
      FROM employee WHERE id = ?
    `).get(request.params.id);

    if (!employee) {
      response.status(404).json({ message: 'Không tìm thấy hồ sơ nhân sự.' });
      return;
    }

    employee.isForeignWorker = Boolean(employee.isForeignWorker);
    employee.familyMembers = database.prepare(`
      SELECT name, relationship FROM employee_family WHERE employee_id = ? ORDER BY id
    `).all(request.params.id);
    employee.workHistories = database.prepare(`
      SELECT workplace, from_date AS fromDate, to_date AS toDate
      FROM employee_work_history WHERE employee_id = ? ORDER BY id
    `).all(request.params.id);
    employee.bank = database.prepare(`
      SELECT account_number AS accountNumber, bank_name AS bankName
      FROM employee_bank WHERE employee_id = ?
    `).get(request.params.id);
    employee.membership = database.prepare(`
      SELECT join_date AS joinDate, details
      FROM employee_membership WHERE employee_id = ?
    `).get(request.params.id);
    employee.education = database.prepare(`
      SELECT education_level AS educationLevel, academic_title AS academicTitle
      FROM employee_education WHERE employee_id = ?
    `).get(request.params.id);
    employee.degrees = database.prepare(`
      SELECT name, issuer FROM employee_degree WHERE employee_id = ? ORDER BY id
    `).all(request.params.id);
    employee.certificates = database.prepare(`
      SELECT name, issuer FROM employee_certificate WHERE employee_id = ? ORDER BY id
    `).all(request.params.id);
    employee.foreignWorker = database.prepare(`
      SELECT passport_number AS passportNumber,
        work_permit_number AS workPermitNumber, visa_number AS visaNumber,
        passport_expiry_date AS passportExpiryDate,
        visa_expiry_date AS visaExpiryDate,
        work_permit_expiry_date AS workPermitExpiryDate
      FROM employee_foreign_worker WHERE employee_id = ?
    `).get(request.params.id) || null;

    response.json({ employee });
  });

  router.post('/', (request, response, next) => {
    const handleRequest = (error) => {
      if (error) {
        next(error);
        return;
      }
      next();
    };

    // WB: Branch - multipart đi qua parser file; JSON đi thẳng tới validation.
    if (request.is('multipart/form-data')) {
      upload.any()(request, response, handleRequest);
      return;
    }
    next();
  }, (request, response, next) => {
    let employee;
    try {
      employee = parseEmployee(request);
    } catch (error) {
      response.status(400).json({
        message: 'Dữ liệu hồ sơ không phải JSON hợp lệ.',
        errors: [{ field: 'employee', message: 'Dữ liệu hồ sơ không phải JSON hợp lệ.' }]
      });
      return;
    }

    if (!employee || typeof employee !== 'object' || Array.isArray(employee)) {
      response.status(400).json({
        message: 'Dữ liệu hồ sơ không hợp lệ.',
        errors: [{ field: 'employee', message: 'Dữ liệu hồ sơ không hợp lệ.' }]
      });
      return;
    }

    const files = request.files || [];
    // WB: Use - các lỗi validation block toàn bộ thao tác lưu.
    const errors = validateEmployee(employee, files);
    if (errors.length > 0) {
      response.status(400).json({ message: errors[0].message, errors });
      return;
    }

    // WB: DB use - unique check chạy trước transaction tạo hồ sơ.
    const duplicates = findDuplicates(database, employee);
    if (duplicates.length > 0) {
      response.status(409).json({ message: duplicates[0].message, errors: duplicates });
      return;
    }

    const savedPaths = [];
    try {
      // WB: Success/failure path - hồ sơ và bảng phụ thuộc được ghi nguyên tử.
      const createRecord = database.transaction(() => {
        const portrait = files.find((file) => file.fieldname === 'portrait');
        const inserted = database.prepare(`
          INSERT INTO employee (
            full_name, gender, birth_date, hometown, email, phone, address,
            national_id, tax_code, social_insurance_number,
            health_insurance_number, is_foreign_worker, portrait_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          employee.fullName.trim(),
          employee.gender,
          employee.birthDate,
          employee.hometown.trim(),
          employee.email.trim(),
          employee.phone.trim(),
          employee.address.trim(),
          employee.nationalId.trim(),
          employee.taxCode || null,
          employee.socialInsuranceNumber || null,
          employee.healthInsuranceNumber || null,
          employee.isForeignWorker === true ||
            employee.isForeignWorker === 1 ||
            employee.isForeignWorker === 'true' ? 1 : 0,
          'pending'
        );
        // WB: Def - SQLite row id tạo employeeId cho mã và quan hệ phụ thuộc.
        const employeeId = Number(inserted.lastInsertRowid);
        const employeeCode = `NS${String(employeeId).padStart(6, '0')}`;
        database.prepare(`
          UPDATE employee SET employee_code = ?, portrait_path = ? WHERE id = ?
        `).run(employeeCode, 'pending', employeeId);
        const portraitPath = saveUpload(
          portrait, employeeId, 'portrait', uploadsDirectory, database, savedPaths
        );
        database.prepare('UPDATE employee SET portrait_path = ? WHERE id = ?')
          .run(portraitPath, employeeId);

        if (employee.isForeignWorker === true ||
            employee.isForeignWorker === 1 ||
            employee.isForeignWorker === 'true') {
          const workPermit = files.find((file) => file.fieldname === 'workPermitFile');
          const workPermitPath = saveUpload(
            workPermit, employeeId, 'workPermit', uploadsDirectory, database, savedPaths
          );
          database.prepare(`
            INSERT INTO employee_foreign_worker (
              employee_id, passport_number, work_permit_number, visa_number,
              passport_expiry_date, visa_expiry_date, work_permit_expiry_date,
              work_permit_file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            employeeId,
            employee.passportNumber,
            employee.workPermitNumber,
            employee.visaNumber,
            employee.passportExpiryDate,
            employee.visaExpiryDate,
            employee.workPermitExpiryDate,
            workPermitPath
          );
        }

        const insertFamily = database.prepare(`
          INSERT INTO employee_family (employee_id, name, relationship) VALUES (?, ?, ?)
        `);
        // WB: Loop/DB write - lưu từng thành viên gia đình.
        for (const member of employee.familyMembers || []) {
          insertFamily.run(employeeId, member.name.trim(), member.relationship);
        }

        const insertWorkHistory = database.prepare(`
          INSERT INTO employee_work_history
            (employee_id, workplace, from_date, to_date)
          VALUES (?, ?, ?, ?)
        `);
        // WB: Loop/DB write - lưu từng quá trình công tác.
        for (const history of employee.workHistories || []) {
          insertWorkHistory.run(
            employeeId, history.workplace.trim(), history.fromDate, history.toDate
          );
        }

        database.prepare(`
          INSERT INTO employee_bank (employee_id, account_number, bank_name)
          VALUES (?, ?, ?)
        `).run(employeeId, employee.bankAccountNumber, employee.bankName.trim());
        database.prepare(`
          INSERT INTO employee_membership (employee_id, join_date, details)
          VALUES (?, ?, ?)
        `).run(employeeId, employee.partyJoinDate, employee.partyDetails.trim());
        database.prepare(`
          INSERT INTO employee_education (employee_id, education_level, academic_title)
          VALUES (?, ?, ?)
        `).run(employeeId, employee.educationLevel.trim(), employee.academicTitle.trim());

        // WB: Loop - xử lý từng nhóm bằng cấp/chứng chỉ.
        for (const [section, table, category] of [
          ['degrees', 'employee_degree', 'degree'],
          ['certificates', 'employee_certificate', 'certificate']
        ]) {
          const insertEntry = database.prepare(`
            INSERT INTO ${table} (employee_id, name, issuer, file_path)
            VALUES (?, ?, ?, ?)
          `);
          // WB: Loop/DB write - liên kết mỗi bản ghi với file upload tương ứng.
          (employee[section] || []).forEach((entry, index) => {
            const file = files.find((item) =>
              item.fieldname === `${section}[${index}].file`
            );
            const filePath = saveUpload(
              file,
              employeeId,
              category,
              uploadsDirectory,
              database,
              savedPaths
            );
            insertEntry.run(employeeId, entry.name.trim(), entry.issuer.trim(), filePath);
          });
        }

        database.prepare(`
          INSERT INTO employee_history (employee_id, action) VALUES (?, 'CREATE')
        `).run(employeeId);

        return { id: employeeId, employeeCode };
      });

      // WB: Success path - chỉ phản hồi thành công sau khi transaction commit.
      const created = createRecord();
      response.status(201).json({
        message: 'Thêm mới hồ sơ nhân sự thành công.',
        employee: {
          ...created,
          contractStatus: 'Chưa hợp đồng',
          workStatus: 'Đang chờ xét'
        }
      });
    } catch (error) {
      for (const savedPath of savedPaths) {
        try {
          fs.unlinkSync(savedPath);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') {
            next(cleanupError);
            return;
          }
        }
      }

      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        response.status(409).json({
          message: 'Dữ liệu đã tồn tại trong hệ thống.',
          errors: [{ field: 'employee', message: 'Dữ liệu đã tồn tại trong hệ thống.' }]
        });
        return;
      }
      next(error);
    }
  });

  return router;
}

module.exports = { createEmployeeRouter };
