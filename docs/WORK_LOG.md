# Work Log

## 2026-06-22

- Tạo cấu trúc monorepo gồm `frontend` và `backend`.
- Cấu hình npm workspaces.
- Khóa phiên bản môi trường bằng `.nvmrc`.
- Thêm `.editorconfig`, `.gitattributes`, `.gitignore`.
- Tạo backend Node.js + Express + MongoDB/Mongoose.
- Tạo health check API và API danh sách phòng.
- Tạo frontend React + Vite với dashboard và danh sách phòng cơ bản.
- Tạo tài liệu setup, API, convention.
- Push repo lên GitHub.

Hai file chưa đưa vào commit ban đầu vì là tài liệu/phụ trợ:

```txt
chuyen_de_2.xlsx
code.txt
```

## 2026-06-24

### Tổng kết ngắn

Ngày đầu setup đã hoàn thành. Dự án đã có nền backend, frontend, MongoDB thật, dữ liệu mẫu, kiểm tra code và tài liệu cho team.

### Setup nền tảng cho team

- Cấu hình ESLint và Prettier ở root monorepo.
- Thêm script:

```bash
npm run lint
npm run format
npm run format:check
```

- Giữ hướng stack chính thức là MongoDB Atlas + Mongoose.
- Không chuyển sang PostgreSQL/migration vì repo hiện tại đã scaffold MongoDB và backend đang dùng Mongoose.

### Backend

- Thêm response lỗi có `message` và `errors`.
- Thêm validation middleware dùng chung.
- Thêm auth JWT:

```txt
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

- Thêm middleware `requireAuth` và `requireRole`.
- Hoàn thiện Room API:

```txt
GET /api/rooms
GET /api/rooms/:id
POST /api/rooms
PUT /api/rooms/:id
DELETE /api/rooms/:id
```

- `DELETE /api/rooms/:id` dùng soft delete qua `deletedAt`.
- Thêm model nền: `User`, `Tenant`, `Contract`, `Payment`.
- Mở rộng seed data gồm phòng, user mẫu, khách thuê, hợp đồng và thanh toán.

### Frontend

- Tách layout khỏi `App.jsx`.
- Thêm `MainLayout`, `Sidebar`, `Header`.
- Thêm trang đăng nhập cơ bản.
- Tách hiển thị trạng thái phòng thành `RoomStatusBadge`.
- Thêm session storage service để lưu token/user.
- Axios tự gắn Bearer token và chuẩn hóa lỗi trả về.
- Trang danh sách phòng có loading, error, empty state và filter theo trạng thái.

### Tài liệu

- Viết lại README, SETUP, CONVENTIONS cho đúng stack hiện tại.
- Thêm `docs/REQUIREMENTS.md` và `docs/MODULES.md`.
- Cập nhật `docs/API.md` theo API contract mới.

### Kiểm tra cuối ngày

- `npm run seed:reset`: pass, đã seed 5 phòng, 2 user, 3 khách thuê.
- `GET /api/health`: pass.
- `GET /api/rooms`: pass, trả đúng 5 phòng.
- `POST /api/auth/login`: pass với tài khoản admin mẫu.
- CRUD phòng bằng JWT admin: tạo, sửa, xóa mềm đều pass.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass.

### Nhánh đã tạo cho team

```txt
dev
feature/auth
feature/rooms
feature/tenants
feature/docs
```

Quy ước đơn giản:

- `main` để code ổn định.
- `dev` để gom code hằng ngày.
- `feature/*` để mỗi người làm một phần riêng.
