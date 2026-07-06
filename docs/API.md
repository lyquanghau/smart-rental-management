# API Documentation

Base URL:

```txt
http://localhost:5000/api
```

## Response format

Success:

```json
{
  "data": {},
  "message": "Optional message"
}
```

Error:

```json
{
  "message": "Validation failed",
  "errors": {
    "field": "Reason"
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
      "role": "landlord"
    },
    "token": "jwt-token"
  },
  "message": "Logged in successfully"
}
```

### GET /auth/me

Header:

```txt
Authorization: Bearer <token>
```

## Rooms

Room status:

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
    "status": "available",
    "deletedAt": null
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

Tenant APIs yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, xóa yêu cầu role
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

Contract APIs yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, kết thúc hợp đồng yêu cầu role
`landlord`.

Contract status:

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

### DELETE /contracts/:id

Hợp đồng không bị xóa cứng. API này chuyển `status` của hợp đồng sang `ended`.

## Payments

Payment APIs yêu cầu đăng nhập bằng JWT. Các thao tác tạo, sửa, đánh dấu đã thu
và hủy khoản thu yêu cầu role `landlord`.

Payment status:

- `pending`
- `paid`
- `overdue`
- `cancelled`

Payment method:

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
  "note": "Tien phong thang 6/2026"
}
```

### PUT /payments/:id

Request:

```json
{
  "contract": "contract-object-id",
  "amount": 2800000,
  "dueDate": "2026-07-30",
  "method": "bank_transfer",
  "status": "pending",
  "note": "Tien phong thang 7/2026"
}
```

### PATCH /payments/:id/mark-paid

Request optional:

```json
{
  "method": "bank_transfer",
  "paidAt": "2026-06-20",
  "note": "Da thu qua chuyen khoan"
}
```

API chuyển `status` sang `paid` và tự set `paidAt` bằng thời điểm hiện tại nếu
request không truyền `paidAt`.

### PATCH /payments/:id/cancel

Request optional:

```json
{
  "note": "Huy do tao nham ky thu"
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
    }
  }
}
```

Ghi chú:

- `rooms` chỉ tính phòng chưa bị soft delete.
- `tenants.active` tính khách thuê chưa bị soft delete.
- `payments` thống kê theo tháng hiện tại dựa trên `dueDate`.
- `overdueCount` tính cả khoản `overdue` và khoản `pending` đã quá hạn.
