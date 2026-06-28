# User Flow

## Mục tiêu

Tài liệu này mô tả luồng sử dụng chính của Smart Rental trong MVP, tập trung vào
chuỗi: đăng nhập -> quản lý phòng -> hợp đồng -> thanh toán.

## Luồng chính: Chủ trọ quản lý phòng và thanh toán

```txt
Mở app
  -> Đăng nhập
    -> Dashboard tổng quan
      -> Quản lý phòng
        -> Xem danh sách phòng
        -> Lọc phòng theo trạng thái
        -> Thêm/sửa phòng nếu cần
      -> Quản lý khách thuê
        -> Thêm/sửa khách thuê
        -> Gán khách thuê vào phòng
      -> Quản lý hợp đồng
        -> Chọn phòng
        -> Chọn khách thuê
        -> Chọn thời hạn hợp đồng
        -> Xác nhận giá thuê và tiền cọc
        -> Tạo hợp đồng active
      -> Quản lý thanh toán
        -> Tạo khoản thu theo hợp đồng active
        -> Theo dõi trạng thái khoản thu
        -> Đánh dấu đã thu hoặc hủy khoản thu
```

## Luồng đăng nhập

1. Người dùng mở trang `/login`.
2. Nhập email và mật khẩu.
3. Frontend gọi `POST /api/auth/login`.
4. Nếu đúng thông tin:
   - Backend trả JWT và thông tin user.
   - Frontend lưu token vào local storage.
   - Người dùng được chuyển vào app.
5. Nếu sai thông tin:
   - Backend trả lỗi.
   - Frontend hiển thị thông báo lỗi.

## Luồng quản lý phòng

1. Chủ trọ mở `/rooms`.
2. Hệ thống gọi `GET /api/rooms`.
3. Chủ trọ có thể lọc theo trạng thái:
   - Trống.
   - Đã thuê.
   - Bảo trì.
4. Chủ trọ thêm hoặc sửa phòng khi thông tin thực tế thay đổi.
5. Khi khách thuê được gán hoặc bỏ gán phòng, backend đồng bộ lại trạng thái phòng.

## Luồng hợp đồng

1. Chủ trọ mở `/contracts`.
2. Hệ thống tải danh sách hợp đồng, phòng và khách thuê.
3. Chủ trọ chọn phòng và khách thuê.
4. Khi chọn phòng, frontend tự điền giá thuê theo giá phòng.
5. Chủ trọ chọn thời hạn 3, 6, 12 hoặc 24 tháng.
6. Frontend tự tính ngày kết thúc.
7. Chủ trọ chọn số tháng cọc.
8. Chủ trọ lưu hợp đồng.
9. Hợp đồng active có thể được dùng để tạo khoản thanh toán.

## Luồng thanh toán

1. Chủ trọ mở `/payments`.
2. Hệ thống tải danh sách khoản thu.
3. Chủ trọ tạo khoản thu theo hợp đồng active.
4. Khoản thu có:
   - Hợp đồng.
   - Số tiền.
   - Hạn thanh toán.
   - Phương thức.
   - Trạng thái.
   - Ghi chú.
5. Khi khách đã đóng tiền, chủ trọ bấm `Đã thu`.
6. Hệ thống chuyển khoản thu sang `paid` và set ngày thu.
7. Nếu tạo nhầm hoặc không cần thu nữa, chủ trọ bấm `Hủy`.

## Luồng khách thuê trong giai đoạn sau

Ở MVP hiện tại, khách thuê mới có role và tài khoản mẫu. Giai đoạn sau sẽ mở rộng
luồng riêng cho khách thuê:

```txt
Đăng nhập
  -> Xem phòng đang thuê
  -> Xem hợp đồng của mình
  -> Xem khoản thanh toán
  -> Theo dõi khoản chờ thanh toán hoặc đã thanh toán
```

## Ghi chú phạm vi

- MVP hiện chưa tích hợp redirect thật sang VNPay/MoMo.
- Thanh toán hiện là ghi nhận thủ công/mock để frontend và nghiệp vụ không bị block.
- Dashboard hiện vẫn là số liệu cơ bản, API thống kê sẽ làm sau khi các module chính ổn định.
