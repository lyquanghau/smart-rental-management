# Work Log

## 2026-08-14

### Doi ma SePay sang noi dung de nhap tay

- Chot format ma thanh toan SePay moi: `P{roomName}-HD-T{month}-{year}`.
  - Vi du phong `102`, hoa don thang `8/2026`: `P102-HD-T8-2026`.
- Muc tieu: khach thue co the tu nhap/copy noi dung chuyen khoan de hon so voi ma dai dang
  `SRINV...`, nhung backend van doi soat duoc dung hoa don.
- Backend:
  - `POST /api/invoices/:id/sepay-payment-code` sinh ma SePay moi theo phong + ky hoa don.
  - Webhook SePay tim ma moi trong `code` hoac `content`.
  - Van ho tro ma cu `SRINV...` de tuong thich voi hoa don da tao truoc do.
  - Neu hoa don chua thanh toan da co ma cu, khi lay lai ma SePay backend se doi sang format moi.
- Bo sung test unit cho tao ma SePay moi, normalize ten phong va parser webhook nhan ca ma moi/ma cu.
- Tai lieu cap nhat: `docs/API.md`, `docs/MODULES.md`, `docs/PAYMENT_TEST_GUIDE.md`,
  `docs/TEST_CHECKLIST.md`.

### Cai thien chuong thong bao admin

- Chinh nut thong bao tren header cua landlord de de nhin hon:
  - Them nhan `Thong bao` tren desktop.
  - Tang do noi cua nen, vien va badge so thong bao chua doc.
  - Popup thong bao rong hon, thong bao chua doc co cham trang thai va nen noi bat.
  - Moi thong bao hien them thoi gian tao de admin de scan.
- Tren mobile van giu nut icon gon de khong vo header.

### Bo sung thong bao tenant va mau phieu thu

- Cong khach thue:
  - Them khoi `Thong bao giao dich` de khach thay nhanh cac payment `paid`, `pending`, `overdue`.
  - Giao dich da thanh toan hien trong lich su thanh toan kem noi dung/reference thanh toan neu co.
  - QR thanh toan khong con hien lap lai trong tung dong hoa don; QR chi nam trong khoi huong dan
    thanh toan cho hoa don dang mo.
- Backend tenant portal tra them `paymentOrderId`, `paidReference`, `paidAt` cua invoice trong lich su
  payment de frontend hien ma giao dich/thanh toan.
- PDF hoa don doi sang mau `Phieu thu tien thue nha`:
  - Co thoi gian, dia chi/so phong, ho ten nguoi thue.
  - Co cac dong tien tro co ban, tien dien, tien nuoc va chi phi khac truoc tong tien.
  - Co tong tien bang so, bang chu, ma hoa don/noi dung chuyen khoan va khu vuc ky ten hai ben.

### Rà soát tiến độ đầu phiên

- Đang ở nhánh `main`, đồng bộ với `origin/main`.
- `dev`, `origin/dev`, `main`, `origin/main` đang cùng commit `54845ae`.
- Không có nhánh local/remote nào còn commit chưa merge vào `main`.
- File phụ trợ/untracked tiếp tục giữ ngoài commit: `chuyen_de_2.xlsx`, `code.txt`,
  `docs/PROMPT_TEMPLATE.md`, `docs/contract/`, `docs/image/`.
- Đối chiếu `chuyen_de_2.xlsx`: dự án đã vượt MVP ban đầu, hiện có auth, phòng, khách thuê,
  hợp đồng, PDF, hóa đơn dịch vụ, tenant portal, dashboard, SePay/VietQR, notification nội bộ,
  Discord webhook, multi-tenant isolation và hardening tài khoản tenant.
- Khoảng trống để thành sản phẩm dùng thật vẫn là SePay production thật, deploy/domain ổn định,
  backup/monitoring, legal/compliance và test E2E frontend.

### Làm lại thông báo xác nhận và toast

- Thêm `ConfirmProvider` dùng chung để thay popup mặc định `window.confirm` của trình duyệt.
- Bọc app bằng `ConfirmProvider` để các page có thể gọi confirm custom qua hook `useConfirm`.
- Nâng cấp `ToastProvider`:
  - Toast hiển thị ở góc trên bên phải.
  - Thời gian mặc định ban đầu là 3 giây.
  - Hỗ trợ nút hành động trong toast, dùng cho `Hoàn tác`.
  - Giữ nút đóng toast thủ công.
- Thay toàn bộ `window.confirm` trong frontend bằng confirm dialog nội bộ:
  - Xóa phòng.
  - Xóa khách thuê.
  - Cấp lại mật khẩu tenant.
  - Kết thúc hợp đồng.
  - Xác nhận đã thu khoản thu.
  - Hủy khoản thu.
  - Xác nhận đã thu hóa đơn.
  - Hủy hóa đơn.
- Thêm undo trì hoãn 3 giây cho các thao tác phá hủy/trạng thái hủy:
  - Xóa phòng.
  - Xóa khách thuê.
  - Kết thúc hợp đồng.
  - Hủy khoản thu.
  - Hủy hóa đơn.
- Cách làm hiện tại: UI cập nhật tạm ngay sau xác nhận, toast hiện nút `Hoàn tác`; nếu hết 3 giây
  mà không hoàn tác thì frontend mới gọi API. Hướng này phù hợp vì backend hiện chưa có endpoint
  restore soft-delete.

### Kiểm tra

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
- `npm run build` ngoài sandbox: pass, build 1672 modules.

### Điều chỉnh toast theo phản hồi

- Tăng thời gian toast mặc định từ 3 giây lên 5 giây.
- Thêm thanh tiến trình ở mép dưới toast để biểu thị thời gian tự đóng.
- Thanh tiến trình dùng màu theo loại toast: thành công, lỗi hoặc thông tin.

### Hiển thị và khôi phục bản ghi đã xóa

- Thêm luồng giữ lịch sử bản ghi đã xóa thay vì để khách/phòng/hợp đồng biến mất hoàn toàn khỏi UI.
- Backend:
  - `Room`, `Tenant`, `Contract` hỗ trợ list kèm bản ghi đã xóa qua `includeDeleted=true`.
  - Thêm `PATCH /rooms/:id/restore`, `PATCH /tenants/:id/restore`, `PATCH /contracts/:id/restore`.
  - Thêm `deletedAt` cho `Contract` để phân biệt `Đã xóa` với `Đã kết thúc`.
  - Tách `PATCH /contracts/:id/end` khỏi `DELETE /contracts/:id`.
  - Chặn xóa khách thuê nếu khách còn hợp đồng `active` chưa xóa.
  - Loại hợp đồng đã xóa khỏi dashboard, tạo hóa đơn, nhập chỉ số, tạo khoản thu và tenant portal.
- Frontend:
  - Trang `Phòng`, `Khách thuê`, `Hợp đồng` hiển thị bản ghi đã xóa với badge `Đã xóa`.
  - Bản ghi đã xóa bị làm mờ, không cho sửa/xóa tiếp, chỉ còn hành động `Khôi phục`.
  - Timeout undo của các thao tác xóa/hủy/kết thúc được đồng bộ lên 5 giây để khớp toast progress.

### Dieu chinh luong khach thue/hop dong sau phan hoi

- Trang `Khach thue` khong tron ban ghi da xoa vao bang chinh nua; them nut mo modal lich su
  khach da xoa va co hanh dong khoi phuc ngay trong modal.
- Bang khach thue hien theo nhom phong/hop dong active: moi dong gom phong, khach dai dien,
  nguoi o cung trong `Contract.occupants`, lien he, tai khoan va thao tac voi khach dai dien.
- Xoa hop dong chi soft delete hop dong va giu lai khach thue de tra cuu/tai ky.
- Them nut tao hop dong moi tu hop dong cu tren trang `Hop dong`, tu dien khach dai dien va
  danh sach nguoi o cung, de dung cho luong chuyen phong/tai ky.
- Khong cho doi phong khi sua hop dong da co; frontend khoa truong phong va backend tra loi `400`
  neu API update hop dong gui `room` khac hop dong hien tai.
- Phong to modal `Khach da xoa` de de doc danh sach lich su hon tren desktop/mobile.
- Doi wording cap lai mat khau thanh luong gui mat khau tam qua email, giu nguyen backend khong
  tra plaintext password ve frontend.
- Sau khi khoi phuc khach da xoa, frontend chuyen sang trang `Hop dong` va mo san form ky hop
  dong moi voi khach/phong cu da duoc dien neu con du lieu.

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

