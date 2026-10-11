export default function render(context) {
  const { e, demo, state, button, empty, title, shell } = context;
  if (!state.ad)
    return shell('ad', empty('광고 세션을 먼저 시작해 주세요.', 'pass', '예측권 화면으로'), 'prediction');
  return shell(
    'ad',
    `${title('광고 참여')}<section class="card"><p>${demo ? '영상이 끝나면 완료 여부를 확인해 주세요.' : '광고를 시청한 후 돌아와 완료 여부를 확인해 주세요.'}</p>${demo ? '<p id="ad-countdown" class="number">15초</p>' : `<a class="primary-button" href="${e(state.ad.launchUrl)}" target="_blank" rel="noopener noreferrer">광고 열기</a>`}</section><button id="verify-ad" class="primary-button" type="button"${demo && Date.now() - state.ad.startedAt < 15000 ? ' disabled' : ''}>시청 완료 확인</button>${button('닫기', 'pass', 'secondary-button')}`,
    'prediction'
  );
}
