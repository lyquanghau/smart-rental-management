# Checklist deploy Smart Rental

## 1. Chuan bi repository

- Nhanh `main` chua code on dinh.
- Khong commit `.env`, `node_modules`, `dist`, anh ca nhan hoac file phu tro chua duoc yeu cau.
- Chay pass:
  - `npm run lint`
  - `npm run format:check`
  - `npm run build`

## 2. Backend Render

- Tao service Node.js tren Render.
- Build command: `npm ci`.
- Start command: `npm run start -w backend`.
- Cau hinh bien moi truong:
  - `NODE_ENV=production`
  - `PORT=5000` hoac de Render tu cap.
  - `MONGODB_URI=<connection-string-production-or-demo>`
  - `JWT_SECRET=<secret-manh-toi-thieu-32-ky-tu>`
  - `CLIENT_URL=https://<frontend-domain>`
  - Hoac `CLIENT_URLS=https://<frontend-domain>,http://localhost:5173` neu can nhieu origin.
  - `ALLOW_PUBLIC_REGISTRATION=false`
  - `RATE_LIMIT_WINDOW_MS=900000`
  - `RATE_LIMIT_MAX=300`
  - Neu SePay chua duyet: `SEPAY_MOCK_MODE=true`.
  - Neu SePay da duyet: `SEPAY_MOCK_MODE=false`, `SEPAY_AUTH_MODE=hmac`,
    `SEPAY_WEBHOOK_SECRET=<secret-key-tu-SePay>`.
- Test `GET /api/health` sau deploy.
- Khong dung `JWT_SECRET=change_me`, khong de `CLIENT_URLS=*` trong production.

## 3. Frontend Vercel

- Import repository vao Vercel.
- Root directory: `frontend`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Cau hinh bien moi truong frontend theo `frontend/.env.example`.
- `VITE_API_BASE_URL` phai tro ve backend production, vi du `https://<backend>.onrender.com/api`.

## 4. MongoDB Atlas

- Dung database demo/production rieng, khong dung lan database dev ca nhan.
- Tao user co quyen vua du.
- Cho phep IP tu Render hoac dung access rule phu hop trong giai doan demo.
- Seed du lieu demo neu database moi.
- Doc `docs/BACKUP_RESTORE.md` va tao backup thu cong truoc moi lan deploy production.

## 5. Kiem tra sau deploy

- Mo frontend production.
- Dang nhap bang tai khoan demo.
- Test nhanh luong: phong -> khach thue -> hop dong -> PDF -> thanh toan -> dashboard.
- Test luong khach thue: dang nhap bang tai khoan tam -> doi mat khau -> xem cong khach thue.
- Mo thu URL quan tri bang tai khoan khach thue, vi du `/rooms`, phai tu chuyen ve trang phu hop.
- Kiem tra CORS khong chan frontend production.
- Kiem tra API tra `429` khi gui qua nhieu request trong mot khoang ngan.
- Kiem tra link demo khong loi sau khi Render service sleep/wake.

## 6. Ghi chu SePay

Trang thai hien tai: SePay dang cho duyet tai khoan/ket noi, chua co Secret Key webhook that.

IPN/Webhook URL da chot cho Render:

```txt
https://smart-rental-management-r1eu.onrender.com/api/webhooks/sepay
```

Trong luc cho duyet:

- Khong bat `SEPAY_MOCK_MODE=false` neu chua co `SEPAY_WEBHOOK_SECRET`.
- Tiep tuc test bang `SEPAY_MOCK_MODE=true` hoac thu tien chuyen khoan thu cong.

Sau khi SePay duyet:

- Tao webhook Money in.
- Chon HMAC-SHA256.
- Dat URL la endpoint Render phia tren.
- Copy Secret Key vao Render env `SEPAY_WEBHOOK_SECRET`.
- Redeploy backend.
- Chuyen khoan test so tien nho voi noi dung chua ma `SRINV...`.

## 7. Ghi chu VNPay/MoMo

Neu chua co sandbox duoc duyet, giu payment o muc ghi nhan thu cong/mock va ghi ro trong bao cao.
Khi tich hop that can them:

- Endpoint tao URL thanh toan.
- Return URL.
- IPN/webhook.
- Kiem tra chu ky bao mat.
- Luu ma giao dich/reference id.
- Test case thanh toan thanh cong, that bai va pending.
