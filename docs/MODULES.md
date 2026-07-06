# Modules

## Auth

Quản lý đăng ký, đăng nhập, JWT và thông tin người dùng hiện tại.

Endpoint nền:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Rooms

Quản lý phòng trọ và trạng thái phòng.

Endpoint nền:

- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms`
- `PUT /api/rooms/:id`
- `DELETE /api/rooms/:id`

## Tenants

Quản lý thông tin khách thuê, thông tin liên hệ và phòng đang gán.

Endpoint nền:

- `GET /api/tenants`
- `GET /api/tenants/:id`
- `POST /api/tenants`
- `PUT /api/tenants/:id`
- `DELETE /api/tenants/:id`

## Contracts

Quản lý hợp đồng giữa khách thuê và phòng. Module đã có model, seed data, API CRUD cơ bản và giao diện quản lý hợp đồng trong frontend.

Endpoint nền:

- `GET /api/contracts`
- `GET /api/contracts/:id`
- `POST /api/contracts`
- `PUT /api/contracts/:id`
- `DELETE /api/contracts/:id`

## Payments

Quản lý thanh toán tiền phòng. Module đã có model, seed data, API quản lý khoản
thu cơ bản và giao diện frontend tại `/payments`. Hiện tại hỗ trợ ghi nhận thủ
công/mock theo phương thức `cash`, `bank_transfer`, `momo`, `vnpay`; chưa tích
hợp redirect thật sang VNPay/MoMo sandbox.

Endpoint nền:

- `GET /api/payments`
- `GET /api/payments/:id`
- `POST /api/payments`
- `PUT /api/payments/:id`
- `PATCH /api/payments/:id/mark-paid`
- `PATCH /api/payments/:id/cancel`

## Dashboard

Hiển thị số liệu tổng quan từ dữ liệu thật trong MongoDB. Module đã có API thống
kê tổng phòng, khách thuê active, hợp đồng active và thanh toán trong tháng.

Endpoint nền:

- `GET /api/dashboard/summary`
