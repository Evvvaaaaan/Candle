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
