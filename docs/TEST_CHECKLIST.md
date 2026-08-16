# Checklist kiểm thử Smart Rental

Tài liệu này dùng cho kiểm thử thủ công trước khi demo, merge hoặc deploy.

## 1. Kiểm tra nền

- Chạy `npm run lint`.
- Chạy `npm run format:check`.
- Chạy `npm run test`.
- Nếu cần kiểm tra API end-to-end, tạo database test riêng có tên chứa `test`, bật
  `SMART_RENTAL_RUN_INTEGRATION_TESTS=true`, rồi chạy lại `npm run test`.
- Chạy `npm run build`.
- Backend chạy được tại `http://localhost:5000/api/health`.
- Frontend chạy được tại `http://localhost:5173`.

## 2. Auth

- Đăng nhập bằng tài khoản chủ trọ mẫu.
- Truy cập trang chính khi chưa đăng nhập phải bị chuyển về `/login`.
- Token hết hạn hoặc sai token phải xóa session và chuyển về `/login`.
- Đổi mật khẩu tại `/change-password`.

## 3. Phòng

- Xem danh sách phòng.
- Lọc theo trạng thái phòng.
- Thêm phòng mới.
- Sửa tên, tầng, giá thuê, số người tối đa.
- Xóa mềm phòng.
- Xem chi tiết phòng và khách thuê hiện tại.

## 4. Khách thuê

- Xem danh sách khách thuê.
- Thêm khách thuê mới và gán phòng.
- Sửa thông tin liên hệ.
- Bỏ gán phòng khỏi khách thuê.
- Xóa mềm khách thuê.
- Kiểm tra trạng thái phòng được đồng bộ sau khi gán hoặc bỏ gán khách.

## 5. Hợp đồng

- Tạo hợp đồng active cho phòng còn trống.
- Không cho tạo hợp đồng active trùng phòng.
- Kiểm tra giá thuê tự điền theo phòng và tiền cọc theo số tháng.
- Khi tao hop dong active cho khach chua co tai khoan, he thong gui thong tin dang nhap qua email
  va khong hien mat khau cho chu tro.
- Sửa hợp đồng.
- Kết thúc hợp đồng.
- Tải PDF hợp đồng.

Checklist bo sung cho hop dong nhieu nguoi o va email tenant:

- Tao hop dong co nhieu nguoi o, kiem tra danh sach hop dong hien tong so nguoi va ten nguoi o cung.
- Tao/sua hop dong co `So xe`, kiem tra danh sach hop dong, chi tiet phong va cong khach thue hien dung so xe.
- Mo chi tiet phong da co hop dong active, kiem tra thay khach dai dien va danh sach nguoi o cung.
- Tao hop dong active phong `101` cho khach A, sau do tao tiep hop dong active phong `102` voi
  cung khach A; he thong phai cho phep vi khach co the thue nhieu phong.
- Kiem tra phong `101` va `102` deu la `Da thue`, moi phong van chi co mot hop dong active.
- Kiem tra trang Khach thue hien khach A tren cac dong phong/hop dong active khac nhau, khong tao
  trung ho so khach.
- Ket thuc hop dong phong `102`, kiem tra phong `101` van con `Da thue` va phong `102` ve `Trong`
  neu khong co hop dong active khac.
- Neu SMTP da cau hinh, tao hop dong active va kiem tra khach thue nhan email tai khoan.
- Neu SMTP chua cau hinh hoac cau hinh sai, kiem tra API/UI bao loi va khong hien mat khau.

## 6. Thanh toán

- Xem danh sách khoản thu.
- Lọc theo trạng thái.
- Tạo khoản thu cho hợp đồng active.
- Kiểm tra khoản thu sinh từ hóa đơn tháng hiển thị tiền phòng và tiền dịch vụ.
- Không cho tạo khoản thu cho hợp đồng không còn hiệu lực.
- Đánh dấu đã thu.
- Hủy khoản thu.
- Kiểm tra dashboard cập nhật số liệu thanh toán.

Ghi chú: VNPay/MoMo hiện ở mức phương thức ghi nhận/mock. Nếu sandbox được duyệt, cần bổ sung test redirect, return URL, IPN/webhook và kiểm tra chữ ký.

## 7. Dashboard

