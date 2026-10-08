# White-box Testing Baseline

## 1. Mục tiêu

Code được xây dựng để phục vụ kiểm thử hộp trắng đối với:
- dòng điều khiển (Control Flow);
- dòng dữ liệu (Data Flow).

Mục tiêu phân tích hướng tới các mức C1, C2, C3 theo yêu cầu môn học.

Không xây dựng code chỉ để đạt coverage cao một cách hình thức.

---

## 2. Control Flow

Sau khi code hoàn thành, cần có khả năng xác định:
- statement;
- decision;
- branch;
- path;
- Control Flow Graph (CFG);
- các đường đi cần thiết theo tiêu chí kiểm thử được yêu cầu.

Mỗi nhánh nên có ý nghĩa nghiệp vụ hoặc xuất phát từ validation được đặc tả.

Không tạo nhánh giả chỉ để tăng số path.

### C1

Áp dụng đúng định nghĩa/tiêu chí C1 mà môn học yêu cầu khi phân tích code.

### C2

Áp dụng đúng định nghĩa/tiêu chí C2 mà môn học yêu cầu khi phân tích code.

### C3

Áp dụng đúng định nghĩa/tiêu chí C3 mà môn học yêu cầu khi phân tích code.

> Lưu ý: file này không tự định nghĩa lại nội dung giáo trình của C1/C2/C3 nếu đề bài môn học chưa cung cấp định nghĩa cụ thể. Khi phân tích thực tế, phải dùng định nghĩa/tiêu chí mà người dùng cung cấp.

---

## 3. Data Flow

Đối với các biến quan trọng cần có khả năng xác định:
- Definition;
- Use;
- Computational Use (c-use);
- Predicate Use (p-use);
- Def-Use relationship;
- DU path khi cần.

Ưu tiên code có vòng đời dữ liệu rõ ràng.

Không tạo biến trung gian không cần thiết.

Không gom quá nhiều phép xử lý vào một biểu thức nếu làm khó xác định definition/use.

---

## 4. Quan hệ giữa Black-box và White-box

Black-box Test Case xác định:
> Input nào cần được kiểm tra và expected result là gì.

White-box Testing xác định:
> Code đi qua những statement/branch/path nào và dữ liệu được definition/use như thế nào.

Hai phần phải thống nhất.

Ví dụ:
- Test Case yêu cầu email rỗng -> code phải có nhánh xử lý email rỗng.
- Test Case yêu cầu email sai định dạng -> code phải có nhánh xử lý sai định dạng.
- Test Case yêu cầu email trùng -> code phải có nhánh xử lý dữ liệu trùng.
- Test Case hợp lệ -> phải có đường đi tới thao tác lưu thành công.

Không sửa code chỉ để white-box coverage đẹp hơn nếu làm sai Use Case/Test Case.

---

## 5. Thiết kế code phục vụ kiểm thử

Ưu tiên:
- điều kiện rõ ràng;
- validation tách vừa đủ;
- return/error rõ ràng;
- dữ liệu đầu vào và kết quả dễ theo dõi;
- ít abstraction;
- ít dependency.

Tránh:
- nested logic không cần thiết;
- abstraction nhiều tầng;
- framework/architecture không phục vụ mục tiêu;
- code "magic";
- side effect khó theo dõi.

---

## 6. Trình tự phân tích sau khi code

Khi một module hoàn thành:

1. Xác định các hàm có logic nghiệp vụ.
2. Xác định input/output của từng hàm.
3. Xác định các statement và decision.
4. Vẽ CFG.
5. Xác định branch/path cần kiểm thử.
6. Xác định các biến quan trọng.
7. Đánh dấu definition/use.
8. Phân loại c-use/p-use khi phù hợp.
9. Xác định def-use/DU path.
10. Đối chiếu các đường đi với Test Case.
11. Ghi nhận các trường hợp Test Case chưa kích hoạt được một nhánh nếu có.

---

## 7. Nguyên tắc phạm vi

White-box analysis không phải lý do để mở rộng nghiệp vụ.

Nếu muốn thêm một nhánh chỉ để phục vụ phân tích, trước tiên phải xác định nó có thuộc đặc tả/Test Case hay không.

Nếu không thuộc phạm vi:
- không tự thêm;
- báo người dùng;
- chỉ thêm khi được xác nhận.

---

## 8. Mục tiêu cuối

Một module đạt yêu cầu khi:
- chạy được;
- đúng Use Case;
- hỗ trợ Test Case;
- có dòng điều khiển rõ;
- có dòng dữ liệu rõ;
- có thể xây dựng CFG;
- có thể xác định definition/use;
- có thể thiết kế kiểm thử C1/C2/C3 theo tiêu chí môn học;
- không có code dư thừa.
