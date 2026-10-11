import { rewardStatuses } from '../challenge-reward.mjs';
import { uiIcon } from '../ui/icons.mjs';

export default function render({ e, n, state, demo, title, shell, button }) {
  const r = state.challengeReward;
  const intro = title('10연승 리워드', '당첨 확인부터 수령 신청까지 한곳에서');
  if (!r)
    return shell(
      'challenge-reward',
      `${intro}<section class="card prize-status" role="status">${state.rewardError ? `<p>${e(state.rewardError)}</p><button id="retry-reward" class="secondary-button" type="button">다시 확인</button>` : '<p>수령 가능 여부를 확인하고 있어요…</p>'}</section>${button('챌린지 안내', 'challenge', 'secondary-button')}`
    );
  const [heading, copy] = rewardStatuses[r.status];
  const eligible = r.status === 'ELIGIBLE';
  const sms = r.method === 'COUPON_SMS';
  const label = sms ? '쿠폰을 받을 휴대폰 번호' : '포인트를 받을 네이버 ID';
  const deadline = r.claimDeadline
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(r.claimDeadline))
    : null;
  return shell(
    'challenge-reward',
    `${intro}
    ${demo ? '<p class="prize-preview">수령 흐름 미리보기 · 실제 당첨·지급이 아닙니다. 실제 개인정보를 입력하지 마세요.</p>' : ''}
    <section class="card prize-hero">
      <span class="icon-tile challenge-icon">${uiIcon(r.status === 'PAID' ? 'check' : 'gift')}</span>
      <p class="prize-eyebrow">10연승 달성자 중 추첨</p><h2>${e(heading)}</h2>
      <p class="prize-amount">${n(r.amount)}<span>원 리워드</span></p>
      <p>${e(copy)}</p>
    </section>
    <section class="card prize-payment" aria-label="네이버페이 지급 안내">
      <div class="prize-provider"><img src="./src/assets/core-flow/npay-symbol.svg" width="44" height="44" alt="네이버페이"><div><h2>네이버페이 포인트</h2><p>${sms ? '문자로 포인트 쿠폰 전달' : '네이버 ID로 직접 적립'}</p></div></div>
      <dl><div><dt>지급 포인트</dt><dd>${n(r.payoutPoints)}P</dd></div>${deadline ? `<div><dt>신청 기한 (한국 시간)</dt><dd>${e(deadline)}</dd></div>` : ''}${r.claimId ? `<div><dt>접수 번호</dt><dd>${e(r.claimId)}</dd></div>` : ''}</dl>
      <p class="prize-note">${e(r.taxNotice)}</p><p class="prize-note">${e(r.deliveryNotice)}</p>
    </section>
    ${
      eligible
        ? `<form id="challenge-reward-form" class="card prize-form" novalidate>
      <h2 class="card-heading">수령 정보</h2>
      <div class="form-field"><label for="reward-recipient">${label}</label><input id="reward-recipient" type="${sms ? 'tel' : 'text'}" inputmode="${sms ? 'tel' : 'text'}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="${sms ? 13 : 100}" aria-describedby="reward-recipient-help reward-form-error" required><p id="reward-recipient-help" class="field-help">${sms ? '문자를 받을 수 있는 본인 휴대폰 번호를 입력해 주세요.' : '닉네임이 아닌 네이버 로그인 ID를 입력해 주세요. 계정 확인은 지급 심사 시 진행됩니다.'}</p></div>
      <div class="form-field"><label for="reward-confirm">${sms ? '휴대폰 번호' : '네이버 ID'} 다시 입력</label><input id="reward-confirm" type="${sms ? 'tel' : 'text'}" inputmode="${sms ? 'tel' : 'text'}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="${sms ? 13 : 100}" aria-describedby="reward-form-error" required></div>
      <div class="prize-agreements">${r.agreements.map((a) => `<div><label class="prize-check"><input type="checkbox" data-reward-agreement="${e(a.id)}"><span>${e(a.title)} (필수)</span></label><details><summary>동의 내용 보기</summary><p>${e(a.body)}</p></details></div>`).join('')}
      <label class="prize-check"><input id="reward-account-ready" type="checkbox"><span>${sms ? '쿠폰을 등록할 본인 네이버 계정의' : '입력한 본인 네이버 계정의'} 네이버페이 이용약관 동의를 완료했으며, 지급 안내를 확인했습니다.</span></label></div>
      <p id="reward-form-error" class="prize-form-error" role="alert"></p>
      <button id="submit-challenge-reward" type="submit" class="primary-button">수령 신청하기</button>
      <p class="field-help">신청 후 수령 정보를 확인합니다. 신청만으로 포인트가 즉시 지급되지는 않습니다.</p>
    </form>`
        : `<section class="card prize-status" role="status"><span class="icon-tile">${uiIcon(r.status === 'PAID' ? 'check' : 'inbox')}</span><h2>${e(heading)}</h2><p>${e(r.statusNote)}</p><button id="retry-reward" class="secondary-button" type="button">상태 새로고침</button></section>`
    }
    ${button('챌린지 안내', 'challenge', 'secondary-button')}`
  );
}
