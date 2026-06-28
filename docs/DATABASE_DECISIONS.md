# Database Decisions

## Mục tiêu

Tài liệu này ghi rõ quyết định database để đối chiếu với kế hoạch ban đầu trong
`chuyen_de_2.xlsx`.

## Quyết định hiện tại

Dự án dùng:

- MongoDB Atlas cho database dev.
- Mongoose cho schema/model.
- Seed script bằng Node.js.

Không dùng:

- MongoDB local làm yêu cầu bắt buộc.
- PostgreSQL.
- SQL migration file.

## Lý do không cài Mongo local làm hướng chính

- Repo đã cấu hình theo MongoDB Atlas từ đầu.
- `backend/.env.example` dùng `MONGODB_URI` trỏ tới MongoDB Atlas.
- Cả nhóm có thể dùng chung database dev qua connection string thay vì mỗi máy có một database local khác nhau.
- Giảm lỗi setup môi trường khi demo hoặc chuyển máy.

Nếu cần làm offline, vẫn có thể cài MongoDB local và đổi `MONGODB_URI`, nhưng đó là
phương án phụ, không phải stack chính của dự án.

## Lý do không viết migration file

MongoDB/Mongoose không dùng migration SQL theo kiểu tạo bảng/foreign key như
PostgreSQL. Thay vào đó:

- Schema nằm trong `backend/src/models`.
- Quan hệ dữ liệu dùng `ObjectId` và `ref`.
- Dữ liệu mẫu được tạo qua seed script.

Các model hiện có:

| Model    | File                             | Mục đích                       |
| -------- | -------------------------------- | ------------------------------ |
| User     | `backend/src/models/User.js`     | Tài khoản và phân quyền.       |
| Room     | `backend/src/models/Room.js`     | Phòng trọ và trạng thái phòng. |
| Tenant   | `backend/src/models/Tenant.js`   | Khách thuê và phòng đang gán.  |
| Contract | `backend/src/models/Contract.js` | Hợp đồng thuê phòng.           |
| Payment  | `backend/src/models/Payment.js`  | Khoản thu/thanh toán.          |

## Seed data

Seed script hiện có:

- `backend/scripts/seed.js`: upsert dữ liệu mẫu, không xóa toàn bộ database.
- `backend/scripts/seed-reset.js`: xóa dữ liệu cũ trong các collection chính rồi seed lại.
- `backend/scripts/seed-data.js`: khai báo dữ liệu mẫu.

Dữ liệu mẫu theo kế hoạch:

| Dữ liệu                | Trạng thái                        |
| ---------------------- | --------------------------------- |
| 5 phòng                | Đã có                             |
| 3 khách thuê           | Đã có                             |
| 1 hợp đồng             | Đã có                             |
| 1 khoản thanh toán mẫu | Đã bổ sung thêm so với kế hoạch   |
| 2 user mẫu             | Đã bổ sung thêm để test đăng nhập |

## Lệnh kiểm tra seed

```bash
npm run seed
```

Reset database dev:

```bash
npm run seed:reset
```

Chỉ chạy `seed:reset` khi chắc chắn đang trỏ tới database dev và cả nhóm đồng ý
reset dữ liệu, vì lệnh này xóa dữ liệu trong các collection chính trước khi seed lại.
