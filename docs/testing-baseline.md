# Testing Baseline

> Đây là baseline chức năng và kiểm thử cho project. Không tự sửa nội dung để phù hợp với code. Nếu code và baseline khác nhau, phải báo và hỏi người dùng.

---

# 1. Nguyên tắc chung

- Use Case là cơ sở chức năng.
- Test Case cụ thể hóa các trường hợp hợp lệ, không hợp lệ và trạng thái/luồng cần kiểm tra.
- Code phải bám hai nguồn này.
- Không tự thêm nghiệp vụ.
- Không tự thay đổi expected result.
- Các module cùng project nhưng giữ phạm vi độc lập để từng thành viên tự kiểm thử.

## Thành viên

| Thành viên | Use Case | Test Case |
|---|---|---|
| Nguyễn Đình Kha | Thêm mới Hồ sơ nhân sự | ADD01–ADD60 |
| Nguyễn Văn Thịnh | Tạo mới đơn vị tổ chức nhân sự | TC01–TC105 |
| Hoàng Tùng | Thêm mới tài khoản người dùng | ADD_U01–ADD_U12 |
| Hoàng Tùng | Thêm mới danh mục hệ số lương | ADD_S01–ADD_S14 |

---

# 2. Nguyễn Đình Kha — Thêm mới Hồ sơ nhân sự

## 2.1. Use Case

**Tên:** Thêm mới Hồ sơ nhân sự

**Actor:** Cán bộ phòng TCCB

**Mục đích:** Cho phép cán bộ TCCB tạo và lưu hồ sơ nhân sự đầy đủ.

**Ưu tiên:** Mandatory

**Precondition:** Người dùng đã đăng nhập.

**Trigger:** Chọn “Thêm mới hồ sơ nhân sự”.

**Success:** Tạo hồ sơ nhân sự mới.

**Failure:** Không tạo được do lỗi hệ thống hoặc dữ liệu không hợp lệ.

## 2.2. Main flow

1. Tại danh sách nhân viên, click “Thêm mới hồ sơ nhân sự”.
2. Hệ thống hiển thị form nhập.
3. Nhập thông tin.

### Ảnh chân dung
- Bắt buộc.
- PNG/JPG/JPEG.
- Dung lượng <5MB.

### Thông tin cá nhân
- Họ tên: bắt buộc; chỉ chữ và khoảng trắng.
- Giới tính: bắt buộc; Nam/Nữ.
- Ngày sinh: bắt buộc; DD/MM/YYYY; nhân sự phải ít nhất 18 tuổi tính tới ngày hiện tại.
- Quê quán: bắt buộc; không rỗng; không ký tự đặc biệt.
- Email: bắt buộc; định dạng example@domain.com; unique.
- Số điện thoại: bắt buộc; 10 chữ số; unique.
- Địa chỉ: bắt buộc; không rỗng; không ký tự đặc biệt.
- CCCD: bắt buộc; đúng 12 chữ số; unique; không khoảng trắng.
- Mã số thuế: tùy chọn; nếu nhập 10–13 chữ số; không khoảng trắng.
- Số BHXH: tùy chọn; đúng 10 chữ số; không khoảng trắng.
- Số BHYT: tùy chọn; đúng 15 ký tự chữ/số; không khoảng trắng.

### Người lao động nước ngoài

Nếu chọn checkbox người nước ngoài thì các trường bổ sung bắt buộc:
- Số hộ chiếu: 6–15 ký tự; không ký tự đặc biệt/khoảng trắng; unique.
- Số giấy phép lao động: không ký tự đặc biệt/khoảng trắng; unique.
- Ngày hết hạn hộ chiếu, Visa, giấy phép lao động: phải > ngày hiện tại.
- File giấy phép lao động: PDF <10MB.

### Gia đình
Có thể có nhiều dòng:
- Tên người thân: bắt buộc; chỉ chữ.
- Quan hệ: bắt buộc; Bố/Mẹ/Vợ/Chồng/Con.

### Quá trình công tác
Có thể có nhiều dòng:
- Nơi công tác: bắt buộc/nonempty.
- Từ ngày, Đến ngày: bắt buộc; DD/MM/YYYY.
- Từ ngày <= Đến ngày.
- Từ ngày < ngày hiện tại.

