export default function render(context) {
  const { icon, session, data, state, button, empty, statusBar } = context;
  const names = { kakao: '카카오', naver: '네이버', google: 'Google', apple: 'Apple' };
  return `<section class="screen-view signup-screen" data-screen="signup">${statusBar()}<div class="signup-content"><div class="signup-brand"><img src="${icon('candle-logo.png')}" alt=""><span>Candle</span></div><div class="signup-intro"><h1 tabindex="-1">로그인</h1><p>오늘의 시장을 예측하고<br>포인트를 모아보세요.</p></div><div class="signup-auth"><h2 class="auth-label">간편 로그인</h2><div class="auth-list">${session.providers.map((p) => `<button class="auth-button ${p}" type="button" data-login="${p}"><img src="${icon(p === 'apple' ? 'apple.png' : `${p}.svg`)}" alt="">${names[p]}로 계속하기</button>`).join('') || '<p class="empty-state">현재 이용 가능한 로그인 방법이 없습니다.</p>'}</div></div></div><p class="signup-note">처음 이용하는 경우 다음 단계에서 필수 약관을 확인합니다.</p></section>`;
}
