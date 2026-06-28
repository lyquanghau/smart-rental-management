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
