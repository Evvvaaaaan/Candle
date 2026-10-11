const claimLabels = {
  REQUESTED: '신청 접수',
  PROCESSING: '처리 중',
  PAID: '지급 완료',
  FAILED: '지급 실패',
  REJECTED: '반려',
  CANCELED: '취소',
};

export default function render(context) {
  const { e, n, data, empty, title, more, shell } = context;
  return shell(
    'history',
    `${title('교환 내역', '신청한 상품과 지급 상태를 확인하세요.')}${data.claims.items.map((c) => `<section class="card request-card"><div class="row-between"><strong>${e(c.title)}</strong><span class="badge">${claimLabels[c.status]}</span></div><p>${e(c.createdAt.slice(0, 10))}</p><p>${n(c.points)}P</p></section>`).join('') || empty('아직 교환 신청 내역이 없어요.', 'shop', '상품 보기')}${more('claims')}`,
    'shop'
  );
}