### Ngân hàng
- Số tài khoản: bắt buộc; chỉ chữ số; 8–15 ký tự.
- Tên ngân hàng: bắt buộc; chọn từ danh sách ngân hàng hợp pháp.

### Đảng/Đoàn
- Ngày vào: bắt buộc; DD/MM/YYYY; > ngày sinh; <= ngày hiện tại.
- Chi tiết: bắt buộc; nonempty.

### Học vấn
- Trình độ văn hóa: bắt buộc, ví dụ 12/12.
- Học hàm/Học vị: bắt buộc; chọn từ danh sách.

### Bằng cấp
Có thể có nhiều dòng:
- Tên bằng: bắt buộc.
- Nơi cấp: bắt buộc/nonempty.
- File PDF: bắt buộc; PDF <10MB.

### Chứng chỉ
Có thể có nhiều dòng:
- Tên chứng chỉ: bắt buộc.
- Nơi cấp: bắt buộc/nonempty.
- File PDF: bắt buộc; PDF <10MB.

4. Hệ thống kiểm tra tính đầy đủ, hợp lệ và logic.
5. Click “Lưu”.
6. Hệ thống tự sinh Mã nhân sự; Trạng thái hợp đồng = “Chưa hợp đồng”; Trạng thái làm việc = “Đang chờ xét”.
7. Lưu hồ sơ, lịch sử tạo hồ sơ và thông báo thành công.

### Exceptions
- E1: dữ liệu thiếu/sai -> cảnh báo “Không được để trống” hoặc lỗi tương ứng; đánh dấu trường/tab; block save.
- E2: click “Hủy” trong bước nhập -> quay lại danh sách nhân viên.

## 2.3. Test Case ADD01–ADD60

