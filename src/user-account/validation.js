function validateUserAccount(account) {
  const errors = [];
  const value = account || {};

  if (typeof value.email !== 'string' || value.email.trim() === '') {
    // WB: Branch - Email required.
    errors.push({ field: 'email', message: 'Vui lòng nhập email' });
  } else if (/\s/.test(value.email) ||
      !/^[^@]+@[^@.]+(?:\.[^@.]+)+$/.test(value.email)) {
    // WB: Branch - kiểm tra email thiếu @, domain hoặc chứa space.
    errors.push({
      field: 'email',
      message: 'Vui lòng nhập đúng định dạng email'
    });
  }

  if (typeof value.employeeCode !== 'string' || value.employeeCode.trim() === '') {
    // WB: Branch - Hồ sơ nhân sự required.
    errors.push({
      field: 'employeeCode',
      message: 'Vui lòng chọn hồ sơ nhân sự'
    });
  }

  if (typeof value.role !== 'string' || value.role.trim() === '') {
    // WB: Branch - role required.
    errors.push({
      field: 'role',
      message: 'Vui lòng chọn phân quyền'
    });
  }

  return errors;
}

module.exports = { validateUserAccount };
