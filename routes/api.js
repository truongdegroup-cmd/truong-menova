const express = require('express');
const router = express.Router();
const orders = require('../db/orders');
const vnpay = require('../utils/vnpay');
const momo = require('../utils/momo');

const SHIPPING_FEE = 25000;
const FREE_SHIPPING_THRESHOLD = 300000;

function computeTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

// Tao don hang (COD hoac buoc dau cho thanh toan online)
router.post('/orders', express.json(), (req, res) => {
  const { customerName, phone, email, address, note, paymentMethod, items } = req.body;

  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Thiếu thông tin đơn hàng. Vui lòng kiểm tra lại.' });
  }
  if (!['cod', 'vnpay', 'momo'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ.' });
  }

  const { subtotal, shippingFee, total } = computeTotals(items);
  const { orderCode } = orders.createOrder({
    customerName,
    phone,
    email,
    address,
    note,
    paymentMethod,
    subtotal,
    shippingFee,
    total,
    items,
  });

  res.json({ orderCode, subtotal, shippingFee, total });
});

// Bat dau thanh toan VNPay - tra ve URL de redirect
router.post('/payment/vnpay/create', express.json(), (req, res) => {
  const { orderCode } = req.body;
  const order = orders.getOrderByCode(orderCode);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

  const paymentUrl = vnpay.buildPaymentUrl({
    orderCode: order.order_code,
    amount: order.total,
    orderInfo: `Thanh toan don hang ${order.order_code}`,
    ipAddr: req.ip,
  });

  res.json({ paymentUrl });
});

// VNPay redirect ve day sau khi khach thanh toan
router.get('/payment/vnpay/return', (req, res) => {
  const isValid = vnpay.verifyReturn(req.query);
  const orderCode = req.query.vnp_TxnRef;
  const success = isValid && req.query.vnp_ResponseCode === '00';

  if (orderCode) {
    orders.updatePaymentStatus(orderCode, success ? 'paid' : 'failed');
  }

  res.redirect(`/order-success?orderCode=${encodeURIComponent(orderCode || '')}&status=${success ? 'success' : 'failed'}`);
});

// Bat dau thanh toan Momo - goi API Momo, tra ve payUrl de redirect
router.post('/payment/momo/create', express.json(), async (req, res) => {
  const { orderCode } = req.body;
  const order = orders.getOrderByCode(orderCode);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

  try {
    const momoRes = await momo.createPaymentRequest({
      orderCode: order.order_code,
      amount: order.total,
      orderInfo: `Thanh toan don hang ${order.order_code}`,
    });

    if (momoRes.payUrl) {
      res.json({ paymentUrl: momoRes.payUrl });
    } else {
      res.status(502).json({ error: 'Không khởi tạo được thanh toán Momo.', detail: momoRes });
    }
  } catch (err) {
    res.status(502).json({ error: 'Lỗi kết nối tới Momo. Vui lòng thử lại hoặc chọn phương thức khác.' });
  }
});

// Momo goi ve day (server-to-server) de xac nhan ket qua thanh toan
router.post('/payment/momo/ipn', express.json(), (req, res) => {
  const valid = momo.verifyIpnSignature(req.body);
  const orderCode = req.body.orderId;
  const success = valid && Number(req.body.resultCode) === 0;

  if (orderCode) {
    orders.updatePaymentStatus(orderCode, success ? 'paid' : 'failed');
  }

  res.status(204).end();
});

// Tra cuu trang thai don hang (dung cho trang order-success)
router.get('/orders/:orderCode', (req, res) => {
  const order = orders.getOrderByCode(req.params.orderCode);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json(order);
});

// Form lien he
router.post('/contact', express.json(), (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, email và nội dung.' });
  }
  orders.saveContact({ name, email, phone, message });
  res.json({ ok: true });
});

module.exports = router;