| ID | Đầu vào / điều kiện | Kết quả mong đợi |
|---|---|---|
| ADD01 | Toàn bộ trường bắt buộc hợp lệ, trường tùy chọn để trống | Cho phép lưu; tự sinh Mã nhân sự; Hợp đồng “Chưa hợp đồng”; làm việc “Đang chờ xét”; lưu hồ sơ và thông báo thành công. |
| ADD02 | Họ tên rỗng | “Không được để trống”; đánh dấu trường/tab lỗi; không lưu. |
| ADD03 | Họ tên “Nguyễn Văn 123” | “Họ tên không hợp lệ, chỉ được chứa chữ cái và khoảng trắng.”; không lưu. |
| ADD04 | Giới tính ngoài Nam/Nữ | “Giá trị giới tính không hợp lệ.”; không lưu. |
| ADD05 | Nhân sự 17 tuổi | “Nhân sự phải đủ 18 tuổi.”; không lưu. |
| ADD06 | Đúng ngày đủ 18 tuổi | Vượt kiểm tra tuổi; không lỗi Ngày sinh. |
| ADD07 | Quê quán rỗng | “Không được để trống”; không lưu. |
| ADD08 | Email `abc@` | “Email không đúng định dạng.”; không lưu. |
| ADD09 | Email hợp lệ nhưng đã tồn tại | “Email đã tồn tại trong hệ thống.”; không lưu. |
| ADD10 | SĐT 9 chữ số | “Số điện thoại phải gồm 10 chữ số.”; không lưu. |
| ADD11 | SĐT 10 chữ số, chưa tồn tại | Vượt kiểm tra SĐT. |
| ADD12 | CCCD 11 chữ số | “CCCD phải gồm 12 chữ số.”; không lưu. |
| ADD13 | CCCD 12 chữ số, chưa trùng | Vượt kiểm tra CCCD. |
| ADD14 | CCCD có khoảng trắng | “CCCD không được chứa khoảng trắng.”; không lưu. |
| ADD15 | Địa chỉ rỗng | “Không được để trống”; không lưu. |
| ADD16 | MST 9 chữ số | “Mã số thuế phải có từ 10 đến 13 chữ số.”; không lưu. |
| ADD17 | MST 10 chữ số | Vượt kiểm tra độ dài MST. |
| ADD18 | MST 13 chữ số | Vượt kiểm tra độ dài MST. |
| ADD19 | MST 14 chữ số | “Mã số thuế phải có từ 10 đến 13 chữ số.”; không lưu. |
| ADD20 | SĐT 9 chữ số | “Số điện thoại phải gồm 10 chữ số.”; không lưu. |
| ADD21 | SĐT 10 chữ số | Vượt kiểm tra độ dài SĐT. |
| ADD22 | SĐT 11 chữ số | “Số điện thoại phải gồm 10 chữ số.”; không lưu. |
| ADD23 | CCCD 11 chữ số | “CCCD phải gồm 12 chữ số.”; không lưu. |
| ADD24 | CCCD 12 chữ số | Vượt kiểm tra độ dài CCCD. |
| ADD25 | CCCD 13 chữ số | “CCCD phải gồm 12 chữ số.”; không lưu. |
| ADD26 | STK 7 chữ số | “Số tài khoản phải có từ 8 đến 15 chữ số.”; không lưu. |
| ADD27 | STK 8 chữ số | Vượt giới hạn dưới. |
| ADD28 | STK 15 chữ số | Vượt giới hạn trên. |
| ADD29 | STK 16 chữ số | “Số tài khoản phải có từ 8 đến 15 chữ số.”; không lưu. |
| ADD30 | Hộ chiếu 5 ký tự | “Số hộ chiếu phải có từ 6 đến 15 ký tự.”; không lưu. |
| ADD31 | Hộ chiếu 6 ký tự | Vượt giới hạn dưới. |
| ADD32 | Hộ chiếu 15 ký tự | Vượt giới hạn trên. |
| ADD33 | Hộ chiếu 16 ký tự | “Số hộ chiếu phải có từ 6 đến 15 ký tự.”; không lưu. |
| ADD34 | Ảnh JPG ngay dưới 5MB | Chấp nhận. |
| ADD35 | Ảnh JPG đúng 5MB | “Dung lượng ảnh phải nhỏ hơn 5MB.”; không lưu. |
| ADD36 | Ảnh >5MB | “Dung lượng ảnh phải nhỏ hơn 5MB.”; không lưu. |
| ADD37 | Upload ảnh PDF | “Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc JPEG.”; không lưu. |
| ADD38 | Giấy phép lao động PDF ngay dưới 10MB | Chấp nhận. |
| ADD39 | Giấy phép lao động đúng 10MB | “Dung lượng file phải nhỏ hơn 10MB.”; không lưu. |
| ADD40 | Giấy phép lao động >10MB | “Dung lượng file phải nhỏ hơn 10MB.”; không lưu. |
| ADD41 | Giấy phép lao động không PDF | “Định dạng file không hợp lệ. Chỉ chấp nhận PDF.”; không lưu. |
| ADD42 | Người nước ngoài = Không | Trường bổ sung không bắt buộc; tiếp tục kiểm tra. |
| ADD43 | Người nước ngoài = Có, hộ chiếu rỗng | “Không được để trống” tại Số hộ chiếu; đánh dấu tab; không lưu. |
| ADD44 | Người nước ngoài = Có, hộ chiếu hợp lệ nhưng thiếu Visa | “Số Visa không được để trống.”; không lưu. |
| ADD45 | Người nước ngoài = Có, ngày hết hạn hộ chiếu <= hiện tại | “Ngày hết hạn hộ chiếu phải lớn hơn ngày hiện tại.”; không lưu. |
| ADD46 | Người nước ngoài = Có, toàn bộ bổ sung hợp lệ | Vượt điều kiện người nước ngoài; tiếp tục kiểm tra. |
| ADD47 | Email hợp lệ nhưng trùng | “Email đã tồn tại trong hệ thống.”; không lưu. |
| ADD48 | CCCD hợp lệ nhưng trùng | “CCCD đã tồn tại trong hệ thống.”; không lưu. |
| ADD49 | Từ ngày > Đến ngày | “Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.”; không lưu. |
| ADD50 | Từ ngày >= ngày hiện tại | “Từ ngày phải nhỏ hơn ngày hiện tại.”; không lưu. |
| ADD51 | Ngày vào Đảng/Đoàn <= ngày sinh | “Ngày vào Đảng/Đoàn phải lớn hơn ngày sinh.”; không lưu. |
| ADD52 | Ngày vào Đảng/Đoàn > hiện tại | “Ngày vào Đảng/Đoàn không được lớn hơn ngày hiện tại.”; không lưu. |
| ADD53 | Không chọn ngân hàng | “Vui lòng chọn ngân hàng.”; không lưu. |
| ADD54 | STK có ký tự chữ | “Số tài khoản chỉ được chứa chữ số.”; không lưu. |
| ADD55 | Không chọn Học hàm/Học vị | “Vui lòng chọn học hàm/học vị.”; không lưu. |
| ADD56 | Tên bằng trống | “Không được để trống”; đánh dấu tab học vấn; không lưu. |
| ADD57 | File bằng cấp không PDF | “Định dạng file không hợp lệ. Chỉ chấp nhận PDF.”; không lưu. |
| ADD58 | Tên chứng chỉ trống | “Không được để trống”; không lưu. |
| ADD59 | File chứng chỉ >10MB | “Dung lượng file phải nhỏ hơn 10MB.”; không lưu. |
| ADD60 | Tất cả bắt buộc hợp lệ; tùy chọn hợp lệ/trống; unique không trùng; quan hệ ngày hợp lệ | Lưu thành công; sinh Mã nhân sự; Hợp đồng “Chưa hợp đồng”; làm việc “Đang chờ xét”; lưu lịch sử và thông báo thành công. |

