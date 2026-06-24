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
  "status": "maintenance"
}
```

### DELETE /rooms/:id

Yêu cầu role `landlord`.

Phòng được soft delete bằng `deletedAt`, không xóa cứng khỏi database.
