# Hooks

Thư mục này dành cho custom React hooks dùng chung của frontend.

Hiện tại dự án chưa cần tách custom hook riêng vì các màn hình vẫn đang quản lý
state cục bộ trong từng page. Khi có logic lặp lại từ 2 nơi trở lên, ví dụ phân
trang, debounce tìm kiếm, hoặc lấy dữ liệu có cache, hook sẽ được thêm tại đây.

Quy ước:

- Tên file dùng dạng `useSomething.js`.
- Hook chỉ chứa logic dùng lại, không chứa JSX.
- Nếu logic chỉ dùng trong một page và chưa lặp lại, giữ trong page để tránh tạo abstraction sớm.
