# Smart Rental

Ứng dụng quản lý phòng trọ thông minh cho đồ án tốt nghiệp.

## Stack chính

- Frontend: React 18, Vite, React Router, Axios, CSS thuần
- Backend: Node.js, Express, MongoDB Atlas, Mongoose
- Tooling: npm workspaces, ESLint, Prettier

## Yêu cầu môi trường

- Git
- Node.js `22.21.0`
- npm `10.9.4`
- MongoDB Atlas account

Nếu dùng `nvm`, chạy:

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

Tài khoản mẫu:

- Chủ trọ: `admin@smartrental.local` / `Admin@123456`
- Khách thuê: `tenant@smartrental.local` / `Tenant@123456`

## Kiểm tra code

```bash
npm run lint
npm run format:check
npm run build
```

## Nhánh Git của team

Dùng ít nhánh để cả nhóm dễ nhớ:

- `main`: code ổn định để demo hoặc nộp, không code trực tiếp.
- `dev`: nhánh làm việc chung, chức năng xong thì merge vào đây trước.
- `feature/auth`: đăng nhập, đăng xuất, bảo vệ trang.
- `feature/rooms`: quản lý phòng, gồm API và giao diện.
- `feature/tenants`: quản lý khách thuê, gồm API và giao diện.
- `feature/docs`: cập nhật README, setup guide và tài liệu API.

Ngày mai nên bắt đầu từ `dev`, sau đó mỗi người checkout đúng nhánh feature của mình.

## Quy tắc nhóm

- Không commit `.env`.
- Không commit `node_modules`, `dist`, `coverage`.
- Không sửa database thủ công nếu dữ liệu đó cần dùng chung; hãy cập nhật seed script.
- Khi thêm package mới, chạy `npm install <package> -w <workspace>` hoặc cài ở root nếu là tooling chung, rồi commit `package.json` và `package-lock.json`.
- Backend schema nằm trong `backend/src/models`.
- Backend route nằm trong `backend/src/routes`.
- Frontend page nằm trong `frontend/src/pages`.
- Frontend API service nằm trong `frontend/src/services`.