## 2026-07-15

### Tinh chỉnh danh sách Hợp đồng và Thanh toán

- Thêm lớp bảng compact riêng cho danh sách `Hợp đồng` và `Thanh toán`.
- Giảm chiều cao dòng, padding, cỡ chữ và kích thước nút thao tác trong bảng để màn hình gọn hơn.
- Giữ các nút thao tác trên một hàng, tránh làm bảng bị kéo cao không cần thiết.
- Bổ sung màu chữ, nền header, hover row và trạng thái dark mode để bảng dễ đọc khi chuyển giao diện tối.
- Thu gọn bộ lọc trang `Thanh toán`, gom cụm thêm khoản thu/lọc/tải lại trên cùng một hàng.
- Điều chỉnh dark mode cho popup form: nền form, label, input/select, option, focus state và field help dễ đọc hơn.
- Làm lại trang `Cài đặt`: chuyển theme/ngôn ngữ/tiền tệ từ select sang các nút chọn có trạng thái active.
- Tách preferences sang service dùng chung, áp dụng theme/ngôn ngữ khi app khởi động và lưu vào `localStorage`.
- Tiền tệ hiển thị có tác dụng ở dashboard, phòng, hợp đồng và thanh toán; hỗ trợ VND và USD theo tỷ giá tham khảo cố định.
- Sửa lại đúng yêu cầu chuyển ngôn ngữ động: mặc định dùng tiếng Việt, chọn `English` trong `Cài đặt` thì sidebar, header và các trang chính chuyển sang tiếng Anh.
- Thêm hook `usePreferences` để component tự cập nhật khi preference thay đổi, không cần reload trang.
- Bổ sung copy song ngữ cho Dashboard, Rooms, Tenants, Contracts, Payments, Settings, Login, Change Password và Help.
- Thiết kế logo Smart Rental theo hướng hiện đại, tối giản, biểu tượng nhà/phòng thông minh, tông sky blue/trắng.
- Thêm asset logo SVG và PNG gồm bản đầy đủ `icon + chữ` và bản icon-only; gắn icon logo vào sidebar và header.

### Kiểm tra đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- `dev`, `main`, `origin/dev`, `origin/main` cùng commit `571a821`.
- Không có nhánh local nào có commit chưa merge vào `main`; các nhánh feature cũ đều `ahead_main=0`.
- File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`, `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
- `npm run build`: pass khi chạy ngoài sandbox. Đây là lỗi môi trường/sandbox, không phải lỗi code.

### Phân tích layout mẫu

- Kiểm tra layout mẫu trong `docs/image/layout`.
- Chốt hướng áp dụng: giao diện admin sáng, tông sky/white, sidebar sáng, topbar có search/date/user, KPI card pastel, table/panel giống SaaS dashboard.
- Map layout mẫu sang Smart Rental:
  - `Hotels` -> `Rooms`.
  - `Travelers` -> `Tenants`.
  - `Tour Packages` -> `Contracts`.
  - `Payments` -> `Payments`.
  - `Dashboard/Reports` -> dashboard tổng quan và thống kê.

### Redesign giao diện

- Thêm `frontend/src/components/Modal.jsx` làm popup dùng chung cho form tạo/sửa/xem.
- Chuyển form nhập liệu của các trang `Rooms`, `Tenants`, `Contracts`, `Payments` sang popup modal.
- Riêng hợp đồng hỗ trợ cả tạo, sửa và xem trong modal để màn hình danh sách gọn hơn.
- Cập nhật `Header` theo mẫu dashboard: thêm ô tìm kiếm, chip ngày hiện tại và icon thông báo, vẫn giữ đổi mật khẩu/đăng xuất.
- Cập nhật `frontend/src/styles.css` theo theme sáng:
  - Sidebar nền trắng, active item dạng pill xanh nhạt.
  - Topbar, search, user chip, notification chip theo tông sky/white.
  - KPI/card/table/panel bo góc mềm, shadow nhẹ, màu pastel.
  - Modal overlay và modal panel responsive, form 2 cột trên desktop.

### Chỉnh header theo phản hồi

- Bỏ ô tìm kiếm khỏi header để tránh chiếm chiều ngang.
- Bỏ chip lịch/ngày và link đổi mật khẩu khỏi header.
- Tên tài khoản chỉ hiển thị một dòng chữ gọn.
- Icon chuông thông báo chỉ hiển thị ở trang `Tổng quan` và nằm ngang hàng với nút đăng xuất.
- Cập nhật CSS topbar về bố cục 2 cột: tiêu đề bên trái, tài khoản/thao tác bên phải.

### Bổ sung sidebar và cài đặt

- Chỉnh menu trái: chữ đậm hơn, màu đen; item đang chọn chuyển nền xanh sky và chữ đen.
- Thêm mục `Cài đặt` vào sidebar.
- Thêm footer dưới thanh menu: copyright và `Design by Quang Hậu`.
- Thêm trang `frontend/src/pages/SettingsPage.jsx` tại route `/settings`.
- Trang cài đặt hiển thị thông tin tài khoản và lựa chọn:
  - Tông giao diện sáng/tối.
  - Ngôn ngữ.
  - Tiền tệ.
- Lưu lựa chọn cài đặt vào `localStorage`; theme sáng/tối áp dụng ngay qua `data-theme`.

### Compact giao diện

- Giảm kích thước tổng thể để hạn chế phải cuộn: sidebar, topbar, heading, card, table, button, input, modal và khoảng cách grid.
- Thu nhỏ dashboard hero, KPI card, panel thống kê, bảng dữ liệu và room card.
- Giảm chiều rộng sidebar từ 280px xuống 240px trên desktop, 210px trên tablet.
- Giảm modal form xuống max-width 820px và padding nhỏ hơn.
- Chỉnh dashboard hero để khối `Cần xử lý` và nút `Tải lại dữ liệu` nằm ngang hàng.
- Giữ footer sidebar luôn hiện trong viewport desktop, không cần cuộn xuống mới thấy copyright/design.

### Sắp xếp lại cụm cuối sidebar

- Chuyển tên tài khoản xuống cuối sidebar và biến thành nút đăng xuất.
- Dời `Cài đặt` xuống cụm dưới, nằm phía trên nút tài khoản/đăng xuất.
- Thêm mục `Help & Support` phía trên `Cài đặt`.
- Bỏ cụm tài khoản/đăng xuất khỏi header để tránh trùng thao tác.
- Thêm trang `frontend/src/pages/HelpSupportPage.jsx` và route `/help`.

### Tối ưu trang Phòng

- Gom bộ lọc trạng thái, nút `Thêm phòng` và `Tải lại` vào cùng một hàng.
- Thu nhỏ bộ lọc trạng thái để chỉ vừa đủ hiển thị nội dung.
- Bỏ panel chi tiết phòng cố định bên phải để danh sách phòng dùng toàn bộ chiều ngang.
- Chuyển chi tiết phòng sang popup modal.
- Popup chi tiết phòng có khối thông tin chính, thống kê giá thuê/khách hiện tại, danh sách khách thuê và nút `Sửa`, `Xóa` ở cuối.
- Redesign card phòng: header rõ hơn, giá thuê nổi bật, thông tin tầng/sức chứa thành chip nhỏ và 3 nút thao tác chia đều trên một hàng.

### Kiểm tra sau khi code

- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: vẫn lỗi `spawn EPERM` khi chạy trong sandbox Windows.
- `npm run build`: pass khi chạy ngoài sandbox.

## 2026-07-17

### Đánh giá đầu phiên

- Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
- `dev`, `main`, `origin/dev`, `origin/main` cùng commit `67229bc`.
- Kiểm tra `git branch --no-merged main --all`: không có nhánh local/remote nào còn commit chưa merge vào `main`.
- File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`, `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- `npm run lint`: pass.
- `npm run format:check`: pass.
- `npm run build`: lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
- `npm run build`: pass khi chạy ngoài sandbox. Đây là lỗi môi trường/sandbox, không phải lỗi code.

### Đối chiếu tiến độ

- Đối chiếu `chuyen_de_2.xlsx`, `docs/WORK_LOG.md`, tài liệu trong `docs` và code hiện tại.
- Dự án đang bám đúng MVP Smart Rental: Auth JWT, Rooms, Tenants, Contracts, Payments và Dashboard đã có backend + frontend.
- Tiến độ phù hợp giai đoạn cuối Tuần 4 và chuẩn bị Tuần 5: polish UI, kiểm thử, deploy production, báo cáo, slide và demo.
- Các khoảng trống còn lại: VNPay/MoMo sandbox thật, deploy production đã xác nhận, test case chính thức/Postman checklist, toast/alert UX và tài liệu demo/báo cáo Tuần 5.

