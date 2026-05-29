/* ── Candle 로고 SVG ─────────────────────────── */
const CANDLE_LOGO_SVG = `
<svg width="24" height="24" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="26" y="16" width="8" height="28" rx="2" fill="#2563EB"/>
  <line x1="30" y1="8" x2="30" y2="16" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
  <line x1="30" y1="44" x2="30" y2="52" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
  <rect x="12" y="28" width="8" height="16" rx="2" fill="#2563EB" opacity="0.6"/>
  <line x1="16" y1="22" x2="16" y2="28" stroke="#2563EB" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="16" y1="44" x2="16" y2="48" stroke="#2563EB" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <rect x="40" y="20" width="8" height="20" rx="2" fill="#2563EB" opacity="0.8"/>
  <line x1="44" y1="12" x2="44" y2="20" stroke="#2563EB" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
  <line x1="44" y1="40" x2="44" y2="46" stroke="#2563EB" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
</svg>`;

const CANDLE_LOGO_WHITE_SVG = `
<svg width="24" height="24" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="26" y="16" width="8" height="28" rx="2" fill="#FFFFFF"/>
  <line x1="30" y1="8" x2="30" y2="16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
  <line x1="30" y1="44" x2="30" y2="52" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
  <rect x="12" y="28" width="8" height="16" rx="2" fill="#FFFFFF" opacity="0.6"/>
  <line x1="16" y1="22" x2="16" y2="28" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="16" y1="44" x2="16" y2="48" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <rect x="40" y="20" width="8" height="20" rx="2" fill="#FFFFFF" opacity="0.8"/>
  <line x1="44" y1="12" x2="44" y2="20" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
  <line x1="44" y1="40" x2="44" y2="46" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/* ── BottomNav 렌더링 ────────────────────────── */
function renderBottomNav(activePage) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  const base = '../pages/';
  const isActive = (page) => activePage === page;

  nav.innerHTML = `
    <button class="bottom-nav__item ${isActive('home') ? 'active' : ''}"
            onclick="Router.go('${base}home.html')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span class="bottom-nav__label">홈</span>
    </button>

    <button class="bottom-nav__item ${isActive('ranking') ? 'active' : ''}"
            onclick="Router.go('${base}ranking.html')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      </svg>
      <span class="bottom-nav__label">랭킹</span>
    </button>

    <div class="bottom-nav__fab-wrap">
      <button class="bottom-nav__fab" onclick="Router.go('${base}prediction.html')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2.5"/>
          <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
        </svg>
        <span class="bottom-nav__fab-label">예측</span>
      </button>
    </div>

    <button class="bottom-nav__item ${isActive('point-store') ? 'active' : ''}"
            onclick="Router.go('${base}point-store.html')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
        <path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>
      </svg>
      <span class="bottom-nav__label">포인트</span>
    </button>

    <button class="bottom-nav__item ${isActive('mypage') ? 'active' : ''}"
            onclick="Router.go('${base}mypage.html')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="bottom-nav__label">마이</span>
    </button>
  `;
}
