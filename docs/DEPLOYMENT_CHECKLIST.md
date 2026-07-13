# Checklist deploy Smart Rental

## 1. Chuẩn bị repository

- Nhánh `main` chứa code ổn định.
- Không commit `.env`, `node_modules`, `dist`, ảnh cá nhân hoặc file phụ trợ chưa được yêu cầu.
- Chạy pass:
  - `npm run lint`
  - `npm run format:check`
  - `npm run build`

## 2. Backend Render

- Tạo service Node.js trên Render.
- Build command: `npm ci`.
- Start command: `npm run start -w backend`.
- Cấu hình biến môi trường:
  - `NODE_ENV=production`
  - `PORT=5000` hoặc để Render tự cấp.
  - `MONGODB_URI=<connection-string-production-or-demo>`
  - `JWT_SECRET=<secret-manh>`
  - `CLIENT_URL=https://<frontend-domain>`
  - Hoặc `CLIENT_URLS=https://<frontend-domain>,http://localhost:5173` nếu cần nhiều origin.
  - `RATE_LIMIT_WINDOW_MS=900000`
  - `RATE_LIMIT_MAX=300`
- Test `GET /api/health` sau deploy.

## 3. Frontend Vercel

- Import repository vào Vercel.
- Root directory: `frontend`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Cấu hình biến môi trường frontend theo `frontend/.env.example`.
- `VITE_API_BASE_URL` phải trỏ về backend production, ví dụ `https://<backend>.onrender.com/api`.

## 4. MongoDB Atlas

- Dùng database demo/production riêng, không dùng lẫn database dev cá nhân.
- Tạo user có quyền vừa đủ.
- Cho phép IP từ Render hoặc dùng access rule phù hợp trong giai đoạn demo.
- Seed dữ liệu demo nếu database mới.

## 5. Kiểm tra sau deploy

- Mở frontend production.
- Đăng nhập bằng tài khoản demo.
- Test nhanh luồng: phòng -> khách thuê -> hợp đồng -> PDF -> thanh toán -> dashboard.
- Kiểm tra CORS không chặn frontend production.
- Kiểm tra API trả `429` khi gửi quá nhiều request trong một khoảng ngắn. Backend đang dùng `express-rate-limit`.
- Kiểm tra link demo không bị lỗi sau khi Render service sleep/wake.

## 6. Ghi chú VNPay/MoMo

Nếu chưa có sandbox được duyệt, giữ payment ở mức ghi nhận thủ công/mock và ghi rõ trong báo cáo. Khi tích hợp thật cần thêm:

- Endpoint tạo URL thanh toán.
- Return URL.
- IPN/webhook.
- Kiểm tra chữ ký bảo mật.
- Lưu mã giao dịch/reference id.
- Test case thanh toán thành công, thất bại và pending.
