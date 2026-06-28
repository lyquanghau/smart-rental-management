# Wireframe

## Mục tiêu

Thư mục này ghi wireframe mức low-fidelity cho các màn hình chính của Smart Rental.
Do dự án đang ưu tiên code MVP, wireframe hiện được mô tả bằng layout text để cả
nhóm có thể đối chiếu nhanh. Khi cần nộp báo cáo hoặc slide, có thể vẽ lại các
màn hình này bằng Figma, draw.io hoặc ảnh chụp từ app thật.

## Màn hình đăng nhập

```txt
+--------------------------------------------------+
| Smart Rental                                     |
| Quản lý phòng trọ                                |
|                                                  |
|  Đăng nhập                                       |
|  +--------------------------------------------+  |
|  | Email                                      |  |
|  +--------------------------------------------+  |
|  | Mật khẩu                                   |  |
|  +--------------------------------------------+  |
|  [ Đăng nhập ]                                   |
+--------------------------------------------------+
```

Thành phần chính:

- Tiêu đề app.
- Form email/mật khẩu.
- Thông báo lỗi khi đăng nhập thất bại.
- Nút đăng nhập.

## Layout quản trị

```txt
+----------------------+---------------------------+
| Sidebar              | Header                    |
| - Tổng quan          | User + Đăng xuất          |
| - Phòng              +---------------------------+
| - Khách thuê         | Nội dung từng trang       |
| - Hợp đồng           |                           |
| - Thanh toán         |                           |
| - Đăng nhập          |                           |
+----------------------+---------------------------+
```

Thành phần chính:

- Sidebar điều hướng.
- Header hiển thị user hiện tại.
- Vùng nội dung thay đổi theo route.

## Màn hình danh sách phòng

```txt
+--------------------------------------------------+
| Phòng                                [Filter]     |
+--------------------------------------------------+
| Card phòng A101 | Card phòng A102 | Card B201    |
| Tầng, giá       | Tầng, giá       | Tầng, giá    |
| Badge trạng thái| Badge trạng thái| Badge        |
+--------------------------------------------------+
```

Thành phần chính:

- Tiêu đề trang.
- Filter trạng thái phòng.
- Grid card phòng.
- Badge trạng thái: trống, đã thuê, bảo trì.

## Màn hình khách thuê

```txt
+----------------------+---------------------------+
| Form khách thuê      | Bảng khách thuê           |
| - Họ tên             | Họ tên | Phòng | Thao tác |
| - SĐT                | ...                       |
| - Email              | [Sửa] [Xóa]               |
| - CCCD/CMND          |                           |
| - Phòng              |                           |
| [Thêm/Cập nhật]      |                           |
+----------------------+---------------------------+
```

Thành phần chính:

- Form thêm/sửa khách thuê.
- Bảng danh sách khách thuê.
- Thao tác sửa và xóa mềm.

## Màn hình hợp đồng

```txt
+----------------------+---------------------------+
| Form hợp đồng        | Bảng hợp đồng             |
| - Phòng              | Phòng/khách | Thời hạn    |
| - Khách thuê         | Tài chính   | Trạng thái  |
| - Ngày bắt đầu       | [Sửa] [Kết thúc] / [Xem]  |
| - Thời hạn           |                           |
| - Giá thuê           |                           |
| - Tiền cọc           |                           |
| [Thêm/Cập nhật]      |                           |
+----------------------+---------------------------+
```

Thành phần chính:

- Form tạo/sửa hợp đồng.
- Tự tính ngày kết thúc theo thời hạn.
- Tự điền giá thuê theo phòng.
- Bảng hợp đồng và thao tác kết thúc hợp đồng.

## Màn hình thanh toán

```txt
+----------------------+---------------------------+
| Form khoản thu       | Filter + Bảng khoản thu   |
| - Hợp đồng           | Hợp đồng | Hạn/ngày thu   |
| - Số tiền            | Số tiền  | Trạng thái     |
| - Hạn thanh toán     | [Sửa] [Đã thu] [Hủy]      |
| - Phương thức        |                           |
| - Trạng thái         |                           |
| - Ghi chú            |                           |
| [Thêm/Cập nhật]      |                           |
+----------------------+---------------------------+
```

Thành phần chính:

- Form tạo/sửa khoản thu.
- Filter trạng thái thanh toán.
- Bảng khoản thu.
- Thao tác đánh dấu đã thu hoặc hủy.

## Màn hình dashboard

```txt
+--------------------------------------------------+
| Tổng quan                                        |
+--------------------------------------------------+
| Phòng trống | Đã thuê | Bảo trì                  |
+--------------------------------------------------+
```

Thành phần chính:

- Các metric card cơ bản.
- Sau này có thể bổ sung doanh thu, hợp đồng sắp hết hạn và hóa đơn chưa thu.

## Ghi chú

- Wireframe text này đủ để khóa bố cục MVP hiện tại.
- Khi cần hình ảnh chính thức, dùng nội dung này để vẽ lại trên Figma/draw.io hoặc chụp màn hình từ app đã chạy.
