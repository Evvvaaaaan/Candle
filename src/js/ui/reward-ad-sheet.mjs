import { uiIcon } from './icons.mjs';

export default function renderRewardAdSheet({ remaining, limit, demo }) {
  return `<div class="sheet-handle" aria-hidden="true"></div>
    <span class="icon-tile reward-ad-icon">${uiIcon('gift')}</span>
    <h2 id="reward-ad-title">광고 보고 예측권 받기</h2>
    <p id="reward-ad-description">영상 광고를 끝까지 시청하면<br>예측권 1장을 받을 수 있어요.</p>
    <div class="reward-ad-allowance"><span>오늘 남은 참여</span><strong>${remaining}<span> / ${limit}회</span></strong></div>
    <p class="reward-ad-note">${demo ? '미리보기에서는 15초 후 시청 완료를 확인해요.' : '광고를 본 뒤 이 화면으로 돌아오면 완료 여부를 확인해요.'}<br>예측은 자동으로 제출되지 않아요.</p>
    <button id="start-reward-ad" class="primary-button" type="button" autofocus>광고 시청하기</button>
    <button id="cancel-reward-ad" class="reward-ad-cancel" type="button">나중에 할게요</button>`;
}
