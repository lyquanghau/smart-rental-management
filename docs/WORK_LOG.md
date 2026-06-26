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

## 2026-06-26

### Tổng kết kiểm tra ngày khởi chạy

- Xác nhận môi trường local đang dùng đúng Node.js `22.21.0` và npm `10.9.4`.
- Xác nhận `backend/.env` và `frontend/.env` đã tồn tại trên máy local.
- Kiểm tra Git: code chính đang sạch trên `main`; chỉ còn `chuyen_de_2.xlsx` và `code.txt` là file phụ trợ chưa theo dõi.
- Chạy `npm run seed`: pass, MongoDB kết nối thành công và seed 5 phòng, 2 user, 3 khách thuê.
- Kiểm tra backend tạm thời bằng `npm run start -w backend`:
  - `GET /api/health`: pass, trả về `status: ok`.
  - `POST /api/auth/login`: pass với tài khoản `admin@smartrental.local`.
  - `GET /api/rooms`: pass, trả về 5 phòng.
- Kiểm tra frontend tạm thời bằng `npm run dev -w frontend -- --host 127.0.0.1 --port 5173`: pass, trả về HTTP 200 và có React root.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox; lần chạy trong sandbox bị lỗi quyền `spawn EPERM` của Vite trên Windows, không phải lỗi code.

### Ghi chú cho nhóm

- Chưa chạy `npm run seed:reset` vì lệnh này xóa toàn bộ dữ liệu trong các collection trước khi seed lại. Chỉ dùng khi chắc chắn đang trỏ vào database dev và cả nhóm đồng ý reset dữ liệu.
- Nội dung tiếng Việt trong file nguồn không bị hỏng; hiện tượng chữ lỗi khi đọc bằng PowerShell là do cách terminal render output.
- Ngày tiếp theo nên bắt đầu từ nhánh `dev`, sau đó chia việc theo `feature/auth`, `feature/rooms`, `feature/tenants` hoặc nhánh feature nhỏ hơn theo module.

### Module khách thuê

- Thêm Tenant API:

```txt
GET /api/tenants
GET /api/tenants/:id
POST /api/tenants
PUT /api/tenants/:id
DELETE /api/tenants/:id
```

- Các API khách thuê yêu cầu JWT; tạo, sửa, xóa yêu cầu role `landlord`.
- `DELETE /api/tenants/:id` dùng soft delete qua `deletedAt`.
- Frontend thêm trang `Khách thuê` tại `/tenants`, có danh sách, form thêm mới, sửa và xóa mềm.
- Cập nhật `docs/API.md` và `docs/MODULES.md` cho module khách thuê.
- Kiểm tra CRUD khách thuê bằng API thật: list, create, update, soft delete đều pass với JWT admin.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox.

### Sửa lỗi Vite trắng trang trên Windows

- Thêm wrapper chạy Vite để bỏ qua bước gọi `net use` trên Windows khi lệnh này bị hệ thống chặn và gây lỗi `spawn EPERM`.
- Cập nhật script `dev`, `build`, `preview` của frontend dùng wrapper này thay vì gọi trực tiếp `vite`.
- Không sửa `node_modules`; workaround nằm trong source của dự án để các máy trong nhóm dùng giống nhau.
