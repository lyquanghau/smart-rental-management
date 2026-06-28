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

### Sửa lỗi frontend runtime

- Sửa lỗi `React is not defined` khi mở giao diện trên trình duyệt.
- Thêm import `React` vào các file JSX đang render component.
- Chỉnh ESLint theo hướng classic JSX runtime để không báo sai các import `React`.

### Hoàn thiện luồng khách thuê và phòng

- Sửa lỗi cập nhật khách thuê không lưu đúng khi bỏ trống các trường tùy chọn như phòng, email, CCCD/CMND.
- Frontend gửi giá trị trống thành `null` thay vì `undefined` để backend có thể xóa giá trị cũ.
- Thêm nút `Tải lại` ở trang `Khách thuê`, chỉ gọi lại API của trang thay vì reload toàn bộ trình duyệt.
- Đồng bộ trạng thái phòng theo khách thuê active:
  - Có khách thuê đang gán phòng thì phòng chuyển sang `occupied`.
  - Không còn khách thuê active thì phòng về `available`.
  - Phòng đang `maintenance` không bị tự động đổi trạng thái.
- Sửa seed data để các phòng có khách thuê mẫu ban đầu không bị ghi nhầm là `available`.

### Kiểm tra sau khi sửa

- Test thêm khách thuê: pass.
- Test sửa khách thuê: pass.
- Test bỏ gán phòng khỏi khách thuê: pass.
- Test xóa mềm khách thuê: pass.
- Test phòng `C301` có khách thuê thì hiển thị `Đã thuê`: pass.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox.

### Push code

