export default function render(context) {
  const { e, data, legal, state, product, statusBar, backHeader, title } = context;
  const a =
    state.legalId === 'reward'
      ? product() && {
          title: '지급 안내 및 개인정보 동의',
          body: product().agreementBody,
          version: product().agreementVersion,
        }
      : legal.items.find((a) => a.id === state.legalId);
  return `<section class="screen-view legal-screen" data-screen="legal">${statusBar()}${backHeader(a?.title || '약관', state.legalReturn)}<div class="consent-main">${title(a?.title || '약관')}<p class="field-help">버전 ${e(a?.version)}</p><div class="legal-copy">${e(a?.body || '문서를 불러오지 못했습니다.')}</div></div></section>`;
}
