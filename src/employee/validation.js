const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const RELATIONSHIPS = new Set(['Bố', 'Mẹ', 'Vợ', 'Chồng', 'Con']);

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function parseDate(value) {
  // WB: Branch - chỉ nhận ngày đúng định dạng DD/MM/YYYY và ngày lịch hợp lệ.
  if (typeof value !== 'string') {
    return null;
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day) {
    return null;
  }

  return date;
}

function dateAtStartOfToday() {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function hasValidAge(birthDate) {
  const today = dateAtStartOfToday();
  // WB: Def/Use - tuổi được tính rồi dùng làm điều kiện đủ 18.
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayNotReached =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());

  if (birthdayNotReached) {
    age -= 1;
  }

  // WB: Boundary - tuổi hợp lệ từ 18 trở lên.
  return age >= 18;
}

function hasAllowedAddressCharacters(value) {
  return /^[\p{L}\p{M}\p{N}\s,.'’/-]+$/u.test(value);
}

function fileFor(files, fieldName) {
  return files.find((file) => file.fieldname === fieldName);
}

function validateFile(file, fieldName, type, errors) {
  // WB: Branch - thiếu file là nhánh lỗi required.
  if (!file) {
    errors.push({ field: fieldName, message: 'Không được để trống' });
    return;
  }

  const extension = file.originalname.toLowerCase().split('.').pop();
  const isImage = type === 'image';
  const allowedExtension = isImage
    ? ['png', 'jpg', 'jpeg'].includes(extension)
    : extension === 'pdf';
  const isPng = file.buffer.subarray(0, 8).equals(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 &&
    file.buffer[2] === 0xff;
  const isPdf = file.buffer.subarray(0, 5).toString() === '%PDF-';
  const validContent = isImage
    ? (extension === 'png' ? isPng : isJpeg)
    : isPdf;

  // WB: Branch - extension và signature nội dung đều phải hợp lệ.
  if (!allowedExtension || !validContent) {
    errors.push({
      field: fieldName,
      message: isImage
        ? 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc JPEG.'
        : 'Định dạng file không hợp lệ. Chỉ chấp nhận PDF.'
    });
    return;
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  // WB: Boundary - đúng giới hạn cũng bị từ chối vì yêu cầu là nhỏ hơn.
  if (file.size >= maxSize) {
    errors.push({
      field: fieldName,
      message: isImage
        ? 'Dung lượng ảnh phải nhỏ hơn 5MB.'
        : 'Dung lượng file phải nhỏ hơn 10MB.'
    });
  }
}

function validateEmployee(employee, files) {
  // WB: Def - errors là kết quả validation, được bổ sung theo từng nhánh.
  const errors = [];
  const value = employee || {};

  const requiredFields = [
    ['fullName', 'Không được để trống'],
    ['gender', 'Giới tính không được để trống.'],
    ['birthDate', 'Ngày sinh không được để trống.'],
    ['hometown', 'Không được để trống'],
    ['email', 'Email không được để trống.'],
    ['phone', 'Số điện thoại không được để trống.'],
    ['address', 'Không được để trống'],
    ['nationalId', 'CCCD không được để trống.'],
    ['bankAccountNumber', 'Số tài khoản không được để trống.'],
    ['bankName', 'Vui lòng chọn ngân hàng.'],
    ['partyJoinDate', 'Ngày vào Đảng/Đoàn không được để trống.'],
    ['partyDetails', 'Chi tiết Đảng/Đoàn không được để trống.'],
    ['educationLevel', 'Trình độ văn hóa không được để trống.'],
    ['academicTitle', 'Vui lòng chọn học hàm/học vị.']
  ];

  // WB: Loop/Branch - xét lần lượt các trường required.
  for (const [field, message] of requiredFields) {
    if (typeof value[field] !== 'string' || isEmpty(value[field])) {
      errors.push({ field, message });
    }
  }

  // WB: Branch - giá trị cờ người nước ngoài quyết định luồng validation mở rộng.
  if (value.isForeignWorker !== undefined &&
      ![true, false, 0, 1, 'true', 'false'].includes(value.isForeignWorker)) {
    errors.push({ field: 'isForeignWorker', message: 'Giá trị người lao động nước ngoài không hợp lệ.' });
  }

  if (!isEmpty(value.fullName) &&
      (typeof value.fullName !== 'string' ||
        !/^[\p{L}\p{M} ]+$/u.test(value.fullName))) {
    errors.push({
      field: 'fullName',
      message: 'Họ tên không hợp lệ, chỉ được chứa chữ cái và khoảng trắng.'
    });
  }

  if (!isEmpty(value.gender) && !['Nam', 'Nữ'].includes(value.gender)) {
    errors.push({ field: 'gender', message: 'Giá trị giới tính không hợp lệ.' });
  }

  const birthDate = parseDate(value.birthDate);
  // WB: Branch - ngày sinh phải hợp lệ và đủ tuổi tối thiểu.
  if (!isEmpty(value.birthDate) && !birthDate) {
    errors.push({ field: 'birthDate', message: 'Ngày sinh không đúng định dạng DD/MM/YYYY.' });
  } else if (birthDate && !hasValidAge(birthDate)) {
    errors.push({ field: 'birthDate', message: 'Nhân sự phải đủ 18 tuổi.' });
  }

  for (const field of ['hometown', 'address']) {
    if (!isEmpty(value[field]) &&
        (typeof value[field] !== 'string' ||
          !hasAllowedAddressCharacters(value[field]) || !value[field].trim())) {
      errors.push({
        field,
        message: `${field === 'hometown' ? 'Quê quán' : 'Địa chỉ'} không hợp lệ.`
      });
    }
  }

  if (!isEmpty(value.email) &&
      (typeof value.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))) {
    errors.push({ field: 'email', message: 'Email không đúng định dạng.' });
  }

  if (!isEmpty(value.phone) &&
      (typeof value.phone !== 'string' || !/^\d{10}$/.test(value.phone))) {
    errors.push({ field: 'phone', message: 'Số điện thoại phải gồm 10 chữ số.' });
  }

  if (!isEmpty(value.nationalId) && typeof value.nationalId !== 'string') {
    errors.push({ field: 'nationalId', message: 'CCCD phải gồm 12 chữ số.' });
  } else if (!isEmpty(value.nationalId) && /\s/.test(value.nationalId)) {
    errors.push({ field: 'nationalId', message: 'CCCD không được chứa khoảng trắng.' });
  } else if (!isEmpty(value.nationalId) && !/^\d{12}$/.test(value.nationalId)) {
    errors.push({ field: 'nationalId', message: 'CCCD phải gồm 12 chữ số.' });
  }

  if (!isEmpty(value.taxCode) &&
      (typeof value.taxCode !== 'string' || !/^\d{10,13}$/.test(value.taxCode))) {
    errors.push({
      field: 'taxCode',
      message: 'Mã số thuế phải có từ 10 đến 13 chữ số.'
    });
  }

  if (!isEmpty(value.socialInsuranceNumber) &&
      (typeof value.socialInsuranceNumber !== 'string' ||
        !/^\d{10}$/.test(value.socialInsuranceNumber))) {
    errors.push({
      field: 'socialInsuranceNumber',
      message: 'Số BHXH phải gồm 10 chữ số.'
    });
  }

  if (!isEmpty(value.healthInsuranceNumber) &&
      (typeof value.healthInsuranceNumber !== 'string' ||
        !/^[a-zA-Z0-9]{15}$/.test(value.healthInsuranceNumber))) {
    errors.push({
      field: 'healthInsuranceNumber',
      message: 'Số BHYT phải gồm 15 ký tự chữ hoặc số.'
    });
  }

  if (!isEmpty(value.bankAccountNumber) &&
      (typeof value.bankAccountNumber !== 'string' ||
        !/^\d+$/.test(value.bankAccountNumber))) {
    errors.push({ field: 'bankAccountNumber', message: 'Số tài khoản chỉ được chứa chữ số.' });
  } else if (!isEmpty(value.bankAccountNumber) &&
      !/^\d{8,15}$/.test(value.bankAccountNumber)) {
    errors.push({
      field: 'bankAccountNumber',
      message: 'Số tài khoản phải có từ 8 đến 15 chữ số.'
    });
  }

  if (isEmpty(value.isForeignWorker)) {
    value.isForeignWorker = false;
  }
  // WB: Use - cờ này chọn nhánh kiểm tra thông tin lao động nước ngoài.
  const isForeignWorker = value.isForeignWorker === true ||
    value.isForeignWorker === 1 ||
    value.isForeignWorker === 'true';

  if (isForeignWorker) {
    // WB: Loop - kiểm tra required cho từng trường người nước ngoài.
    for (const [field, label] of [
      ['passportNumber', 'Số hộ chiếu'],
      ['workPermitNumber', 'Số giấy phép lao động'],
      ['visaNumber', 'Số Visa']
    ]) {
      if (typeof value[field] !== 'string' || isEmpty(value[field])) {
        errors.push({ field, message: `${label} không được để trống.` });
      }
    }

    if (!isEmpty(value.passportNumber) &&
        (typeof value.passportNumber !== 'string' ||
          !/^[\p{L}\p{N}]{6,15}$/u.test(value.passportNumber))) {
      errors.push({
        field: 'passportNumber',
        message: 'Số hộ chiếu phải có từ 6 đến 15 ký tự.'
      });
    }

    if (!isEmpty(value.workPermitNumber) &&
        (typeof value.workPermitNumber !== 'string' ||
          !/^[\p{L}\p{N}]+$/u.test(value.workPermitNumber))) {
      errors.push({
        field: 'workPermitNumber',
        message: 'Số giấy phép lao động không hợp lệ.'
      });
    }

    for (const [field, label] of [
      ['passportExpiryDate', 'Ngày hết hạn hộ chiếu'],
      ['visaExpiryDate', 'Ngày hết hạn Visa'],
      ['workPermitExpiryDate', 'Ngày hết hạn giấy phép lao động']
    ]) {
      const expiryDate = parseDate(value[field]);
      // WB: Boundary - hạn dùng phải lớn hơn ngày hiện tại.
      if (isEmpty(value[field])) {
        errors.push({ field, message: `${label} không được để trống.` });
      } else if (!expiryDate || expiryDate <= dateAtStartOfToday()) {
        errors.push({
          field,
          message: `${label} phải lớn hơn ngày hiện tại.`
        });
      }
    }

    validateFile(fileFor(files, 'workPermitFile'), 'workPermitFile', 'pdf', errors);
  }

  validateFile(fileFor(files, 'portrait'), 'portrait', 'image', errors);

  if (!isEmpty(value.partyJoinDate)) {
    const partyDate = parseDate(value.partyJoinDate);
    // WB: Branch - ngày tham gia phải sau ngày sinh và không sau ngày hiện tại.
    if (!partyDate) {
      errors.push({
        field: 'partyJoinDate',
        message: 'Ngày vào Đảng/Đoàn không đúng định dạng DD/MM/YYYY.'
      });
    } else if (birthDate && partyDate <= birthDate) {
      errors.push({
        field: 'partyJoinDate',
        message: 'Ngày vào Đảng/Đoàn phải lớn hơn ngày sinh.'
      });
    } else if (partyDate > dateAtStartOfToday()) {
      errors.push({
        field: 'partyJoinDate',
        message: 'Ngày vào Đảng/Đoàn không được lớn hơn ngày hiện tại.'
      });
    }
  }

  const familyMembers = Array.isArray(value.familyMembers) ? value.familyMembers : [];
  if (value.familyMembers !== undefined && !Array.isArray(value.familyMembers)) {
    errors.push({ field: 'familyMembers', message: 'Danh sách gia đình không hợp lệ.' });
  }
  // WB: Loop - mỗi thành viên gia đình có required, format và enum decisions.
  familyMembers.forEach((member, index) => {
    if (!member || typeof member !== 'object' || Array.isArray(member)) {
      errors.push({
        field: `familyMembers[${index}]`,
        message: 'Thông tin người thân không hợp lệ.'
      });
      return;
    }
    if (isEmpty(member.name)) {
      errors.push({
        field: `familyMembers[${index}].name`,
        message: 'Không được để trống'
      });
    } else if (typeof member.name !== 'string' ||
        !/^[\p{L}\p{M} ]+$/u.test(member.name)) {
      errors.push({
        field: `familyMembers[${index}].name`,
        message: 'Tên người thân chỉ được chứa chữ cái và khoảng trắng.'
      });
    }
    if (typeof member.relationship !== 'string' || isEmpty(member.relationship)) {
      errors.push({
        field: `familyMembers[${index}].relationship`,
        message: 'Quan hệ không được để trống.'
      });
    } else if (!RELATIONSHIPS.has(member.relationship)) {
      errors.push({
        field: `familyMembers[${index}].relationship`,
        message: 'Quan hệ không hợp lệ.'
      });
    }
  });

  const workHistories = Array.isArray(value.workHistories) ? value.workHistories : [];
  if (value.workHistories !== undefined && !Array.isArray(value.workHistories)) {
    errors.push({ field: 'workHistories', message: 'Quá trình công tác không hợp lệ.' });
  }
  // WB: Loop/Boundary - kiểm tra ngày bắt đầu <= kết thúc và bắt đầu < hôm nay.
  workHistories.forEach((history, index) => {
    const prefix = `workHistories[${index}]`;
    if (!history || typeof history !== 'object' || Array.isArray(history)) {
      errors.push({ field: prefix, message: 'Thông tin quá trình công tác không hợp lệ.' });
      return;
    }
    const fromDate = parseDate(history.fromDate);
    const toDate = parseDate(history.toDate);
    if (typeof history.workplace !== 'string' || isEmpty(history.workplace)) {
      errors.push({ field: `${prefix}.workplace`, message: 'Nơi công tác không được để trống.' });
    }
    if (!fromDate) {
      errors.push({ field: `${prefix}.fromDate`, message: 'Từ ngày không đúng định dạng DD/MM/YYYY.' });
    }
    if (!toDate) {
      errors.push({ field: `${prefix}.toDate`, message: 'Đến ngày không đúng định dạng DD/MM/YYYY.' });
    }
    if (fromDate && toDate && fromDate > toDate) {
      errors.push({
        field: `${prefix}.fromDate`,
        message: 'Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.'
      });
    }
    if (fromDate && fromDate >= dateAtStartOfToday()) {
      errors.push({
        field: `${prefix}.fromDate`,
        message: 'Từ ngày phải nhỏ hơn ngày hiện tại.'
      });
    }
  });

  for (const [field, section, label] of [
    ['degrees', 'degrees', 'bằng'],
    ['certificates', 'certificates', 'chứng chỉ']
  ]) {
    const entries = Array.isArray(value[field]) ? value[field] : [];
    if (value[field] !== undefined && !Array.isArray(value[field])) {
      errors.push({ field, message: `Danh sách ${label} không hợp lệ.` });
      continue;
    }

    // WB: Loop - validation file và trường required cho từng bằng/chứng chỉ.
    entries.forEach((entry, index) => {
      const prefix = `${section}[${index}]`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push({ field: prefix, message: `Thông tin ${label} không hợp lệ.` });
        return;
      }
      if (typeof entry.name !== 'string' || isEmpty(entry.name)) {
        errors.push({ field: `${prefix}.name`, message: 'Không được để trống' });
      }
      if (typeof entry.issuer !== 'string' || isEmpty(entry.issuer)) {
        errors.push({ field: `${prefix}.issuer`, message: 'Nơi cấp không được để trống.' });
      }
      validateFile(
        fileFor(files, `${section}[${index}].file`),
        `${prefix}.file`,
        'pdf',
        errors
      );
    });
  }

  return errors;
}

module.exports = {
  MAX_DOCUMENT_SIZE,
  MAX_IMAGE_SIZE,
  parseDate,
  validateEmployee
};
