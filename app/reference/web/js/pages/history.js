/* 예측 내역: /api/prediction/my. 채점된 예측은 적중 15P · 미적중 5P 보상을 받을 수 있습니다. */
(() => {
  const ui = CandleUI;
  const list = ui.$('#history-list'),
    more = ui.$('#history-more'),
    empty = ui.$('#history-empty');
  const SVG = 'http://www.w3.org/2000/svg';
  const ICONS = {
    pending: ['circle:12,12,9', 'M12 7v5l3 2'],
    hit: ['m5 12 4 4L19 6'],
    miss: ['M12 5v9m0 5h.01'],
  };
  let cursor = null,
    busy = false;

  function icon(status) {
    const svg = document.createElementNS(SVG, 'svg');
    for (const [key, value] of Object.entries({
      class: 'ui-icon',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    }))
      svg.setAttribute(key, value);
    for (const shape of ICONS[status]) {
      if (shape.startsWith('circle:')) {
        const [cx, cy, r] = shape.slice(7).split(',');
        const circle = document.createElementNS(SVG, 'circle');
        Object.entries({ cx, cy, r }).forEach(([k, v]) => circle.setAttribute(k, v));
        svg.append(circle);
      } else {
        const path = document.createElementNS(SVG, 'path');
        path.setAttribute('d', shape);
        svg.append(path);
      }
    }
    const tile = Object.assign(document.createElement('span'), {
      className: { pending: 'icon-tile', hit: 'icon-tile complete', miss: 'icon-tile miss' }[status],
    });
    tile.append(svg);
    return tile;
  }
  const direction = (answer) => (answer === 120 ? '↘ 하락' : '↗ 상승');

  function claimButton(row) {
    const button = Object.assign(document.createElement('button'), {
      className: 'primary-button',
      type: 'button',
      textContent: row.rewarded ? '수령 완료' : `${row.point}P 받기`,
      disabled: row.rewarded,
    });
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        await CandleApi.claimPrediction(row.id);
        button.textContent = '수령 완료';
        ui.announce(`${row.point}P를 받았어요.`);
        if (window.latest_myreward) window.latest_myreward().catch(() => {});
      } catch (error) {
        if (error?.status === 409) {
          button.textContent = '수령 완료';
          ui.announce('이미 받았거나 아직 받을 수 없는 보상이에요.');
        } else {
          button.disabled = false;
          ui.report(error);
        }
      }
    });
    return button;
  }

  function card(row) {
    const status = ['hit', 'miss'].includes(row.status) ? row.status : 'pending';
    const section = Object.assign(document.createElement('section'), { className: 'card result-card' });
    const meta = Object.assign(document.createElement('p'), { className: 'result-meta' });
    meta.append(Object.assign(document.createElement('strong'), { textContent: direction(row.answer) }));
    section.append(
      icon(status),
      Object.assign(document.createElement('strong'), {
        className: 'result-stock',
        textContent: row.topicTitle || '종목',
      }),
      meta
    );
    if (status === 'pending') {
      meta.append(' · 결과 확정 후 확인');
      section.append(Object.assign(document.createElement('span'), { className: 'badge pending', textContent: '결과 대기' }));
    } else {
      meta.append(
        ` · ${row.point}P · `,
        Object.assign(document.createElement('span'), {
          className: status === 'hit' ? 'result-hit' : 'result-miss',
          textContent: status === 'hit' ? '적중' : '미적중',
        })
      );
      section.append(claimButton(row));
    }
    return section;
  }

  async function scroll_myprediction() {
    if (busy) return;
    busy = true;
    more.disabled = true;
    list.setAttribute('aria-busy', 'true');
    try {
      const rows = await CandleApi.predictions(cursor);
      list.append(...rows.map(card));
      if (rows.length) cursor = rows[rows.length - 1].id;
      more.hidden = rows.length < 20;
    } catch (error) {
      ui.report(error);
    } finally {
      busy = false;
      more.disabled = false;
      list.setAttribute('aria-busy', 'false');
      empty.hidden = list.children.length > 0;
    }
  }
  more.addEventListener('click', scroll_myprediction);
  window.scroll_myprediction = scroll_myprediction;
  CandleAuth.ready.then((ok) => {
    if (ok) scroll_myprediction();
    else list.setAttribute('aria-busy', 'false');
  });
})();
