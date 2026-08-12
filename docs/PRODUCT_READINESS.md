# Product readiness

Tai lieu nay dung de danh gia Smart Rental truoc khi demo cho khach that hoac trien khai ban thu.

## Cap nhat pilot-ready

- Chu tro co the cau hinh thong tin chuyen khoan trong trang `Dich vu`.
- Khach thue co the xem ngan hang, so tai khoan, chu tai khoan, noi dung chuyen khoan va ghi chu
  thanh toan trong cong khach thue.
- Chu tro va khach thue co the tai PDF hoa don de in/gui thu cong.
- Dashboard co nhac han hoa don qua han va hoa don den han trong 7 ngay.
- Da co tai lieu backup/restore tai `docs/BACKUP_RESTORE.md`.
- Backend da co endpoint SePay webhook:
  `https://smart-rental-management-r1eu.onrender.com/api/webhooks/sepay`.

## Trang thai SePay

- Tai khoan/ket noi SePay dang cho duyet, chua co Secret Key webhook that.
- Trong thoi gian cho duyet, chi nen demo `SEPAY_MOCK_MODE=true` hoac thu tien bang chuyen khoan
  thu cong.
- Chua bat `SEPAY_MOCK_MODE=false` tren production neu chua co `SEPAY_WEBHOOK_SECRET`.
- Sau khi SePay duyet: tao webhook Money in + HMAC-SHA256, copy Secret Key vao Render env,
  redeploy backend va test mot giao dich nho dung ma `SRINV...`.

## Trang thai hien tai

Ung dung da du loi MVP cho mot nha tro nho:

- Chu tro dang nhap va quan ly phong, khach thue, hop dong, hoa don, thanh toan.
- He thong sinh PDF hop dong va PDF hoa don tu du lieu that.
- Hoa don thang co tien phong, dien, nuoc va phi dich vu.
- Dashboard co so lieu phong, doanh thu, cong no va canh bao hop dong/khoan thu.
- Khach thue co cong rieng de xem phong, hop dong, hoa don va thanh toan cua minh.
- Du lieu nghiep vu da co multi-tenant isolation theo `owner`, phu hop mo hinh nhieu chu tro dung
  chung mot he thong.
- Da co test backend bang `node:test` cho validation model, guard cau hinh production,
  middleware/util quan trong va integration flow co guard an toan cho database test rieng.

## Co the ban thu khi

- Backend da deploy production tren Render hoac nen tang tuong duong.
- Frontend da deploy production tren Vercel hoac nen tang tuong duong.
- MongoDB dung database demo/production rieng, khong dung lan database dev ca nhan.
- `JWT_SECRET` manh, toi thieu 32 ky tu.
- `CLIENT_URLS` chi chua domain frontend that, khong dung `*`.
- `ALLOW_PUBLIC_REGISTRATION=false` neu chua co quy trinh xac minh email/duyet chu tro.
- Co du lieu demo va tai khoan demo duoc kiem tra truoc khi gap khach.
- Checklist trong `docs/TEST_CHECKLIST.md` pass tren moi truong production.
- Neu bat SePay that: SePay da duyet, webhook Money in da tao voi HMAC-SHA256,
  `SEPAY_MOCK_MODE=false`, `SEPAY_AUTH_MODE=hmac`, `SEPAY_WEBHOOK_SECRET` da cau hinh tren Render.

## Chua nen cam ket la san pham thuong mai day du

- SePay dang cho duyet nen chua test duoc giao dich ngan hang that qua webhook production.
- Chua co thanh toan VNPay/MoMo sandbox that gom redirect, return URL, IPN/webhook va kiem tra
  chu ky.
- Chua co automated test suite day du cho frontend UI va cac luong API edge case mo rong.
- Chua co phan he to chuc/chi nhanh nang cao cho mot chu tro quan ly nhieu toa nha hoac nhieu
  nhan vien.
- Chua co sao luu du lieu tu dong, audit log va quy trinh khoi phuc su co.
- Chua co trang dang ky/duyet chu tro kem xac minh email.
- Chua co dieu khoan su dung, chinh sach quyen rieng tu va quy trinh ho tro khach hang.

## Huong uu tien de ban that

1. SePay/VietQR webhook that sau khi tai khoan duoc duyet.
2. Deploy production on dinh, domain that, database production rieng.
3. Billing plan: goi mien phi/tra phi, gioi han so phong hoac so hop dong.
4. Automated tests: test auth, phan quyen owner, hoa don, thanh toan va dashboard.
5. Backup & monitoring: backup MongoDB, log loi server, health check va canh bao downtime.
6. Legal/compliance: dieu khoan su dung, chinh sach du lieu ca nhan, quy trinh xoa du lieu.
7. Organization roles: neu can, them nhan vien/quan ly phu thuoc cung mot chu tro.

## Kich ban demo ban thu

1. Dang nhap chu tro.
2. Xem dashboard tong quan.
3. Tao phong moi hoac kiem tra phong con trong.
4. Them khach thue.
5. Tao hop dong active va ghi lai tai khoan/mat khau tam cua khach thue.
6. Xem truoc va tai PDF hop dong.
7. Nhap chi so dien/nuoc, tao hoa don thang.
8. Lay ma SePay tren cong khach thue va demo mock webhook neu SePay chua duyet.
9. Dang nhap bang tai khoan khach thue, doi mat khau va xem cong khach thue.
