(() => {
  const ui = CandleUI;
  function select(tab) {
    if (!['all', 'earn', 'use'].includes(tab)) tab = 'all';
    ui.$$('.wallet-tabs [data-wallet-tab]').forEach((button) => {
      const selected = button.dataset.walletTab === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    ui.$$('.wallet-transaction').forEach((row) => {
      const amount = Number(row.dataset.amount);
      row.hidden = tab === 'earn' ? amount <= 0 : tab === 'use' ? amount >= 0 : false;
    });
    history.replaceState(null, '', ui.href('wallet', { tab }));
  }
  ui.$$('.wallet-tabs [data-wallet-tab]').forEach((button) =>
    button.addEventListener('click', () => select(button.dataset.walletTab))
  );
  select(ui.params.get('tab') || 'all');
})();
