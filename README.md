# Smart Rental

Ứng dụng quản lý phòng trọ thông minh cho đồ án tốt nghiệp.

## Yêu cầu môi trường

- Git
- Node.js `22.21.0`
- npm `10.9.4`
- MongoDB Atlas account

Toàn bộ thành viên phải dùng cùng Node/npm version ở trên. Nếu dùng `nvm`, chạy:

```bash
nvm install
nvm use
```

## Setup lần đầu

```bash
npm ci
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Sau đó sửa `backend/.env` và điền `MONGODB_URI` từ MongoDB Atlas.

## Chạy dự án

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

## Seed dữ liệu mẫu

```bash
npm run seed
```

Reset dữ liệu mẫu:

```bash
npm run seed:reset
```

## Quy tắc đồng bộ nhóm

- Không commit `.env`.
- Không sửa database thủ công nếu dữ liệu đó cần dùng lại; hãy viết seed script.
- Cài package bằng `npm ci` sau khi clone hoặc pull code mới.
- Khi thêm package mới, người thêm chạy `npm install <package> -w <workspace>` và commit `package.json` cùng `package-lock.json`.
- Backend schema phải nằm trong `backend/src/models`.
- API route phải nằm trong `backend/src/routes`.