---

# 3. Nguyễn Văn Thịnh — Tạo mới đơn vị tổ chức nhân sự

## 3.1. Use Case

**Actor:** Cán bộ TCCB

**Mục đích:** Tạo đơn vị tổ chức mới.

**Ưu tiên:** Mandatory

**Trigger:** Click “Thêm mới đơn vị” tại đơn vị cha.

**Precondition:** Đã đăng nhập.

**Success:** Đơn vị mới được lưu.

**Failure:** Không lưu.

### Dữ liệu

- Tên đơn vị: nonempty, không chỉ whitespace, tối đa 100 ký tự, không control character.
- Mã đơn vị: nonempty, tối đa 20 ký tự, unique, chỉ chữ/số/hyphen/underscore.
- Loại đơn vị: bắt buộc; Khoa/Phòng/Ban/Bộ môn.
- Email: bắt buộc; username@domain; không space; tối đa 100 ký tự.
- Số điện thoại: bắt buộc; bắt đầu 0; đúng 10 chữ số; chỉ chữ số.
- Website: không chỉ whitespace; nếu nhập phải là URL hợp lệ; tối đa 2048 ký tự.
- Địa chỉ: không chỉ whitespace; tối đa 200 ký tự.

### Main flow

1. Hiển thị form đơn vị mới.
2. Nhập dữ liệu.
3. Click “Lưu đơn vị”.
4. Validate.
5. Lưu; mặc định trạng thái “Đang hoạt động”.

### Exceptions

- E1: mã đơn vị trùng -> “Mã đơn vị đã tồn tại”.
- E2: thiếu bắt buộc -> “Vui lòng chọn/nhập …”.
- E3: sai định dạng -> “Thông tin không đúng định dạng”.
- E4: quá độ dài -> “Thông tin không vượt quá … ký tự”.
- E5: hủy/đóng -> đóng form, bỏ dữ liệu, quay lại màn hình trước.

## 3.2. Test Case TC01–TC105

