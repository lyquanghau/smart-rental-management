# Modules

## Multi-tenant data isolation

Các module nghiệp vụ dùng trường nội bộ `owner` trỏ tới tài khoản chủ trọ (`User`) để tách dữ liệu
khi nhiều chủ trọ cùng dùng một hệ thống.

- Khi chủ trọ tạo phòng, khách thuê, hợp đồng, hóa đơn, thanh toán, chỉ số dịch vụ hoặc cấu hình
  dịch vụ, backend tự gán `owner = req.user._id`.
- Khi chủ trọ xem/sửa/xóa dữ liệu, backend luôn lọc thêm `owner = req.user._id`.
- Khách thuê không truy cập theo `owner` trực tiếp; tài khoản khách thuê được nối với hồ sơ
  `Tenant.user`, sau đó chỉ xem dữ liệu liên quan đến hồ sơ tenant đó.
- Tài khoản tenant sinh tự động dùng username/email kỹ thuật có mã tenant để tránh trùng giữa nhiều
  chủ trọ có khách thuê cùng số điện thoại hoặc email.

## Auth

Quản lý đăng nhập, JWT, thông tin người dùng hiện tại và đổi mật khẩu. Frontend không mở form đăng ký
public cho khách thuê; tài khoản khách thuê được tạo khi chủ trọ tạo hợp đồng hiệu lực. Mật khẩu tạm
có hạn 3 ngày, quá hạn chưa đổi thì tài khoản bị khóa và chủ trọ phải mở khóa/cấp lại mật khẩu tạm.

Endpoint nền:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/change-password`
- `PATCH /api/auth/users/:id/unlock`

## Rooms

Quản lý phòng trọ và trạng thái phòng. Module đã có API CRUD, frontend thêm/sửa/xóa mềm phòng,
lọc theo trạng thái và xem chi tiết phòng kèm khách thuê hiện tại.
Phòng đã xóa mềm vẫn có thể được hiển thị trong danh sách lịch sử khi frontend truyền
`includeDeleted=true`, có badge `Đã xóa` và có thể khôi phục.

Endpoint nền:

- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms`
- `PUT /api/rooms/:id`
- `DELETE /api/rooms/:id`

## Tenants

Quản lý thông tin khách thuê, thông tin liên hệ và phòng đang gán.
Khách thuê dùng soft delete để giữ lịch sử. Khách đã xóa vẫn có thể hiển thị với badge `Đã xóa`
và có thể khôi phục. Backend chặn xóa khách nếu khách còn hợp đồng `active` chưa xóa.

Endpoint nền:

- `GET /api/tenants`
- `GET /api/tenants/:id`
- `POST /api/tenants`
- `PUT /api/tenants/:id`
- `DELETE /api/tenants/:id`

Frontend hien khach da xoa trong modal lich su rieng, khong tron vao bang khach dang quan ly.
Bang khach dang quan ly nhom theo hop dong/phong active de thay du nguoi dai dien va nguoi o cung.

Tenant account rule: khi landlord them khach va gan phong, backend tu dong tao tai khoan tenant.
Username = ho ten khong dau + ma phong, vi du `Ly Quang Hau` phong `101` thanh `lyquanghau101`;
mat khau ban dau duoc sinh ngau nhien va chi gui qua email khach thue. Neu SMTP chua cau hinh
hoac gui email that bai, backend khong tao/cap lai tai khoan tenant vi chu tro khong duoc phep
nhin thay mat khau plaintext.

## Contracts

Quản lý hợp đồng giữa khách thuê và phòng. Module đã có model, seed data, API CRUD cơ bản và giao diện quản lý hợp đồng trong frontend.
Hợp đồng có hai thao tác khác nhau: `end` để kết thúc hợp đồng và soft delete để đánh dấu
`Đã xóa`. Hợp đồng đã xóa vẫn giữ lịch sử, không tham gia dashboard/tạo hóa đơn/tenant portal
và có thể khôi phục nếu không gây trùng hợp đồng active cùng phòng.

Endpoint nền:

- `GET /api/contracts`
- `GET /api/contracts/:id`
- `GET /api/contracts/:id/pdf`
- `POST /api/contracts`
- `PUT /api/contracts/:id`
- `DELETE /api/contracts/:id`
- `PATCH /api/contracts/:id/end`
- `PATCH /api/contracts/:id/restore`

Xoa hop dong khong xoa khach thue. Neu khach chuyen phong, frontend dung nut tao hop dong moi
tu hop dong cu va backend chan update `room` truc tiep tren hop dong da co.

## Payments

Quản lý thanh toán tiền phòng. Module đã có model, seed data, API quản lý khoản
thu cơ bản và giao diện frontend tại `/payments`. Hiện tại hỗ trợ ghi nhận thủ
công/mock theo phương thức `cash`, `bank_transfer`, `momo`, `vnpay`; chưa tích
hợp redirect thật sang VNPay/MoMo sandbox.

Endpoint nền:

