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
