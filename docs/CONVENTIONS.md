# Quy ước dự án

## Branch

- `main`: code ổn định để demo hoặc nộp.
- `dev`: nhánh tích hợp hằng ngày.
- `feature/<ten-ngan>`: nhánh cho từng chức năng.

Ví dụ:

```txt
feature/auth-api
feature/room-crud
feature/room-list-ui
```

## Commit

Dùng format ngắn, rõ:

```txt
feat: add room create api
fix: handle missing jwt token
docs: update setup guide
chore: configure eslint
```

## Cấu trúc code

- Frontend pages đặt trong `frontend/src/pages`.
- Frontend components đặt trong `frontend/src/components`.
- Frontend layouts đặt trong `frontend/src/layouts`.
- Frontend API services đặt trong `frontend/src/services`.
- Frontend custom hooks đặt trong `frontend/src/hooks` khi logic đã lặp lại và cần tái sử dụng.
- Backend models đặt trong `backend/src/models`.
- Backend routes đặt trong `backend/src/routes`.
- Backend controllers đặt trong `backend/src/controllers`.
- Backend middleware đặt trong `backend/src/middleware`.

## API response

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

## Database

Dự án dùng MongoDB Atlas và Mongoose. Không dùng PostgreSQL/migration trong giai đoạn hiện tại để tránh lệch stack.

## Frontend styling

Dự án hiện dùng CSS thuần trong `frontend/src/styles.css`, không dùng TailwindCSS
hoặc MUI ở giai đoạn này.

Lý do:

- Giao diện MVP còn nhỏ, CSS thuần đủ kiểm soát layout, bảng, form và trạng thái.
- Tránh thêm dependency lớn khi các màn hình đã có style thống nhất.
- Giữ cấu trúc dự án đơn giản cho nhóm mới tiếp nhận.

Nếu sau này UI phức tạp hơn, nhóm có thể cân nhắc TailwindCSS hoặc một component
library, nhưng cần thống nhất trước và cập nhật lại convention.
