export default function render(context) {
  const { e, data, state, stock, todayPrediction, button, empty, statusBar, backHeader, title } = context;
  const rows = data.stocks.filter(
    (s) =>
      (state.market === 'all' || s.market === state.market) &&
      `${s.name} ${s.code}`.toLowerCase().includes(state.search.toLowerCase())
  );
  return `<section class="screen-view stock-select-screen" data-screen="stock-select">${statusBar()}${backHeader('종목 선택', state.stockReturn)}<div class="stock-select-content">${title('예측할 종목을 선택하세요')}<label class="stock-search"><span aria-hidden="true">⌕</span><input id="stock-search-input" type="search" aria-label="종목명 또는 종목코드 검색" placeholder="종목명 또는 종목코드 검색" value="${e(state.search)}"></label><div class="stock-market-tabs" role="group" aria-label="시장 구분">${['all', ...new Set(data.stocks.map((s) => s.market))].map((m) => `<button type="button" data-market="${e(m)}" aria-pressed="${m === state.market}" class="${m === state.market ? 'active' : ''}">${m === 'all' ? '전체' : e(m)}</button>`).join('')}</div><div class="stock-list-heading"><h2>국내 종목</h2><span id="stock-result-count">${rows.length}개</span></div><div id="stock-select-list" class="card stock-select-list">${rows.map((s) => `<button class="stock-select-row" type="button" data-stock-code="${s.code}"><span class="stock-symbol">${e(s.name.slice(0, 1))}</span><span class="stock-row-copy"><strong>${e(s.name)}</strong><small>${s.code} · ${e(s.market)}</small></span><span class="stock-row-state">${todayPrediction(s.code) ? '오늘 예측 완료' : s.code === state.stockCode ? '선택됨' : '선택'}</span></button>`).join('')}</div>${rows.length ? '' : '<p id="stock-empty" class="stock-empty">검색 결과가 없습니다.</p>'}</div></section>`;
}
