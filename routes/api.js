const express = require('express');
const router = express.Router();
const orders = require('../db/orders');

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
