/* Forms validate locally; the professor supplied no claim/payout endpoint. */
(() => {
  const { $, page, announce, requireServer } = CandleUI;
  const app = $('#app');
  app.querySelectorAll('[data-requires-js]').forEach((input) => {
    input.disabled = false;
  });
  if (page === 'consent') {
    const agreements = [...app.querySelectorAll('[data-agreement]')];
    const agreeAll = document.getElementById('agree-all');
    function syncConsent() {
      agreeAll.checked = agreements.every((input) => input.checked);
      agreeAll.indeterminate = !agreeAll.checked && agreements.some((input) => input.checked);
      document.getElementById('consent-submit').disabled = !agreements
        .filter((input) => input.classList.contains('required-agreement'))
        .every((input) => input.checked);
    }
    agreeAll.addEventListener('change', () => {
      agreements.forEach((input) => {
        input.checked = agreeAll.checked;
      });
      syncConsent();
    });
    agreements.forEach((input) => input.addEventListener('change', syncConsent));

    syncConsent();
    $('#consent-submit').addEventListener('click', () =>
      CandleUI.navigate('home', { tutorial: '1' })
    );
  }
  if (page === 'payout') {
    const phone = document.getElementById('phone');
    const recipientName = document.getElementById('name');
    const payoutAgree = document.getElementById('payout-agree');
    const payoutSubmit = document.getElementById('payout-submit');
    phone.removeAttribute('pattern');
    const phoneValid = () => /^010\d{8}$/.test(phone.value.replace(/[\s-]/g, ''));
    const nameValid = () =>
      recipientName.value.trim().length >= 2 && recipientName.value.trim().length <= 40;
    function syncPayout() {
      phone.setCustomValidity(
        phoneValid() ? '' : '010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.'
      );
      recipientName.setCustomValidity(
        nameValid() ? '' : '받는 분의 이름을 2자 이상 입력해 주세요.'
      );
      payoutSubmit.disabled = !(phoneValid() && nameValid() && payoutAgree.checked);
    }
    [phone, recipientName, payoutAgree].forEach((input) => {
      input.addEventListener('input', syncPayout);
      input.addEventListener('change', syncPayout);
    });
    const submitPayout = (event) => {
      event.preventDefault();
      syncPayout();
      if (!document.getElementById('payout-form').reportValidity()) return;
      if (!payoutAgree.checked)
        return announce('지급 안내 및 개인정보 처리에 동의해 주세요.', 'payout-error');
      requireServer('지급 신청', 'payout-error');
    };
    document.getElementById('payout-form').addEventListener('submit', submitPayout);
    payoutSubmit.addEventListener('click', submitPayout);

    syncPayout();
  }
  if (page === 'challenge-reward') {
    const rewardForm = document.getElementById('challenge-reward-form');
    const rewardRecipient = document.getElementById('reward-recipient');
    const rewardConfirm = document.getElementById('reward-confirm');
    const clearRewardError = () => {
      [rewardRecipient, rewardConfirm].forEach((input) => {
        input.removeAttribute('aria-invalid');
        input.setCustomValidity('');
      });
      document.getElementById('reward-form-error').textContent = '';
    };
    rewardForm.addEventListener('input', clearRewardError);
    rewardForm.addEventListener('change', clearRewardError);
    rewardForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearRewardError();
      const reject = (message, input) => {
        announce(message, 'reward-form-error');
        if (input) {
          input.setCustomValidity(message);
          input.setAttribute('aria-invalid', 'true');
          input.focus();
        }
      };
      const recipient = rewardRecipient.value.trim();
      if (!recipient || recipient.length > 100 || /[\s<>]/.test(recipient))
        return reject('올바른 네이버 ID를 입력해 주세요.', rewardRecipient);
      if (recipient !== rewardConfirm.value.trim())
        return reject('두 번 입력한 수령 정보가 일치하지 않아요.', rewardConfirm);
      if (
        [...rewardForm.querySelectorAll('input[type="checkbox"]')].some((input) => !input.checked)
      )
        return reject('필수 동의와 네이버페이 이용 준비 여부를 확인해 주세요.');
      requireServer('리워드 수령 신청', 'reward-form-error');
    });
  }
})();
