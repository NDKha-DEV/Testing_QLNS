const express = require('express');
const { parseNumber, validateSalaryCoefficient } = require('./validation');

function createSalaryCoefficientRouter({ database }) {
  const router = express.Router();

  router.post('/', (request, response) => {
    const input = request.body;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      response.status(400).json({
        message: 'Dữ liệu hệ số lương không hợp lệ',
        errors: [{
          field: 'body',
          message: 'Dữ liệu hệ số lương không hợp lệ'
        }]
      });
      return;
    }

    // WB: validation failure branch prevents database writes.
    const errors = validateSalaryCoefficient(input);
    if (errors.length > 0) {
      response.status(400).json({ message: errors[0].message, errors });
      return;
    }

    const salaryStep = parseNumber(input.salaryStep);
    const coefficient = parseNumber(input.coefficient);

    // WB: DB read/branch - code is unique; step is unique within the same rank.
    const existingCode = database.prepare(`
      SELECT id FROM salary_coefficients WHERE coefficient_code = ?
    `).get(input.coefficientCode.trim());
    if (existingCode) {
      response.status(409).json({
        message: 'Mã hệ số lương đã tồn tại',
        errors: [{
          field: 'coefficientCode',
          message: 'Mã hệ số lương đã tồn tại'
        }]
      });
      return;
    }

    const existingRankStep = database.prepare(`
      SELECT id FROM salary_coefficients
      WHERE civil_servant_rank = ? AND salary_step = ?
    `).get(input.civilServantRank.trim(), salaryStep);
    if (existingRankStep) {
      response.status(409).json({
        message: 'Bậc lương đã tồn tại trong ngạch viên chức',
        errors: [{
          field: 'salaryStep',
          message: 'Bậc lương đã tồn tại trong ngạch viên chức'
        }]
      });
      return;
    }

    try {
      // WB: DB insert - persist the validated catalog fields.
      const result = database.prepare(`
        INSERT INTO salary_coefficients (
          coefficient_code, civil_servant_rank, salary_step, coefficient
        ) VALUES (?, ?, ?, ?)
      `).run(
        input.coefficientCode.trim(),
        input.civilServantRank.trim(),
        salaryStep,
        coefficient
      );

      // WB: Success path - report success after row is persisted.
      response.status(201).json({
        message: 'Hệ số lương đã được thêm thành công',
        salaryCoefficient: {
          id: Number(result.lastInsertRowid),
          coefficientCode: input.coefficientCode.trim(),
          civilServantRank: input.civilServantRank.trim(),
          salaryStep,
          coefficient
        }
      });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const duplicate = database.prepare(`
          SELECT coefficient_code AS coefficientCode
          FROM salary_coefficients
          WHERE coefficient_code = ?
             OR (civil_servant_rank = ? AND salary_step = ?)
        `).get(input.coefficientCode.trim(), input.civilServantRank.trim(), salaryStep);
        const codeDuplicate = duplicate &&
          duplicate.coefficientCode === input.coefficientCode.trim();
        const message = codeDuplicate
          ? 'Mã hệ số lương đã tồn tại'
          : 'Bậc lương đã tồn tại trong ngạch viên chức';
        response.status(409).json({
          message,
          errors: [{
            field: codeDuplicate ? 'coefficientCode' : 'salaryStep',
            message
          }]
        });
        return;
      }
      throw error;
    }
  });

  return router;
}

module.exports = { createSalaryCoefficientRouter };
