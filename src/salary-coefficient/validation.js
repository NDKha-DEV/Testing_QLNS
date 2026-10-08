function isBlank(value) {
  return value === undefined || value === null ||
    (typeof value === 'string' && value.trim() === '');
}

function parseNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateSalaryCoefficient(input) {
  const errors = [];
  const value = input || {};

  if (isBlank(value.coefficientCode)) {
    // WB: required-field branch.
    errors.push({
      field: 'coefficientCode',
      message: 'Mã hệ số lương không được để trống'
    });
  }

  if (isBlank(value.civilServantRank)) {
    // WB: required-field branch for rank.
    errors.push({
      field: 'civilServantRank',
      message: 'Vui lòng điền ngạch viên chức'
    });
  }

  if (isBlank(value.salaryStep)) {
    // WB: required-field branch for salary step.
    errors.push({
      field: 'salaryStep',
      message: 'Vui lòng điền bậc lương'
    });
  } else {
    const salaryStep = parseNumber(value.salaryStep);
    // WB: format branch - step must be an integer.
    if (salaryStep === null || !Number.isInteger(salaryStep)) {
      errors.push({
        field: 'salaryStep',
        message: 'Bậc lương phải là số nguyên'
      });
    }
  }

  if (isBlank(value.coefficient)) {
    errors.push({
      field: 'coefficient',
      message: 'Hệ số lương không được để trống'
    });
  } else {
    const coefficient = parseNumber(value.coefficient);
    // WB: Boundary - coefficient must be a finite real number greater than zero.
    if (coefficient === null) {
      errors.push({
        field: 'coefficient',
        message: 'Hệ số lương phải là số thực lớn hơn 0'
      });
    } else if (coefficient <= 0) {
      errors.push({
        field: 'coefficient',
        message: 'Hệ số lương phải là số thực lớn hơn 0'
      });
    }
  }

  return errors;
}

module.exports = { parseNumber, validateSalaryCoefficient };
