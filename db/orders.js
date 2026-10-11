const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'menova.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function saveContact({ name, email, phone, message }) {
  const stmt = db.prepare(
    'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)'
  );
  stmt.run(name, email, phone || '', message);
}

module.exports = {
  saveContact,
};
