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
      <div>
        <div class="cart-row__name">${item.name}</div>
        <div class="cart-row__meta">${formatVND(item.price)} / hộp</div>
      </div>
      <div class="qty-stepper">
        <button type="button" class="qty-dec" aria-label="Giảm số lượng">−</button>
        <input type="number" class="qty-val" value="${item.qty}" min="1" max="20" aria-label="Số lượng" />
        <button type="button" class="qty-inc" aria-label="Tăng số lượng">+</button>
      </div>
      <button type="button" class="cart-row__remove">Xoá</button>
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

document.addEventListener('DOMContentLoaded', renderCartPage);
