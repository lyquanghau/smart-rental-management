# User Stories

## Mục tiêu

Tài liệu này mô tả user story cho 2 vai chính của Smart Rental:

- Chủ trọ: người quản lý phòng, khách thuê, hợp đồng và thanh toán.
- Khách thuê: người xem thông tin liên quan đến phòng thuê, hợp đồng và thanh toán của mình.

## Chủ trọ

### US-LANDLORD-01: Đăng nhập hệ thống

As a chủ trọ, I want đăng nhập bằng email và mật khẩu, so that tôi có thể truy cập các màn hình quản lý an toàn.

Acceptance criteria:

- Đăng nhập đúng tài khoản trả về JWT và thông tin người dùng.
- Đăng nhập sai trả lỗi rõ ràng.
- Token được frontend lưu để tự gắn vào các API cần xác thực.

### US-LANDLORD-02: Quản lý phòng

As a chủ trọ, I want thêm, sửa, xem và xóa mềm phòng, so that danh sách phòng trong hệ thống luôn đúng với thực tế.

Acceptance criteria:

- Chủ trọ xem được danh sách phòng và lọc theo trạng thái.
- Chủ trọ thêm/sửa được tên phòng, tầng, giá thuê, số người tối đa và trạng thái.
- Xóa phòng dùng soft delete, không xóa cứng khỏi database.

### US-LANDLORD-03: Quản lý khách thuê

As a chủ trọ, I want lưu thông tin khách thuê và gán khách vào phòng, so that tôi biết ai đang ở phòng nào.

Acceptance criteria:

- Chủ trọ thêm/sửa/xóa mềm khách thuê.
- Khách thuê có thể có số điện thoại, email, CCCD/CMND và phòng đang gán.
- Khi khách thuê được gán hoặc bỏ gán phòng, trạng thái phòng được đồng bộ phù hợp.

### US-LANDLORD-04: Quản lý hợp đồng

As a chủ trọ, I want tạo và cập nhật hợp đồng thuê phòng, so that thỏa thuận thuê được lưu lại rõ ràng.

Acceptance criteria:

- Chủ trọ chọn phòng, khách thuê, ngày bắt đầu, thời hạn, giá thuê và tiền cọc.
- Ngày kết thúc được tự tính theo thời hạn đã chọn.
- Có thể sửa hợp đồng active và kết thúc hợp đồng khi không còn hiệu lực.

### US-LANDLORD-05: Ghi nhận thanh toán

As a chủ trọ, I want tạo khoản thu và đánh dấu đã thu tiền, so that tôi theo dõi được lịch sử thanh toán tiền phòng.

Acceptance criteria:

- Chủ trọ tạo khoản thu theo hợp đồng active.
- Khoản thu có số tiền, hạn thanh toán, phương thức, trạng thái và ghi chú.
- Chủ trọ có thể đánh dấu đã thu hoặc hủy khoản thu.

## Khách thuê

### US-TENANT-01: Đăng nhập hệ thống

As a khách thuê, I want đăng nhập bằng tài khoản của mình, so that tôi có thể xem thông tin liên quan đến việc thuê phòng.

Acceptance criteria:

- Khách thuê đăng nhập thành công bằng email và mật khẩu.
- Hệ thống nhận biết role `tenant`.
- Các API quản trị vẫn chặn khách thuê bằng phân quyền.

### US-TENANT-02: Xem thông tin phòng đang thuê

As a khách thuê, I want xem thông tin phòng đang thuê, so that tôi biết thông tin phòng, giá thuê và trạng thái hiện tại.

Acceptance criteria:

- Khách thuê xem được phòng liên quan đến mình trong giai đoạn mở rộng.
- Thông tin phòng gồm tên phòng, tầng, giá thuê và trạng thái.
- Khách thuê không được sửa thông tin phòng.

### US-TENANT-03: Xem hợp đồng thuê

As a khách thuê, I want xem hợp đồng của mình, so that tôi kiểm tra được thời hạn thuê, giá thuê và tiền cọc.

Acceptance criteria:

- Khách thuê xem được hợp đồng liên quan đến mình trong giai đoạn mở rộng.
- Hợp đồng hiển thị phòng, ngày bắt đầu, ngày kết thúc, giá thuê, tiền cọc và trạng thái.
- Khách thuê không được sửa hoặc kết thúc hợp đồng.

### US-TENANT-04: Xem khoản thanh toán

As a khách thuê, I want xem các khoản thanh toán của mình, so that tôi biết khoản nào đã thanh toán và khoản nào còn chờ thu.

Acceptance criteria:

- Khách thuê xem được danh sách khoản thanh toán liên quan đến hợp đồng của mình trong giai đoạn mở rộng.
- Mỗi khoản thanh toán có số tiền, hạn thanh toán, ngày thu, phương thức và trạng thái.
- Khách thuê không được tự đổi trạng thái thanh toán.

### US-TENANT-05: Nhận thông tin trạng thái thanh toán

As a khách thuê, I want biết trạng thái thanh toán rõ ràng, so that tôi tránh bỏ sót tiền phòng cần đóng.

Acceptance criteria:

- Trạng thái thanh toán hiển thị dễ hiểu: chờ thu, đã thanh toán, quá hạn, đã hủy.
- Các khoản đã thanh toán hiển thị ngày thu.
- Các khoản hủy không còn hiển thị như khoản cần đóng.
