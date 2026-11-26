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
    /* id < 0 is a business result: -100 마감, -110 기존 예측 변경, -120 예측권 부족. */
    async predict(topicId, answer) {
      const row = await request('/api/topicroundpredict/predict', 'POST', { topicId, answer });
      if (!finite(row?.id)) invalid();
      return Number(row.id);
    },
    /* Reward ledger of the signed-in user (userId 0 = me), newest first. */
    async rewards(cursor) {
      const param = { userId: 0, deleted: false, perpage: 20 };
      if (cursor != null) param.cursor = cursor;
      const rows = await request('/api/reward/scrollList', 'GET', param);
      if (!Array.isArray(rows)) invalid();
      return rows.map((row) => {
        if (!finite(row?.id) || !finite(row.amount)) invalid();
        return {
          id: Number(row.id),
          title: typeof row.title === 'string' && row.title ? row.title : '포인트',
          amount: Number(row.amount),
          createdAt: String(row.createdAt ?? ''),
          code: typeof row.code === 'string' ? row.code : '',
        };
      });
    },
    /* 포인트 교환: 신청 즉시 차감, 관리자가 지급 완료(200) 또는 반려·환급(300) 처리 */
    exchange: (productId, name, phone) =>
      request('/api/exchange', 'POST', { productId, name, phone, agree: true }),
    async myExchanges() {
      const rows = await request('/api/exchange/my');
      if (!Array.isArray(rows)) invalid();
      return rows;
    },
    async attendStreak() {
      const row = await request('/api/attend/streak');
      if (!nonnegative(row?.streak) || typeof row.today !== 'boolean') invalid();
      return { streak: Number(row.streak), today: row.today };
    },
    async attendToday() {
      const row = await request('/api/attend/today', 'POST', {});
      if (!nonnegative(row?.streak) || typeof row.today !== 'boolean') invalid();
      return { streak: Number(row.streak), today: row.today };
    },
    /* 연승은 채점된 날 단위: 그날 적중률 50% 초과면 +1, 이하면 0. */
    async streak() {
      const row = await request('/api/streak');
      for (const key of ['current', 'best', 'goal', 'remaining', 'settledcount', 'hitcount'])
        if (!nonnegative(row?.[key])) invalid();
      return {
        ...row,
        achieved: row.achieved === true,
        hitrate: row.hitrate == null ? null : Number(row.hitrate),
      };
    },
    /* 내 예측 내역 (최신순). status: pending | hit | miss, point: 받을 보상 */
    async predictions(cursor) {
      const param = { perpage: 20 };
      if (cursor != null) param.cursor = cursor;
      const rows = await request('/api/prediction/my', 'GET', param);
      if (!Array.isArray(rows)) invalid();
      return rows;
    },
    claimPrediction: (id) => request('/api/prediction/claim', 'POST', { id }),
    async mission() {
      const row = await request('/api/mission');
      if (!Array.isArray(row?.daily) || !Array.isArray(row?.weekly)) invalid();
      return row;
    },
    /* 약관 본문 (공개). content 가 null 이면 미등록 */
    term: (key) => request(`/api/term/${encodeURIComponent(key)}`),
    consent: (keys) => request('/api/term/consent', 'POST', { keys }),
    /* 204(신청 없음)는 null */
    myClaim: async () => (await request('/api/streak/claim')) || null,
    claim: (naverId) => request('/api/streak/claim', 'POST', { naverId }),
    banners: () => request('/api/banner/list', 'GET', { deleted: false, cate: 100 }),
    saveFcm: (fcm) => request('/api/user', 'PUT', { id: 0, fcm }),
  };
})();