- Hiển thị tổng số phòng theo trạng thái.
- Hiển thị số khách thuê active.
- Hiển thị số hợp đồng active/ended/cancelled.
- Hiển thị doanh thu tháng hiện tại và tháng trước.
- Hiển thị hợp đồng sắp hết hạn trong 30 ngày.
- Hiển thị khoản thu chưa thanh toán hoặc quá hạn.

## 7.1. Dịch vụ và hóa đơn

- Cập nhật đơn giá điện, nước, internet, rác, gửi xe.
- Nhập chỉ số điện/nước cho hợp đồng active.
- Không cho lưu nếu chỉ số mới nhỏ hơn chỉ số cũ.
- Kiểm tra hệ thống tự tính điện, nước, phí dịch vụ và tổng dịch vụ.
- Tạo hóa đơn tháng.
- Không tạo trùng hóa đơn cho cùng hợp đồng/tháng.
- Kiểm tra hóa đơn sinh khoản thu tương ứng ở trang Thanh toán.

## 8. Responsive và demo

- Kiểm tra Chrome desktop.
- Kiểm tra Edge desktop.
- Kiểm tra tablet khoảng 768px.
- Kiểm tra mobile khoảng 390px.
- Không có bảng/form bị che mất nút thao tác quan trọng.
- Chuẩn bị sẵn dữ liệu demo, không demo trên database trống.

## 9. Bo sung hoa don pilot-ready

- Xem chi tiet hoa don va breakdown tien phong/dich vu tu trang Dich vu.
- Tai PDF hoa don tu trang Dich vu va kiem tra co bang ke chi phi, tong tien, thong tin chuyen khoan.
- Tai PDF hoa don tu cong khach thue va kiem tra tenant khong xem duoc hoa don cua nguoi khac.
- Danh dau hoa don da thu va kiem tra payment lien quan chuyen sang da thanh toan.
- Huy hoa don va kiem tra payment lien quan chuyen sang da huy.
- Chu tro cau hinh ngan hang, so tai khoan, chu tai khoan, mau noi dung chuyen khoan va ghi chu.
- Khach thue vao cong khach thue, thay huong dan chuyen khoan dung thong tin chu tro da cau hinh.
- Copy noi dung chuyen khoan va kiem tra placeholder phong/thang/nam duoc thay bang hoa don dang mo.
- Dashboard hien nhac han hoa don qua han va hoa don den han trong 7 ngay.

## 9.1. Tro giup & Ho tro

- Dang nhap tenant, vao `/help`, kiem tra FAQ hien dung va tieng Viet khong loi ma hoa.
- Tenant tao ticket moi voi loai yeu cau, tieu de, noi dung va muc do uu tien.
- Tenant khong tao duoc ticket khi thieu tieu de/noi dung.
- Dang nhap landlord, vao `/help`, thay ticket tenant vua tao.
- Landlord loc ticket theo trang thai, loai yeu cau va muc do uu tien.
- Landlord cap nhat `status`, `priority`, `landlordReply` va kiem tra tenant thay phan hoi.
- Tenant chi xem duoc ticket cua minh, khong xem duoc ticket cua tenant khac.
- Landlord chi xem duoc ticket thuoc `owner` cua minh, khong xem duoc ticket cua chu tro khac.
- Khi tenant tao ticket, landlord thay notification trong chuong header.
- Khi landlord phan hoi/cap nhat ticket, tenant thay notification trong chuong header.
- Tenant dong ticket da xu ly, landlord nhan notification ticket da dong.

## 10. Backup va restore

- Doc `docs/BACKUP_RESTORE.md` truoc khi thao tac voi database that.
- Tao backup thu cong truoc deploy/demo quan trong.
- Restore thu vao database test rieng va smoke test app.
- Khong commit thu muc/file backup len Git.

## 11. MoMo mock auto payment va thong bao

- Dat `MOMO_MOCK_MODE=true` trong backend `.env`.
- Tao hoa don thang cho hop dong active.
- Dang nhap bang tai khoan tenant, vao Cong khach thue.
- Bam `Thanh toan MoMo` tren hoa don chua thu, kiem tra API tra `mockMode=true` va `orderId`.
- Bam `Gia lap da thanh toan`, kiem tra hoa don chuyen sang `paid` va payment lien quan chuyen sang `paid`, method `momo`.
- Dang nhap landlord, kiem tra Header hien badge thong bao chua doc.
- Mo dropdown thong bao, thay thong bao hoa don da thanh toan.
- Bam tung thong bao hoac `Danh dau da doc`, kiem tra unread count giam.
- Neu co credential MoMo that, dat `MOMO_MOCK_MODE=false`, cau hinh `MOMO_IPN_URL` public HTTPS
  va test IPN that tren sandbox.