| ID | Nội dung kiểm thử / dữ liệu đầu vào | Phương pháp | Kết quả |
|---|---|---|---|
| TC01 | Toàn bộ dữ liệu hợp lệ, nhấn Lưu đơn vị | Phân vùng tương đương | Tạo đơn vị thành công |
| TC02 | Kiểm tra dữ liệu sau khi lưu | Bảng quyết định | Dữ liệu được lưu đúng |
| TC03 | Tạo đơn vị tại một đơn vị cha cụ thể | Bảng quyết định | Đơn vị mới gắn đúng đơn vị cha |
| TC04 | Kiểm tra trạng thái sau khi tạo | Bảng quyết định | “Đang hoạt động” |
| TC05 | Website trống, trường khác hợp lệ | Phân vùng tương đương | Lưu thành công |
| TC06 | Địa chỉ trống, trường khác hợp lệ | Phân vùng tương đương | Lưu thành công |
| TC07 | Website và Địa chỉ trống | Phân vùng tương đương | Lưu thành công |
| TC08 | Tên “Phòng Tổ chức Cán bộ” | Phân vùng tương đương | Chấp nhận |
| TC09 | Tên đơn vị trống | Phân vùng tương đương | “Vui lòng nhập tên đơn vị”, không lưu |
| TC10 | Tên chỉ whitespace | Phân vùng tương đương | Báo lỗi, không lưu |
| TC11 | Tên chứa newline | Phân vùng tương đương | Báo lỗi định dạng, không lưu |
| TC12 | Tên chứa tab | Phân vùng tương đương | Báo lỗi định dạng, không lưu |
| TC13 | Tên 99 ký tự | Giá trị biên | Chấp nhận |
| TC14 | Tên 100 ký tự | Giá trị biên | Chấp nhận |
| TC15 | Tên 101 ký tự | Giá trị biên | Vượt 100 ký tự, không lưu |
| TC16 | Mã TCCB999 chưa tồn tại | Phân vùng tương đương | Chấp nhận |
| TC17 | Mã trống | Phân vùng tương đương | “Vui lòng nhập mã đơn vị”, không lưu |
| TC18 | Mã TCCB001 đã tồn tại | Phân vùng tương đương | “Mã đơn vị đã tồn tại”, không lưu |
| TC19 | Mã chỉ whitespace | Phân vùng tương đương | Báo lỗi, không lưu |
| TC20 | Mã TCCB001 | Phân vùng tương đương | Chấp nhận nếu chưa tồn tại |
| TC21 | Mã PHONG_TCCB | Phân vùng tương đương | Chấp nhận nếu chưa tồn tại |
| TC22 | Mã KHOA-CNTT | Phân vùng tương đương | Chấp nhận nếu chưa tồn tại |
| TC23 | Mã TCCB 001 | Phân vùng tương đương | Sai định dạng, không lưu |
| TC24 | Mã TCCB@001 | Phân vùng tương đương | Sai định dạng, không lưu |
| TC25 | Mã TCCB.001 | Phân vùng tương đương | Sai định dạng, không lưu |
| TC26 | Mã TCCB/001 | Phân vùng tương đương | Sai định dạng, không lưu |
| TC27 | Mã hợp lệ 19 ký tự | Giá trị biên | Chấp nhận nếu chưa tồn tại |
| TC28 | Mã hợp lệ 20 ký tự | Giá trị biên | Chấp nhận nếu chưa tồn tại |
| TC29 | Mã hợp lệ 21 ký tự | Giá trị biên | Vượt 20 ký tự, không lưu |
| TC30 | Loại Khoa | Phân vùng tương đương | Chấp nhận |
| TC31 | Loại Phòng | Phân vùng tương đương | Chấp nhận |
| TC32 | Loại Ban | Phân vùng tương đương | Chấp nhận |
| TC33 | Loại Bộ môn | Phân vùng tương đương | Chấp nhận |
| TC34 | Không chọn loại | Phân vùng tương đương | “Vui lòng chọn loại đơn vị”, không lưu |
| TC35 | Giá trị ngoài danh sách, ví dụ Trung tâm | Phân vùng tương đương | Sai định dạng, không lưu |
| TC36 | Email tccb@example.com | Phân vùng tương đương | Chấp nhận |
| TC37 | Email phong.tccb@domain.edu.vn | Phân vùng tương đương | Chấp nhận |
| TC38 | Email trống | Phân vùng tương đương | “Vui lòng nhập email”, không lưu |
| TC39 | Email tccb | Phân vùng tương đương | Sai định dạng, không lưu |
| TC40 | Email @example.com | Phân vùng tương đương | Sai định dạng, không lưu |
| TC41 | Email tccb@ | Phân vùng tương đương | Sai định dạng, không lưu |
| TC42 | Email tccb@@example.com | Phân vùng tương đương | Sai định dạng, không lưu |
| TC43 | Email tccb @example.com | Phân vùng tương đương | Sai định dạng, không lưu |
| TC44 | Email tccb.example.com | Phân vùng tương đương | Sai định dạng, không lưu |
| TC45 | Email hợp lệ 99 ký tự | Giá trị biên | Chấp nhận |
| TC46 | Email hợp lệ 100 ký tự | Giá trị biên | Chấp nhận |
| TC47 | Email 101 ký tự | Giá trị biên | Vượt 100 ký tự, không lưu |
| TC48 | Email có space đầu | Giá trị biên | Sai định dạng, không lưu |
| TC49 | Email có space cuối | Giá trị biên | Sai định dạng, không lưu |
| TC50 | Email có space trước @ | Giá trị biên | Sai định dạng, không lưu |
| TC51 | Email có space sau @ | Giá trị biên | Sai định dạng, không lưu |
| TC52 | SĐT 0912345678 | Phân vùng tương đương | Chấp nhận |
| TC53 | SĐT trống | Phân vùng tương đương | “Vui lòng nhập số điện thoại”, không lưu |
| TC54 | SĐT 9123456789 | Phân vùng tương đương | Không bắt đầu 0, không lưu |
| TC55 | SĐT 091234567A | Phân vùng tương đương | Chứa chữ, không lưu |
| TC56 | SĐT 0912 345678 | Phân vùng tương đương | Chứa space, không lưu |
| TC57 | SĐT 091234-5678 | Phân vùng tương đương | Chứa ký tự đặc biệt, không lưu |
| TC58 | SĐT +84912345678 | Phân vùng tương đương | Chứa +, không lưu |
| TC59 | SĐT 9 chữ số | Giá trị biên | Sai định dạng, không lưu |
| TC60 | SĐT 10 chữ số | Giá trị biên | Chấp nhận |
| TC61 | SĐT 11 chữ số | Giá trị biên | Sai định dạng, không lưu |
| TC62 | SĐT 1912345678 | Giá trị biên | Không bắt đầu 0, không lưu |
| TC63 | SĐT 0912345678 | Giá trị biên | Chấp nhận |
| TC64 | Website trống | Phân vùng tương đương | Cho phép lưu |
| TC65 | https://example.com | Phân vùng tương đương | Chấp nhận |
| TC66 | http://example.com | Phân vùng tương đương | Chấp nhận |
| TC67 | https://example.com/about | Phân vùng tương đương | Chấp nhận |
| TC68 | Website chỉ whitespace | Phân vùng tương đương | Báo lỗi, không lưu |
| TC69 | Website abc | Phân vùng tương đương | Sai URL, không lưu |
| TC70 | Website example.com | Phân vùng tương đương | Báo lỗi nếu không đúng định dạng URL |
| TC71 | Website http:// | Phân vùng tương đương | Sai URL |
| TC72 | URL hợp lệ 2047 ký tự | Giá trị biên | Chấp nhận |
| TC73 | URL hợp lệ 2048 ký tự | Giá trị biên | Chấp nhận |
| TC74 | URL 2049 ký tự | Giá trị biên | Vượt 2048, không lưu |
| TC75 | Website có một space | Giá trị biên | Báo lỗi, không lưu |
| TC76 | Website có nhiều space | Giá trị biên | Báo lỗi, không lưu |
| TC77 | Địa chỉ trống | Phân vùng tương đương | Cho phép lưu |
| TC78 | Địa chỉ Hà Nội | Phân vùng tương đương | Chấp nhận |
| TC79 | Địa chỉ Số 01, đường ABC, Hà Nội | Phân vùng tương đương | Chấp nhận |
| TC80 | Địa chỉ một space | Phân vùng tương đương | Báo lỗi, không lưu |
| TC81 | Địa chỉ nhiều space | Phân vùng tương đương | Báo lỗi, không lưu |
| TC82 | Địa chỉ 199 ký tự | Giá trị biên | Chấp nhận |
| TC83 | Địa chỉ 200 ký tự | Giá trị biên | Chấp nhận |
| TC84 | Địa chỉ 201 ký tự | Giá trị biên | Vượt 200, không lưu |
| TC85 | Tất cả hợp lệ, website và địa chỉ trống | Bảng quyết định | Lưu thành công |
| TC86 | Tên trống | Bảng quyết định | Báo lỗi Tên, không lưu |
| TC87 | Mã trống | Bảng quyết định | Báo lỗi Mã, không lưu |
| TC88 | Mã trùng | Bảng quyết định | “Mã đơn vị đã tồn tại”, không lưu |
| TC89 | Không chọn loại | Bảng quyết định | Báo lỗi Loại, không lưu |
| TC90 | Email sai định dạng | Bảng quyết định | Báo lỗi Email, không lưu |
| TC91 | SĐT sai định dạng | Bảng quyết định | Báo lỗi SĐT, không lưu |
| TC92 | Website sai định dạng | Bảng quyết định | Báo lỗi Website, không lưu |
| TC93 | Địa chỉ chỉ whitespace | Bảng quyết định | Báo lỗi Địa chỉ, không lưu |
| TC94 | Nhiều trường cùng không hợp lệ | Bảng quyết định | Không lưu, hiển thị lỗi tương ứng |
| TC95 | Bắt buộc hợp lệ, website và địa chỉ rỗng | Bảng quyết định | Lưu thành công |
| TC96 | Nhấn “Thêm mới đơn vị” | Chuyển trạng thái | Hiển thị màn hình thêm đơn vị |
| TC97 | Mở form, chưa nhập, nhấn Lưu | Chuyển trạng thái | Hiển thị lỗi trường bắt buộc |
| TC98 | Email sai, sửa thành đúng rồi lưu | Chuyển trạng thái | Lỗi Email được loại bỏ, lưu nếu phần khác hợp lệ |
| TC99 | SĐT 9 chữ số rồi Lưu | Chuyển trạng thái | Hiển thị lỗi, không lưu |
| TC100 | Mở form rồi Hủy | Chuyển trạng thái | Đóng form, quay lại màn hình trước |
| TC101 | Nhập dữ liệu rồi Hủy | Chuyển trạng thái | Dữ liệu bị hủy, không tạo đơn vị |
| TC102 | Nhập dữ liệu rồi đóng form | Chuyển trạng thái | Đóng form, không lưu |
| TC103 | Hủy rồi mở lại | Chuyển trạng thái | Form không còn dữ liệu cũ |
| TC104 | Dữ liệu sai rồi Hủy | Chuyển trạng thái | Đóng form, không lưu |
| TC105 | Dữ liệu hợp lệ, nhấn Lưu nhiều lần | Chuyển trạng thái | Không tạo nhiều bản ghi trùng |

