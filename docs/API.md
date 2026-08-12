# Tài Liệu API

Base URL:

```txt
http://localhost:5000/api
```

## Bảo vệ API

- Backend dùng JWT Bearer Token cho các route nghiệp vụ.
- Dữ liệu nghiệp vụ dùng multi-tenant isolation theo `owner`: mỗi chủ trọ chỉ truy cập được
  phòng, khách thuê, hợp đồng, hóa đơn, chỉ số dịch vụ, cấu hình dịch vụ và thanh toán do tài khoản
  chủ trọ đó sở hữu. Trường `owner` là dữ liệu nội bộ backend, frontend không cần gửi.
- CORS chỉ cho phép frontend origin khai báo trong `CLIENT_URL` hoặc `CLIENT_URLS`.
- Backend dùng `express-rate-limit` với giới hạn mặc định `300` request trong `15` phút cho mỗi IP. Có thể chỉnh bằng:

```txt
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Khi vượt giới hạn, API trả HTTP `429`.

## Định dạng phản hồi

Thành công:

```json
{
  "data": {},
  "message": "Thông báo tùy chọn"
}
```

Lỗi:

```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "field": "Lý do lỗi"
  }
}
```

## Health

### GET /health

Response:

```json
{
  "status": "ok",
  "service": "smart-rental-api",
  "timestamp": "2026-06-22T00:00:00.000Z"
}
```

## Auth

Ghi chú nghiệp vụ:

- `POST /auth/register` là endpoint tạo tài khoản chủ trọ, không dùng để khách thuê tự đăng ký.
- Trong production, đăng ký công khai chỉ hoạt động khi backend đặt `ALLOW_PUBLIC_REGISTRATION=true`.
- Frontend không có form đăng ký public cho khách thuê.
- Tài khoản khách thuê được hệ thống tạo khi chủ trọ tạo hợp đồng hiệu lực cho khách thuê chưa có tài khoản.
- Tài khoản dùng mật khẩu tạm trong 3 ngày. Nếu khách thuê không đổi mật khẩu trong thời hạn này,
  tài khoản bị khóa và chỉ chủ trọ mới có thể mở khóa/cấp lại mật khẩu tạm.

### POST /auth/register

Request:

```json
{
  "fullName": "Admin Smart Rental",
  "email": "admin@example.com",
  "password": "Admin@123456",
  "role": "landlord"
}
```

Ghi chú:

- `role` optional, mặc định là `landlord`.
- Không cho phép đăng ký công khai với `role=tenant`; tài khoản khách thuê phải được tạo qua luồng hợp đồng.

### POST /auth/login

Request:

```json
{
  "email": "admin@smartrental.local",
  "password": "Admin@123456"
}
```

Response:

```json
{
  "data": {
    "user": {
      "_id": "...",
      "fullName": "Admin Smart Rental",
      "email": "admin@smartrental.local",
      "username": "admin",
      "role": "landlord",
      "mustChangePassword": false,
      "temporaryPasswordExpiresAt": null
    },
    "token": "jwt-token"
  },
  "message": "Đăng nhập thành công"
}
```

### GET /auth/me

Header:

```txt
Authorization: Bearer <token>
```

### PATCH /auth/change-password

Yêu cầu đăng nhập bằng JWT.

Request:

```json
{
  "currentPassword": "TempPassword123",
  "newPassword": "NewPassword123"
}
```

Response trả session mới và xóa trạng thái `mustChangePassword`.

### PATCH /auth/users/:id/unlock

Yêu cầu role `landlord`.

API mở khóa tài khoản, sinh mật khẩu tạm mới và đặt hạn đổi mật khẩu sau 3 ngày.

Response:

```json
{
  "data": {
    "user": {
      "_id": "...",
      "fullName": "Nguyen Van An",
      "email": "an@example.com",
      "username": "0901000001",
      "role": "tenant",
      "mustChangePassword": true,
      "temporaryPasswordExpiresAt": "2026-07-13T00:00:00.000Z"
    },
    "temporaryPassword": "Sr@temporary"
  },
  "message": "Mở khóa tài khoản và cấp lại mật khẩu tạm thành công"
}
```

## Rooms

Trạng thái phòng:

- `available`
- `occupied`
- `maintenance`

### GET /rooms

Query optional:

```txt
status=available
floor=1
page=1
limit=20
```

Response:

```json
{
  "data": [
    {
      "_id": "...",
      "name": "A101",
      "floor": 1,
      "price": 2500000,
      "maxOccupants": 2,
      "status": "available",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### GET /rooms/:id

Response:

```json
{
  "data": {
    "_id": "...",
    "name": "A101",
    "floor": 1,
    "price": 2500000,
    "maxOccupants": 2,
    "status": "available",
    "deletedAt": null,
    "currentTenants": [
      {
        "_id": "...",
        "fullName": "Nguyen Van An",
        "phone": "0901000001",
        "email": "an@example.com",
        "identityNumber": "079200000001",
        "room": "...",
        "deletedAt": null
      }
    ]
  }
}
```

### POST /rooms

Yêu cầu role `landlord`.

Request:

```json
{
  "name": "D401",
  "floor": 4,
  "price": 3800000,
  "maxOccupants": 2,
  "status": "available"
}
```

### PUT /rooms/:id

Yêu cầu role `landlord`.

Request:

```json
{
  "name": "D401",
  "floor": 4,
  "price": 3900000,
  "maxOccupants": 3,
  "status": "maintenance"
}
```

### DELETE /rooms/:id

Yêu cầu role `landlord`.

Phòng được soft delete bằng `deletedAt`, không xóa cứng khỏi database.

## Tenants

API khách thuê yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, xóa yêu cầu role
`landlord`.

### GET /tenants

Query optional:

```txt
room=<roomId>
page=1
limit=20
```

Response:

```json
{
  "data": [
    {
      "_id": "...",
      "fullName": "Nguyen Van An",
      "phone": "0901000001",
      "email": "an@example.com",
      "identityNumber": "079200000001",
      "room": {
        "_id": "...",
        "name": "A102",
        "floor": 1,
        "price": 2700000,
        "status": "occupied"
      },
      "user": {
        "_id": "...",
        "fullName": "Nguyen Van An",
        "email": "an@example.com",
        "username": "0901000001",
        "role": "tenant",
        "isActive": true,
        "mustChangePassword": false,
        "temporaryPasswordExpiresAt": null
      },
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### GET /tenants/:id

Response:

```json
{
  "data": {
    "_id": "...",
    "fullName": "Nguyen Van An",
    "phone": "0901000001",
    "email": "an@example.com",
    "identityNumber": "079200000001",
    "room": {
      "_id": "...",
      "name": "A102",
      "floor": 1,
      "price": 2700000,
      "status": "occupied"
    },
    "user": {
      "_id": "...",
      "fullName": "Nguyen Van An",
      "email": "an@example.com",
      "username": "0901000001",
      "role": "tenant",
      "isActive": true,
      "mustChangePassword": false,
      "temporaryPasswordExpiresAt": null
    },
    "deletedAt": null
  }
}
```

### POST /tenants

Request:

```json
{
  "fullName": "Nguyen Van An",
  "phone": "0901000001",
  "email": "an@example.com",
  "identityNumber": "079200000001",
  "room": "room-object-id"
}
```

### PUT /tenants/:id

Request:

```json
{
  "fullName": "Nguyen Van An",
  "phone": "0901000001",
  "email": "an@example.com",
  "identityNumber": "079200000001",
  "room": "room-object-id"
}
```

### DELETE /tenants/:id

Khách thuê được soft delete bằng `deletedAt`, không xóa cứng khỏi database.

## Contracts

API hợp đồng yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, kết thúc hợp đồng yêu cầu role
`landlord`.

Trạng thái hợp đồng:

- `active`
- `ended`
- `cancelled`

### GET /contracts

Query optional:

```txt
room=<roomId>
tenant=<tenantId>
status=active
page=1
limit=20
```

### GET /contracts/:id

Trả về chi tiết hợp đồng kèm thông tin phòng và khách thuê.

### GET /contracts/:id/pdf

Yêu cầu đăng nhập bằng JWT.

Trả về file PDF hợp đồng tạo từ dữ liệu hợp đồng, phòng và khách thuê.
Phản hồi dùng `Content-Type: application/pdf`.

### POST /contracts

Request:

```json
{
  "room": "room-object-id",
  "tenant": "tenant-object-id",
  "startDate": "2026-06-01",
  "endDate": "2027-06-01",
  "monthlyPrice": 2700000,
  "deposit": 2700000,
  "status": "active"
}
```

Ghi chú:

- Không cho tạo thêm hợp đồng `active` nếu phòng đã có hợp đồng `active` khác.
- Khi tạo hợp đồng `active` cho khách thuê chưa có tài khoản, backend tạo tài khoản `tenant` và
  trả thêm `temporaryAccount` trong response để chủ trọ gửi thông tin đăng nhập cho khách.
- `temporaryAccount.user.username` được sinh từ số điện thoại kèm mã tenant, ví dụ
  `0901000001-a1b2c3`, để tránh trùng giữa nhiều chủ trọ.
- `temporaryAccount.temporaryPassword` chỉ trả về một lần trong response tạo hợp đồng; backend chỉ lưu
  password hash, không lưu plaintext.

### PUT /contracts/:id

Request:

```json
{
  "room": "room-object-id",
  "tenant": "tenant-object-id",
  "startDate": "2026-06-01",
  "endDate": "2027-06-01",
  "monthlyPrice": 2800000,
  "deposit": 2800000,
  "status": "active"
}
```

Ghi chú:

- Khi cập nhật sang trạng thái `active`, hệ thống cũng kiểm tra trùng hợp đồng
  active theo phòng.

### DELETE /contracts/:id

Hợp đồng không bị xóa cứng. API này chuyển `status` của hợp đồng sang `ended`.

## Payments

API thanh toán yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, đánh dấu đã thu
và hủy khoản thu yêu cầu role `landlord`.

Ghi chú: từ module dịch vụ/hóa đơn, `Payment` là bản ghi thu tiền/giao dịch. Một
payment có thể tham chiếu `invoice`. Các endpoint cũ vẫn được giữ để không phá
luồng thanh toán MVP.

Trạng thái thanh toán:

- `pending`
- `paid`
- `overdue`
- `cancelled`

Phương thức thanh toán:

- `cash`
- `bank_transfer`
- `momo`
- `vnpay`

### GET /payments

Query optional:

```txt
contract=<contractId>
status=pending
method=cash
month=6
year=2026
page=1
limit=20
```

Response trả danh sách khoản thu kèm hợp đồng, phòng và khách thuê.

### GET /payments/:id

Trả về chi tiết khoản thu kèm hợp đồng, phòng và khách thuê.

### POST /payments

Request:

```json
{
  "contract": "contract-object-id",
  "amount": 2700000,
  "dueDate": "2026-06-30",
  "method": "cash",
  "status": "pending",
  "note": "Tiền phòng tháng 6/2026"
}
```

Ghi chú:

- Khoản thu chỉ được tạo/cập nhật cho hợp đồng đang `active`.
- `amount` phải là số không âm.

### PUT /payments/:id

Request:

```json
{
  "contract": "contract-object-id",
  "amount": 2800000,
  "dueDate": "2026-07-30",
  "method": "bank_transfer",
  "status": "pending",
  "note": "Tiền phòng tháng 7/2026"
}
```

### PATCH /payments/:id/mark-paid

Request optional:

```json
{
  "method": "bank_transfer",
  "paidAt": "2026-06-20",
  "note": "Đã thu qua chuyển khoản"
}
```

API chuyển `status` sang `paid` và tự set `paidAt` bằng thời điểm hiện tại nếu
request không truyền `paidAt`.

### PATCH /payments/:id/cancel

Request optional:

```json
{
  "note": "Hủy do tạo nhầm kỳ thu"
}
```

API chuyển `status` sang `cancelled`, không xóa cứng khoản thu khỏi database.
Nếu khoản thu liên kết với hóa đơn, hóa đơn cũng chuyển sang `cancelled`.

## Services & Invoices

Các API dịch vụ và hóa đơn yêu cầu JWT. Thao tác ghi/sửa/tạo hóa đơn yêu cầu role
`landlord`.

### GET /service-settings

Trả về cấu hình đơn giá dịch vụ hiện tại. Nếu chưa có cấu hình, backend tự tạo
cấu hình mặc định.

### PUT /service-settings

Request:

```json
{
  "electricityUnitPrice": 3500,
  "waterUnitPrice": 15000,
  "internetFee": 100000,
  "trashFee": 30000,
  "parkingFeePerVehicle": 100000,
  "bankName": "VCB - Vietcombank",
  "bankAccountNumber": "0123456789",
  "bankAccountName": "ADMIN SMART RENTAL",
  "transferContentTemplate": "Thanh toan phong {room} thang {month}-{year}",
  "paymentNote": "Sau khi chuyen khoan, vui long gui bien lai cho chu tro."
}
```

Ghi chu:

- Cac truong `bankName`, `bankAccountNumber`, `bankAccountName`,
  `transferContentTemplate`, `paymentNote` dung de hien thi huong dan chuyen khoan
  trong cong khach thue.
- `transferContentTemplate` ho tro placeholder `{room}`, `{month}`, `{year}`.

### GET /utility-readings

Query optional:

```txt
month=7
year=2026
```

Response trả danh sách chỉ số điện/nước kèm phòng và hợp đồng.

### POST /utility-readings

Tạo hoặc cập nhật chỉ số theo `room + month + year`.

Request:

```json
{
  "contract": "contract-object-id",
  "month": 7,
  "year": 2026,
  "electricityPrevious": 120,
  "electricityCurrent": 168,
  "waterPrevious": 45,
  "waterCurrent": 57,
  "internetAmount": 100000,
  "trashAmount": 30000,
  "parkingVehicleCount": 1,
  "note": "Chỉ số tháng 7/2026"
}
```

Backend tự tính:

```txt
electricityUsage = electricityCurrent - electricityPrevious
waterUsage = waterCurrent - waterPrevious
serviceTotal = electricityAmount + waterAmount + internet + trash + parking
```

### PUT /utility-readings/:id

Cập nhật chỉ số dịch vụ.

### DELETE /utility-readings/:id

Xóa bản ghi chỉ số dịch vụ.

### GET /invoices

Query optional:

```txt
month=7
year=2026
status=issued
contract=<contractId>
```

### GET /invoices/:id

Trả chi tiết hóa đơn gồm tiền phòng, tiền dịch vụ và từng dòng chi phí.

### GET /invoices/:id/pdf

Yeu cau JWT. Landlord chi tai duoc hoa don thuoc owner cua minh; tenant chi tai duoc hoa don
cua ho so tenant dang dang nhap.

Tra ve file PDF hoa don gom thong tin phong, khach thue, ky hoa don, bang ke chi phi,
tong thanh toan va thong tin chuyen khoan neu chu tro da cau hinh.

### POST /invoices/:id/momo-payment-link

Yeu cau JWT. Tenant chi tao phien thanh toan cho hoa don cua minh; landlord chi tao duoc cho
hoa don thuoc owner cua minh.

Tao phien thanh toan MoMo cho hoa don chua `paid`/`cancelled`.

Response:

```json
{
  "data": {
    "invoiceId": "...",
    "amount": 2700000,
    "orderId": "INV...",
    "requestId": "INV...-mock",
    "checkoutUrl": "http://localhost:5173/tenant-portal?mockMomoOrderId=INV...",
    "deeplink": "",
    "qrCodeUrl": "",
    "mockMode": true
  },
  "message": "Da tao phien thanh toan MoMo"
}
```

Ghi chu:

- Khi `MOMO_MOCK_MODE=true`, API khong goi MoMo that va dung de demo luong webhook tu dong.
- Khi `MOMO_MOCK_MODE=false`, backend can cau hinh `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`,
  `MOMO_SECRET_KEY`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`.
- `MOMO_ENDPOINT` dung sandbox mac dinh `https://test-payment.momo.vn/v2/gateway/api/create`;
  production dung `https://payment.momo.vn/v2/gateway/api/create`.
- `MOMO_REDIRECT_URL` la URL frontend, vi du `https://smart-rental.vercel.app/tenant-portal`.
- `MOMO_IPN_URL` la URL backend public HTTPS, vi du
  `https://smart-rental-api.onrender.com/api/webhooks/momo`.

### POST /invoices/:id/momo-mock-success

Yeu cau JWT va chi hoat dong khi `MOMO_MOCK_MODE=true`.

Gia lap MoMo IPN thanh cong cho hoa don, sau do backend tu:

- Chuyen `Invoice.status` sang `paid`.
- Cap nhat/tien tao `Payment` lien quan sang `paid`, method `momo`.
- Tao notification cho landlord.

Endpoint nay chi dung cho dev/demo khi chua co tai khoan MoMo merchant.

### POST /invoices/:id/sepay-payment-code

Yeu cau JWT. Tenant chi tao ma thanh toan cho hoa don cua minh; landlord chi tao duoc cho
hoa don thuoc owner cua minh.

Tao ma thanh toan SePay/VietQR cho hoa don chua `paid`/`cancelled`. Tenant dung ma nay trong
noi dung chuyen khoan de SePay webhook co the doi soat tu dong.

Response:

```json
{
  "data": {
    "invoiceId": "...",
    "amount": 2700000,
    "orderId": "SRINV...",
    "paymentCode": "SRINV...",
    "mockMode": true
  },
  "message": "Da tao ma thanh toan SePay"
}
```

### POST /invoices/:id/sepay-mock-success

Yeu cau JWT va chi hoat dong khi `SEPAY_MOCK_MODE=true`.

Gia lap SePay webhook tien vao thanh cong cho hoa don, sau do backend tu:

- Chuyen `Invoice.status` sang `paid`.
- Cap nhat/tien tao `Payment` lien quan sang `paid`, method `sepay`.
- Tao notification cho landlord.

Endpoint nay chi dung cho dev/demo khi chua cau hinh SePay webhook that.

### POST /invoices/generate-monthly

Tạo hóa đơn tháng cho tất cả hợp đồng `active`. Nếu hóa đơn của hợp đồng trong
tháng đó đã tồn tại, backend bỏ qua để tránh tạo trùng.

Request:

```json
{
  "month": 7,
  "year": 2026,
  "dueDate": "2026-07-30",
  "note": "Hóa đơn tháng 7/2026"
}
```

Logic:

- Lấy hợp đồng active.
- Lấy chỉ số dịch vụ theo hợp đồng/tháng nếu có.
- Tính `rentAmount`, `serviceAmount`, `totalAmount`.
- Tạo `Invoice`.
- Tạo khoản thu `Payment` liên kết với hóa đơn để trang Thanh toán tiếp tục xử lý.

### PATCH /invoices/:id/mark-paid

Chuyển hóa đơn sang `paid`, đồng thời tạo/cập nhật payment liên kết sang `paid`.

### PATCH /invoices/:id/cancel

Chuyển hóa đơn sang `cancelled`, đồng thời hủy payment liên kết nếu có.

## Tenant Portal

### GET /tenant-portal/summary

Yeu cau role `tenant`.

Response tra ho so khach thue hien tai, phong, hop dong, hoa don, thanh toan va
`paymentInstructions` lay tu cau hinh cua chu tro dang quan ly hop dong.

```json
{
  "data": {
    "tenant": {},
    "room": {},
    "activeContract": {},
    "contracts": [],
    "invoices": [],
    "payments": [],
    "paymentInstructions": {
      "bankName": "VCB - Vietcombank",
      "bankAccountNumber": "0123456789",
      "bankAccountName": "ADMIN SMART RENTAL",
      "transferContentTemplate": "Thanh toan phong {room} thang {month}-{year}",
      "paymentNote": "Sau khi chuyen khoan, vui long gui bien lai cho chu tro.",
      "isConfigured": true
    },
    "totals": {
      "openInvoiceAmount": 0,
      "openInvoiceCount": 0,
      "openPaymentAmount": 0,
      "openPaymentCount": 0
    }
  }
}
```

## Notifications

Cac API thong bao yeu cau role `landlord`.

### GET /notifications

Query optional:

```txt
limit=8
unread=true
```

Response:

```json
{
  "data": [
    {
      "_id": "...",
      "type": "payment_success",
      "title": "Hoa don da thanh toan",
      "message": "Hoa don phong A101 thang 8/2026 da duoc thanh toan 2700000 VND.",
      "entityType": "invoice",
      "entityId": "...",
      "readAt": null,
      "createdAt": "2026-08-03T00:00:00.000Z"
    }
  ],
  "meta": {
    "unreadCount": 1
  }
}
```

### PATCH /notifications/:id/read

Danh dau mot thong bao da doc.

### PATCH /notifications/read-all

Danh dau tat ca thong bao cua landlord hien tai da doc.

## Webhooks

### POST /webhooks/momo

Endpoint public de MoMo gui IPN server-to-server.

Backend verify HMAC SHA256 signature bang `MOMO_SECRET_KEY`. Neu `resultCode = 0`, backend tim
hoa don theo `paymentProvider=momo` va `paymentOrderId=orderId`, kiem tra so tien khop
`Invoice.totalAmount`, sau do tu dong cap nhat invoice/payment va tao notification.

Webhook duoc xu ly idempotent bang `sourceEventKey`, tranh tao nhieu thong bao khi MoMo gui lai
cung mot giao dich.

### POST /webhooks/sepay

Endpoint public de SePay gui giao dich ngan hang server-to-server.

Payload SePay chinh:

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2026-08-05 11:08:33",
  "accountNumber": "1017588888",
  "code": "SRINVABC123",
  "content": "SRINVABC123 chuyen tien",
  "transferType": "in",
  "transferAmount": 2700000,
  "referenceCode": "FT24012345678"
}
```

Backend xu ly:

- Verify webhook theo `SEPAY_AUTH_MODE`: `hmac`, `api_key`, hoac `none` chi cho dev.
- Voi `hmac`, verify `X-SePay-Signature` va `X-SePay-Timestamp` bang `SEPAY_WEBHOOK_SECRET`.
- Chi xu ly tien vao `transferType=in`.
- Tim ma `SRINV...` tu `code` hoac `content`.
- Kiem tra `transferAmount` khop `Invoice.totalAmount`.
- Cap nhat invoice/payment sang `paid` va tao notification.
- Dedupe bang `sourceEventKey=sepay:<id>`.

Production nen dung:

```txt
SEPAY_MOCK_MODE=false
SEPAY_AUTH_MODE=hmac
SEPAY_WEBHOOK_SECRET=<secret-key-copy-tu-SePay>
```

## Dashboard

Bo sung nhac han dashboard:

- `alerts.paymentReminders.dueSoon` tra toi da 5 hoa don chua thu den han trong 7 ngay.
- `alerts.paymentReminders.overdue` tra toi da 5 hoa don qua han.

Dashboard API yêu cầu đăng nhập bằng JWT.

### GET /dashboard/summary

Response:

```json
{
  "data": {
    "rooms": {
      "total": 5,
      "available": 3,
      "occupied": 1,
      "maintenance": 1
    },
    "tenants": {
      "active": 3
    },
    "contracts": {
      "active": 1,
      "ended": 0,
      "cancelled": 0
    },
    "payments": {
      "month": 7,
      "year": 2026,
      "pendingAmount": 2700000,
      "paidAmount": 2700000,
      "pendingCount": 1,
      "paidCount": 1,
      "overdueCount": 0
    },
    "revenue": {
      "currentMonth": 2700000,
      "previousMonth": 0,
      "previousMonthPaidCount": 0
    },
    "alerts": {
      "expiringContracts": [],
      "paymentReminders": {
        "dueSoon": [],
        "overdue": []
      },
      "unpaidPayments": []
    }
  }
}
```

Ghi chú:

- `rooms` chỉ tính phòng chưa bị soft delete.
- `tenants.active` tính khách thuê chưa bị soft delete.
- `payments` thống kê theo tháng hiện tại dựa trên `dueDate`.
- `overdueCount` tính cả khoản `overdue` và khoản `pending` đã quá hạn.
- `revenue.currentMonth` là tổng khoản `paid` trong tháng hiện tại.
- `revenue.previousMonth` là tổng khoản `paid` trong tháng trước.
- `alerts.expiringContracts` trả tối đa 5 hợp đồng active sắp hết hạn trong 30 ngày.
- `alerts.unpaidPayments` trả tối đa 5 khoản `pending` hoặc `overdue` cần xử lý.
