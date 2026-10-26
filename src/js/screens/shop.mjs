export default function render(context) {
  const { data, empty, title, shell, pointsCard, productCard } = context;
  return shell(
    'shop',
    `${title('포인트 상점', '보유 포인트로 교환을 신청하세요.')}${pointsCard(true, 'use')}${data.catalog.items.map((p) => productCard(p)).join('') || empty('현재 교환 가능한 상품이 없어요.')}`,
    'shop'
  );
}
