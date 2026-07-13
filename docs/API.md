# Tài Liệu API

Base URL:

```txt
http://localhost:5000/api
```

## Bảo vệ API

- Backend dùng JWT Bearer Token cho các route nghiệp vụ.
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
- `temporaryAccount.user.username` mặc định là số điện thoại khách thuê.
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

## Dashboard

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
