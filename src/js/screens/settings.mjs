import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, data, legal, button, title, shell } = context;
  return shell(
    'settings',
    `${title('계정 · 약관')}<section class="card menu-card">${legal.items.map((a) => `<button class="menu-row" type="button" data-legal="${e(a.id)}"><span class="menu-label"><span class="icon-tile menu-icon">${uiIcon('document')}</span>${e(a.title)}</span>${uiIcon('chevron', 'menu-chevron')}</button>`).join('<hr>')}</section><button id="logout" class="secondary-button" type="button">로그아웃</button>`,
    'profile'
  );
}