### Animation chuyển trang và dashboard

- Thêm `useLocation` trong `frontend/src/layouts/MainLayout.jsx` để nội dung chính remount theo `pathname`, giúp animation chạy lại khi chuyển trang.
- Thêm class `route-transition` cho vùng `main.content`.
- Cập nhật `frontend/src/styles.css`:
  - Sidebar trượt từ trái sang khi mở app.
  - Header trượt từ trên xuống.
  - Nội dung chính trượt từ dưới lên và fade in khi mở/chuyển trang.
  - Card, panel, room grid, table/form area xuất hiện theo stagger nhẹ.
  - Revenue bar trên dashboard grow từ đáy lên và transition khi chiều cao thay đổi.
  - Bổ sung `prefers-reduced-motion: reduce` để tắt animation cho người dùng không muốn motion.
- Giữ nguyên stack CSS thuần, không thêm thư viện animation để phù hợp MVP và kiến trúc hiện tại.
- Điều chỉnh motion theo phản hồi: tăng thời lượng sidebar/header/content, tăng stagger delay cho card/panel và làm revenue bar grow chậm hơn để hiệu ứng nhẹ nhàng nhưng dễ thấy hơn.
- Sửa hiện tượng reload/chuyển trang có thể giữ lại vị trí cuộn cũ bằng cách reset scroll về đầu trang trong `MainLayout` khi `pathname` thay đổi.
- Điều chỉnh header motion: animate phần `.topbar-brand` thay vì toàn bộ `.topbar` để header vẫn giữ chỗ trong layout và không trượt đè lên hero khi reload.
- Bỏ `position: sticky` khỏi `.topbar` theo yêu cầu để header chỉ nằm ở đầu layout, không đi theo màn hình khi cuộn trang.

### Tinh chỉnh sidebar, scrollbar và nhận diện

- Làm đẹp scrollbar theo tông xanh/trắng của giao diện, có cấu hình màu riêng cho dark mode.
- Bỏ logo khỏi header để giảm trùng nhận diện với sidebar.
- Tăng kích thước logo sidebar, sau đó tinh chỉnh lại để chữ `Smart Rental` hiển thị đầy đủ trong trạng thái mở.
- Bỏ dòng phụ `Quản lý nhà trọ` dưới brand để header sidebar gọn hơn.
- Làm sidebar nền xanh nhạt phẳng, bỏ gradient, shadow/glow và các lớp mờ không cần thiết quanh menu item.
- Điều chỉnh màu sidebar và active item về sắc xanh rõ hơn, phù hợp với màu chủ đạo của web.
- Thêm cơ chế thu gọn sidebar:
  - Trạng thái mở có nút mũi tên riêng cạnh brand để thu gọn.
  - Trạng thái thu gọn chỉ hiển thị icon/logo, menu chỉ còn icon.
  - Hover logo khi sidebar thu gọn đổi sang mũi tên mở sidebar.
  - Lưu trạng thái sidebar vào `localStorage` để reload vẫn giữ mở/thu gọn.
- Dùng Google Material Symbols Outlined cho icon mũi tên:
  - `arrow_back` khi sidebar đang mở.
  - `arrow_forward` khi sidebar đang thu gọn.
- Tooltip/ARIA của nút sidebar dùng tiếng Việt có dấu: `Thu gọn thanh bên`, `Mở thanh bên`.
- Đồng bộ vùng hover của nút/biểu tượng sidebar thành ô vuông bo góc, nền trắng đục nhẹ và căn mũi tên ở giữa.
- Sau khi đối chiếu ảnh trong `docs/image/buttton`, giảm kích thước icon mũi tên để không bị to so với logo và menu.

## 2026-07-19

### Module điện, nước, dịch vụ và hóa đơn

- Chọn hướng hoàn chỉnh hơn MVP cũ: tách `Invoice` khỏi `Payment`.
  - `Invoice`: hóa đơn phải thu theo tháng, gồm tiền phòng và dịch vụ.
  - `Payment`: bản ghi thu tiền/giao dịch, có thể liên kết với một hóa đơn.
- Thêm backend model:
  - `ServiceSetting`: đơn giá điện, nước, internet, rác, gửi xe.
  - `UtilityReading`: chỉ số điện/nước và phí dịch vụ theo phòng/hợp đồng/tháng.
  - `Invoice`: hóa đơn tháng có breakdown từng dòng chi phí.
- Thêm API:
  - `GET/PUT /api/service-settings`.
  - `GET/POST/PUT/DELETE /api/utility-readings`.
  - `GET /api/invoices`, `GET /api/invoices/:id`.
  - `POST /api/invoices/generate-monthly`.
  - `PATCH /api/invoices/:id/mark-paid`, `PATCH /api/invoices/:id/cancel`.
- Cập nhật `Payment` để có thể tham chiếu `invoice`.
- Khi tạo hóa đơn tháng, backend sinh khoản thu tương ứng ở `Payment` để trang
  Thanh toán hiện tại vẫn dùng được.
- Khi đánh dấu khoản thu đã thu hoặc hủy khoản thu có liên kết hóa đơn, backend
  đồng bộ trạng thái hóa đơn tương ứng.
- Cập nhật dashboard để công nợ/doanh thu tháng lấy từ hóa đơn.
- Thêm frontend:
  - Service gọi API mới: `invoiceService`, `serviceSettingService`,
    `utilityReadingService`.
  - Trang `/services` để cấu hình đơn giá, nhập chỉ số điện/nước, tạo hóa đơn
    tháng và xem tổng hợp hóa đơn.
  - Menu `Dịch vụ` trong sidebar.
  - Trang `Thanh toán` hiển thị breakdown tiền phòng/dịch vụ nếu khoản thu sinh
    từ hóa đơn.
- Cập nhật seed script để có dữ liệu demo dịch vụ/hóa đơn khi nhóm chủ động chạy
  seed/reset.
- Cập nhật `docs/API.md`, `docs/MODULES.md`, `docs/COMPONENT_LIST.md`,
  `docs/TEST_CHECKLIST.md` và `docs/USER_FLOW.md`.
- Sửa CORS local dev để backend cho phép cả `http://localhost:5173` và
  `http://127.0.0.1:5173`, tránh lỗi frontend báo không kết nối được server khi
  mở app bằng địa chỉ loopback khác.
- Redesign trang `Dịch vụ`:
  - Thêm nhóm card tổng quan cho hợp đồng active, chỉ số đã nhập, hóa đơn và tổng
    giá trị hóa đơn.
  - Chia workspace thành panel đơn giá và panel nhập chỉ số rõ ràng hơn.
  - Làm bảng chỉ số/hóa đơn đồng bộ với phong cách dashboard/admin hiện tại.
- Sửa sidebar desktop không còn trôi theo nội dung khi cuộn trang bằng cách đưa
  sidebar về `position: sticky`, cao bằng viewport và chỉ cuộn nội bộ khi cần.
- Redesign file PDF hợp đồng:
  - Thêm header thương hiệu, mã hợp đồng ngắn và ngày lập.
  - Bố cục thành các khối giống hợp đồng thật: bên cho thuê, bên thuê, thông tin
    phòng, thời hạn/giá trị hợp đồng, điều khoản chính và chữ ký hai bên.
  - Dùng màu xanh nhẹ, đường kẻ, card thông tin và footer để PDF dễ đọc hơn.
- Đổi luồng xem hợp đồng trên frontend:
  - Nút `Xem` trong danh sách hợp đồng mở modal preview file PDF.
  - Trong modal PDF có nút `Tải PDF`.
  - Bỏ luồng tải PDF trực tiếp từ bảng để người dùng xem trước trước khi tải.
- Sửa lỗi preview PDF bị che phần trên:
  - Modal hỗ trợ class riêng cho panel PDF.
  - Ẩn toolbar PDF mặc định của trình duyệt trong iframe bằng fragment URL.
  - Tăng kích thước modal PDF, giữ header/nút tải riêng phía trên và tránh iframe
    đè lên vùng điều khiển của app.
  - Tăng vùng letterhead/safe area ở đầu trang PDF để nếu trình duyệt vẫn hiện
    toolbar PDF nội bộ thì tiêu đề hợp đồng không bị che.
  - Bọc iframe PDF trong viewport riêng, crop vùng toolbar/viền trên của PDF
    viewer và kéo iframe lên để chỉ còn phần trang hợp đồng hiển thị.

