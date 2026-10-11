# MENOVA — Website vi sinh ứng dụng chăn nuôi & nông nghiệp

Website giới thiệu thương hiệu MENOVA (Hộ Kinh Doanh Men Vi Sinh MENOVA, ĐKKD số 036200009205) cho 5 sản phẩm: MENOVA F (ủ thức ăn chăn nuôi), MENOVA GREEN (ủ phân hữu cơ), MENOVA BIO 4+ (cải tạo đất & xử lý nước), MENOVA BED (khử mùi chuồng trại), MENOVA DIGEST (hỗ trợ tiêu hoá vật nuôi).

Giỏ hàng chạy hoàn toàn phía trình duyệt bằng `localStorage`. Khi khách bấm **"Đặt hàng qua Zalo"** ở trang giỏ hàng, trang tự soạn sẵn nội dung đơn hàng (tên sản phẩm, số lượng, thành tiền, tổng cộng), sao chép vào clipboard và mở khung chat Zalo của MENOVA để khách dán gửi — không có bước thanh toán trực tuyến, đơn giản và không cần tài khoản merchant VNPay/Momo.

## Cấu trúc thư mục

```
server.js              Điểm khởi động Express
routes/pages.js         Render các trang (EJS)
routes/api.js            API: lưu lời nhắn liên hệ
views/                   Các trang .ejs (header/footer dùng chung trong views/partials)
public/css/style.css     Toàn bộ hệ thống thiết kế (màu, chữ, component)
public/js/               cart.js (giỏ hàng), cart-page.js (trang giỏ hàng + đặt hàng qua Zalo), main.js
public/images/           Logo, ảnh sản phẩm, ảnh banner thật của MENOVA
data/products.json       Danh mục sản phẩm (sửa trực tiếp file này để thêm/sửa sản phẩm)
data/blog.json           Bài viết blog
db/orders.js             Lưu lời nhắn liên hệ vào SQLite (dùng node:sqlite có sẵn trong Node)
```

## Vì sao vẫn có backend Node, dù không còn thanh toán online

Phần lớn trang là HTML/CSS/JS tĩnh. Backend Express chỉ còn hai việc: dùng EJS để dùng chung header/footer giữa các trang, và nhận lời nhắn từ form Liên hệ để lưu lại (`routes/api.js`, bảng `contacts` trong SQLite). Việc đặt hàng không đi qua server nữa — toàn bộ xử lý ở trình duyệt rồi chuyển thẳng sang Zalo.

## Chạy thử ở máy local

Yêu cầu Node.js **22.5 trở lên** (dự án dùng `node:sqlite` có sẵn trong Node, không cần cài driver database riêng).

```bash
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:3000`.

## Triển khai lên hosting

Cần hosting hỗ trợ chạy tiến trình Node.js (để phục vụ trang EJS và lưu lời nhắn liên hệ):

- [Render.com](https://render.com) — tạo "Web Service" mới, trỏ vào repo, build command `npm install`, start command `npm start`.
- [Railway.app](https://railway.app) — tương tự Render, deploy từ Git trong vài phút.
- VPS riêng (DigitalOcean, Vultr, hoặc nhà cung cấp Việt Nam) — cài Node.js, chạy bằng `pm2 start server.js`, cấu hình Nginx reverse proxy + SSL (Let's Encrypt).

Nếu không cần lưu lời nhắn liên hệ vào database (chỉ cần nhận qua email/Zalo), có thể bỏ hẳn phần backend và xuất toàn bộ trang thành HTML tĩnh để deploy lên bất kỳ hosting tĩnh nào (Netlify, Vercel, GitHub Pages, shared hosting) — báo tôi nếu bạn muốn chuyển theo hướng này.

### Các bước deploy lên Render (ví dụ)

1. Đẩy code lên GitHub.
2. Trên Render: New → Web Service → chọn repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Thêm Environment Variables giống nội dung `.env`.
5. Trỏ domain `menova.vn` về Render qua CNAME, bật SSL tự động.

## Cập nhật số Zalo / Facebook nhận đơn

Sửa trong `routes/pages.js`, object `SITE`:

```js
facebook: 'https://www.facebook.com/menovavietnam',
zalo: 'https://zalo.me/0869688384',
```

## Những phần cần bạn cung cấp để hoàn thiện 100%

- Giấy công bố hợp quy / hợp chuẩn cho từng sản phẩm thức ăn chăn nuôi bổ sung (theo quy định của Cục Chăn nuôi — Bộ Nông nghiệp), nên bổ sung số công bố vào trang sản phẩm khi có.
- Rà soát pháp lý/kỹ thuật nội dung: toàn bộ copy, liều dùng là tổng hợp từ tài liệu bạn cung cấp, nên có người có chuyên môn kiểm tra lại trước khi quảng cáo chính thức.
- Nội dung blog hiện là bài viết mẫu dựa trên thông tin sản phẩm — có thể thay bằng bài viết thật nếu bạn đã có sẵn.
