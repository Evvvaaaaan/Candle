/* Forms validate locally; the professor supplied no claim/payout endpoint. */
(() => {
  const { $, page, announce } = CandleUI;
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
    /* 동의한 약관(age·terms·privacy)과 그 시점 약관 버전을 서버에 기록한 뒤 이동합니다. */
    let consentBusy = false;
    $('#consent-submit').addEventListener('click', async () => {
      if (consentBusy) return;
      if (localStorage.getItem('candle.preview') === '1') return CandleUI.navigate('home', { tutorial: '1' });
      consentBusy = true;
      const submit = $('#consent-submit');
      submit.disabled = true;
      try {
        await CandleApi.consent(agreements.filter((input) => input.checked).map((input) => input.dataset.agreement));
        CandleUI.navigate('home', { tutorial: '1' });
      } catch (error) {
        CandleUI.report(error);
        syncConsent();
      } finally {
        consentBusy = false;
      }
    });
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
      create_exchange();
    };
    let payoutBusy = false;
    async function create_exchange() {
      if (payoutBusy) return;
      payoutBusy = true;
      payoutSubmit.disabled = true;
      try {
        await CandleApi.exchange(
          CandleUI.selection().productId,
          recipientName.value.trim(),
          phone.value.replace(/[\s-]/g, '')
        );
        CandleUI.navigate('wallet', { tab: 'use', requested: '1' });
      } catch (error) {
        if (error?.status === 409)
          announce('보유 포인트가 부족해 신청하지 못했어요.', 'payout-error');
        else if (error?.status === 400)
          announce('입력한 정보를 다시 확인해 주세요.', 'payout-error');
        else CandleUI.report(error);
        payoutSubmit.disabled = false;
      } finally {
        payoutBusy = false;
      }
    }
    window.create_exchange = create_exchange;
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
      create_streakclaim(recipient).catch((error) =>
        error?.status === 409
          ? reject('10연승을 달성한 뒤에 신청할 수 있어요.')
          : error?.status === 400
            ? reject('올바른 네이버 ID를 입력해 주세요.', rewardRecipient)
            : CandleUI.report(error)
      );
    });
    rewardForm.querySelectorAll('[data-reward-agreement]').forEach((input) => {
      const copy = input.closest('div')?.querySelector('details p');
      if (copy) CandleUI.loadTerm(`reward-${input.dataset.rewardAgreement}`, null, copy);
    });
    const status = document.getElementById('reward-status');
    const submit = document.getElementById('submit-challenge-reward');
    const claimText = (claim) =>
      ({
        0: `수령 신청이 접수되었어요. (최고 ${claim.beststreak}연승 · 적중률 ${claim.hitrate}%)`,
        200: '당첨되어 리워드 지급이 완료되었어요.',
        300: '이번 챌린지에는 선정되지 않았어요.',
      })[claim.process] || '수령 신청 내역을 확인해 주세요.';
    let busy = false;
    async function create_streakclaim(naverId) {
      if (busy) return;
      busy = true;
      submit.disabled = true;
      try {
        const claim = await CandleApi.claim(naverId);
        status.textContent = claimText(claim);
        announce('수령 신청이 접수되었어요. 심사 후 안내해 드릴게요.', 'reward-form-error');
      } finally {
        busy = false;
        submit.disabled = false;
      }
    }
    async function detail_streakclaim() {
      const [streak, claim] = await Promise.all([CandleApi.streak(), CandleApi.myClaim()]);
      if (claim) status.textContent = claimText(claim);
      else if (streak.achieved)
        status.textContent = `최고 ${streak.best}연승을 달성했어요! 아래에서 수령 신청을 해 주세요.`;
      else
        status.textContent = `현재 ${streak.current}연승 · 최고 ${streak.best}연승이에요. 10연승을 달성하면 신청할 수 있어요.`;
      if (claim && claim.process !== 0) submit.disabled = true;
    }
    Object.assign(window, { create_streakclaim, detail_streakclaim });
    CandleAuth.ready.then((ok) => {
      if (ok) detail_streakclaim().catch(CandleUI.report);
    });
  }
})();