## 2026-07-20

### Chuẩn hóa UX thông báo và responsive

- Kiểm tra đầu phiên:
  - Đang ở nhánh `dev`, đồng bộ với `origin/dev`.
  - `dev`, `main`, `origin/dev`, `origin/main` cùng commit `14779a7`.
  - Không có nhánh local/remote nào còn commit chưa merge vào `main`.
  - File untracked giữ nguyên, chưa đưa vào Git: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: lỗi `spawn EPERM` trong sandbox Windows của Vite/esbuild.
  - `npm run build`: pass khi chạy ngoài sandbox. Đây là lỗi môi trường/sandbox,
    không phải lỗi code.
- Thêm `ToastProvider` dùng chung ở frontend:
  - Bọc app bằng provider trong `frontend/src/App.jsx`.
  - Thêm hook `useToast` để gọi `showSuccess` và `showError`.
  - Toast có trạng thái `success`, `error`, `info`, tự đóng sau vài giây và có nút đóng thủ công.
  - Style toast hỗ trợ light/dark mode và responsive mobile.
- Gắn toast vào các luồng chính:
  - `RoomsPage`: lưu/xóa phòng và lỗi API.
  - `TenantsPage`: lưu/xóa khách thuê và lỗi API.
  - `ContractsPage`: lưu/kết thúc hợp đồng, xem/tải PDF và lỗi API.
  - `PaymentsPage`: lưu khoản thu, đánh dấu đã thu, hủy khoản thu và lỗi API.
  - `ServicesPage`: lưu đơn giá, lưu chỉ số điện/nước, tạo hóa đơn tháng và lỗi API.
- Sửa responsive nhỏ trong `frontend/src/styles.css`:
  - Page heading/action tự xếp dọc dưới `860px`.
  - Nút, select và filter trong cụm action chiếm full width khi màn hình hẹp.
  - Action trong bảng/modal/card tự wrap dưới `560px`, tránh tràn ngang nút thao tác.
  - PDF preview toolbar và viewport co lại trên mobile.
  - Toast chuyển sang full-width ở đáy màn hình trên mobile.
- Ghi chú QA:
  - Browser tool nội bộ bị lỗi kết nối sandbox nên chưa chụp được screenshot kiểm chứng trực quan.
  - Dev server Vite là process chạy liên tục; lệnh foreground đã được dừng theo yêu cầu người dùng.
  - Phần responsive đã được kiểm tra bằng build và rà CSS breakpoint, cần mở app thủ công để xác nhận trực quan cuối cùng.

## 2026-07-22

### Product hardening: tenant login support

- Kiem tra dau phien:
  - Dang o nhanh `dev`, dong bo voi `origin/dev`.
  - `dev`, `main`, `origin/dev`, `origin/main` cung commit `14779a7`.
  - Khong co nhanh local/remote nao con commit chua merge vao `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1665 modules.
- Chuyen trong tam ngay lam viec tu chuan bi tuan 5 sang huong san pham dung thuc te cho chu tro.
- Bo sung luong van hanh tai khoan khach thue:
  - Backend `GET /api/tenants` va `GET /api/tenants/:id` populate them `user` de frontend biet trang thai tai khoan dang nhap.
  - Frontend them `unlockUser` trong `authService`.
  - Trang `Khach thue` hien thi cot `Tai khoan`: chua co tai khoan, dang hoat dong, dang bi khoa, hoac dang dung mat khau tam.
  - Chu tro co the cap lai/mo khoa tai khoan khach thue bang nut `Cap lai mat khau`.
  - Sau khi cap lai, giao dien hien username/email/mat khau tam/han doi mat khau trong panel rieng. Mat khau tam chi hien thi mot lan theo response API.
- Cap nhat `docs/API.md` de response Tenants the hien them truong `user`.
- Tiep tuc phat trien theo huong san pham dung thuc te:
  - Them backend `GET /api/tenant-portal/summary` cho role `tenant`.
  - Endpoint portal chi tra ho so tenant dang dang nhap, phong dang o, hop dong, hoa don, lich su thanh toan va tong cong no lien quan.
  - Them frontend service `tenantPortalService` va trang `TenantPortalPage`.
  - Route `/` tu dong dua tenant ve `/tenant-portal`, chu tro van vao dashboard quan tri.
  - Sidebar theo role: tenant chi thay cong khach thue, tro giup va cai dat; landlord van thay menu quan tri.
  - Siết quyen doc API: `contracts`, `payments`, `invoices`, `tenants` loc theo tenant khi role la `tenant`; `rooms`, `dashboard`, `service-settings`, `utility-readings` yeu cau role `landlord`.
- Ghi chu tiep tuc cho ngay mai:
  - Voi tenant moi duoc tao khi lap hop dong, username thuong la so dien thoai khach thue.
  - Mat khau tam chi hien thi mot lan sau khi tao hop dong hoac khi chu tro bam `Cap lai mat khau` o trang `Khach thue`.
  - Khi test demo that, can ghi lai username/mat khau tam ngay luc he thong hien panel credential.

## 2026-07-27

### Product readiness va hardening de demo/ban thu

- Kiem tra dau phien:
  - Dang o nhanh `dev`, dong bo voi `origin/dev`.
  - `dev`, `main`, `origin/dev`, `origin/main` cung commit `58c1e97`.
  - Khong co nhanh local/remote nao con commit chua merge vao `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1667 modules.
- Tao nhanh `feature/product-readiness` tu `dev` de lam viec, khong sua truc tiep tren `main/dev`.
- Dinh huong san pham:
  - MVP hien tai da du luong cot loi cho chu tro nho: phong, khach thue, hop dong, PDF,
    hoa don dich vu, thanh toan thu cong/mock, dashboard va cong khach thue.
  - De ban thu, uu tien on dinh deploy, bao mat cau hinh, phan quyen va demo flow thay vi them
    cong thanh toan that khi chua co credential sandbox.
- Hardening backend:
  - Them `ALLOW_PUBLIC_REGISTRATION`.
  - Mac dinh moi truong production tat dang ky cong khai neu khong bat ro bang env.
  - Khong cho dang ky cong khai voi role `tenant`; tai khoan khach thue tiep tuc duoc tao qua
    luong tao hop dong active.
  - `validateEnv` chan production neu `JWT_SECRET` yeu/van la mac dinh, `MONGODB_URI` con
    placeholder, hoac `CLIENT_URLS` dung wildcard `*`.
- Hardening frontend:
  - Them client-side role guard: tenant chi vao `/tenant-portal`, landlord moi vao cac trang
    quan tri nhu phong, khach thue, hop dong, thanh toan va dich vu.
  - Frontend API ho tro ca `VITE_API_BASE_URL` va `VITE_API_URL`, uu tien `VITE_API_BASE_URL`
    de khop checklist deploy Vercel.
- Multi-tenant data isolation:
  - Them truong `owner` cho cac model nghiep vu: `Room`, `Tenant`, `Contract`, `Payment`,
    `Invoice`, `UtilityReading`, `ServiceSetting`.
  - Cac API landlord tu dong gan `owner = req.user._id` khi tao du lieu.
  - Cac API landlord loc `owner = req.user._id` khi xem/sua/xoa, tranh chu tro nay doan ID
    de doc du lieu chu tro khac.
  - Dashboard, cau hinh dich vu, tao hoa don thang va seed data deu tach theo owner.
  - Tai khoan khach thue sinh tu hop dong dung username/email ky thuat co ma tenant de tranh
    trung giua nhieu chu tro co khach thue cung so dien thoai/email.
  - API cap lai mat khau tenant chi cho phep chu tro cap lai cho tenant thuoc owner cua minh.
- Tai lieu:
  - Cap nhat `backend/.env.example` va `frontend/.env.example`.
  - Cap nhat `docs/API.md`, `docs/MODULES.md`, `docs/SETUP.md`,
    `docs/DEPLOYMENT_CHECKLIST.md`.
  - Them `docs/PRODUCT_READINESS.md` de phan biet trang thai MVP ban thu va cac viec can lam
    truoc khi ban thuong mai day du.
- Kiem tra cuoi phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `git diff --check`: pass.
  - `npm run build`: van loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1667 modules.
  - Smoke check `validateEnv` voi cau hinh production hop le: pass.
  - Smoke check import backend app: pass.

## 2026-07-28

### Product test readiness va demo script

