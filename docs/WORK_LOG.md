# Work Log

## 2026-07-13

### Kiểm tra đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- `dev`, `main`, `origin/dev`, `origin/main` cùng commit `30da487`.
- Kiểm tra `git branch --no-merged main --all`: không có nhánh local/remote nào còn commit chưa merge vào `main`.
- File tracked đang modified từ trước: `docs/WORK_LOG.md`.
- File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`, `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
- `npm run build`: pass khi chạy ngoài sandbox. Đây là lỗi môi trường/sandbox, không phải lỗi code.

### Đánh giá tiến độ

- Đối chiếu kế hoạch `chuyen_de_2.xlsx`, tài liệu trong `docs` và code hiện tại.
- Dự án đang bám đúng MVP: Auth JWT, Rooms, Tenants, Contracts, Payments và Dashboard đã có backend + frontend.
- Tiến độ phù hợp giai đoạn Tuần 4: hoàn thiện dashboard, polish UI, kiểm thử, deploy production và chuẩn bị báo cáo.
- Các khoảng trống chính còn lại: VNPay/MoMo sandbox thật, test case chính thức, checklist deploy production, hardening production nhẹ và tài liệu demo.

### Nhánh làm việc hôm nay

- Tạo nhánh `feature/week4-polish-hardening` từ `dev`.

### Hardening backend

- Thêm cấu hình `NODE_ENV`, `CLIENT_URLS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` trong `backend/src/config/env.js`.
- Cập nhật CORS để cho phép một hoặc nhiều frontend origin qua `CLIENT_URL` hoặc `CLIENT_URLS`.
- Thêm `app.set('trust proxy', 1)` để phù hợp khi backend chạy sau Render/proxy.
- Thêm package `express-rate-limit` cho backend để rate limiting theo chuẩn middleware Express.
- Rate limit mặc định: 300 request / 15 phút / IP, có thể chỉnh bằng biến môi trường.
- API trả HTTP `429` và header rate limit chuẩn khi client gửi quá nhiều request.

### Polish responsive

- Cập nhật `frontend/src/styles.css` để form compact chuyển 2 cột trên tablet và 1 cột trên mobile.
- Cải thiện sidebar/nav, page actions, user menu, revenue chart và row action buttons ở viewport nhỏ.
- Giữ nguyên stack CSS thuần, không thêm UI library.

### UI/UX polish bằng skill `ui-ux-pro-max`

- Đọc skill local `.codex/skills/ui-ux-pro-max/SKILL.md`.
- Chạy CLI design-system cho hướng `property management rental dashboard operational admin` với mật độ dashboard cao, motion nhẹ.
- Chốt hướng giao diện: phần mềm vận hành nội bộ, trung tính, data-dense, màu trạng thái rõ, không làm kiểu landing/hero.
- Cập nhật layout:
  - Sidebar có nhận diện `Smart Rental`, nhóm menu theo nghiệp vụ.
  - Header đổi thành ngữ cảnh bảng điều hành vận hành khu trọ.
  - Thêm skip link tới nội dung chính để cải thiện keyboard accessibility.
- Thay hệ CSS bằng design tokens rõ ràng: background, surface, border, primary, warning, danger, shadow, spacing.
- Cải thiện card, bảng, form, trạng thái, focus visible, hover/active state và responsive mobile/tablet.
- Thêm `.codex/` vào `.gitignore`, `.prettierignore` và ESLint ignore để skill local không bị commit/lint/format nhầm như source app.

### Redesign bố cục admin hiện đại

- Chốt brief với chủ dự án: admin hiện đại, chuyên nghiệp, giống phần mềm quản lý thật; áp dụng toàn bộ app; mật độ cân bằng; tông xanh da trời và trắng.
- Chạy lại `ui-ux-pro-max` với query `modern admin property management dashboard sky white professional balanced density`.
- Redesign dashboard thành màn điều hành:
  - Hero vận hành có số việc cần xử lý.
  - KPI bento cho doanh thu, phòng, khách thuê và khoản quá hạn.
  - Panel so sánh doanh thu.
  - Panel tình trạng thanh toán.
  - Work queue cho hợp đồng sắp hết hạn và khoản thu cần xử lý.
- Cập nhật CSS toàn app theo hệ sky/white:
  - Sidebar, topbar, page heading, form panel, table panel, room card, alert item, status badge.
  - Form CRUD dùng kiểu control panel bên trái; bảng/danh sách là workspace bên phải.
  - Bỏ sticky form trên tablet/mobile để thao tác dễ hơn.
  - Bổ sung responsive cho dashboard hero, bento grid, insight grid và work queue.

### Điều chỉnh layout theo phản hồi

