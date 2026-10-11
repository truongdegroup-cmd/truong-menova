const CO_SHIPPING_FEE = 25000;
const CO_FREE_SHIPPING_THRESHOLD = 300000;

function renderCheckoutSummary() {
  const items = cartRead();
  const emptyEl = document.getElementById('checkout-empty');
  const formEl = document.getElementById('checkout-form');

  if (items.length === 0) {
    emptyEl.style.display = 'block';
    formEl.style.display = 'none';
    return false;
  }
  emptyEl.style.display = 'none';
  formEl.style.display = 'grid';

  document.getElementById('checkout-items').innerHTML = items
    .map(
      (item) => `
      <div class="summary-row"><span>${item.name} × ${item.qty}</span><span>${formatVND(item.price * item.qty)}</span></div>
    `
    )
    .join('');

  const subtotal = cartSubtotal();
  const shipping = subtotal >= CO_FREE_SHIPPING_THRESHOLD ? 0 : CO_SHIPPING_FEE;
  document.getElementById('co-subtotal').textContent = formatVND(subtotal);
  document.getElementById('co-shipping').textContent = shipping === 0 ? 'Miễn phí' : formatVND(shipping);
  document.getElementById('co-total').textContent = formatVND(subtotal + shipping);
  return true;
}

function showFormStatus(message, type) {
  const el = document.getElementById('form-status');
  el.innerHTML = `<div class="form-status form-status--${type}">${message}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();

  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-order');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';

    const items = cartRead();
    const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked').value;
    const payload = {
      customerName: document.getElementById('customerName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      address: document.getElementById('address').value.trim(),
      note: document.getElementById('note').value.trim(),
      paymentMethod,
      items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, slug: i.slug })),
    };

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Không thể tạo đơn hàng.');

      if (paymentMethod === 'cod') {
        cartClear();
        window.location.href = `/order-success?orderCode=${encodeURIComponent(orderData.orderCode)}&status=success`;
        return;
      }

      const endpoint = paymentMethod === 'vnpay' ? '/api/payment/vnpay/create' : '/api/payment/momo/create';
      const payRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: orderData.orderCode }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.paymentUrl) {
        throw new Error(
          payData.error ||
            'Không thể kết nối cổng thanh toán lúc này. Vui lòng chọn Thanh toán khi nhận hàng hoặc thử lại sau.'
        );
      }

      cartClear();
      window.location.href = payData.paymentUrl;
    } catch (err) {
      showFormStatus(err.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đặt hàng';
    }
  });
});