- Kiem tra dau phien:
  - Dang o nhanh `dev`, dong bo voi `origin/dev`.
  - `dev`, `main`, `origin/dev`, `origin/main` cung commit `f1a51f30`.
  - Khong co nhanh local/remote nao con commit chua merge vao `main`.
  - File phu tro/untracked giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1667 modules.
- Tao nhanh `feature/product-test-readiness` tu `dev`.
- Doi chieu tien do voi `chuyen_de_2.xlsx`, `docs/WORK_LOG.md`, `docs/PRODUCT_READINESS.md`
  va code hien tai:
  - MVP cot loi da vuot ke hoach ban dau: auth, phong, khach thue, hop dong, PDF,
    hoa don dich vu, thanh toan manual/mock, dashboard, cong khach thue va data isolation theo owner.
  - Cac khoang trong lon con lai de thanh san pham thuong mai day du: deploy production da xac nhan,
    VNPay/MoMo sandbox that, test API end-to-end, backup/monitoring va tai lieu phap ly.
- Them test backend native bang `node:test`, khong them framework moi:
  - `backend/tests/model-validation.test.js`: kiem tra owner bat buoc cho model nghiep vu,
    validate gia tri am, enum trang thai, ky hoa don va login identifier.
  - `backend/tests/env.test.js`: kiem tra guard production cho `JWT_SECRET`, `MONGODB_URI`,
    `CLIENT_URLS` va `ALLOW_PUBLIC_REGISTRATION`.
  - `backend/tests/middleware-utils.test.js`: kiem tra `ownerFilter`, `createHttpError` va
    `validateBody`.
  - `backend/tests/api-flows.integration.test.js`: integration test co guard an toan, mac dinh skip,
    chi chay khi bat `SMART_RENTAL_RUN_INTEGRATION_TESTS=true` va `MONGODB_URI` tro toi database co ten
    chua `test`. Luong test gom login, owner isolation, chan hop dong active trung phong, tao hoa don
    thang khong trung va mark-paid dong bo payment.
  - Them script `npm run test` o root va backend workspace.
- Them `docs/DEMO_SCRIPT.md` cho kich ban demo 5-7 phut, dieu kien truoc demo, diem can noi ro khi
  bao ve va loi demo thuong gap.
- Cap nhat `README.md`, `docs/TEST_CHECKLIST.md`, `docs/PRODUCT_READINESS.md`.
- Kiem tra trong qua trinh lam:
  - `npm run test`: bi sandbox Windows chan spawn voi loi `EPERM`.
  - `npm run test` ngoai sandbox: pass 15/15.
  - Integration test mac dinh skip neu chua bat bien moi truong va database test rieng.

## 2026-07-29

### Production pilot readiness: thao tac hoa don

- Kiem tra dau phien:
  - Bat dau o nhanh `feature/product-test-readiness`, sau do fast-forward vao `main`.
  - Dong bo `dev` local theo `main` va tao nhanh `feature/production-pilot-readiness`.
  - Sau merge, `main` va `dev` local cung commit `7dad35b`; remote `origin/main` va `origin/dev`
    van sau local 1 commit vi chua push.
  - Khong con nhanh local/remote nao co commit chua merge vao `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- Kiem tra bat buoc dau phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1667 modules.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner.
  - `npm run test` ngoai sandbox: pass 15 test, skip 1 integration test do chua bat database test rieng.
- Doi chieu tien do:
  - Core MVP da vuot ke hoach ban dau: auth, phong, khach thue, hop dong, PDF, dich vu, hoa don,
    thanh toan manual/mock, dashboard, tenant portal va owner data isolation.
  - Khoang trong lon de thanh san pham thuong mai day du van la deploy production, thanh toan
    VNPay/MoMo sandbox that, backup/monitoring, legal docs va frontend E2E test.
- Chon huong hom nay:
  - Uu tien gia tri su dung that cho chu tro nho thay vi them payment gateway khi chua co credential.
  - Khong them stack moi; tiep tuc dung React state, Modal co san, lucide icon va API invoice hien co.
- Implement:
  - Trang `Dich vu` co the xem chi tiet hoa don bang modal.
  - Modal hien room/tenant, ky hoa don, han thanh toan, trang thai va breakdown tung dong chi phi.
  - Chu tro co the danh dau hoa don da thu hoac huy hoa don ngay tai trang `Dich vu`.
  - Cac hanh dong dung API co san `PATCH /api/invoices/:id/mark-paid` va
    `PATCH /api/invoices/:id/cancel`, backend tiep tuc dong bo payment lien quan.
  - Them CSS responsive cho modal chi tiet hoa don va bang breakdown.
- Tai lieu:
  - Cap nhat `docs/MODULES.md`.
  - Cap nhat `docs/TEST_CHECKLIST.md`.
- Ghi chu test toi nay:
  - Mo `http://localhost:5173`, dang nhap landlord va test lai flow `Dich vu`:
    xem chi tiet hoa don, danh dau da thu, huy hoa don.
  - Kiem tra trang `Thanh toan` sau moi thao tac de xac nhan payment lien quan da dong bo
    sang `paid` hoac `cancelled`.
  - Quay lai `Dashboard` de kiem tra doanh thu/cong no cap nhat theo trang thai moi.

## 2026-08-02

### Production value hardening: huong dan chuyen khoan manual

- Kiem tra dau phien:
  - Bat dau o nhanh `dev`, sau do tao nhanh `feature/production-value-hardening`.
  - `dev`, `main`, `origin/dev`, `origin/main` cung commit `ca7542c`.
  - Khong co nhanh local/remote nao co commit ahead so voi `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- Kiem tra bat buoc dau phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner.
  - `npm run test` ngoai sandbox: pass 15 test, skip 1 integration test do chua bat database test rieng.
- Doi chieu tien do:
  - MVP da vuot ke hoach goc: auth, phong, khach thue, hop dong, PDF, dich vu, hoa don,
    thanh toan manual/mock, dashboard, tenant portal va owner data isolation.
  - Khoang trong lon de ban that van la deploy production, payment gateway that, backup/monitoring,
    legal docs va frontend E2E test.
- Chon huong hom nay:
  - Uu tien thu tien that bang chuyen khoan/manual truoc khi co credential VNPay/MoMo.
  - Khong them stack moi; tan dung `ServiceSetting`, React state hien co va tenant portal hien co.
- Implement:
  - Mo rong `ServiceSetting` voi thong tin ngan hang, so tai khoan, chu tai khoan,
    mau noi dung chuyen khoan va ghi chu thanh toan.
  - Trang `Dich vu` cho chu tro cau hinh cac thong tin chuyen khoan cung voi don gia dich vu.
  - `GET /api/tenant-portal/summary` tra them `paymentInstructions` lay theo owner cua hop dong tenant.
  - Cong khach thue hien thi huong dan chuyen khoan, hoa don dang mo va nut copy noi dung chuyen khoan.
  - Seed data co san thong tin ngan hang demo de nhom test nhanh.
- Tai lieu:
  - Cap nhat `docs/API.md`, `docs/MODULES.md`, `docs/PRODUCT_READINESS.md`,
    `docs/TEST_CHECKLIST.md`.
- Bo sung theo yeu cau tiep theo:
  - Them API `GET /api/invoices/:id/pdf` de xuat PDF hoa don cho landlord/tenant dung quyen.
  - PDF hoa don gom thong tin phong, khach thue, ky hoa don, breakdown chi phi, tong tien
    va thong tin chuyen khoan neu chu tro da cau hinh.
  - Trang `Dich vu` co nut tai PDF hoa don tu bang va modal chi tiet.
  - Cong khach thue co nut tai PDF hoa don trong danh sach hoa don.
  - Dashboard co them `alerts.paymentReminders.overdue` va `alerts.paymentReminders.dueSoon`
    de nhac hoa don qua han/den han trong 7 ngay.
  - Them `docs/BACKUP_RESTORE.md` cho quy trinh backup/restore MongoDB an toan.
  - Note backlog toi nay: quan ly toa nha/khu tro, QR chuyen khoan VietQR, deploy production
    va domain that.
- Kiem tra cuoi phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `git diff --check`: pass.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows.
  - `npm run test` ngoai sandbox: pass 15 test, skip 1 integration test do chua bat database test rieng.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows.
  - `npm run build` ngoai sandbox: pass, build 1667 modules.
  - Thu khoi dong dev server tu dong bang `Start-Process` bi loi moi truong `Path/PATH` trung key;
    khong de lai process nen chay treo. Neu can test UI, chay thu cong `npm run dev`.

## 2026-08-03

### MoMo-ready auto payment va thong bao chu tro

- Kiem tra dau phien:
  - Bat dau o nhanh `feature/production-value-hardening`, sau do merge fast-forward vao `main`.
  - `main` local hien ahead `origin/main` 1 commit vi chua push.
  - Tao nhanh `feature/momo-auto-payment-notifications` tu `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- Kiem tra bat buoc dau phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass.
