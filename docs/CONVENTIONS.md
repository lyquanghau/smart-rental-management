# Quy ước dự án

## Branch

- `main`: code ổn định để demo/nộp.
- `dev`: nhánh tích hợp hằng ngày.
- `feature/<ten-ngan>`: nhánh cho từng chức năng.

Ví dụ:

```txt
feature/auth-api
feature/room-list-ui
feature/payment-vnpay
```

## Commit

Dùng format ngắn, rõ:

```txt
feat: add room list api
fix: handle missing jwt token
docs: update setup guide
chore: configure eslint
```

## Code

- Frontend pages đặt trong `frontend/src/pages`.
- Frontend API services đặt trong `frontend/src/services`.
- Backend models đặt trong `backend/src/models`.
- Backend routes đặt trong `backend/src/routes`.
- Backend controllers đặt trong `backend/src/controllers`.
