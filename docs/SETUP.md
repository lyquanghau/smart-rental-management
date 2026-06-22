# Setup cho cả nhóm

Tài liệu này là nguồn chuẩn để 3 máy setup giống nhau.

## 1. Cài công cụ

Cả nhóm dùng cùng phiên bản:

- Node.js `22.21.0`
- npm `10.9.4`

Kiểm tra:

```bash
node -v
npm -v
```

## 2. Clone và cài dependencies

```bash
git clone <repo-url>
cd smart-rental
npm ci
```

Không dùng `npm install` sau khi clone nếu chỉ muốn đồng bộ dependencies. `npm ci` sẽ cài đúng theo `package-lock.json`.

## 3. Tạo file môi trường

Windows:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền `MONGODB_URI` trong `backend/.env` bằng connection string từ MongoDB Atlas.

## 4. MongoDB Atlas

Tạo database:

```txt
smart_rental_dev
```

Khuyến nghị:

- Tạo 1 database dev dùng chung.
- Tạo user riêng cho project.
- Không nhập dữ liệu mẫu thủ công nếu dữ liệu đó cần dùng chung; hãy cập nhật seed script.

## 5. Seed dữ liệu mẫu

```bash
npm run seed
```

Nếu muốn reset lại dữ liệu phòng mẫu:

```bash
npm run seed:reset
```

## 6. Chạy dự án

```bash
npm run dev
```

URL mặc định:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

## 7. Khi thêm package

Ví dụ thêm package cho backend:

```bash
npm install <package-name> -w backend
```

Ví dụ thêm package cho frontend:

```bash
npm install <package-name> -w frontend
```

Sau đó commit cả:

- `package.json`
- `package-lock.json`
