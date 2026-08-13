# Demo script Smart Rental

Tai lieu nay dung de chay demo 5-7 phut cho giang vien hoac khach dung thu.

## Dieu kien truoc demo

- Backend va frontend dang chay on dinh.
- Database demo co san phong, khach thue, hop dong, hoa don va thanh toan mau.
- Tai khoan landlord dang nhap duoc.
- Neu demo luong tenant, cau hinh SMTP truoc va dung email khach thue de nhan thong tin dang nhap.
- Khong demo bang database production that neu chua backup.

## Kich ban 5-7 phut

1. Dang nhap bang tai khoan landlord.
2. Mo Dashboard de gioi thieu tong quan phong, doanh thu, cong no va canh bao.
3. Mo Phong, loc phong trong, tao hoac sua mot phong.
4. Mo Khach thue, them khach thue va gan voi phong.
5. Mo Hop dong, tao hop dong active cho khach thue.
6. Kiem tra he thong bao da gui thong tin dang nhap qua email tenant.
7. Xem truoc va tai PDF hop dong.
8. Mo Dich vu, nhap chi so dien/nuoc va tao hoa don thang.
9. Mo Thanh toan, kiem tra khoan thu sinh tu hoa don va danh dau da thu.
10. Quay lai Dashboard de cho thay so lieu da cap nhat.
11. Dang xuat landlord, dang nhap tenant bang tai khoan tam.
12. Doi mat khau tenant neu he thong yeu cau, sau do xem cong khach thue.

## Diem can noi ro khi bao ve

- He thong dung JWT de bao ve API va phan role landlord/tenant.
- Du lieu cua moi chu tro duoc tach bang truong `owner`, backend luon loc theo `req.user._id`.
- Hoa don va thanh toan duoc tach rieng: `Invoice` la khoan phai thu, `Payment` la giao dich/ghi nhan thu tien.
- VNPay/MoMo hien la phuong thuc ghi nhan/mock. De tich hop that can them create payment URL, return URL, IPN/webhook, verify chu ky va transaction log.
- Ban co the ban thu cho chu tro nho khi deploy production, dung database rieng, tat dang ky cong khai va checklist test production pass.

## Loi demo thuong gap

- Khong dang nhap duoc: kiem tra backend `.env`, MongoDB Atlas va seed data.
- Frontend bi CORS: kiem tra `CLIENT_URLS` trong backend production.
- Build loi `spawn EPERM` tren Windows sandbox: chay build ngoai sandbox; day la loi moi truong Vite/esbuild da ghi nhan, khong phai loi code neu build ngoai sandbox pass.
- Khong tao duoc hop dong active: phong da co hop dong active hoac dang bao tri.
- Khong thay email tenant: kiem tra cau hinh SMTP va dung nut cap lai mat khau trong trang Khach thue.
