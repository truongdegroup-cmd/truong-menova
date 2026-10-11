# MENOVA — Website vi sinh ứng dụng chăn nuôi & nông nghiệp

Website giới thiệu thương hiệu MENOVA (Hộ Kinh Doanh Men Vi Sinh MENOVA, ĐKKD số 036200009205) kèm giỏ hàng, thanh toán COD/VNPay/Momo cho 5 sản phẩm: MENOVA F (ủ thức ăn chăn nuôi), MENOVA GREEN (ủ phân hữu cơ), MENOVA BIO 4+ (cải tạo đất & xử lý nước), MENOVA BED (khử mùi chuồng trại), MENOVA DIGEST (hỗ trợ tiêu hoá vật nuôi). Giao diện là HTML/CSS/JS thuần (render qua EJS để dùng chung header/footer), phần giỏ hàng chạy bằng `localStorage`, phần đặt hàng và thanh toán chạy qua một backend Node.js/Express nhỏ gọn.

## Vì sao có backend, dù giao diện là HTML tĩnh

Thanh toán online (VNPay, Momo) bắt buộc phải ký yêu cầu bằng một khoá bí mật (secret key). Khoá này **không được phép** nằm trong JavaScript phía trình duyệt — ai mở DevTools cũng đọc được, và có thể giả mạo đơn hàng hoặc xác nhận thanh toán khống. Vì vậy phần tạo đơn hàng và ký giao dịch thanh toán nằm trong `routes/api.js`, chạy trên server. Mọi trang giao diện vẫn là HTML/CSS/JS bình thường, không cần build phức tạp (không React/Next/Webpack).

## Cấu trúc thư mục

```
server.js              Điểm khởi động Express
routes/pages.js         Render các trang (EJS)
routes/api.js            API: tạo đơn hàng, thanh toán, liên hệ
views/                   Các trang .ejs (header/footer dùng chung trong views/partials)
public/css/style.css     Toàn bộ hệ thống thiết kế (màu, chữ, component)
public/js/               cart.js (giỏ hàng), checkout.js, main.js, cart-page.js
public/images/           Minh hoạ SVG tự thiết kế
data/products.json       Danh mục sản phẩm (sửa trực tiếp file này để thêm/sửa sản phẩm)
data/blog.json           Bài viết blog
db/orders.js             Thao tác với SQLite (dùng node:sqlite có sẵn trong Node, không cần cài thêm)
utils/vnpay.js            Ký & xác minh giao dịch VNPay
utils/momo.js             Gọi API & xác minh IPN Momo
```

## Chạy thử ở máy local

Yêu cầu Node.js **22.5 trở lên** (dự án dùng `node:sqlite` có sẵn trong Node, không cần cài driver database riêng). Khuyến nghị Node 22 LTS hoặc mới hơn.

```bash
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:3000`. Giá trị mặc định trong `.env.example` là khoá demo — nút "Thanh toán qua VNPay/Momo" sẽ tạo được link sandbox VNPay, nhưng Momo cần tài khoản sandbox thật mới gọi API thành công. Thanh toán khi nhận hàng (COD) hoạt động đầy đủ không cần cấu hình gì thêm.

## Cấu hình thanh toán thật trước khi lên hosting thật

Trong `.env` (xem `.env.example` để biết đầy đủ biến):

- **VNPay**: đăng ký merchant tại VNPay, lấy `vnp_TmnCode` và `HashSecret` từ cổng merchant, điền vào `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET`. Đổi `VNPAY_URL` sang URL production (`https://pay.vnpay.vn/vpcpay.html`) khi không còn dùng sandbox.
- **Momo**: đăng ký tại business.momo.vn, lấy `partnerCode`, `accessKey`, `secretKey`, điền vào biến tương ứng. Đổi `MOMO_ENDPOINT` sang endpoint production khi đã có merchant thật.
- Đổi `SITE_URL`, `VNPAY_RETURN_URL`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL` sang domain thật (ví dụ `https://menova.vn/...`) — các cổng thanh toán không gọi được về `localhost`.

## Triển khai lên hosting

Vì có phần backend Node.js (bắt buộc để ký giao dịch thanh toán và lưu đơn hàng), cần hosting **hỗ trợ chạy tiến trình Node.js liên tục** — không dùng được hosting tĩnh thuần (như GitHub Pages) cho toàn bộ chức năng, dù giao diện vẫn là HTML/CSS/JS.

**Gợi ý nền tảng** (đều có gói miễn phí/giá rẻ, dễ deploy từ Git):
- [Render.com](https://render.com) — tạo "Web Service" mới, trỏ vào repo, build command `npm install`, start command `npm start`.
- [Railway.app](https://railway.app) — tương tự Render, deploy từ Git trong vài phút.
- VPS riêng (DigitalOcean, Vultr, hoặc nhà cung cấp Việt Nam) — cài Node.js, chạy bằng `pm2 start server.js`, cấu hình Nginx reverse proxy + SSL (Let's Encrypt).

**Lưu ý quan trọng về dữ liệu đơn hàng**: Database là file SQLite (`db/menova.db`), lưu trực tiếp trên ổ đĩa server. Trên các nền tảng serverless (Vercel, Netlify Functions) ổ đĩa bị xoá sau mỗi lần gọi hàm, **đơn hàng sẽ mất** — vì vậy bắt buộc chọn nền tảng có tiến trình Node chạy liên tục với ổ đĩa cố định (Render/Railway/VPS ở trên), không dùng Vercel/Netlify cho phần backend này.

### Các bước deploy lên Render (ví dụ)

1. Đẩy code lên GitHub.
2. Trên Render: New → Web Service → chọn repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Thêm Environment Variables giống nội dung `.env` (dùng khoá VNPay/Momo thật).
5. Thêm một **Persistent Disk** (Render hỗ trợ sẵn) mount vào thư mục `db/` để dữ liệu đơn hàng không mất khi redeploy.
6. Trỏ domain `menova.vn` về Render qua CNAME, bật SSL tự động.

## Những phần cần bạn cung cấp để hoàn thiện 100%

- Logo thật: đã có (`public/images/logo-icon.png`, `logo-full.png` — cắt từ `D:\LOGO + FILE THIẾT KẾ\LOGO MENOVA\LOGO MENOVA-01PNG.png`). Nếu có bản vector (.ai/.pdf) muốn xuất lại độ nét cao hơn, gửi thêm.
- Ảnh chụp sản phẩm thật (hiện dùng minh hoạ SVG tự vẽ theo tông màu thương hiệu — logo, bao bì, composition icon). Khi có ảnh chụp bao bì thật, thay vào `public/images/product-menova-*.svg` bằng ảnh `.jpg/.png` và cập nhật đường dẫn trong `data/products.json`.
- Tài khoản merchant VNPay/Momo thật để nhận thanh toán online thực tế (hiện dùng khoá demo trong `.env`).
- Giấy công bố hợp quy / hợp chuẩn cho từng sản phẩm thức ăn chăn nuôi bổ sung (theo quy định của Cục Chăn nuôi — Bộ Nông nghiệp), nên bổ sung số công bố vào trang sản phẩm khi có.
- Rà soát pháp lý/kỹ thuật nội dung: toàn bộ copy, liều dùng là tổng hợp từ tài liệu bạn cung cấp, nên có người có chuyên môn kiểm tra lại trước khi quảng cáo chính thức.
- Nội dung blog hiện là bài viết mẫu dựa trên thông tin sản phẩm — có thể thay bằng bài viết thật nếu bạn đã có sẵn.