- `GET /api/payments`
- `GET /api/payments/:id`
- `POST /api/payments`
- `PUT /api/payments/:id`
- `PATCH /api/payments/:id/mark-paid`
- `PATCH /api/payments/:id/cancel`

Khi landlord/tenant doc danh sach payment hoac dashboard/tenant portal, backend tu dong chuyen
khoan thu `pending` co `dueDate` truoc ngay hien tai sang `overdue`. Cac khoan `paid` va
`cancelled` khong bi thay doi.

## Services & Invoices

Bo sung pilot-ready:

- `ServiceSetting` luu don gia dich vu va thong tin nhan chuyen khoan cua tung chu tro.
- Trang `Dich vu` cho chu tro cau hinh ngan hang, so tai khoan, chu tai khoan,
  mau noi dung chuyen khoan va ghi chu thanh toan.
- Cong khach thue hien thi huong dan chuyen khoan tu `ServiceSetting` cua chu tro,
  giup thu tien that bang chuyen khoan/manual truoc khi co VNPay/MoMo sandbox.

Quản lý điện, nước và dịch vụ hằng tháng. Module này tách riêng hóa đơn phải thu
khỏi thanh toán:

- `UtilityReading`: chỉ số điện/nước và phí dịch vụ của từng phòng theo tháng.
- `Invoice`: hóa đơn tháng gồm tiền phòng, tiền điện, nước, internet, rác, gửi xe.
- `Payment`: bản ghi thu tiền/giao dịch, có thể liên kết với một hóa đơn.

Luồng chính:

```txt
Chọn tháng/năm
-> Cấu hình đơn giá dịch vụ
-> Nhập chỉ số điện/nước cho hợp đồng active
-> Tạo hóa đơn tháng
-> Hóa đơn sinh khoản thu tương ứng ở trang Thanh toán
```

Endpoint nền:

- `GET /api/service-settings`
- `PUT /api/service-settings`
- `GET /api/utility-readings`
- `POST /api/utility-readings`
- `PUT /api/utility-readings/:id`
- `DELETE /api/utility-readings/:id`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices/generate-monthly`
- `PATCH /api/invoices/:id/mark-paid`
- `PATCH /api/invoices/:id/cancel`

Frontend trang `Dich vu` hien cho chu tro xem chi tiet breakdown hoa don, dong bo trang thai
`paid`/`cancelled` qua API hoa don va payment lien quan.

Backend tu dong chuyen hoa don `issued` co `dueDate` truoc ngay hien tai sang `overdue` khi doc
danh sach hoa don, dashboard hoac cong khach thue. Viec nay giup dashboard va cong no dung theo
thoi gian that ma chua can cron job rieng trong MVP.

## Dashboard

Hiển thị số liệu tổng quan từ dữ liệu thật trong MongoDB. Module đã có API thống
kê tổng phòng, khách thuê active, hợp đồng active, thanh toán trong tháng, doanh thu tháng trước,
hợp đồng sắp hết hạn và khoản thu cần xử lý.

Endpoint nền:

- `GET /api/dashboard/summary`

## SePay/MoMo auto payment & Notifications

SePay la huong uu tien cho san pham dung that vi phu hop luong chu tro nhan tien qua ngan hang:

- `POST /api/invoices/:id/sepay-payment-code` tao ma thanh toan dang `SRINV...`.
- Tenant dung ma nay lam noi dung chuyen khoan/VietQR.
- `POST /api/webhooks/sepay` nhan giao dich tien vao tu SePay, verify HMAC/API key,
  doi soat theo ma thanh toan va so tien.
- `POST /api/invoices/:id/sepay-mock-success` dung cho dev/demo khi chua cau hinh webhook that.
- Khi giao dich thanh cong, backend tu dong chuyen `Invoice` va `Payment` lien quan sang `paid`,
  method/provider `sepay`, tao notification cho landlord va gui Discord webhook neu da cau hinh
  `DISCORD_WEBHOOK_URL`.

Bo sung luong MoMo-ready cho MVP:

- `POST /api/invoices/:id/momo-payment-link` tao phien thanh toan cho hoa don chua thu.
- `POST /api/webhooks/momo` nhan IPN MoMo, verify signature khi dung credential that.
- `POST /api/invoices/:id/momo-mock-success` dung cho dev/demo khi chua co tai khoan MoMo merchant.
- Khi giao dich thanh cong, backend tu dong chuyen `Invoice` va `Payment` lien quan sang `paid`.
- Luong xu ly IPN co tinh idempotent de tranh xu ly trung khi gateway gui lai ket qua.

Thong bao noi bo:

- `Notification` luu thong bao theo `owner`, co `readAt` de dem thong bao chua doc.
- Khi MoMo/IPN mock xac nhan thanh toan thanh cong, backend tao notification
  `payment_success` lien ket ve hoa don.
- Frontend header hien badge so thong bao chua doc va dropdown danh sach thong bao gan day.
- Endpoint: `GET /api/notifications`, `PATCH /api/notifications/:id/read`,
  `PATCH /api/notifications/read-all`.