---

# 4. Hoàng Tùng — Thêm mới tài khoản người dùng

## 4.1. Use Case

**Actor:** Quản trị viên

**Mục đích:** Tạo tài khoản người dùng mới.

**Ưu tiên:** Mandatory

**Trigger:** Admin click “Thêm tài khoản”.

**Precondition:** Đã đăng nhập với quyền quản trị hệ thống.

**Success:** Tài khoản mới được tạo và lưu.

**Failure:** Dữ liệu không hợp lệ hoặc trùng.

### Main flow

1. Tại danh sách tài khoản, Admin click “Thêm tài khoản”.
2. Form gồm Email, Hồ sơ nhân sự, Vai trò.
3. Nhập Email, chọn hồ sơ nhân sự và vai trò; Username và mật khẩu mặc định = Mã nhân sự.
4. Click “Lưu tài khoản”.
5. Validate:
   - trường bắt buộc;
   - email format;
   - mã nhân sự tồn tại;
   - hồ sơ nhân sự chưa có tài khoản liên kết.
6. Lưu và hiển thị “Thêm tài khoản thành công”.

### Exception E1
- Email rỗng -> “Vui lòng nhập email”.
- Email sai -> “Vui lòng nhập đúng định dạng email”.
- Hồ sơ nhân sự rỗng -> “Vui lòng chọn hồ sơ nhân sự”.
- Vai trò rỗng -> “Vui lòng chọn phân quyền”.

