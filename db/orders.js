const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'menova.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    note TEXT,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function generateOrderCode() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `MNV${stamp}${rand}`;
}

function createOrder(order) {
  const orderCode = generateOrderCode();
  const stmt = db.prepare(`
    INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, payment_status, subtotal, shipping_fee, total, items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    orderCode,
    order.customerName,
    order.phone,
    order.email || '',
    order.address,
    order.note || '',
    order.paymentMethod,
    order.paymentMethod === 'cod' ? 'cod_pending' : 'awaiting_payment',
    order.subtotal,
    order.shippingFee,
    order.total,
    JSON.stringify(order.items)
  );
  return { id: Number(result.lastInsertRowid), orderCode };
}

function getOrderByCode(orderCode) {
  const stmt = db.prepare('SELECT * FROM orders WHERE order_code = ?');
  return stmt.get(orderCode);
}

function updatePaymentStatus(orderCode, status) {
  const stmt = db.prepare(
    "UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE order_code = ?"
  );
  stmt.run(status, orderCode);
}

function saveContact({ name, email, phone, message }) {
  const stmt = db.prepare(
    'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)'
  );
  stmt.run(name, email, phone || '', message);
}

module.exports = {
  createOrder,
  getOrderByCode,
  updatePaymentStatus,
  saveContact,
};
