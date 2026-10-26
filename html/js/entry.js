/* Compatibility for old root URLs such as index.html#prediction. */
(() => {
  const routes = new Set([
    'index',
    'signup',
    'consent',
    'home',
    'challenge',
    'challenge-reward',
    'stock-select',
    'prediction',
    'pass',
    'ad',
    'missions',
    'shop',
    'exchange',
    'profile',
    'payout',
    'prediction-history',
    'wallet',
    'settings',
    'legal',
  ]);
  let route = location.hash.slice(1) || 'index';
  const query = new URLSearchParams(location.search);
  if (route === 'splash') route = 'index';
  if (route === 'history') {
    route = 'wallet';
    query.set('tab', 'use');
  }
  if (!routes.has(route)) route = 'index';
  location.replace(`html/${route}.html${query.size ? '?' + query : ''}`);
})();
