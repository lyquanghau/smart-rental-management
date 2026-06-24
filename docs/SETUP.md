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

Reset lại dữ liệu mẫu:

```bash
npm run seed:reset
```

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
