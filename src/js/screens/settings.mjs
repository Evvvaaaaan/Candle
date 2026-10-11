export default function render(context) {
  const { e, data, legal, button, title, shell } = context;
  return shell(
    'settings',
    `${title('계정 · 약관')}<section class="card menu-card">${legal.items.map((a) => `<button class="menu-row" type="button" data-legal="${e(a.id)}"><span>${e(a.title)}</span><span>›</span></button>`).join('<hr>')}</section><button id="logout" class="secondary-button" type="button">로그아웃</button>`,
    'profile'
  );
}
