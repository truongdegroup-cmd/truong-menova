const SHIPPING_FEE = 25000;
const FREE_SHIPPING_THRESHOLD = 300000;

function renderCartPage() {
  const items = cartRead();
  const empty = document.getElementById('cart-empty');
  const filled = document.getElementById('cart-filled');
  const rowsEl = document.getElementById('cart-rows');

  if (items.length === 0) {
    empty.style.display = 'block';
    filled.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  filled.style.display = 'grid';

  rowsEl.innerHTML = items
    .map(
      (item) => `
    <div class="cart-row" data-slug="${item.slug}">
      <div class="cart-row__media"><img src="${item.image}" alt="" /></div>
      <div class="cart-row__info">
        <div class="cart-row__name">${item.name}</div>
        <div class="cart-row__meta">${formatVND(item.price)} / ${item.isCombo ? 'combo' : 'hộp'}</div>
      </div>
      <div class="cart-row__actions">
        <div class="qty-stepper">
          <button type="button" class="qty-dec" aria-label="Giảm số lượng">−</button>
          <input type="number" class="qty-val" value="${item.qty}" min="1" max="20" aria-label="Số lượng" />
          <button type="button" class="qty-inc" aria-label="Tăng số lượng">+</button>
        </div>
        <button type="button" class="cart-row__remove">Xoá</button>
      </div>
    </div>
  `
    )
    .join('');

  const subtotal = cartSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  document.getElementById('sum-subtotal').textContent = formatVND(subtotal);
  document.getElementById('sum-shipping').textContent = shipping === 0 ? 'Miễn phí' : formatVND(shipping);
  document.getElementById('sum-total').textContent = formatVND(subtotal + shipping);

  rowsEl.querySelectorAll('.cart-row').forEach((row) => {
    const slug = row.dataset.slug;
    row.querySelector('.qty-dec').addEventListener('click', () => {
      const input = row.querySelector('.qty-val');
      cartSetQty(slug, Math.max(0, Number(input.value) - 1));
      renderCartPage();
    });
    row.querySelector('.qty-inc').addEventListener('click', () => {
      const input = row.querySelector('.qty-val');
      cartSetQty(slug, Number(input.value) + 1);
      renderCartPage();
    });
    row.querySelector('.qty-val').addEventListener('change', (e) => {
      cartSetQty(slug, Math.max(0, Number(e.target.value)));
      renderCartPage();
    });
    row.querySelector('.cart-row__remove').addEventListener('click', () => {
      cartRemove(slug);
      renderCartPage();
    });
  });
}

function buildZaloOrderMessage(items, subtotal, shipping, total) {
  const lines = ['Chào MENOVA, tôi muốn đặt mua:', ''];
  items.forEach((item) => {
    lines.push(`- ${item.name} x${item.qty} = ${formatVND(item.price * item.qty)}`);
  });
  lines.push('');
  lines.push(`Tạm tính: ${formatVND(subtotal)}`);
  lines.push(`Phí vận chuyển (dự kiến): ${shipping === 0 ? 'Miễn phí' : formatVND(shipping)}`);
  lines.push(`Tổng cộng: ${formatVND(total)}`);
  lines.push('');
  lines.push('Vui lòng tư vấn và xác nhận đơn giúp tôi. Cảm ơn MENOVA!');
  return lines.join('\n');
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function bindCheckoutZalo() {
  const btn = document.getElementById('checkout-zalo-btn');
  const copyAgainBtn = document.getElementById('zalo-copy-again');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const items = cartRead();
    if (items.length === 0) return;

    const subtotal = cartSubtotal();
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const message = buildZaloOrderMessage(items, subtotal, shipping, total);

    window.open(btn.dataset.zalo, '_blank', 'noopener');

    const panel = document.getElementById('zalo-message-panel');
    const textarea = document.getElementById('zalo-message-text');
    textarea.value = message;
    panel.style.display = 'block';
    copyToClipboard(message);
  });

  if (copyAgainBtn) {
    copyAgainBtn.addEventListener('click', () => {
      const textarea = document.getElementById('zalo-message-text');
      textarea.select();
      copyToClipboard(textarea.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  bindCheckoutZalo();
});
