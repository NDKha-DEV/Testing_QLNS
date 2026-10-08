const express = require('express');
const { validateUserAccount } = require('./validation');

function createUserAccountRouter({ database }) {
  const router = express.Router();

  router.post('/', (request, response) => {
    const account = request.body;
    if (!account || typeof account !== 'object' || Array.isArray(account)) {
      response.status(400).json({
        message: 'Dữ liệu tài khoản không hợp lệ',
        errors: [{ field: 'body', message: 'Dữ liệu tài khoản không hợp lệ' }]
      });
      return;
    }

    // WB: Branch - validation failures stop before database writes.
    const errors = validateUserAccount(account);
    if (errors.length > 0) {
      response.status(400).json({ message: errors[0].message, errors });
      return;
    }

    // WB: DB read - resolve the selected employee using the existing employee table.
    const employee = database.prepare(`
      SELECT id, employee_code AS employeeCode
      FROM employee WHERE employee_code = ?
    `).get(account.employeeCode.trim());
    if (!employee) {
      response.status(404).json({
        message: 'Không tìm thấy hồ sơ nhân sự',
        errors: [{
          field: 'employeeCode',
          message: 'Không tìm thấy hồ sơ nhân sự'
        }]
      });
      return;
    }

    // WB: DB read/branch - an employee can have at most one linked account.
    const existingAccount = database.prepare(`
      SELECT id FROM user_accounts WHERE employee_id = ?
    `).get(employee.id);
    if (existingAccount) {
      response.status(409).json({
        message: 'Nhân sự đã có tài khoản',
        errors: [{
          field: 'employeeCode',
          message: 'Nhân sự đã có tài khoản'
        }]
      });
      return;
    }

    try {
      // WB: Def/DB write - employee code supplies username and default password.
      const result = database.prepare(`
        INSERT INTO user_accounts (
          email, employee_id, username, default_password, role
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        account.email.trim(),
        employee.id,
        employee.employeeCode,
        employee.employeeCode,
        account.role.trim()
      );

      // WB: Success path - expose the created account and specified success message.
      response.status(201).json({
        message: 'Thêm tài khoản thành công',
        account: {
          id: Number(result.lastInsertRowid),
          email: account.email.trim(),
          employeeCode: employee.employeeCode,
          username: employee.employeeCode,
          defaultPassword: employee.employeeCode,
          role: account.role.trim()
        }
      });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // WB: Failure path - covers a concurrent create for the same employee.
        response.status(409).json({
          message: 'Nhân sự đã có tài khoản',
          errors: [{
            field: 'employeeCode',
            message: 'Nhân sự đã có tài khoản'
          }]
        });
        return;
      }
      throw error;
    }
  });

  return router;
}

module.exports = { createUserAccountRouter };
