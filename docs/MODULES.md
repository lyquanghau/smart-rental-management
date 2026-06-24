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

Quản lý thông tin khách thuê. Ngày 1 mới tạo model và seed data, chưa mở API riêng.

## Contracts

Quản lý hợp đồng giữa khách thuê và phòng. Ngày 1 mới tạo model và seed data, chưa mở API riêng.

## Payments

Quản lý thanh toán tiền phòng. Ngày 1 mới tạo model và seed data, chưa tích hợp cổng thanh toán.

## Dashboard

Hiển thị số liệu tổng quan. Ngày 1 frontend đang dùng số liệu tĩnh, các API thống kê sẽ làm sau khi module chính ổn định.
