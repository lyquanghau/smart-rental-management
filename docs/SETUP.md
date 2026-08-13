# Setup cho cả nhóm

Tài liệu này là nguồn chuẩn để các máy setup giống nhau.

## 1. Cài công cụ

Cả nhóm dùng cùng phiên bản:

- Node.js `22.21.0`
- npm `10.9.4`

Kiểm tra:

```bash
node -v
npm -v
```

## 2. Clone và cài dependencies

```bash
git clone https://github.com/lyquanghau/smart-rental-management.git
cd smart-rental-management
npm ci
```

Dùng `npm ci` sau khi clone hoặc pull code mới để cài đúng theo `package-lock.json`.

## 3. Tạo file môi trường

Windows:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền `MONGODB_URI` trong `backend/.env` bằng connection string từ MongoDB Atlas.

Biến môi trường backend quan trọng:

```txt
PORT=5000
MONGODB_URI=<mongodb-atlas-uri>
JWT_SECRET=<secret>
CLIENT_URL=http://localhost:5173
ALLOW_PUBLIC_REGISTRATION=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Khi deploy cần cho phép nhiều frontend origin, dùng `CLIENT_URLS` thay cho `CLIENT_URL`:

```txt
CLIENT_URLS=http://localhost:5173,https://<frontend-domain>
```

`ALLOW_PUBLIC_REGISTRATION=false` là lựa chọn an toàn cho demo/production khi chưa có xác minh email
hoặc quy trình duyệt chủ trọ. Nếu cần test `POST /auth/register` ở môi trường dev, có thể bật
`ALLOW_PUBLIC_REGISTRATION=true`.

## 4. MongoDB Atlas

Database dev thống nhất:

```txt
smart_rental_dev
```

Khuyến nghị:

- Tạo user riêng cho project.
- Chỉ cấp quyền cần thiết cho database dev.
- Không nhập dữ liệu mẫu thủ công nếu dữ liệu đó cần chia sẻ; cập nhật seed script.

## 5. Seed dữ liệu mẫu

```bash
npm run seed
```

Seed hiện gán toàn bộ dữ liệu demo cho tài khoản chủ trọ mẫu `admin@smartrental.local`. Nếu database
cũ đã có dữ liệu từ trước khi thêm multi-tenant `owner`, chạy `npm run seed` sẽ tạo/cập nhật bộ dữ
liệu demo có owner để app hiển thị đúng theo tài khoản admin.

Reset lại dữ liệu mẫu:

```bash
npm run seed:reset
```

## 8. SMTP gui tai khoan tenant

Neu muon he thong gui tai khoan/mat khau tenant khi tao khach hoac tao hop dong active, cau hinh
SMTP trong `backend/.env`:

```txt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password-or-app-password>
SMTP_FROM="Smart Rental <no-reply@smartrental.local>"
```

Neu chua cau hinh SMTP hoac SMTP gui that bai, backend se khong tao/cap lai mat khau tai khoan
tenant. Chu tro khong duoc nhin thay mat khau; thong tin dang nhap chi duoc gui qua email khach thue.

Tài khoản mẫu:

- `admin@smartrental.local` / `Admin@123456`
- `tenant@smartrental.local` / `Tenant@123456`

## 6. Chạy dự án

```bash
npm run dev
```

URL mặc định:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

## 7. Kiểm tra trước khi push

```bash
npm run lint
npm run format:check
npm run build
```

Nếu thêm hoặc sửa dữ liệu mẫu, chạy thêm:

```bash
npm run seed:reset
```
