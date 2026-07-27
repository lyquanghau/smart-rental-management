# Product readiness

Tài liệu này dùng để đánh giá Smart Rental trước khi demo cho khách thật hoặc triển khai bán thử.

## Trạng thái hiện tại

Ứng dụng đã đủ lõi MVP cho một nhà trọ nhỏ:

- Chủ trọ đăng nhập và quản lý phòng, khách thuê, hợp đồng, hóa đơn, thanh toán.
- Hệ thống sinh PDF hợp đồng từ dữ liệu thật.
- Hóa đơn tháng có tiền phòng, điện, nước và phí dịch vụ.
- Dashboard có số liệu phòng, doanh thu, công nợ và cảnh báo hợp đồng/khoản thu.
- Khách thuê có cổng riêng để xem thông tin liên quan đến phòng, hợp đồng, hóa đơn và thanh toán.
- Dữ liệu nghiệp vụ đã có multi-tenant isolation theo `owner`, phù hợp mô hình nhiều chủ trọ dùng
  chung một hệ thống.

## Có thể bán thử khi

- Backend đã deploy production trên Render hoặc nền tảng tương đương.
- Frontend đã deploy production trên Vercel hoặc nền tảng tương đương.
- MongoDB dùng database demo/production riêng, không dùng lẫn database dev cá nhân.
- `JWT_SECRET` mạnh, tối thiểu 32 ký tự.
- `CLIENT_URLS` chỉ chứa domain frontend thật, không dùng `*`.
- `ALLOW_PUBLIC_REGISTRATION=false` nếu chưa có quy trình xác minh email/duyệt chủ trọ.
- Có dữ liệu demo và tài khoản demo được kiểm tra trước khi gặp khách.
- Checklist trong `docs/TEST_CHECKLIST.md` pass trên môi trường production.

## Chưa nên cam kết là sản phẩm thương mại đầy đủ

- Chưa có thanh toán VNPay/MoMo sandbox thật gồm redirect, return URL, IPN/webhook và kiểm tra chữ ký.
- Chưa có automated test suite cho backend/frontend.
- Chưa có phân hệ tổ chức/chi nhánh nâng cao cho một chủ trọ quản lý nhiều tòa nhà hoặc nhiều nhân viên.
- Chưa có sao lưu dữ liệu tự động, audit log và quy trình khôi phục sự cố.
- Chưa có trang đăng ký/duyệt chủ trọ kèm xác minh email.
- Chưa có điều khoản sử dụng, chính sách quyền riêng tư và quy trình hỗ trợ khách hàng.

## Hướng ưu tiên để bán thật

1. Billing plan: gói miễn phí/trả phí, giới hạn số phòng hoặc số hợp đồng.
2. Payment gateway thật: tích hợp VNPay/MoMo với chữ ký, return URL, IPN và transaction log.
3. Automated tests: test auth, phân quyền owner, hóa đơn, thanh toán và dashboard.
4. Backup & monitoring: backup MongoDB, log lỗi server, health check và cảnh báo downtime.
5. Legal/compliance: điều khoản sử dụng, chính sách dữ liệu cá nhân, quy trình xóa dữ liệu.
6. Organization roles: nếu cần, thêm nhân viên/quản lý phụ thuộc cùng một chủ trọ.

## Kịch bản demo bán thử

1. Đăng nhập chủ trọ.
2. Xem dashboard tổng quan.
3. Tạo phòng mới hoặc kiểm tra phòng còn trống.
4. Thêm khách thuê.
5. Tạo hợp đồng active và ghi lại tài khoản/mật khẩu tạm của khách thuê.
6. Xem trước và tải PDF hợp đồng.
7. Nhập chỉ số điện/nước, tạo hóa đơn tháng.
8. Đánh dấu khoản thu đã thanh toán.
9. Đăng nhập bằng tài khoản khách thuê, đổi mật khẩu và xem cổng khách thuê.