### Exception E2
Hủy -> quay lại danh sách tài khoản.

## 4.2. Test Case ADD_U01–ADD_U12

| ID | Đầu vào | Kết quả |
|---|---|---|
| ADD_U01 | Email chuẩn; nhân sự NS01 chưa có tài khoản; role Cán bộ | Thành công; username/password mặc định = NS01. |
| ADD_U02 | Tất cả trường trống | Nhắc Email, hồ sơ nhân sự, vai trò; không lưu. |
| ADD_U03 | Email trống | “Vui lòng nhập email”. |
| ADD_U04 | Email `tungemail.com` | “Vui lòng nhập đúng định dạng email”. |
| ADD_U05 | Email `tung@` | “Vui lòng nhập đúng định dạng email”. |
| ADD_U06 | Email `tung ht@school.com` | Email không hợp lệ. |
| ADD_U07 | Không chọn hồ sơ nhân sự, Email/role hợp lệ | “Vui lòng chọn hồ sơ nhân sự”. |
| ADD_U08 | Chọn NS02 đã liên kết tài khoản | Báo lỗi, block save. |
| ADD_U09 | Không chọn role | “Vui lòng chọn phân quyền”. |
| ADD_U10 | Role Quản trị viên | Thành công. |
| ADD_U11 | Role Nhân sự phòng TCCB | Thành công. |
| ADD_U12 | Hủy giữa chừng | Đóng form, về danh sách user, không thay đổi. |

