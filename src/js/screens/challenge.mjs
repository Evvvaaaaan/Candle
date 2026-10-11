import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { title, shell, button } = context;
  return shell(
    'challenge',
    `${title('10연승 챌린지', '연속으로 예측에 성공하고 리워드에 도전하세요.')}
    <section class="card challenge-card">
      <span class="icon-tile challenge-icon">${uiIcon('gift')}</span>
      <p class="card-label">10연승 달성자 중 추첨</p>
      <h2>100만원 리워드</h2>
      <p>10연승에 성공한 참여자 중<br>추첨으로 리워드를 지급합니다.</p>
    </section>
    <section class="card challenge-rules">
      <h2 class="card-heading">참여 안내</h2>
      <ol>
        <li><span>1</span><p>종목을 선택하고 상승·하락을 예측하세요.</p></li>
        <li><span>2</span><p>예측 결과를 확인하며 10연승에 도전하세요.</p></li>
        <li><span>3</span><p>10연승 달성자는 리워드 추첨 대상이 됩니다.</p></li>
      </ol>
      <p class="field-help">리워드는 추첨으로 지급되며, 10연승 달성만으로 지급이 확정되지는 않습니다.</p>
    </section>
    ${button('예측하러 가기', 'prediction')}${button('내 예측 결과 확인', 'result', 'secondary-button')}`
  );
}