- Chủ dự án không muốn kiểu bố cục form bên trái, thông tin bên phải.
- Thêm `lucide-react` cho icon SVG thống nhất trong giao diện.
- Sidebar dùng icon cho từng mục: tổng quan, phòng, khách thuê, hợp đồng, thanh toán.
- Đổi layout CRUD toàn app:
  - Form trở thành command panel ngang phía trên.
  - Workspace dữ liệu nằm bên dưới, không còn bị chia đôi với form.
  - Trang phòng dùng workspace riêng: danh sách phòng và panel chi tiết nằm trong vùng nội dung bên dưới form.
  - Form tự chuyển 4 cột desktop, 2 cột tablet, 1 cột mobile.

### Icon hành động

- Thêm icon lucide nhỏ gọn, stroke dày hơn cho các hành động thường dùng.
- Header:
  - `Đổi mật khẩu`: icon chìa khóa.
  - `Đăng xuất`: icon đăng xuất.
- Sidebar:
  - Icon cho tổng quan, phòng, khách thuê, hợp đồng, thanh toán.
- Các trang nghiệp vụ:
  - `Tải lại`: icon refresh.
  - `Thêm`: icon plus/file-plus.
  - `Cập nhật/Sửa`: icon bút.
  - `Hủy`: icon x/trash tùy ngữ cảnh.
  - `Xóa`: icon thùng rác.
  - `Chi tiết/Xem`: icon mắt.
  - `PDF`: icon download.
  - `Đã thu`: icon check circle.
  - `Kết thúc`: icon stop circle.

### Tài liệu

- Thêm `docs/TEST_CHECKLIST.md` cho checklist kiểm thử thủ công trước demo/merge/deploy.
- Thêm `docs/DEPLOYMENT_CHECKLIST.md` cho checklist Render, Vercel, MongoDB Atlas và kiểm tra sau deploy.
- Cập nhật `docs/SETUP.md` cho biến môi trường mới.
- Cập nhật `docs/API.md` cho CORS/rate limit và HTTP `429`.

### Kiểm tra sau khi code

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: vẫn lỗi `spawn EPERM` khi chạy trong sandbox Windows.
- `npm run build`: pass khi chạy ngoài sandbox.

## 2026-07-10

### Kiểm tra đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- Kiểm tra tất cả nhánh local/remote: `dev`, `main`, `origin/dev`, `origin/main` đang cùng commit `8458510`.
- Không có nhánh local hoặc remote nào chưa merge vào `main`.
- File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`,
  `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: gặp lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
- `npm run build`: pass khi chạy ngoài sandbox. Đây là lỗi môi trường/sandbox, không phải lỗi code.

### Đánh giá tiến độ và phạm vi hôm nay

- Đối chiếu `chuyen_de_2.xlsx`, `docs/WORK_LOG.md`, docs và code hiện tại.
- Xác nhận dự án đang bám MVP: Auth JWT, Rooms, Tenants, Contracts, Payments và Dashboard đã có nền tảng.
- Các hạng mục tuần 2 còn thiếu trong code: CRUD phòng trên frontend, chi tiết phòng kèm khách thuê
  hiện tại, index MongoDB cho các filter thường dùng.
- Các hạng mục staging Render/Postman cần tài khoản/cấu hình bên ngoài nên tách ra làm checklist riêng.

### Hoàn thiện module phòng

- Mở rộng `GET /api/rooms/:id` để trả thêm `currentTenants`, gồm các khách thuê chưa bị xóa mềm
  đang gán với phòng.
- Bổ sung index MongoDB:
  - `Room`: `deletedAt + status`, `deletedAt + floor`.
  - `Tenant`: `deletedAt + room`, `deletedAt + fullName`.
  - `Contract`: `room + status`, `tenant + status`, `status + endDate`.
  - `Payment`: `contract + status`, `status + dueDate`, `dueDate + method`.
- Cập nhật trang `Phòng` trên frontend:
  - Thêm form tạo phòng mới.
  - Thêm sửa phòng.
  - Thêm xóa mềm phòng.
  - Thêm nút tải lại danh sách.
  - Thêm panel chi tiết phòng, hiển thị thông tin phòng và khách thuê hiện tại.
  - Giữ logic trạng thái `occupied` được đồng bộ từ khách thuê đang gán phòng.

### Tài liệu

- Cập nhật `docs/API.md` cho response `GET /rooms/:id` có `currentTenants`.
- Cập nhật `docs/MODULES.md` để ghi rõ module phòng đã có CRUD frontend và chi tiết phòng.

### Tài khoản khách thuê và mật khẩu tạm

- Chốt hướng nghiệp vụ: không tạo form đăng ký public cho khách thuê.
- Khi chủ trọ tạo hợp đồng `active` cho khách thuê chưa có tài khoản, backend tự tạo user role
  `tenant`.
