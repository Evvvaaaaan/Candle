export default function render(context) {
  const { e, n, data, product, button, empty, title, shell, productCard } = context;
  const p = product();
  if (!p) return shell('exchange', empty('상품을 먼저 선택해 주세요.', 'shop', '상품 보기'), 'shop');
  const enough = data.wallet.balance >= p.points;
  return shell(
    'exchange',
    `${title('교환 확인')}${productCard(p, true)}<section class="summary-card"><div class="summary-row"><span>보유 포인트</span><strong>${n(data.wallet.balance)}P</strong></div><div class="summary-row"><span>${enough ? '교환 후 잔액' : '부족한 포인트'}</span><strong>${n(Math.abs(data.wallet.balance - p.points))}P</strong></div></section><p class="field-help">${e(p.deliveryNotice)}</p>${button(enough ? '수령 정보 입력' : '포인트가 부족해요', 'payout', 'primary-button', !enough || !p.available)}`,
    'shop'
  );
}