- Dinh huong:
  - MoMo co the dap ung yeu cau tu dong: sau khi khach thanh toan, MoMo gui IPN ve backend.
  - Do chua chac lay duoc credential merchant/sandbox, implement theo huong MoMo-ready kem mock mode
    de demo luong auto-paid va notification ngay trong moi truong dev.
- Implement:
  - Them cau hinh `MOMO_*` va `MOMO_MOCK_MODE` trong backend env.
  - Mo rong `Invoice` va `Payment` de luu order/request/link/reference cua payment gateway.
  - Them `POST /api/invoices/:id/momo-payment-link` de tao phien thanh toan MoMo.
  - Them `POST /api/webhooks/momo` de nhan IPN, verify HMAC khi dung MoMo that.
  - Them `POST /api/invoices/:id/momo-mock-success` de gia lap IPN thanh cong trong dev/demo.
  - Request tao giao dich MoMo that gui du `partnerCode`, `accessKey`, `requestId`,
    `orderId`, `amount`, `redirectUrl`, `ipnUrl`, `requestType=captureWallet` va HMAC signature.
  - Tenant portal xu ly redirect tu MoMo qua query `resultCode`/`orderId` va reload lai du lieu;
    trang thai cuoi van lay tu IPN server-to-server.
  - Production validate se chan deploy neu `MOMO_MOCK_MODE=false` nhung thieu MoMo credential/URL.
  - Them `Notification` model va API `GET /api/notifications`,
    `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
  - Header landlord hien badge thong bao chua doc va dropdown thong bao gan day.
  - Cong khach thue co nut `Thanh toan MoMo` va nut `Gia lap da thanh toan` khi mock mode.
- Ghi chu tam dung:
  - Nguoi dung hien chi co tai khoan MoMo ca nhan, khong thay khu vuc lay `Partner Code`,
    `Access Key`, `Secret Key`.
  - MoMo that can tai khoan MoMo for Business/merchant va credential sandbox/production;
    tai khoan ca nhan khong du de tich hop IPN thanh toan that.
  - Tam thoi giu `MOMO_MOCK_MODE=true` de demo luong auto-paid va notification.
  - Buoi toi tiep tuc khi co them thong tin ve kha nang tao MoMo for Business, hoac chuyen sang
    phuong an VietQR manual/mock webhook neu khong lay duoc merchant credential.
- Tai lieu:
  - Cap nhat `docs/API.md`, `docs/MODULES.md`, `docs/TEST_CHECKLIST.md`.

## 2026-08-05

### SePay bank webhook cho thanh toan that

- Kiem tra dau phien:
  - Dang o nhanh `feature/momo-auto-payment-notifications`.
  - `main` local ahead `origin/main` 1 commit; `dev`/`origin/dev` dang sau `main` 1 commit.
  - `git branch --no-merged main` khong tra ve nhanh nao.
  - Working tree co nhieu thay doi chua commit cua luong MoMo/notification; tiep tuc lam tren nhanh hien tai,
    khong chuyen nhanh de tranh de viec dang do.
  - File phu tro/untracked tiep tuc giu ngoai commit neu chua duoc yeu cau:
    `chuyen_de_2.xlsx`, `code.txt`, `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
- Kiem tra bat buoc dau phien:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass.
- Dinh huong:
  - Uu tien SePay cho san pham dung that vi phu hop luong chu tro nhan tien qua ngan hang/VietQR.
  - SePay webhook can public URL, production nen dung HMAC-SHA256, doi soat theo ma thanh toan va so tien.
  - MoMo giu lai o muc MoMo-ready/mock vi can merchant credential rieng.
- Implement:
  - Them cau hinh `SEPAY_*` trong backend env va production guard.
  - Luu raw request body trong Express de verify HMAC webhook dung chuan.
  - Mo rong enum `Invoice.paymentProvider`, `Payment.provider`, `Payment.method` de ho tro `sepay`.
  - Them `POST /api/invoices/:id/sepay-payment-code` tao ma thanh toan dang `SRINV...`.
  - Them `POST /api/webhooks/sepay` nhan giao dich ngan hang tu SePay, verify HMAC/API key,
    loc tien vao, tim ma `SRINV...`, kiem tra so tien khop hoa don va cap nhat invoice/payment.
  - Them `POST /api/invoices/:id/sepay-mock-success` de demo luong auto-paid khi chua co SePay that.
  - Tenant portal doi CTA chinh sang `Lay ma SePay`, hien ma thanh toan va copy noi dung chuyen khoan.
  - Cap nhat docs API, module va checklist test cho SePay.
- Huong dan lay key SePay:
  - Tao/dang nhap SePay, lien ket tai khoan ngan hang.
  - Vao Webhooks -> Add webhook, chon Money in, endpoint `/api/webhooks/sepay`.
  - Chon HMAC-SHA256 va copy Secret Key ngay luc tao vao `SEPAY_WEBHOOK_SECRET`.
  - Dat `SEPAY_MOCK_MODE=false`, `SEPAY_AUTH_MODE=hmac` khi test that tren public HTTPS.
- Trang thai SePay hien tai:
  - Backend Render da co URL public du kien cho IPN:
    `https://smart-rental-management-r1eu.onrender.com/api/webhooks/sepay`.
  - Tai khoan/ket noi SePay dang cho duyet, chua co Secret Key webhook that.
  - Trong thoi gian cho duyet, giu `SEPAY_MOCK_MODE=true` hoac tiep tuc thu tien bang chuyen khoan
    thu cong; chua bat `SEPAY_MOCK_MODE=false` tren production neu chua co `SEPAY_WEBHOOK_SECRET`.
  - Sau khi SePay duyet, can tao webhook Money in + HMAC-SHA256, copy Secret Key vao Render env,
    redeploy backend va test mot giao dich nho dung ma `SRINV...`.

## 2026-08-11

### Kiem tra cau hinh SePay production env

- Kiem tra sau khi cau hinh SePay env:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild; chay ngoai sandbox pass.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner; chay ngoai sandbox ban dau fail 1 test do `.env` local co `SEPAY_WEBHOOK_SECRET` lam nhiem test env.
- Sua loi test isolation:
  - `backend/src/config/env.js` chi goi `dotenv.config()` khi khong bat `SMART_RENTAL_SKIP_DOTENV=true`.
  - `backend/tests/env.test.js` bat `SMART_RENTAL_SKIP_DOTENV=true` khi import env module bang bien moi truong gia lap.
  - Muc dich: test production guard khong bi anh huong boi `.env` that tren may local hoac env da cau hinh cho SePay.
- Kiem tra lai sau khi sua:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run test` ngoai sandbox: pass 19 test, skip 1 integration test theo guard.
  - `npm run build` ngoai sandbox: pass.
- Ghi chu:
  - Khong phat hien `.env` bi track trong Git.
  - Chua commit/push; cac file phu tro/untracked nhu `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/` tiep tuc giu ngoai commit neu chua duoc yeu cau.

### Ghi chú cấu hình SePay

- Đã thống nhất `SEPAY_WEBHOOK_SECRET` là secret dùng chung giữa SePay webhook và Render backend.
- Khi dùng `SEPAY_AUTH_MODE=hmac`, không cần cấu hình `SEPAY_API_KEY`.
- Secret trong SePay và biến môi trường `SEPAY_WEBHOOK_SECRET` trên Render phải giống nhau tuyệt đối; sau khi đổi env cần redeploy backend.

## 2026-08-12

### Dua QR thanh toan vao cong khach thue

- Di chuyen anh QR tu `docs/qr-qronly-sepay.png` sang asset frontend
  `frontend/src/assets/payment/sepay-qr-qronly.png`.
- Cong khach thue hien QR trong khoi `Huong dan thanh toan` khi chu tro da cau hinh thong tin
  ngan hang nhan tien.
- QR la ma tai khoan nhan tien co dinh; ma SePay `SRINV...` van duoc dung lam noi dung chuyen
  khoan de webhook SePay doi soat hoa don.
- Them CSS de QR co kich thuoc on dinh, nen trang de quet ro va khong vo layout tren mobile/dark mode.
- Sau phan hoi test that, bo nut `Gia lap da thanh toan` khoi cong khach thue.
- QR hien khi khach co hoa don dang mo, khong con phu thuoc `paymentInstructions.isConfigured`.
- Doi nut tren hoa don thanh `Hien QR thanh toan`; sau khi bam, QR hien truc tiep trong hoa don kem
  so tien va ma/noi dung chuyen khoan `SRINV...`.
- Them QR dong VietQR cho SePay: backend tra `qrCodeUrl` co san `amount=totalAmount` va
  `addInfo=SRINV...` neu chu tro cau hinh du `bankCode`, so tai khoan va chu tai khoan.
- Trang `Dich vu` co them truong `Ma ngan hang VietQR`, vi du `MBBank` hoac ma BIN ngan hang.
- Them tuy chon `DISCORD_WEBHOOK_URL`; khi SePay webhook xac nhan thanh toan thanh cong, backend tao
  notification noi bo va gui them message Discord neu bien moi truong nay duoc cau hinh.

## 2026-08-13

### Hoan thien auto payment status va Discord notification

- Kiem tra dau phien:
  - Dang o nhanh `main`, dong bo voi `origin/main`.
  - `dev`, `origin/dev`, `main`, `origin/main` cung commit `4bb2832`.
  - Khong co nhanh local/remote nao con commit chua merge vao `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1669 modules.