- Tên đăng nhập mặc định của khách thuê là số điện thoại; nếu khách không có email thì backend tạo
  email nội bộ dạng `<so-dien-thoai>@tenant.smartrental.local`.
- Backend sinh mật khẩu tạm bằng random bytes, chỉ trả plaintext một lần trong response tạo hợp đồng;
  database chỉ lưu password hash.
- Tài khoản mật khẩu tạm có `mustChangePassword = true` và `temporaryPasswordExpiresAt` sau 3 ngày.
- Trong 3 ngày đầu, khách thuê vẫn đăng nhập và dùng app bình thường, frontend hiện cảnh báo đổi mật khẩu.
- Nếu quá 3 ngày chưa đổi, backend khóa tài khoản khi login hoặc gọi API; chỉ role `landlord` có API mở
  khóa/cấp lại mật khẩu tạm.
- Thêm `PATCH /api/auth/change-password` để người dùng tự đổi mật khẩu.
- Thêm `PATCH /api/auth/users/:id/unlock` để chủ trọ mở khóa và cấp lại mật khẩu tạm.
- Thêm màn hình frontend `/change-password`.
- Cập nhật màn hình đăng nhập để nhận "Email hoặc tên đăng nhập" và validate form rõ hơn.
- Trang hợp đồng hiện thông tin tài khoản tạm ngay sau khi tạo hợp đồng nếu backend vừa tạo tài khoản mới.

## 2026-07-09

### Kiểm tra đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- Kiểm tra tất cả nhánh local/remote: không có nhánh local nào có commit chưa merge vào `main`.
- File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`,
  `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: gặp lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild,
  chạy lại ngoài sandbox thì pass. Đây là lỗi môi trường/sandbox, không phải lỗi code.
- Tạo nhánh `feature/auth-validation-dashboard-polish` để làm việc hôm nay.

### Auth frontend

- Tách `/login` ra khỏi layout quản trị để trang đăng nhập không hiện sidebar/header.
- Thêm `ProtectedRoute` để bảo vệ các trang chính bằng JWT trong local storage.
- Nếu chưa đăng nhập và truy cập trang chính, frontend redirect về `/login`.
- Sau khi đăng nhập thành công, frontend đưa người dùng về trang đang muốn mở trước đó.
- Bỏ menu `Đăng nhập` khỏi sidebar trong khu vực quản trị.

### Validation nghiệp vụ backend

- Bổ sung chặn tạo/cập nhật hợp đồng `active` khi phòng đã có hợp đồng `active` khác.
- Bổ sung kiểm tra khoản thu chỉ gắn với hợp đồng đang `active`.
- Bổ sung kiểm tra `amount` phải là số không âm trong controller payment.
- Bổ sung validate `paidAt` cho thao tác đánh dấu đã thu để không âm thầm đổi ngày sai thành ngày hiện tại.

### Dashboard

- Chuẩn hóa text tiếng Việt có dấu trong khu vực cảnh báo dashboard.
- Thêm biểu đồ cột đơn giản so sánh doanh thu tháng này và tháng trước bằng HTML/CSS,
  không thêm chart library để giữ MVP gọn nhẹ.

### Việt hóa giao diện và thông báo

- Việt hóa thông báo lỗi/thành công từ backend để frontend không hiện chữ tiếng Anh như
  `Room already has an active contract`.
- Việt hóa validation middleware, auth middleware, not found handler và error handler chung.
- Việt hóa nội dung PDF hợp đồng: tiêu đề, thông tin phòng, khách thuê, điều khoản và chữ ký.
- Thêm cơ chế đăng ký font Arial/DejaVu/Liberation nếu có trên máy chủ để PDF hiển thị được tiếng Việt có dấu.
- Chuẩn hóa text dashboard còn thiếu dấu và map trạng thái thanh toán sang tiếng Việt.

### Kiểm tra sau khi code

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: vẫn gặp `spawn EPERM` khi chạy trong sandbox Windows.
- `npm run build`: pass khi chạy ngoài sandbox.

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

### Bổ sung tài liệu cho các mục kế hoạch còn thiếu

- Thêm `docs/USER_FLOW.md` mô tả luồng đăng nhập, quản lý phòng, hợp đồng và thanh toán.
- Thêm `docs/COMPONENT_LIST.md` liệt kê layout, component, page, service và hooks của frontend.
- Thêm `docs/DATABASE_DECISIONS.md` ghi rõ quyết định dùng MongoDB Atlas + Mongoose, không dùng Mongo local/migration SQL làm hướng chính.
- Thêm `design/wireframe/README.md` mô tả wireframe text cho các màn hình: đăng nhập, layout quản trị, phòng, khách thuê, hợp đồng, thanh toán và dashboard.
- Cập nhật README để gom các tài liệu phân tích nhanh cho nhóm dễ tìm.

