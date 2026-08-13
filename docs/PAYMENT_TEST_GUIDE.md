# Payment test guide

Tai lieu nay dung de test nhanh cac luong thanh toan, auto status va Discord notification.

## 1. Chuan bi env local

Trong `backend/.env`, can co cac bien toi thieu:

```txt
MONGODB_URI=<database dev cua ban>
JWT_SECRET=<secret local it nhat 32 ky tu>
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
SEPAY_MOCK_MODE=true
SEPAY_AUTH_MODE=hmac
DISCORD_WEBHOOK_URL=<optional>
```

Neu chua co Discord webhook thi de trong `DISCORD_WEBHOOK_URL=`. Flow thanh toan van hoat dong.

## 2. Tao du lieu test khong xoa database

Chay:

```bash
npm run seed:payment-test
```

Script nay khong reset database. No upsert cac ban ghi test co dinh:

- Landlord: `payment-test-landlord@smartrental.local` / `Admin@123456`
- Tenant: `payment-test-tenant@smartrental.local` / `Tenant@123456`
- Room: `PAYMENT-TEST-101`
- Hoa don `TEST_AUTO_OVERDUE`: due date truoc ngay hien tai, dung de test tu chuyen `overdue`.
- Hoa don `TEST_SEPAY_QR`: due date sap toi, dung de test QR/SePay/Discord.

## 3. Chay app local

Chay:

```bash
npm run dev:safe
```

Ghi chu: `dev:safe` chay backend bang `node src/server.js` thay vi `nodemon`, tranh loi
`spawn EPERM` tren mot so may Windows.

Mo frontend:

```txt
http://localhost:5173
```

## 4. Test auto overdue

1. Dang nhap landlord bang:

```txt
payment-test-landlord@smartrental.local
Admin@123456
```

2. Vao `Dashboard`.
3. Vao `Dich vu` hoac `Thanh toan`.
4. Tim hoa don/payment co note `TEST_AUTO_OVERDUE`.
5. Ket qua dung:
   - Hoa don tu `issued` sang `overdue`.
   - Payment tu `pending` sang `overdue`.
   - Cac ban ghi `paid` hoac `cancelled` khong bi doi trang thai.

## 5. Test tenant QR va SePay mock

1. Dang xuat landlord.
2. Dang nhap tenant:

```txt
payment-test-tenant@smartrental.local
Tenant@123456
```

3. Vao `Cong khach thue`.
4. Tim hoa don co note `TEST_SEPAY_QR`.
5. Bam `Hien QR thanh toan`.
6. Ket qua dung:
   - Hien QR/VietQR.
   - Hien so tien `2,600,000 VND`.
   - Noi dung chuyen khoan bat dau bang `SRINV...`.

Neu trong UI co nut mock thanh toan o moi truong dev thi bam mock va kiem tra:

- Hoa don sang `paid`.
- Payment lien quan sang `paid`.
- Method/provider la `sepay`.
- Landlord thay notification noi bo.
- Discord nhan message neu `DISCORD_WEBHOOK_URL` dung.

## 6. Test SePay production webhook

Chi lam buoc nay khi da co webhook secret that tu SePay.

Backend production env nen la:

```txt
SEPAY_MOCK_MODE=false
SEPAY_AUTH_MODE=hmac
SEPAY_WEBHOOK_SECRET=<secret tu SePay>
DISCORD_WEBHOOK_URL=<optional>
```

Webhook URL tren SePay:

```txt
https://smart-rental-management-r1eu.onrender.com/api/webhooks/sepay
```

Checklist:

1. Tenant bam `Hien QR thanh toan`.
2. Chuyen khoan dung so tien.
3. Noi dung chuyen khoan dung ma `SRINV...`.
4. Xem SePay delivery log phai tra success.
5. Vao app kiem tra hoa don/payment sang `paid`.
6. Kiem tra landlord notification va Discord.

## 7. Loi thuong gap

- QR khong co amount/addInfo: kiem tra `Ma ngan hang VietQR`, so tai khoan va chu tai khoan trong trang `Dich vu`.
- SePay webhook 401: sai `SEPAY_WEBHOOK_SECRET`, sai timestamp/signature, hoac Render chua redeploy sau khi doi env.
- Hoa don khong sang `paid`: so tien chuyen khoan khong khop `Invoice.totalAmount` hoac noi dung khong co ma `SRINV...`.
- Discord khong nhan message: kiem tra `DISCORD_WEBHOOK_URL`; loi Discord khong lam fail giao dich.