- Doi chieu tien do:
  - MVP da vuot ke hoach trong `chuyen_de_2.xlsx`: da co auth, phong, khach thue, hop dong,
    PDF, hoa don dich vu, tenant portal, dashboard, SePay/VietQR webhook, notification noi bo
    va Discord webhook.
  - Khoang trong chinh de thanh san pham that van la test giao dich SePay production sau khi
    co webhook secret that, deploy/domain/E2E production va monitoring/backup tu dong.
- Implement:
  - Them helper `syncOverdueBillingStatuses` de tu dong chuyen `Invoice.status` tu `issued`
    sang `overdue` khi `dueDate` truoc ngay hien tai.
  - Helper dong thoi chuyen `Payment.status` tu `pending` sang `overdue` khi qua han.
  - Khong thay doi cac trang thai cuoi `paid` va `cancelled`.
  - Goi helper truoc khi doc danh sach hoa don, danh sach thanh toan, dashboard va cong khach thue.
  - Dashboard aggregate sau khi da dong bo qua han, nen so lieu cong no va canh bao dung hon.
  - Tach Discord webhook sender thanh `discordNotifier`, co timeout ngan va fail-soft de loi Discord
    khong lam fail luong SePay/MoMo da doi soat thanh cong.
  - Bo sung test unit cho logic auto overdue va filter scope theo owner/tenant/contracts.
  - Them script `npm run seed:payment-test` de tao du lieu test thanh toan khong reset database:
    landlord/tenant test, phong test, hoa don qua han va hoa don SePay dang mo.
  - Them script `npm run dev:safe` de chay local khong dung `nodemon`, tranh loi `spawn EPERM`
    tren Windows.
- Tai lieu:
  - Cap nhat `docs/API.md` cho auto overdue khi doc invoice/payment va Discord trong SePay webhook.
  - Cap nhat `docs/MODULES.md` ve auto overdue va Discord webhook.
  - Cap nhat `docs/TEST_CHECKLIST.md` them muc auto overdue va Discord webhook.
  - Them `docs/PAYMENT_TEST_GUIDE.md` huong dan test local, SePay mock, Discord va webhook production.
- Kiem tra:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner.
  - `npm run test` ngoai sandbox: pass 24 test, skip 1 integration test theo guard.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1669 modules.

### Reset data phong tro va tai khoan tenant theo phong

- Theo yeu cau moi, reset database dev hien tai bang `npm run seed:reset`.
- Du lieu sau reset:
  - 1 tai khoan landlord mau: `admin@smartrental.local` / `Admin@123456`.
  - 30 phong trong 3 tang: `101-110`, `201-210`, `301-310`.
  - 0 khach thue, 0 hop dong, 0 hoa don, 0 payment.
- Cap nhat seed data mac dinh de khong con tao khach/hop dong/payment demo cu.
- Them logic tao tai khoan tenant khi landlord them khach va gan phong:
  - Username = ho ten khong dau + ma phong, vi du `Ly Quang Hau` + `101` -> `lyquanghau101`.
  - Mat khau ban dau = so dien thoai khach thue.
  - Email la bat buoc neu khach duoc gan phong, vi backend can gui thong tin dang nhap.
- Them SMTP mail service bang `nodemailer`:
  - Cau hinh qua `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.
  - Neu SMTP chua cau hinh, backend van tao tai khoan va tra trang thai `emailDelivery.skipped=true`
    de landlord gui thong tin thu cong.
- Cap nhat frontend trang `Khach thue`:
  - Email bat buoc khi chon phong.
  - Sau khi tao khach co phong, UI hien username/password va trang thai gui mail.
- Them test unit cho username tenant: `Ly Quang Hau` + phong `101` -> `lyquanghau101`.

### Chuyen luong tao hop dong thanh luong tao khach thue chinh

- Dieu chinh nghiep vu theo huong san pham that:
  - Khi tao hop dong co the nhap thong tin khach dai dien moi ngay trong form hop dong.
  - Backend tu tao `Tenant`, gan vao phong va tao tai khoan dang nhap tenant khi hop dong active.
  - Van giu tuy chon dung khach thue da co de khong pha luong cu.
  - Them danh sach `occupants` trong `Contract` de luu nguoi o cung, khong tao account cho nguoi o cung.
- Frontend trang `Hop dong`:
  - Them cac truong ho ten, so dien thoai, email, CCCD/CMND cho nguoi dai dien.
  - Them truong `So nguoi o`; neu lon hon 1 thi hien form nhap nguoi o cung.
  - Gioi han so nguoi o theo `maxOccupants` cua phong.
  - Input tien hop dong tiep tuc hien thi co dau cham hang nghin.
- Backend:
  - Them schema `occupants` vao `Contract`.
  - `POST /contracts` khong con bat buoc `tenant` neu payload co `tenantInfo`.
  - Kiem tra suc chua phong truoc khi tao hop dong.
  - Kiem tra phong co hop dong active truoc khi tao tenant moi de tranh du lieu rac.
  - Gan tenant dai dien vao phong va cap nhat trang thai phong sang `occupied` neu phong khong bao tri.
- Kiem tra:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner.
  - `npm run test` ngoai sandbox: pass 26 test, skip 1 integration test.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass.

### Ghi chu ton dong cuoi ngay

- Test thuc te tao hop dong co 2 nguoi o:
  - Trang `Khach thue` hien moi khach dai dien, chua hien nguoi o cung.
  - Can quyet dinh UI/du lieu cho nguoi o cung: hien trong chi tiet khach dai dien, chi tiet hop dong,
    chi tiet phong, hoac tao module/section rieng `Nguoi o cung`.
- Chua nhan duoc email tai khoan va mat khau cua khach dai dien:
  - Can kiem tra cau hinh SMTP trong `.env`.
  - Can kiem tra backend response `temporaryAccount.emailDelivery` / `loginAccount.emailDelivery`.
  - Can kiem tra log backend khi tao hop dong de phan biet SMTP chua cau hinh, gui mail fail, hay mail vao spam.
- Trang `Phong`:
  - Trang thai `Da thue` dang cung mau/gan nhu kho phan biet voi phong `Trong`.
  - Can chinh badge/status color de `Da thue` noi bat khac voi `Trong`.
- Viec can lam tiep:
  - Bo sung hien thi nguoi o cung sau khi tao hop dong.
  - Kiem tra va sua luong gui mail tai khoan tenant khi tao hop dong.
  - Chinh mau status phong `Da thue`.

### Tiep tuc hoan thien luong hop dong dung that

- Kiem tra dau phien:
  - Dang o nhanh `main`, dong bo voi `origin/main`.
  - Khong co nhanh local/remote nao con commit chua merge vao `main`.
  - File phu tro/untracked tiep tuc giu ngoai commit: `chuyen_de_2.xlsx`, `code.txt`,
    `docs/PROMPT_TEMPLATE.md`, `docs/image/`.
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass.
- Doi chieu tien do:
  - Du an da vuot MVP trong `chuyen_de_2.xlsx`; huong hien tai tiep tuc uu tien san pham that
    cho chu tro nho: hop dong, tenant portal, hoa don, VietQR/SePay, notification va PDF.
  - Cac khoang trong con lai de ban that la SePay production that, deploy/domain on dinh,
    backup/monitoring va test E2E frontend.
- Implement tiep cac ton dong cuoi ngay:
  - `GET /api/rooms/:id` tra them `activeContract` de frontend co thong tin nguoi dai dien
    va danh sach nguoi o cung cua hop dong active.
  - Trang `Hop dong` hien tong so nguoi o va ten nguoi o cung trong danh sach hop dong.
  - Thong tin tai khoan tenant sau khi tao hop dong duoc dua ra ngoai modal de chu tro nhin thay
    sau khi form dong.
  - Trang thai gui email tai khoan tenant hien ro: da gui, SMTP chua cau hinh, hoac gui that bai.
  - Chi tiet phong hien khach dai dien va danh sach nguoi o cung cua hop dong active.
  - Chinh mau badge phong: `Trong` xanh la, `Da thue` xanh duong, `Bao tri` vang de de phan biet.
- Tai lieu:
  - Cap nhat `docs/API.md` cho truong `activeContract` cua chi tiet phong.
  - Cap nhat `docs/SETUP.md` them cau hinh SMTP gui tai khoan tenant.
  - Cap nhat `docs/TEST_CHECKLIST.md` them test hop dong nhieu nguoi o va email tenant.
- Kiem tra sau implement:
  - `npm run lint`: pass.
  - `npm run format:check`: pass sau khi format rieng `frontend/src/pages/ContractsPage.jsx`.
  - `git diff --check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1671 modules.