## 2026-07-06

### Kiểm tra Git trước khi code

- Kiểm tra remote heads bằng `git ls-remote --heads origin`: remote có `main`,
  `dev`, `feature/auth`, `feature/docs`, `feature/rooms`, `feature/tenants`.
- Không phát hiện nhánh remote mới bị thiếu ở local.
- Xác nhận `dev` đang sau `main` ở 2 commit tài liệu; đã fast-forward `dev`
  theo `main` và push lại `origin/dev`.
- Tạo nhánh `feature/dashboard-stats` để triển khai dashboard thống kê.
- Các file phụ trợ chưa theo dõi vẫn giữ nguyên: `chuyen_de_2.xlsx`,
  `code.txt`, `docs/image/`.

### Dashboard thống kê thật

- Thêm `GET /api/dashboard/summary`, yêu cầu JWT.
- API tổng hợp số liệu phòng, khách thuê active, hợp đồng theo trạng thái và
  thanh toán trong tháng hiện tại từ MongoDB.
- Frontend thêm `dashboardService` và cập nhật `DashboardPage` để bỏ số liệu
  tĩnh, thay bằng số liệu từ API.
- Dashboard có loading state, error state và nút tải lại.
- Cập nhật `docs/API.md` và `docs/MODULES.md` cho Dashboard API.

### Sửa lỗi token hết hạn trên giao diện

- Sau khi Dashboard bắt đầu gọi API yêu cầu JWT, trình duyệt có thể hiển thị lỗi
  `Invalid or expired token` nếu local storage còn giữ token cũ hoặc token đã hết
  hạn.
- Cập nhật Axios response interceptor trong `frontend/src/services/api.js`:
  khi backend trả `401`, frontend tự xóa session cũ và chuyển người dùng về
  `/login`.
- Cách xử lý này áp dụng chung cho các API có đăng nhập, không chỉ riêng
  Dashboard.

## 2026-07-08

### Kiểm tra Git trước khi code

- Kiểm tra nhanh tất cả nhánh local/remote: chỉ có `feature/dashboard-stats` chưa nhập vào
  `main`.
- Chạy `npm run lint`: pass.
- Chạy `npm run format:check`: pass.
- Chạy `npm run build`: pass khi chạy ngoài sandbox Windows.
- Fast-forward `feature/dashboard-stats` vào `main`.
- Fast-forward `dev` theo `main`.
- Tạo nhánh `feature/contract-pdf-dashboard-details` để làm công việc hôm nay.
- Các file phụ trợ chưa đưa vào Git vẫn giữ nguyên: `chuyen_de_2.xlsx`, `code.txt`,
  `docs/image/`.

### PDF hợp đồng

- Thêm package `pdfkit` cho backend.
- Thêm API `GET /api/contracts/:id/pdf`, yêu cầu JWT.
- API lấy hợp đồng kèm phòng và khách thuê, sau đó sinh file PDF hợp đồng từ dữ liệu thật.
- Frontend trang `Hợp đồng` có nút `PDF` trên từng dòng để tải file hợp đồng.
- PDF hiện tại dùng font mặc định của PDFKit và nội dung ASCII để tránh lỗi font Unicode khi deploy.

### Dashboard mở rộng

- Mở rộng `GET /api/dashboard/summary` nhưng không phá response cũ.
- Bổ sung `revenue.currentMonth`, `revenue.previousMonth`, `revenue.previousMonthPaidCount`.
- Bổ sung `alerts.expiringContracts` cho hợp đồng active sắp hết hạn trong 30 ngày.
- Bổ sung `alerts.unpaidPayments` cho khoản thu `pending` hoặc `overdue` cần xử lý.
- Frontend dashboard hiển thị doanh thu tháng này/tháng trước, hợp đồng sắp hết hạn và khoản thu cần xử lý.

### Tài liệu

- Cập nhật `docs/API.md` cho endpoint PDF và response dashboard mới.
- Cập nhật `docs/MODULES.md` để phản ánh PDF hợp đồng và dashboard cảnh báo hành động.

### Kiểm tra cuối ngày

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass khi chạy ngoài sandbox Windows.
- Smoke test API local:
  - `POST /api/auth/login`: pass với tài khoản admin mẫu.
  - `GET /api/health`: pass.
  - `GET /api/dashboard/summary`: pass, trả dữ liệu phòng và alert dashboard.
  - `GET /api/contracts`: pass.
  - `GET /api/contracts/:id/pdf`: pass, trả `200 OK` và sinh file PDF hợp đồng.
- Dev server local đã chạy được:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5000`
- Ghi chú: build trong sandbox Windows vẫn có thể gặp lỗi `spawn EPERM` của Vite/esbuild;
  chạy ngoài sandbox thì build thành công.
