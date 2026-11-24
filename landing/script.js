// Keep one FAQ answer open at a time without replacing native keyboard behavior.
const questions = document.querySelectorAll('.faq-list details');
questions.forEach((question) => {
  question.addEventListener('toggle', () => {
    if (!question.open) return;
    questions.forEach((other) => {
      if (other !== question) other.open = false;
    });
  });
});

// Launch-alert signup. Nothing is sent until data-endpoint holds a real collection URL.
const form = document.querySelector('.waitlist-form');
const status = form.querySelector('.waitlist-status');
const say = (message, ok = false) => {
  status.textContent = message;
  status.classList.toggle('is-ok', ok);
};
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.email.checkValidity()) return say('이메일 주소를 확인해 주세요.');
  if (!form.consent.checked) return say('개인정보 수집·이용에 동의해 주세요.');
  const endpoint = form.dataset.endpoint;
  if (!endpoint) return say('아직 신청 접수처가 연결되지 않았습니다.');
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    if (!response.ok) throw new Error(response.status);
    form.reset();
    say('신청됐어요. 출시되면 이메일로 알려드릴게요.', true);
  } catch {
    say('신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
  } finally {
    button.disabled = false;
  }
});
