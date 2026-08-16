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

Quan he khach thue - phong hien tai:

- `Tenant._id` la khoa chinh ho so mot nguoi khach thue.
- `Room._id` la khoa chinh phong.
- `Contract` la quan he chinh noi khach thue voi phong qua `tenant` va `room`.
- Mot khach thue co the co nhieu hop dong `active` o nhieu phong khac nhau.
- Moi phong chi duoc co mot hop dong `active` tai mot thoi diem.
- Truong `Tenant.room` chi con dong vai tro phong chinh/du lieu cu cho luong gan phong truc tiep; cac man hinh van hanh nen uu tien doc phong tu hop dong active.

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
Neu mot khach thue dang thue them phong khac, backend tao them `Contract` moi cho phong moi va
khong ghi de `Tenant.room`; trang Khach thue co the hien cung mot khach tren nhieu dong phong/hop dong active.

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
- Cong khach thue hien them thong tin phong/hop dong, don gia dich vu va breakdown hoa don
  chua thanh toan de khach tu kiem tra tien phong, dien, nuoc, internet, rac, gui xe truoc khi
  chuyen khoan.
- Luong `Dich vu` hien ghi hoa don dich vu hang thang: chu tro chon hop dong active va chi nhap
  chi so dien moi. Dien cu tu dong lay tu ban ghi gan nhat cua cung phong.
- Nuoc la phi co dinh theo so nguoi trong hop dong, mac dinh `100000`/nguoi/thang.
- Hop dong co `vehicleCount` de luu so xe cua phong do.
- Gui xe tinh theo `vehicleCount` trong hop dong, mac dinh `100000`/xe/thang.
- Internet va rac lay tu `ServiceSetting`, hien read-only tren form ghi hoa don.

Ghi chu: `UtilityReading` dang dong vai tro ban ghi hoa don dich vu cua tung phong theo thang.
Ten model giu nguyen de tranh migration lon trong MVP, nhung UI/API khong yeu cau nhap nuoc,
internet, rac hoac xe tren form ghi hoa don; so xe lay tu hop dong.

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

## Help & Support

Module Tro giup & Ho tro bien route `/help` tu trang ghi chu tinh thanh cong cu van hanh that:

- FAQ dung chung cho chu tro va khach thue.
- Khach thue tao ticket ho tro bang van ban, khong upload file trong MVP.
- Khach thue xem ticket cua minh va dong ticket khi van de da duoc xu ly.
- Chu tro xem ticket thuoc nha tro cua minh, loc theo trang thai/loai/muc do, phan hoi va cap nhat tien do.
- Backend dung `SupportRequest` co `owner`, `requester`, `tenant`, `category`, `subject`, `description`, `priority`, `status`, `landlordReply`, `resolvedAt`, `closedAt`.
- Du lieu tiep tuc cach ly theo `owner` va `Tenant.user`: tenant khong xem duoc ticket cua tenant khac, chu tro khong xem duoc ticket cua chu tro khac.
- Notification noi bo tao thong bao khi tenant tao ticket, landlord cap nhat ticket hoac tenant dong ticket.
- Notification support co `recipientRole`/`recipientUser` optional de thong bao support cua tenant khong bi tron unread voi landlord.

Endpoint nen:

- `GET /api/support-requests`
- `GET /api/support-requests/:id`
- `POST /api/support-requests`
- `PATCH /api/support-requests/:id`
- `PATCH /api/support-requests/:id/close`

## SePay/MoMo auto payment & Notifications

SePay la huong uu tien cho san pham dung that vi phu hop luong chu tro nhan tien qua ngan hang:

- `POST /api/invoices/:id/sepay-payment-code` tao ma thanh toan de nhap tay de hon, dang
  `P{roomName}-HD-T{month}-{year}`. Vi du: `P102-HD-T8-2026`.
- Tenant dung ma nay lam noi dung chuyen khoan/VietQR.
- `POST /api/webhooks/sepay` nhan giao dich tien vao tu SePay, verify HMAC/API key,
  doi soat theo ma thanh toan va so tien.
- Webhook van nhan ma cu dang `SRINV...` de tuong thich voi hoa don da tao truoc khi doi format.
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
