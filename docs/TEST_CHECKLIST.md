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
- Khi tạo hợp đồng active cho khách chưa có tài khoản, hệ thống trả mật khẩu tạm một lần.
- Sửa hợp đồng.
- Kết thúc hợp đồng.
- Tải PDF hợp đồng.

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

## 10. Backup va restore

- Doc `docs/BACKUP_RESTORE.md` truoc khi thao tac voi database that.
- Tao backup thu cong truoc deploy/demo quan trong.
- Restore thu vao database test rieng va smoke test app.
- Khong commit thu muc/file backup len Git.
