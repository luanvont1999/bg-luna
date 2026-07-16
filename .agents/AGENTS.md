# Style Guidelines for Boardgame Hub

Dự án này sử dụng phong cách thiết kế đặc thù được người dùng yêu thích:

## 1. Phong cách thiết kế (Aesthetic & Theme)
- **Chủ đề (Theme)**: Giao diện sáng (Light Theme), màu nền kem ấm áp (`#FFFDFb` hoặc `#fbf7ed`).
- **Phong cách**: Hoạt hình vui tươi (Playful Cartoonish / Neo-brutalism).
- **Đường viền**: Sử dụng viền đen đậm (`3px solid #1e1e24`) cho tất cả các thẻ (cards), nút bấm (buttons), input, và hình vẽ logo.
- **Bóng đổ 3D**: Sử dụng bóng đổ dạng khối cứng, không làm mờ (`box-shadow: 5px 5px 0px #1e1e24`).
- **Tương tác vật lý**: Nút bấm khi di chuột (hover) dịch chuyển nhẹ và khi nhấn (active) lún sâu tương thích với bóng đổ để tạo hiệu ứng bấm vật lý.
- **Phông chữ**: Phông chữ bo tròn thân thiện **Quicksand** hoặc **Fredoka** từ Google Fonts.

## 2. Thiết kế di động (Mobile-First Layout)
- Thiết kế tối ưu hóa hiển thị dọc cho điện thoại.
- Sử dụng **Bottom Tab Bar** (thanh điều hướng cạnh dưới) đối với màn hình di động (`max-width: 768px`) thay cho thanh menu rút gọn (hamburger menu) truyền thống.
- Kích thước chạm (touch targets) tối thiểu `48px` để thao tác dễ dàng trên di động.
