# AGENTS.md

## 1. Mục đích dự án

Đây là project JavaScript dùng để xây dựng backend web demo phục vụ kiểm thử hộp trắng.

Mục tiêu chính không phải xây dựng một hệ thống HRM hoàn chỉnh mà là tạo lượng code vừa đủ để:

- mô phỏng đúng các chức năng được quy định trong Use Case;
- đáp ứng các Test Case đã xác định;
- tạo đủ dòng điều khiển và dòng dữ liệu cần thiết cho kiểm thử hộp trắng;
- hỗ trợ phân tích Control Flow và Data Flow, hướng tới các mức C1, C2, C3 theo yêu cầu môn học.

Không được mở rộng phạm vi nếu không có yêu cầu rõ ràng.

---

## 2. Công nghệ và mức độ phức tạp

- Sử dụng JavaScript.
- Hướng tới demo bằng web.
- Giai đoạn hiện tại chỉ cần backend.
- Ưu tiên code đơn giản, dễ đọc, dễ chạy và dễ kiểm thử.

Không tự ý đưa thêm framework, database, ORM, authentication system, design pattern hoặc kiến trúc phức tạp nếu chưa được yêu cầu.

Code phục vụ kiểm thử nên có:
- logic rõ ràng;
- nhánh điều khiển dễ nhận biết;
- dữ liệu đầu vào/đầu ra rõ ràng;
- biến có vòng đời dễ theo dõi;
- validation bám sát Test Case;
- cấu trúc dễ xây dựng CFG;
- cấu trúc dễ phân tích def-use/c-use/p-use.

Không tối ưu hóa hoặc trừu tượng hóa quá mức nếu việc đó làm khó phân tích kiểm thử.

---

## 3. Nguồn sự thật

Các file trong `docs/` là nguồn tham chiếu chính:

1. `docs/testing-baseline.md`: Use Case và Test Case.
2. `docs/white-box-testing.md`: mục tiêu và quy ước kiểm thử hộp trắng.

Use Case và Test Case có ưu tiên cao hơn các "best practice" chung.

Không tự sửa, hợp nhất hoặc thay thế yêu cầu bằng kiến thức bên ngoài.

Nếu phát hiện mâu thuẫn hoặc điểm chưa rõ:
- không tự suy diễn;
- không tự sửa đặc tả;
- báo rõ vấn đề;
- hỏi người dùng trước khi thực hiện thay đổi ảnh hưởng đến phạm vi.

---

## 4. Phạm vi từng thành viên

### Nguyễn Đình Kha
Use Case: Thêm mới Hồ sơ nhân sự
Test Case: ADD01–ADD60

### Nguyễn Văn Thịnh
Use Case: Tạo mới đơn vị tổ chức nhân sự
Test Case: TC01–TC105

### Hoàng Tùng
Use Case: Thêm mới tài khoản người dùng
Test Case: ADD_U01–ADD_U12

### Hoàng Tùng
Use Case: Thêm mới danh mục hệ số lương
Test Case: ADD_S01–ADD_S14

---

## 5. Quy tắc liên kết module

Các module thuộc cùng một project nên phải có khả năng liên kết khi cần, nhưng mỗi thành viên phải giữ ranh giới để có thể tự chạy, kiểm thử và phân tích phần của mình.

Không tạo dependency không cần thiết giữa các module.

Không đưa nghiệp vụ của module khác vào module hiện tại chỉ vì muốn "tích hợp".

Nếu cần dữ liệu từ module khác, chỉ tạo mức liên kết tối thiểu đã được đặc tả hoặc xác nhận.

---

## 6. Quy tắc bám Use Case và Test Case

Chỉ triển khai:
1. Use Case;
2. Test Case;
3. yêu cầu kỹ thuật đã được người dùng xác nhận.

Không tự thêm nghiệp vụ.

Nếu Test Case yêu cầu một nhánh cụ thể, code phải có logic tương ứng.

Không tự thêm validation chỉ vì đó là cách làm thường thấy trong hệ thống thực tế.

