/* 페이지 이동 유틸 — 백엔드 연결 후에도 변경 불필요 */
const Router = {
  go: (path, params = {}) => {
    if (Object.keys(params).length) {
      sessionStorage.setItem('routeParams', JSON.stringify(params));
    }
    window.location.href = path;
  },
  back: () => window.history.back(),
  params: () => {
    try { return JSON.parse(sessionStorage.getItem('routeParams')) ?? {}; }
    catch { return {}; }
  },
  clearParams: () => sessionStorage.removeItem('routeParams'),
};
