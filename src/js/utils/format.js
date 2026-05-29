const Format = {
  number: (n) => n?.toLocaleString('ko-KR') ?? '0',
  price: (n) => `${Format.number(n)}원`,
  percent: (n, showSign = true) => {
    if (n === undefined || n === null) return '0.00%';
    const sign = showSign && n > 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  },
  timer: (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  },
};
