export default function render(context) {
  const { e, demo, state, button, empty, title, shell } = context;
  if (!state.ad)
    return shell('ad', empty('광고 세션을 먼저 시작해 주세요.', 'pass', '예측권 화면으로'), 'prediction');
  return shell(
    'ad',
    `${title('예측권 받는 중', '완료가 확인되면 예측 화면으로 돌아가요.')}<section class="card"><p>${demo ? '영상이 끝나면 자동으로 완료 여부를 확인해요.' : '광고를 끝까지 시청하고 돌아오세요. 지급이 확인되면 예측을 이어갈 수 있어요.'}</p>${demo ? '<p id="ad-countdown" class="number">15초</p>' : `<a id="open-reward-ad" class="primary-button" href="${e(state.ad.launchUrl)}" target="_blank" rel="noopener noreferrer">광고가 열리지 않았나요? 다시 열기</a>`}</section><button id="verify-ad" class="primary-button" type="button"${demo && Date.now() - state.ad.startedAt < 15000 ? ' disabled' : ''}>시청 완료 다시 확인</button>${button('닫기', state.adReturn, 'secondary-button')}`,
    'prediction'
  );
}
