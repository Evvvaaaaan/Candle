/* The only place where Candle HTTP contracts and response fields are defined. */
(() => {
  const finite = (value) =>
    (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
    Number.isFinite(Number(value));
  const nonnegative = (value) => finite(value) && Number(value) >= 0;
  const invalid = () => {
    throw { status: 502 };
  };
  const request = (url, type = 'GET', param = {}) =>
    new Promise((resolve, reject) =>
      func_ajax({ url, type, param, success: resolve, error: reject })
    );
  function normalizeTopic(row, detail = false) {
    if (
      !row ||
      !['string', 'number'].includes(typeof row.id) ||
      !String(row.id) ||
      typeof row.code !== 'string' ||
      !row.code ||
      typeof row.title !== 'string' ||
      !row.title
    )
      invalid();
    if (detail && (!nonnegative(row.price) || !finite(row.rate))) invalid();
    return {
      ...row,
      id: String(row.id),
      market:
        { 110: '코스피', 120: '코스닥', 210: '나스닥', 310: '코인' }[String(row.cate)] ||
        String(row.cate ?? ''),
    };
  }
  window.CandleApi = {
    request,
    normalizeTopic,
    signIn(provider, credentials) {
      return new Promise((resolve, reject) =>
        func_ajax({
          url: `/api/user/${provider}`,
          type: 'POST',
          param: credentials,
          success: (body, status, xhr) => {
            const token = xhr.getResponseHeader('RefreshToken');
            if (isMissingToken(token)) {
              reject({ status: 502 });
              return;
            }
            flutter_setLocalStorage('refreshToken', token);
            resolve();
          },
          error: reject,
        })
      );
    },
    session: () =>
      new Promise((resolve, reject) => listenerGetAccessToken({ success: resolve, error: reject })),
    user: () => request('/api/user', 'GET', { id: 0 }),
    async balance() {
      const row = await request('/api/reward/latest');
      if (!nonnegative(row?.latest)) invalid();
      return Number(row.latest);
    },
    async tickets() {
      const row = await request('/api/heart/count');
      if (
        !nonnegative(row?.amount) ||
        !Number.isInteger(Number(row.amount)) ||
        !nonnegative(row.ad) ||
        !Number.isInteger(Number(row.ad)) ||
        Number(row.ad) > 10
      )
        invalid();
      return { amount: Number(row.amount), ad: Number(row.ad) };
    },
    alarm: () => request('/api/alarm/count'),
    async topics(keyword, market) {
      const rows = await request('/api/topic/scrollList', 'GET', {
        perpage: 10,
        deleted: false,
        cate: { 코스피: '110', 코스닥: '120' }[market] || '',
        keyword,
      });
      if (!Array.isArray(rows)) invalid();
      return rows.map((row) => normalizeTopic(row));
    },
    async topic(id) {
      const row = normalizeTopic(await request('/api/topic', 'GET', { id }), true);
      if (row.id !== String(id)) invalid();
      return row;
    },
    predict: (topicId, answer) =>
      request('/api/topicroundpredict/predict', 'POST', { topicId, answer }),
    banners: () => request('/api/banner/list', 'GET', { deleted: false, cate: 100 }),
    saveFcm: (fcm) => request('/api/user', 'PUT', { id: 0, fcm }),
  };
})();