Mỗi validation phải có lý do từ Use Case hoặc Test Case.

---

## 7. White-box Testing

Mục tiêu code là hỗ trợ:
- Control Flow;
- Data Flow;
- C1/C2/C3.

Control Flow có thể cần phân tích:
- statement;
- decision;
- branch;
- path;
- CFG.

Data Flow có thể cần phân tích:
- definition;
- use;
- c-use;
- p-use;
- def-use relationship;
- DU path khi cần.

Không viết code quá ngắn theo kiểu gom nhiều logic vào một biểu thức nếu làm mất khả năng phân tích.

Không cố tình tạo nhánh giả hoặc code thừa chỉ để tăng coverage.

Mục tiêu:
> Đúng nghiệp vụ + đủ để kiểm thử + đơn giản.

---

## 8. Quy trình làm việc theo từng thành viên

KHÔNG triển khai toàn bộ project trong một lần.

Quy trình bắt buộc:

1. Xác định thành viên đang làm.
2. Đọc Use Case tương ứng.
3. Đọc toàn bộ Test Case tương ứng.
4. Đọc cấu trúc project hiện tại.
5. Xác định phạm vi code tối thiểu.
6. Nếu có quyết định ảnh hưởng cấu trúc/phạm vi mà chưa rõ, hỏi người dùng.
7. Code module.
8. Chạy kiểm tra.
9. Đối chiếu với Test Case.
10. Kiểm tra khả năng phục vụ white-box testing.
11. Báo những Test Case chưa được hỗ trợ hoặc những điểm còn chưa xác định.
12. Chỉ sau khi hoàn thành module hiện tại mới chuyển sang thành viên tiếp theo.

Ở bước lập kế hoạch ban đầu, nếu người dùng yêu cầu "chưa code", tuyệt đối không sửa file.

---

## 9. Không tự ý sửa ngoài phạm vi

Khi làm một module:
- không sửa module thành viên khác nếu không cần thiết;
- không refactor toàn project;
- không đổi kiến trúc chung chỉ vì thấy cách khác "tốt hơn";
- không đổi API module khác nếu chưa được xác nhận;
- không tạo file không cần thiết.

Phát hiện vấn đề ngoài phạm vi thì báo lại thay vì tự sửa.

---

## 10. Quy tắc thay đổi lớn

Các thay đổi ảnh hưởng đến:
- cấu trúc module;
- API;
- data model;
- dependency giữa thành viên;
- cách chạy project;
- Use Case;
- Test Case

phải được giải thích trước và cần xác nhận nếu đặc tả chưa quyết định.

Không tự ý triển khai:
- Clean Architecture;
- CQRS;
- DDD đầy đủ;
- Repository/Service abstraction nhiều tầng;
- database phức tạp;
- authentication;
- logging/monitoring phức tạp;
- production infrastructure

nếu chưa có yêu cầu.

---

## 11. Khi thiếu thông tin

Nếu không biết:
- nội dung Use Case;
- Test Case;
- cấu trúc project;
- framework;
- cách liên kết module;
- mức độ đơn giản;
- yêu cầu đặc biệt;

thì hỏi người dùng.

Không dùng "best practice" để thay thế yêu cầu chưa được xác định.

Nguyên tắc:
> Không chắc -> hỏi.
>
> Không cần -> không thêm.
>
> Đã có đặc tả -> bám đặc tả.
>
> Có nhiều cách hợp lệ và quyết định ảnh hưởng cấu trúc -> đề xuất, chờ xác nhận.

---

## 12. Nguyên tắc cuối

Đây là project học tập phục vụ kiểm thử.

Không đánh giá thành công bằng mức độ production-ready.

Đánh giá bằng:
1. đúng đặc tả;
2. đúng Test Case;
3. code đơn giản;
4. dễ chạy;
5. dễ kiểm thử;
6. dễ xây dựng CFG;
7. dễ phân tích dòng dữ liệu;
8. các thành viên làm việc độc lập trong cùng project;
9. không có phần dư thừa.