---

# 5. Hoàng Tùng — Thêm mới danh mục hệ số lương

## 5.1. Use Case

**Actor:** Phòng TCCB

**Mục đích:** Cấu hình hệ số lương theo ngạch/bậc phục vụ quản lý và nhập dữ liệu.

**Ưu tiên:** Mandatory

**Trigger:** Tại danh sách hệ số lương, TCCB chọn “Thêm hệ số lương”.

**Precondition:** Đã đăng nhập với quyền TCCB.

**Success:** Hệ số lương theo ngạch/bậc được lưu DB.

**Failure:** Không lưu.

### Main flow

1. Truy cập chức năng thêm hệ số lương.
2. Hệ thống hiển thị form.
3. Nhập:
   - Mã hệ số lương;
   - Ngạch viên chức;
   - Bậc lương;
   - Hệ số lương.
4. Click “Lưu hệ số lương”.
5. Validate.
6. Lưu và hiển thị “Hệ số lương đã được thêm thành công”.

### Exception E1
- Bậc đã tồn tại trong cùng ngạch.
- Hệ số lương là số thực >0.
- Bậc lương là số nguyên.
- Thông tin bắt buộc đầy đủ.

### Exception E2
TCCB hủy.

## 5.2. Test Case ADD_S01–ADD_S14

| ID | Đầu vào | Kết quả |
|---|---|---|
| ADD_S01 | Mã HSL_02, Ngạch GVCC, Bậc 2, Hệ số 4.40 | Thành công; DB cập nhật; “Hệ số lương đã được thêm thành công”. |
| ADD_S02 | Tất cả trường trống | Báo các trường bắt buộc; không lưu. |
| ADD_S03 | Mã HSL_01 đã tồn tại | “Mã hệ số lương đã tồn tại”; không lưu. |
| ADD_S04 | Ngạch trống | “Vui lòng điền ngạch viên chức”. |
| ADD_S05 | Bậc trống | “Vui lòng điền bậc lương”. |
| ADD_S06 | Bậc = 2.5 | Bậc phải là số nguyên. |
| ADD_S07 | Bậc = “Hai” | Bậc phải là số nguyên. |
| ADD_S08 | Ngạch GVCC đã có bậc 1, thêm bậc 1 | Trùng bậc trong cùng ngạch; không lưu. |
| ADD_S09 | Bậc 1 nhưng ngạch khác GV | Hợp lệ/thành công. |
| ADD_S10 | Hệ số = 0 | Hệ số phải là số thực >0. |
| ADD_S11 | Hệ số âm | Không hợp lệ. |
| ADD_S12 | Hệ số = 0.01 | Hợp lệ. |
| ADD_S13 | Hệ số = “abc” | Sai định dạng số. |
| ADD_S14 | Hủy giữa chừng | Đóng form, hủy dữ liệu, về danh sách hệ số lương. |

---

# 6. Quy tắc bảo toàn baseline

Nếu source code hiện tại chưa đáp ứng một Test Case:
- không tự sửa Test Case;
- không tự xóa Test Case;
- không tự thay expected result;
- báo Test Case đó và nguyên nhân.

Nếu có mâu thuẫn giữa Use Case và Test Case:
- giữ nguyên cả hai trong baseline;
- đánh dấu điểm mâu thuẫn;
- hỏi người dùng trước khi code theo một cách cụ thể.

Nếu một Test Case không thể hiện đầy đủ chi tiết kỹ thuật để triển khai:
- không tự suy diễn thêm;
- chỉ triển khai phần được đặc tả;
- hỏi người dùng nếu cần quyết định ảnh hưởng đến cấu trúc/logic.

---

# 7. Lưu ý cho Agent

Không nhầm:
- ADD_U = tài khoản người dùng.
- ADD_S = danh mục hệ số lương.
- ADD01–ADD60 = hồ sơ nhân sự.
- TC01–TC105 = đơn vị tổ chức.

Đây là bốn phạm vi Test Case độc lập nhưng nằm trong cùng project.
