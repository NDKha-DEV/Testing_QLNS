# Testing_QLNS

Backend demo dùng cho kiểm thử hộp trắng các Use Case quản lý nhân sự.

## Chạy backend

Yêu cầu Node.js 20 trở lên.

```sh
npm install
npm start
```

Backend mặc định lắng nghe tại `http://localhost:3000`, tạo SQLite database
tại `data/hrm.sqlite` và lưu file upload tại `data/employee-files`.
Có thể đổi vị trí database bằng biến môi trường `DATABASE_PATH`, thư mục file
bằng `UPLOADS_DIRECTORY`, hoặc cổng bằng `PORT`.

## API hồ sơ nhân sự

- `GET /health`: kiểm tra backend.
- `GET /api/employees`: danh sách hồ sơ đã tạo.
- `GET /api/employees/:id`: xem một hồ sơ.
- `POST /api/employees`: tạo hồ sơ bằng `multipart/form-data`. Trường `employee`
  chứa JSON hồ sơ; file upload có tên `portrait`, `workPermitFile`,
  `degrees[0].file`, `certificates[0].file` (chỉ gửi các trường áp dụng).
  JSON hồ sơ dùng các thuộc tính camelCase tương ứng Use Case, gồm
  `fullName`, `gender`, `birthDate` (`DD/MM/YYYY`), `hometown`, `email`,
  `phone`, `address`, `nationalId`, các trường tùy chọn bảo hiểm/thuế,
  `isForeignWorker`, `bankAccountNumber`, `bankName`, `partyJoinDate`,
  `partyDetails`, `educationLevel`, `academicTitle` và các mảng
  `familyMembers`, `workHistories`, `degrees`, `certificates`.
- `POST /api/organization-units`: tạo đơn vị tổ chức từ JSON với các trường
  `unitName`, `unitCode`, `unitType`, `email`, `phone` và tùy chọn
  `website`, `address`, `parentUnitId`. Giá trị `parentUnitId` phải trỏ tới
  đơn vị đã tồn tại. Mã đơn vị trùng trả HTTP 409 với thông báo
  “Mã đơn vị đã tồn tại”; đơn vị mới mặc định có trạng thái “Đang hoạt động”.
- `POST /api/user-accounts`: tạo tài khoản từ JSON với các trường `email`,
  `employeeCode` (mã hồ sơ nhân sự đã tồn tại) và `role`. Username và mật khẩu
  mặc định bằng mã nhân sự; mỗi hồ sơ chỉ liên kết được một tài khoản.
- `POST /api/salary-coefficients`: tạo danh mục hệ số lương từ JSON với các
  trường `coefficientCode`, `civilServantRank`, `salaryStep`, `coefficient`.
  Mã hệ số lương không trùng; bậc lương không trùng trong cùng ngạch.

Kết quả tạo thành công trả mã nhân sự tự sinh, trạng thái hợp đồng “Chưa hợp
đồng” và trạng thái làm việc “Đang chờ xét”. Lỗi validation trả HTTP 400;
dữ liệu unique bị trùng trả HTTP 409.

Chạy kiểm thử bằng `npm test`.
