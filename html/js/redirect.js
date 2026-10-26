(() => {
  const target = document.currentScript.dataset.target;
  const [page, defaults = ''] = target.split('?');
  const query = new URLSearchParams(location.search);
  for (const [key, value] of new URLSearchParams(defaults)) query.set(key, value);
  location.replace(`${page}.html${query.size ? '?' + query : ''}`);
})();
