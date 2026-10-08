const UNIT_TYPES = new Set(['Khoa', 'Phòng', 'Ban', 'Bộ môn']);

function characterCount(value) {
  return Array.from(value).length;
}

function validateOrganizationUnit(unit) {
  const errors = [];
  const value = unit || {};

  if (typeof value.unitName !== 'string' || value.unitName.trim() === '') {
    errors.push({
      field: 'unitName',
      message: 'Vui lòng nhập tên đơn vị'
    });
  } else if (/[\p{Cc}]/u.test(value.unitName)) {
    errors.push({
      field: 'unitName',
      message: 'Thông tin không đúng định dạng'
    });
  } else if (characterCount(value.unitName) > 100) {
    errors.push({
      field: 'unitName',
      message: 'Tên đơn vị không vượt quá 100 ký tự'
    });
  }

  if (typeof value.unitCode !== 'string' || value.unitCode.trim() === '') {
    errors.push({
      field: 'unitCode',
      message: 'Vui lòng nhập mã đơn vị'
    });
  } else if (characterCount(value.unitCode) > 20) {
    errors.push({
      field: 'unitCode',
      message: 'Mã đơn vị không vượt quá 20 ký tự'
    });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(value.unitCode)) {
    errors.push({
      field: 'unitCode',
      message: 'Thông tin không đúng định dạng'
    });
  }

  if (typeof value.unitType !== 'string' || value.unitType.trim() === '') {
    errors.push({
      field: 'unitType',
      message: 'Vui lòng chọn loại đơn vị'
    });
  } else if (!UNIT_TYPES.has(value.unitType)) {
    errors.push({
      field: 'unitType',
      message: 'Thông tin không đúng định dạng'
    });
  }

  if (typeof value.email !== 'string' || value.email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'Vui lòng nhập email'
    });
  } else if (characterCount(value.email) > 100) {
    errors.push({
      field: 'email',
      message: 'Email không vượt quá 100 ký tự'
    });
  } else if (/\s/.test(value.email) ||
      !/^[^@]+@[^@.]+(?:\.[^@.]+)+$/.test(value.email)) {
    errors.push({
      field: 'email',
      message: 'Thông tin không đúng định dạng'
    });
  }

  if (typeof value.phone !== 'string' || value.phone.trim() === '') {
    errors.push({
      field: 'phone',
      message: 'Vui lòng nhập số điện thoại'
    });
  } else if (!/^0\d{9}$/.test(value.phone)) {
    errors.push({
      field: 'phone',
      message: 'Thông tin không đúng định dạng'
    });
  }

  if (value.website !== undefined && value.website !== '') {
    if (typeof value.website !== 'string' || value.website.trim() === '' ||
        /\s/.test(value.website)) {
      errors.push({
        field: 'website',
        message: 'Thông tin không đúng định dạng'
      });
    } else if (characterCount(value.website) > 2048) {
      errors.push({
        field: 'website',
        message: 'Website không vượt quá 2048 ký tự'
      });
    } else if (!isHttpUrl(value.website)) {
      errors.push({
        field: 'website',
        message: 'Thông tin không đúng định dạng'
      });
    }
  }

  if (value.address !== undefined && value.address !== '') {
    if (typeof value.address !== 'string' || value.address.trim() === '') {
      errors.push({
        field: 'address',
        message: 'Thông tin không đúng định dạng'
      });
    } else if (characterCount(value.address) > 200) {
      errors.push({
        field: 'address',
        message: 'Địa chỉ không vượt quá 200 ký tự'
      });
    }
  }

  if (value.parentUnitId !== undefined && value.parentUnitId !== null &&
      (!Number.isInteger(Number(value.parentUnitId)) || Number(value.parentUnitId) <= 0)) {
    errors.push({
      field: 'parentUnitId',
      message: 'Đơn vị cha không hợp lệ'
    });
  }

  return errors;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

module.exports = { validateOrganizationUnit };