- Đã push nhánh `dev` lên remote `origin/dev`.
- Commit cuối đã push: `9b4b7c4 fix: sync room status from active tenants`.
- Các file phụ trợ chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`, `docs/image/`.

## 2026-06-28

### Đánh giá đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- Không có thay đổi tracked cần push trước khi code.
- Các file phụ trợ chưa theo dõi vẫn là `chuyen_de_2.xlsx`, `code.txt`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox; lỗi `spawn EPERM` trong sandbox là lỗi môi trường Windows/Vite, không phải lỗi code.

### Module hợp đồng

- Thêm Contracts API:

```txt
GET /api/contracts
GET /api/contracts/:id
POST /api/contracts
PUT /api/contracts/:id
DELETE /api/contracts/:id
```

- Các API hợp đồng yêu cầu JWT; tạo, sửa, kết thúc hợp đồng yêu cầu role `landlord`.
- Danh sách và chi tiết hợp đồng trả kèm thông tin phòng và khách thuê qua `populate`.
- Validate nghiệp vụ cơ bản: phòng tồn tại, khách thuê tồn tại, ngày bắt đầu hợp lệ, ngày kết thúc sau ngày bắt đầu, tiền thuê và tiền cọc không âm.
- `DELETE /api/contracts/:id` không xóa cứng, chỉ chuyển trạng thái hợp đồng sang `ended`.

### Frontend hợp đồng

- Thêm service `contractService`.
- Thêm trang `Hợp đồng` tại `/contracts`.
- Trang hợp đồng có danh sách, form thêm mới, sửa, kết thúc hợp đồng, loading state, error state và empty state.
- Thêm menu `Hợp đồng` vào sidebar.

### Tài liệu

- Cập nhật `docs/API.md` cho Contracts API.
- Cập nhật `docs/MODULES.md` để phản ánh module hợp đồng đã có API/UI cơ bản.

### Kiểm tra sau triển khai

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox.
- Ghi chú: build trong sandbox vẫn lỗi `spawn EPERM` tại bước Vite/esbuild trên Windows, giống các phiên trước.

### Điều chỉnh flow tạo hợp đồng

- Thêm lựa chọn thời hạn hợp đồng: 3 tháng, 6 tháng, 12 tháng, 24 tháng.
- Ngày kết thúc được tự tính từ ngày bắt đầu và thời hạn đã chọn.
- Khi chọn phòng, giá thuê mỗi tháng được tự điền theo giá phòng hiện tại.
- Thêm giải thích rằng giá thuê mỗi tháng là giá chốt trong hợp đồng, có thể khác giá niêm yết của phòng nếu có thỏa thuận riêng.
- Đổi tiền cọc từ nhập số tiền sang chọn số tháng cọc: 1 tháng, 2 tháng, 3 tháng.
- Hiển thị dòng phụ bên dưới để người dùng thấy số tiền cọc tương ứng.
- Thêm giải thích ý nghĩa trạng thái hợp đồng: đang hiệu lực, đã kết thúc, đã hủy.
- Thêm số người ở tối đa cho mỗi phòng và hiển thị ở danh sách phòng, form hợp đồng.

### Module thanh toán MVP

- Kiểm tra Git trước khi code: đang ở nhánh `dev`, đồng bộ với `origin/dev`, không có thay đổi tracked cần xử lý trước; chỉ có `chuyen_de_2.xlsx`, `code.txt`, `docs/image/` là file phụ trợ chưa theo dõi.
- Thêm Payments API:

```txt
GET /api/payments
GET /api/payments/:id
POST /api/payments
PUT /api/payments/:id
PATCH /api/payments/:id/mark-paid
PATCH /api/payments/:id/cancel
```

- Các API thanh toán yêu cầu JWT; tạo, sửa, đánh dấu đã thu và hủy khoản thu yêu cầu role `landlord`.
- Danh sách và chi tiết thanh toán trả kèm thông tin hợp đồng, phòng và khách thuê qua `populate`.
- Thêm filter danh sách thanh toán theo hợp đồng, trạng thái, phương thức, tháng/năm hạn thanh toán.
- Chưa tích hợp redirect VNPay/MoMo thật vì dự án chưa có cấu hình sandbox trong `.env.example`; hôm nay ưu tiên ghi nhận thanh toán thủ công/mock để không block frontend.
- Frontend thêm service `paymentService`.
- Frontend thêm trang `Thanh toán` tại `/payments`, có danh sách khoản thu, filter trạng thái, form thêm/sửa, đánh dấu đã thu, hủy khoản thu, loading state, error state và empty state.
- Thêm menu `Thanh toán` vào sidebar.
- Cập nhật `docs/API.md` và `docs/MODULES.md` cho module thanh toán.

### Kiểm tra sau module thanh toán

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox.
- Ghi chú: build trong sandbox vẫn lỗi `spawn EPERM` tại Vite/esbuild trên Windows, giống các phiên trước; chạy ngoài sandbox build thành công.

### Test giao diện module thanh toán

- Chạy backend local bằng `npm run start -w backend`: pass, MongoDB connected, API health trả `status: ok`.
- Chạy frontend local tại `http://localhost:5173`: pass.
- Test đăng nhập trên giao diện bằng tài khoản admin mẫu: pass, chuyển được vào app và lưu session.
- Test trang `/payments`: pass, hiển thị danh sách khoản thu seed, filter trạng thái, form thêm khoản thu và không có error message.
- Do dữ liệu hiện tại không còn hợp đồng `active`, tạo thêm một hợp đồng active qua giao diện `/contracts` để có dữ liệu test thanh toán.
- Test tạo khoản thu qua giao diện `/payments`: pass, khoản thu mới xuất hiện trong bảng với số tiền, hạn thanh toán, phương thức và ghi chú đúng.
- Test nút `Đã thu`: pass, khoản thu chuyển sang trạng thái `Đã thanh toán`, có ngày thu và chỉ còn thao tác `Sửa`.
- Test nút `Hủy`: pass, khoản thu test riêng chuyển sang trạng thái `Đã hủy` và chỉ còn thao tác `Sửa`.
- Ảnh chụp kiểm tra giao diện được lưu tạm tại `.tmp-test-logs/payments-ui-test.png`.

### Hoàn thiện tài liệu phân tích ban đầu

- Thêm `docs/USER_STORY.md` với user story cho 2 vai: chủ trọ và khách thuê.
- Mỗi vai có 5 user story theo format `As a... I want... so that...` và acceptance criteria.
- Cập nhật `docs/REQUIREMENTS.md` để trỏ sang tài liệu user story chi tiết.
- Bổ sung `frontend/src/hooks/README.md` để hoàn thiện cấu trúc thư mục frontend theo kế hoạch; chưa tạo hook code vì hiện chưa có logic lặp lại cần tách.
- Cập nhật `docs/CONVENTIONS.md` về quy ước hooks và quyết định dùng CSS thuần thay vì TailwindCSS/MUI trong giai đoạn MVP.
- Cập nhật README để stack frontend ghi rõ đang dùng CSS thuần.
