# Backup and restore

Tai lieu nay dung cho giai doan pilot/production nho. Muc tieu la tranh mat du lieu phong,
khach thue, hop dong, hoa don va thanh toan.

## Nguyen tac an toan

- Khong restore de len database production khi chua co ban backup moi nhat.
- Database test/restore phai co ten rieng, vi du `smart_rental_restore_test`.
- Khong dua file backup len Git.
- Khong chia se connection string co username/password trong chat, slide hoac bao cao public.
- Truoc khi restore production, dung app va thong bao cho nguoi dung dang thao tac.

## Backup MongoDB Atlas bang UI

1. Vao MongoDB Atlas project.
2. Chon cluster dang dung cho demo/production.
3. Mo tab backup/snapshot theo goi Atlas dang dung.
4. Tao snapshot thu cong truoc khi deploy thay doi lon hoac truoc demo quan trong.
5. Ghi lai thoi diem snapshot, database, nguoi tao va ly do tao trong `docs/WORK_LOG.md`.

## Backup bang mongodump

Can cai MongoDB Database Tools tren may chay lenh.

```bash
mongodump --uri="<MONGODB_URI>" --out="./backups/smart-rental-YYYY-MM-DD"
```

Thu muc `backups/` phai nam ngoai Git hoac da duoc ignore. Neu backup chua duoc ma hoa,
khong gui qua email/chat nhom.

## Restore vao database test

Luon restore vao database test truoc de kiem tra file backup co dung hay khong.

```bash
mongorestore --uri="<MONGODB_TEST_URI>" "./backups/smart-rental-YYYY-MM-DD"
```

Sau khi restore test:

- Dang nhap tai khoan demo.
- Mo dashboard, phong, khach thue, hop dong, dich vu, hoa don, thanh toan.
- Kiem tra tenant portal voi tai khoan khach thue.

## Restore production

Chi thuc hien khi da co ly do ro rang, vi du mat du lieu hoac deploy loi nghiem trong.

1. Tao backup production moi nhat truoc khi restore.
2. Xac nhan dung file backup can restore.
3. Restore vao database test va smoke test.
4. Tam dung ghi du lieu tren app neu co the.
5. Restore production bang Atlas UI hoac `mongorestore`.
6. Chay smoke test production:
   - `GET /api/health`
   - Dang nhap landlord
   - Kiem tra dashboard
   - Kiem tra 1 hoa don va 1 hop dong
   - Dang nhap tenant portal

## Lich backup de xuat

- Moi ngay: snapshot Atlas neu goi dang dung ho tro.
- Truoc moi lan deploy production: backup thu cong.
- Truoc demo/bao ve: backup thu cong va export database demo.
- Sau khi co khach that: toi thieu 1 backup moi ngay, luu toi thieu 7 ngay gan nhat.

## Backlog tu dong hoa

- Script `npm run backup` de chay `mongodump` theo env rieng.
- Luu backup vao cloud storage co ma hoa.
- Canh bao neu backup gan nhat qua 24 gio.