## 12. SePay bank webhook va thong bao

- Dat `SEPAY_MOCK_MODE=true` trong backend `.env` de test nhanh local.
- Tao hoa don thang cho hop dong active.
- Dang nhap bang tai khoan tenant, vao Cong khach thue.
- Bam `Lay ma SePay`, kiem tra API tra `paymentCode` dang `P{roomName}-HD-T{month}-{year}`.
- Kiem tra noi dung chuyen khoan tren cong khach thue doi sang ma de doc, vi du
  `P102-HD-T8-2026`, va copy duoc.
- Bam `Gia lap da thanh toan`, kiem tra hoa don chuyen sang `paid`, payment lien quan chuyen sang
  `paid`, method/provider `sepay`.
- Dang nhap landlord, kiem tra Header hien badge thong bao chua doc.
- Khi test SePay that: tao webhook tren SePay dashboard, chon Money in, HMAC-SHA256,
  URL `https://<backend-domain>/api/webhooks/sepay`, copy Secret Key vao `SEPAY_WEBHOOK_SECRET`,
  dat `SEPAY_MOCK_MODE=false`, `SEPAY_AUTH_MODE=hmac`.
- Chuyen khoan so tien dung bang hoa don va noi dung chua ma dang `P{roomName}-HD-T{month}-{year}`;
  kiem tra SePay delivery log tra success va invoice tu dong sang `paid`.

## 13. Auto overdue va Discord webhook

- Neu can du lieu test va cac buoc chi tiet, doc `docs/PAYMENT_TEST_GUIDE.md`.
- Tao hoa don `issued` co `dueDate` truoc ngay hien tai, sau do mo trang Dashboard/Dich vu/Cong khach thue
  va kiem tra hoa don tu dong chuyen sang `overdue`.
- Tao payment `pending` co `dueDate` truoc ngay hien tai, sau do mo trang Thanh toan/Dashboard
  va kiem tra payment tu dong chuyen sang `overdue`.
- Kiem tra payment/hoa don `paid` hoac `cancelled` khong bi chuyen ve `overdue`.
- Cau hinh `DISCORD_WEBHOOK_URL`, thanh toan thanh cong qua SePay webhook/mock va kiem tra Discord nhan message.
- Tat hoac cau hinh sai Discord webhook, kiem tra giao dich SePay van duoc ghi nhan `paid` va API khong fail.

## 14. Reset data va tai khoan khach thue theo phong

- Chay `npm run seed:reset` va kiem tra database chi con admin + 30 phong.
- Kiem tra danh sach phong gom `101-110`, `201-210`, `301-310`; tat ca o trang thai `available`.
- Them khach co email, so dien thoai va gan phong `101`.
- Neu ten khach la `Ly Quang Hau`, kiem tra tai khoan tenant co username `lyquanghau101`.
- Kiem tra mat khau ban dau khong hien tren UI va khong tra ve API cho chu tro.
- Neu SMTP da cau hinh, kiem tra email khach nhan username va mat khau ngau nhien.
- Neu SMTP chua cau hinh, kiem tra backend chan tao/cap lai tai khoan tenant va tra loi ro rang.

## 15. Ghi hoa don dich vu theo quy tac moi

- Kiem tra form `Ghi hoa don`: chon hop dong active thi tu hien dien cu, so nguoi, nuoc,
  internet, rac va gui xe.
- Chi nhap duoc chi so dien moi va ghi chu; khong nhap tay dien cu, nuoc, internet, rac, gui xe.
- Dien cu phai lay tu `electricityCurrent` cua ban ghi gan nhat truoc do cua cung phong.
- Nuoc tu dong tinh `so nguoi * waterUnitPrice`, mac dinh 100000/nguoi/thang.
- Gui xe tu dong tinh `vehicleCount * parkingFeePerVehicle`, mac dinh 100000/xe/thang.
- Form `Ghi hoa don` khong con nut `Luu hoa don`; nut `Tao hoa don thang` nam trong khu vuc ghi hoa don.
- Tao hoa don thang va kiem tra serviceAmount khop tong dien, nuoc, internet, rac va gui xe.
