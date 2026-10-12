import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, n, demo, product, empty, statusBar, backHeader, title, shell } = context;
  const p = product();
  if (!p) return shell('payout', empty('상품을 다시 선택해 주세요.', 'shop', '상품 보기'), 'shop');
  return `<section class="screen-view payout-screen" data-screen="payout">
    ${statusBar()}${backHeader('지급 신청', 'exchange')}
    <div class="payout-content">
      ${title('수령 정보 입력', '차곡차곡 모은 포인트를 리워드로 받아보세요.')}
      <section class="card payout-summary" aria-label="신청할 리워드">
        <div class="payout-reward-heading"><span>포인트 교환</span>${uiIcon('gift')}</div>
        <div class="payout-reward-product">
          <img src="./src/assets/core-flow/npay-symbol.svg" width="48" height="48" alt="네이버페이">
          <div><p>${e(p.title)}</p><strong class="payout-amount">${n(p.amount)}<span>원</span></strong></div>
        </div>
        <div class="payout-points"><span>사용 포인트</span><strong>${n(p.points)}P</strong></div>
      </section>
      <form id="payout-form" class="card payout-form">
        <div class="payout-form-heading"><div class="payout-form-title">${uiIcon('user')}<h2>받는 분 정보</h2></div><span>필수 입력</span></div>
        <div class="form-field"><label for="phone">휴대폰 번호</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="13" placeholder="01012345678" required></div>
        <div class="form-field"><label for="name">이름</label><input id="name" name="name" autocomplete="name" maxlength="40" placeholder="받는 분의 이름" required></div>
      </form>
      <div class="payout-delivery">${uiIcon('inbox')}<p>${e(p.deliveryNotice)}</p></div>
      ${demo ? '<p class="payout-preview">연동 전 미리보기입니다. 실제 개인정보를 입력하지 마세요.</p>' : ''}
    </div>
    <footer class="payout-footer">
      <div class="payout-agreement-row"><label class="payout-consent"><input id="payout-agree" type="checkbox"><span>지급 안내 및 개인정보 처리 동의 <strong>(필수)</strong></span></label><button class="payout-terms" type="button" data-legal="reward" aria-label="지급 안내 및 개인정보 동의 내용 보기">${uiIcon('chevron')}</button></div>
      <button id="payout-submit" class="primary-button payout-action" type="button" disabled>지급 신청하기</button>
      <p class="fraud-note">신청 결과는 교환 내역에서 확인할 수 있습니다.</p>
    </footer>
  </section>`;
}
