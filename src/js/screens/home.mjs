export default function render(context) {
  const { stock, todayPrediction, isOpen, button, title, shell, pointsCard, directionCard, stockCard } =
    context;
  return shell(
    'home',
    `${title('오늘의 종목을 예측해 보세요', isOpen() ? '다음 거래일 방향을 선택하세요.' : '현재 예측 참여 시간이 아닙니다.')}${pointsCard()}${stockCard()}${stock() ? `<h2 class="section-title">다음 거래일 종가는?</h2><div class="direction-grid">${directionCard('up', !isOpen() || !!todayPrediction(stock().code))}${directionCard('down', !isOpen() || !!todayPrediction(stock().code))}</div>` : ''}${button('예측 결과 확인', 'result', 'secondary-button')}`
  );
}
