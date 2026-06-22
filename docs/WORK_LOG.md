# Work Log

Ngày thực hiện: 2026-06-22

## Đã setup dự án

- Tạo cấu trúc monorepo gồm `frontend` và `backend`.
- Cấu hình npm workspaces để cài toàn bộ package bằng một lệnh ở thư mục gốc:

```bash
npm ci
```

- Khóa phiên bản môi trường bằng `.nvmrc`:

```txt
22.21.0
```

- Thêm `.editorconfig` và `.gitattributes` để thống nhất format và line ending giữa các máy.
- Thêm `.gitignore` để không commit `node_modules`, `dist`, `.env`.
- Tạo `package-lock.json` để các máy cài cùng version package.

## Backend

- Tạo backend bằng Node.js + Express.
- Cấu hình MongoDB qua Mongoose.
- Tạo file môi trường mẫu:

```txt
backend/.env.example
```

- Tạo health check API:

```txt
GET /api/health
```

- Tạo model `Room`.
- Tạo API danh sách phòng:

```txt
GET /api/rooms
```

- Tạo seed script:

```bash
npm run seed
npm run seed:reset
```

## Frontend

- Tạo frontend bằng React + Vite.
- Tạo file môi trường mẫu:

```txt
frontend/.env.example
```

- Tạo layout cơ bản gồm sidebar và nội dung chính.
- Tạo trang Tổng quan.
- Tạo trang Danh sách phòng.
- Cấu hình gọi API backend qua:

```txt
VITE_API_URL
```

## Tài liệu

Đã tạo các file tài liệu:

```txt
README.md
docs/SETUP.md
docs/API.md
docs/CONVENTIONS.md
```

Nội dung chính:

- Cách setup dự án cho cả nhóm.
- Cách clone code và cài package.
- Cách tạo `.env`.
- Cách chạy frontend/backend.
- Quy ước branch, commit và cấu trúc thư mục.

## Git và GitHub

- Khởi tạo Git repo local.
- Tạo commit đầu tiên:

```txt
e5738fb chore: scaffold smart rental project
```

- Đổi branch mặc định sang:

```txt
main
```

- Thêm remote GitHub:

```txt
https://github.com/lyquanghau/smart-rental-management.git
```

- Push code lên GitHub thành công.

## Hướng dẫn gửi cho thành viên

```bash
git clone https://github.com/lyquanghau/smart-rental-management.git
cd smart-rental-management
npm ci
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
npm run dev
```

Sau khi chạy:

```txt
Frontend: http://localhost:5173
Backend: http://localhost:5000/api/health
```

Lưu ý: cần điền `MONGODB_URI` trong `backend/.env` trước khi chạy backend thật.

## File chưa đưa vào commit ban đầu

Hai file sau đang nằm ngoài Git commit vì là file kế hoạch/nguồn phụ, không phải source code scaffold:

```txt
chuyen_de_2.xlsx
code.txt
```
