import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, icon, legal, state, statusBar } = context;
  return `<section class="screen-view consent-screen" data-screen="consent">
    ${statusBar()}
    <header class="consent-header"><button class="consent-close" type="button" data-route="signup" aria-label="약관 동의 닫기"><span aria-hidden="true">×</span></button></header>
    <div class="consent-main">
      <div class="consent-intro"><img src="${icon('candle-logo.png')}" width="76" height="76" alt="Candle"><h1 tabindex="-1">고객님,<br>환영합니다!</h1></div>
      <div class="consent-agreements" aria-label="가입 약관 동의">
        <div class="agree-all"><label class="check-row"><input id="agree-all" type="checkbox"><strong>약관 전체동의</strong></label></div>
        <div class="agreement-card">${legal.items.map((a) => `<div class="agreement-line"><label class="check-row"><input id="${e(a.id)}" class="agreement-checkbox${a.required ? ' required-agreement' : ''}" type="checkbox" data-agreement="${e(a.id)}"${state.consent[a.id] ? ' checked' : ''}><span>${e(a.title)} (${a.required ? '필수' : '선택'})</span></label><button type="button" data-legal="${e(a.id)}" aria-label="${e(a.title)} 내용 보기">${uiIcon('chevron')}</button></div>`).join('')}</div>
      </div>
    </div>
    <button id="consent-submit" class="primary-button consent-action" type="button" disabled>다음</button>
  </section>`;
}
