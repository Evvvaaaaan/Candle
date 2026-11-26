(() => {
  const TUTORIAL_KEY = 'candle.tutorial.seen';
  const tutorialDialog = document.getElementById('tutorial-dialog');
  const tutorialSlides = [...tutorialDialog.querySelectorAll('[data-tutorial-slide]')];
  const tutorialDots = [...tutorialDialog.querySelectorAll('[data-tutorial-dot]')];
  const tutorialNext = document.getElementById('tutorial-next');
  let tutorialIndex = 0;
  let tutorialTrigger = null;
  const tutorialSeen = () => {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === '1';
    } catch {
      return false;
    }
  };
  const rememberTutorial = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {}
  };
  const forgetTutorial = () => {
    try {
      localStorage.removeItem(TUTORIAL_KEY);
    } catch {}
  };
  function renderTutorial() {
    tutorialSlides.forEach((slide, index) =>
      slide.classList.toggle('active', index === tutorialIndex)
    );
    tutorialDots.forEach((dot, index) =>
      dot.setAttribute('aria-current', String(index === tutorialIndex))
    );
    tutorialNext.textContent = tutorialIndex === tutorialSlides.length - 1 ? '시작하기' : '다음';
  }
  function showTutorial(index = 0) {
    tutorialIndex = index;
    renderTutorial();
    tutorialTrigger = document.activeElement;
    if (!tutorialDialog.open) tutorialDialog.showModal();
    tutorialNext.focus({ preventScroll: true });
  }
  // New users see the tutorial on entry; returning users see their last result.
  function showEntryDialog() {
    if (!tutorialSeen()) {
      if (!tutorialDialog.open) showTutorial(0);
    }
    // The example has no results endpoint; do not show sample winnings for an account.
  }
  function closeTutorial() {
    rememberTutorial();
    tutorialDialog.close();
    if (tutorialTrigger instanceof HTMLElement) tutorialTrigger.focus({ preventScroll: true });
  }
  tutorialNext.addEventListener('click', () => {
    if (tutorialIndex < tutorialSlides.length - 1) {
      tutorialIndex += 1;
      renderTutorial();
      return;
    }
    closeTutorial();
  });
  tutorialDots.forEach((dot, index) =>
    dot.addEventListener('click', () => {
      tutorialIndex = index;
      renderTutorial();
    })
  );
  document.getElementById('tutorial-skip').addEventListener('click', closeTutorial);
  tutorialDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTutorial();
  });
  tutorialDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' && tutorialIndex < tutorialSlides.length - 1) {
      tutorialIndex += 1;
      renderTutorial();
    } else if (event.key === 'ArrowLeft' && tutorialIndex > 0) {
      tutorialIndex -= 1;
      renderTutorial();
    }
  });
  tutorialDialog.addEventListener('click', (event) => {
    const rect = tutorialDialog.getBoundingClientRect();
    if (
      event.target === tutorialDialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeTutorial();
  });

  document.querySelector('[data-tutorial-replay]')?.addEventListener('click', () => {
    forgetTutorial();
    showTutorial();
  });
  if (CandleUI.page === 'home' && CandleUI.params.get('tutorial') === '1')
    CandleAuth.ready.then((ok) => {
      if (ok && !tutorialSeen()) showTutorial();
    });

  /* 지난 예측 결과: 가장 최근에 채점된 날의 결과를 그 날짜당 한 번 보여줍니다. */
  const resultDialog = document.getElementById('last-result-dialog');
  const RESULT_KEY = 'candle.lastResult.seen';
  let resultDate = null;
  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  };
  const row = (label, value, className = '') =>
    el('div', { className: 'summary-row' }, [el('span', { textContent: label }), el('strong', { textContent: value, className })]);
  function resultCard(item) {
    const rate = item.rate == null ? '—' : `${item.rate > 0 ? '+' : ''}${item.rate}%`;
    const rateClass = item.result === 110 ? 'up-text' : item.result === 120 ? 'down-text' : '';
    return el('div', { className: 'summary-card' }, [
      row('종목', item.topicTitle || '종목'),
      row('내 예측', item.answer === 120 ? '하락' : '상승', item.answer === 120 ? 'down-text' : 'up-text'),
      row('실제 등락', rate, rateClass),
      row('결과', item.status === 'hit' ? '적중' : '미적중'),
      row('보상', item.rewarded ? `+${item.point}P (수령 완료)` : `+${item.point}P`),
    ]);
  }
  function markResultSeen() {
    try {
      if (resultDate) localStorage.setItem(RESULT_KEY, resultDate);
    } catch {}
  }
  async function showLastResult() {
    if (!resultDialog || resultDialog.open || tutorialDialog.open) return;
    const rows = await CandleApi.predictions();
    const settled = rows.filter((item) => item.status !== 'pending' && item.roundDate);
    if (!settled.length) return;
    resultDate = settled.map((item) => item.roundDate).sort().pop();
    try {
      if (localStorage.getItem(RESULT_KEY) === resultDate) return;
    } catch {}
    const day = settled.filter((item) => item.roundDate === resultDate);
    const cards = resultDialog.querySelector('.last-result-cards');
    const dots = resultDialog.querySelector('.last-result-dots');
    cards.replaceChildren(...day.map(resultCard));
    dots.replaceChildren(
      ...day.map((_, index) => {
        const dot = el('button', { className: 'tutorial-dot', type: 'button' });
        dot.setAttribute('aria-label', `${index + 1}번째 결과`);
        dot.setAttribute('aria-current', String(index === 0));
        dot.addEventListener('click', () =>
          cards.children[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        );
        return dot;
      })
    );
    dots.hidden = day.length < 2;
    const hits = day.filter((item) => item.status === 'hit').length;
    document.getElementById('last-result-note').textContent =
      `${resultDate.replaceAll('-', '.')} 결과 · ${day.length}개 중 ${hits}개 적중. 보상은 예측 내역에서 받을 수 있어요.`;
    resultDialog.showModal();
  }
  if (resultDialog) {
    const cards = resultDialog.querySelector('.last-result-cards');
    cards.addEventListener('scroll', () => {
      const index = Math.round(cards.scrollLeft / Math.max(cards.clientWidth, 1));
      resultDialog.querySelectorAll('.last-result-dots .tutorial-dot').forEach((dot, i) =>
        dot.setAttribute('aria-current', String(i === index))
      );
    });
    document.getElementById('close-last-result').addEventListener('click', () => {
      markResultSeen();
      resultDialog.close();
    });
    resultDialog.querySelector('[data-route="prediction-history"]')?.addEventListener('click', () => {
      markResultSeen();
      CandleUI.navigate('prediction-history', { from: 'home' });
    });
    resultDialog.addEventListener('cancel', markResultSeen);
  }
  if (CandleUI.page === 'home' && CandleUI.params.get('tutorial') !== '1')
    CandleAuth.ready.then((ok) => {
      if (ok && tutorialSeen()) showLastResult().catch(() => {});
    });
})();
