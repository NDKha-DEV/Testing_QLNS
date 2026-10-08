const express = require('express');
const { validateOrganizationUnit } = require('./validation');

function createOrganizationUnitRouter({ database }) {
  const router = express.Router();

  router.post('/', (request, response) => {
    const unit = request.body;
    if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
      response.status(400).json({
        message: 'Dữ liệu đơn vị không hợp lệ',
        errors: [{ field: 'body', message: 'Dữ liệu đơn vị không hợp lệ' }]
      });
      return;
    }

    // WB: Validation branches - lỗi dữ liệu chặn trước khi gọi database.
    const errors = validateOrganizationUnit(unit);
    if (errors.length > 0) {
      response.status(400).json({ message: errors[0].message, errors });
      return;
    }

    const parentUnitId = unit.parentUnitId === undefined || unit.parentUnitId === null
      ? null
      : Number(unit.parentUnitId);
    if (parentUnitId !== null) {
      // WB: DB read/decision - đơn vị cha phải tồn tại để giữ quan hệ self-reference.
      const parent = database.prepare(
        'SELECT id FROM organization_units WHERE id = ?'
      ).get(parentUnitId);
      if (!parent) {
        response.status(400).json({
          message: 'Đơn vị cha không tồn tại',
          errors: [{ field: 'parentUnitId', message: 'Đơn vị cha không tồn tại' }]
        });
        return;
      }
    }

    try {
      // WB: DB write - unit code có UNIQUE constraint ở SQLite.
      const result = database.prepare(`
        INSERT INTO organization_units (
          parent_unit_id, unit_name, unit_code, unit_type,
          email, phone, website, address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        parentUnitId,
        unit.unitName.trim(),
        unit.unitCode,
        unit.unitType,
        unit.email,
        unit.phone,
        unit.website || null,
        unit.address || null
      );

      const createdUnit = database.prepare(`
        SELECT id, parent_unit_id AS parentUnitId,
          unit_name AS unitName, unit_code AS unitCode,
          unit_type AS unitType, email, phone, website, address, status
        FROM organization_units WHERE id = ?
      `).get(result.lastInsertRowid);

      // WB: Success path - phản hồi trả về dữ liệu đã đọc lại từ SQLite.
      response.status(201).json({
        message: 'Tạo đơn vị thành công',
        unit: createdUnit
      });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // WB: Failure branch - từ chối mã đơn vị đã tồn tại.
        response.status(409).json({
          message: 'Mã đơn vị đã tồn tại',
          errors: [{ field: 'unitCode', message: 'Mã đơn vị đã tồn tại' }]
        });
        return;
      }
      throw error;
    }
  });

  return router;
}

module.exports = { createOrganizationUnitRouter };
