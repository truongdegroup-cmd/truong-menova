/* MENOVA — quan ly gio hang phia client bang localStorage */
const MENOVA_CART_KEY = 'menova_cart_v1';

function cartRead() {
  try {
    const raw = localStorage.getItem(MENOVA_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cartWrite(items) {
  localStorage.setItem(MENOVA_CART_KEY, JSON.stringify(items));
  cartUpdateBadge();
  document.dispatchEvent(new CustomEvent('menova:cart-changed', { detail: items }));
}

function cartAdd(product, qty = 1) {
  const items = cartRead();
  const existing = items.find((i) => i.slug === product.slug);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      accent: product.accent,
      qty,
    });
  }
  cartWrite(items);
}

function cartSetQty(slug, qty) {
  let items = cartRead();
  if (qty <= 0) {
    items = items.filter((i) => i.slug !== slug);
  } else {
    const item = items.find((i) => i.slug === slug);
    if (item) item.qty = qty;
  }
  cartWrite(items);
}

function cartRemove(slug) {
  const items = cartRead().filter((i) => i.slug !== slug);
  cartWrite(items);
}

function cartClear() {
  cartWrite([]);
}

function cartCount() {
  return cartRead().reduce((sum, i) => sum + i.qty, 0);
}

function cartSubtotal() {
  return cartRead().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartUpdateBadge() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = String(cartCount());
}

function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + '₫';
}

document.addEventListener('DOMContentLoaded', cartUpdateBadge);
