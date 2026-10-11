export default function render(context) {
  const { icon, session, data, button } = context;
  return `<section class="screen-view splash-screen" data-screen="splash"><div class="splash-lockup"><img src="${icon('candle-logo.png')}" alt="Candle 로고"><h1>Candle</h1><p>오늘의 선택이 내일의 포인트로</p></div>${button('시장 예측 리워드 서비스', session?.user && !session.user.consentRequired ? 'home' : 'signup', 'launch-note')}</section>`;
}