### Sua hien thi mat khau tam va gui email khi cap lai mat khau

- Phat hien van de:
  - Trang `Khach thue` hien mat khau tam dang plain text ngay tren man hinh sau khi tao/cap lai
    mat khau, khong phu hop khi demo hoac share man hinh.
  - Luong `Cap lai mat khau` reset password va tra ve frontend nhung chua goi SMTP mail service,
    nen khach thue khong nhan duoc email tu thao tac nay.
  - `backend/.env` local hien chua cau hinh cac bien `SMTP_*`, nen email cung se bi skipped
    cho den khi cau hinh SMTP va restart backend.
- Implement:
  - Them component `TemporaryCredentialPanel` dung chung cho trang `Khach thue` va `Hop dong`.
  - Mat khau tam duoc che mac dinh, chi hien khi bam `Hien` hoac copy bang nut `Copy mat khau`.
  - `PATCH /api/auth/users/:id/unlock` goi `sendTenantCredentialsEmail` va tra them
    `emailDelivery` de frontend hien trang thai gui mail.
  - Cap nhat CSS cho hang mat khau/copy khong vo layout.
- Tai lieu:
  - Cap nhat `docs/API.md` cho response cap lai mat khau co `emailDelivery`.
- Kiem tra sau sua:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `git diff --check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1672 modules.

### Chuyen tenant password sang email-only

- Dieu chinh theo yeu cau bao mat:
  - Chu tro khong duoc xem mat khau tenant plaintext tren UI hoac qua API response.
  - Mat khau tenant ban dau/cap lai duoc sinh ngau nhien va chi gui qua email khach thue.
  - Neu SMTP chua cau hinh hoac gui email that bai, backend khong tao/cap lai tai khoan tenant.
  - Luong cap lai mat khau gui email thanh cong truoc roi moi luu password hash moi, tranh khoa
    tenant khi email khong di duoc.
- Implement:
  - Them `backend/src/utils/password.js` de sinh mat khau tam ngau nhien dung chung.
  - `ensureTenantAccountForRoom`, tao hop dong active va cap lai mat khau khong con tra password
    ve frontend.
  - Trang `Khach thue` va `Hop dong` khong hien bat ky thong tin dang nhap nao tren man hinh,
    chi hien trang thai email da gui hoac loi.
  - Xoa component `TemporaryCredentialPanel` vi khong con can bat ky UI xem/copy mat khau nao.
- Tai lieu:
  - Cap nhat `docs/API.md`, `docs/MODULES.md`, `docs/SETUP.md`, `docs/TEST_CHECKLIST.md`,
    `docs/DEMO_SCRIPT.md`, `docs/PRODUCT_READINESS.md` theo huong email-only.
- Kiem tra sau sua:
  - `npm run lint`: pass.
  - `npm run format:check`: pass sau khi format cac file source lien quan.
  - `npm run test`: loi `spawn EPERM` trong sandbox Windows cua Node test runner.
  - `npm run test` ngoai sandbox: pass 26 test, skip 1 integration test theo guard.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1671 modules.

### Lam lai PDF hop dong theo mau ngan gon

- Yeu cau:
  - Doi file PDF hop dong thue tro sinh tu he thong theo mau
    `docs/contract/mau-hop-dong-thue-nha-tro-ngan-gon.docx`.
  - Bo giao dien PDF kieu dashboard/card cu, uu tien van ban hop dong de in va ky that.
- Implement:
  - `GET /api/contracts/:id/pdf` van dung endpoint cu de khong doi frontend/API.
  - Backend populate them thong tin `owner` cua hop dong de dien Ben A trong PDF.
  - Tao template PDF moi gom quoc hieu, tieu ngu, tieu de, thong tin Ben A/Ben B,
    phong thue, gia thue, tien coc, thoi han, trach nhiem cac ben va khu vuc ky ten.
  - Giu cac gia tri dong tu du lieu that cua hop dong: ma hop dong, chu tro, khach thue,
    phong, tang, nguoi o cung, gia thue, tien coc, ngay bat dau/ket thuc, trang thai.
  - Them xu ly xuong trang truoc khu vuc chu ky de tranh tran noi dung khi hop dong dai.
- Ghi chu cong nghe:
  - Tiep tuc dung `pdfkit` vi du an da co san, phu hop MVP va khong doi stack.
  - Khong them thu vien docx-to-pdf vi de phat sinh phu thuoc Office/LibreOffice tren may deploy.
- Kiem tra sau sua:
  - `npm run lint`: pass.
  - `npm run format:check`: pass.
  - `npm run build`: loi `spawn EPERM` trong sandbox Windows cua Vite/esbuild.
  - `npm run build` ngoai sandbox: pass, build 1671 modules.

### Bo sung thong tin hop dong in an

- Yeu cau:
  - PDF hop dong dung thong tin chu tro: Ly Quang Hau, email, so dien thoai, CCCD,
    ngay sinh va dia chi nha tro.
  - Doi font hop dong sang Times New Roman/serif, tang co chu va in dam ten rieng.
  - Khi lap hop dong, bo sung ngay sinh va dia chi thuong tru cua khach thue.
- Implement:
  - Them `dateOfBirth` va `permanentAddress` vao model `Tenant`.
  - Form `Hop dong` them truong ngay sinh va dia chi thuong tru khi tao khach moi.
  - Form `Khach thue` cung them 2 truong nay de sua thong tin khach da co.
  - API tenant/contract nhan va luu `dateOfBirth`, `permanentAddress`.
  - PDF hop dong dien thong tin Ben A theo profile chu tro, dien HK thuong tru/ngay sinh Ben B,
    dung font Times New Roman tren Windows va fallback serif tren moi truong khac.
- Tai lieu:
  - Cap nhat `docs/API.md` cho field `dateOfBirth`, `permanentAddress` va `tenantInfo`
    khi tao hop dong.

### Ra soat ngon ngu UI va bo sung doi mat khau trong cai dat

- Yeu cau:
  - Ra soat giao dien cuoi ngay de che do tieng Viet hien tieng Viet co dau, khong lan chu
    khong dau hoac gia tri ky thuat tu API.
  - Khi chuyen sang tieng Anh, tiep tuc dung nhom copy tieng Anh rieng.
  - Ben khach thue phai co phan doi mat khau trong `Cai dat`.
- Implement:
  - Them form doi mat khau vao trang `Cai dat`, dung API co san `PATCH /auth/change-password`.
  - Form doi mat khau validate mat khau hien tai, do dai toi thieu 8 ky tu, xac nhan mat khau
    va khong cho trung mat khau cu.
  - Sua sidebar tenant tu chu khong dau sang nhan `Cong khach thue` co dau trong UI.
  - Viet hoa/bo dau cac copy tieng Viet con thieu o header, cong khach thue, khach thue,
    dich vu/hoa don, dashboard va thanh toan.
  - Map trang thai hop dong/hoa don/thanh toan va phuong thuc thanh toan sang nhan theo ngon ngu,
    tranh hien truc tiep `active`, `issued`, `pending`, `cash` tren UI.
