// Eventos do GoatCounter: registra cliques importantes (WhatsApp, currículo, cases, links externos).
// Se o script do GoatCounter não carregar (bloqueador, offline), tudo vira no-op.
const track = name => {
  try { window.goatcounter?.count?.({ path: name, title: name, event: true }); } catch {}
};
window.trackEvent = track;

const rules = [
  [a => a.href.includes('wa.me/'), () => 'clique-whatsapp'],
  [a => a.href.startsWith('mailto:'), () => 'clique-email'],
  [a => a.hasAttribute('download') || a.href.endsWith('.pdf'), () => 'download-curriculo'],
  [a => /\/cases\//.test(a.pathname) && a.origin === location.origin, a => 'abrir-case-' + a.pathname.split('/').pop().replace('.html', '')],
  [a => a.hostname.includes('linkedin.com'), () => 'clique-linkedin'],
  [a => a.hostname.includes('github.com'), () => 'clique-github'],
  [a => a.hostname.includes('acadflow.online'), () => 'abrir-acadflow'],
  [a => a.hostname === 't.me', () => 'abrir-bot-telegram'],
];

document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const rule = rules.find(([test]) => test(a));
  if (rule) track(rule[1](a));
}, { capture: true });
