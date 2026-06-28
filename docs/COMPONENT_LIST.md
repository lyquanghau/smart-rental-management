# Component List

## Mục tiêu

Tài liệu này liệt kê các page, component, layout và service chính của frontend.
Danh sách bám theo cấu trúc hiện tại trong `frontend/src`.

## Layout

| Tên        | File                                  | Mục đích                                                 |
| ---------- | ------------------------------------- | -------------------------------------------------------- |
| MainLayout | `frontend/src/layouts/MainLayout.jsx` | Khung layout chính gồm sidebar, header và vùng nội dung. |

## Components

| Tên             | File                                          | Mục đích                                                                         |
| --------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Sidebar         | `frontend/src/components/Sidebar.jsx`         | Điều hướng giữa Dashboard, Phòng, Khách thuê, Hợp đồng, Thanh toán và Đăng nhập. |
| Header          | `frontend/src/components/Header.jsx`          | Hiển thị thông tin người dùng hiện tại và nút đăng xuất.                         |
| RoomStatusBadge | `frontend/src/components/RoomStatusBadge.jsx` | Hiển thị trạng thái phòng bằng badge dễ phân biệt.                               |

## Pages

| Tên           | File                                   | Mục đích                                                        |
| ------------- | -------------------------------------- | --------------------------------------------------------------- |
| DashboardPage | `frontend/src/pages/DashboardPage.jsx` | Hiển thị số liệu tổng quan cơ bản.                              |
| LoginPage     | `frontend/src/pages/LoginPage.jsx`     | Form đăng nhập bằng email và mật khẩu.                          |
| RoomsPage     | `frontend/src/pages/RoomsPage.jsx`     | Danh sách phòng, lọc trạng thái và hiển thị thông tin phòng.    |
| TenantsPage   | `frontend/src/pages/TenantsPage.jsx`   | Quản lý khách thuê: danh sách, thêm, sửa, xóa mềm.              |
| ContractsPage | `frontend/src/pages/ContractsPage.jsx` | Quản lý hợp đồng: danh sách, thêm, sửa, xem, kết thúc hợp đồng. |
| PaymentsPage  | `frontend/src/pages/PaymentsPage.jsx`  | Quản lý khoản thu: danh sách, thêm, sửa, đánh dấu đã thu, hủy.  |

## Services

| Tên             | File                                       | Mục đích                                                 |
| --------------- | ------------------------------------------ | -------------------------------------------------------- |
| api             | `frontend/src/services/api.js`             | Cấu hình Axios, base URL, Bearer token và chuẩn hóa lỗi. |
| authService     | `frontend/src/services/authService.js`     | Đăng nhập và đăng xuất.                                  |
| sessionStorage  | `frontend/src/services/sessionStorage.js`  | Lưu/xóa token và user trong local storage.               |
| roomService     | `frontend/src/services/roomService.js`     | Gọi API phòng.                                           |
| tenantService   | `frontend/src/services/tenantService.js`   | Gọi API khách thuê.                                      |
| contractService | `frontend/src/services/contractService.js` | Gọi API hợp đồng.                                        |
| paymentService  | `frontend/src/services/paymentService.js`  | Gọi API thanh toán.                                      |

## Hooks

| Tên          | File                           | Mục đích                                                                                      |
| ------------ | ------------------------------ | --------------------------------------------------------------------------------------------- |
| Hooks README | `frontend/src/hooks/README.md` | Ghi quy ước cho custom hooks. Hiện chưa có hook code vì chưa có logic lặp lại đủ lớn để tách. |

## Component dự kiến có thể tách sau

Các màn hình hiện vẫn đang dùng form/table trực tiếp trong page để giữ tốc độ MVP.
Khi code lặp lại nhiều hơn, có thể tách:

- `DataTable`: bảng danh sách dùng chung.
- `EmptyState`: trạng thái không có dữ liệu.
- `LoadingState`: trạng thái đang tải.
- `FormActions`: nhóm nút lưu/hủy.
- `StatusBadge`: badge dùng chung cho hợp đồng/thanh toán.
- `ConfirmDialog`: thay thế `window.confirm` khi cần UX tốt hơn.

## Ghi chú quyết định

Chưa tách modal riêng vì các form hiện nằm trực tiếp trên trang, phù hợp với MVP
và dễ kiểm tra. Nếu sau này UI cần gọn hơn, form thêm/sửa có thể chuyển vào modal.
