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
})();
