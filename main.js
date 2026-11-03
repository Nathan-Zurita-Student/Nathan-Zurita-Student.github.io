const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const isMobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);

/* ---------- Preloader ---------- */
const loader = { shown: 0, target: 10 };
const bar = $('#loader-bar'), count = $('#loader-count');
(function tickLoader() {
  loader.shown += (loader.target - loader.shown) * .08;
  const v = Math.min(100, Math.round(loader.shown));
  bar.style.width = v + '%';
  count.textContent = v;
  if (v < 100) requestAnimationFrame(tickLoader);
})();

/* ---------- Divisão de texto ---------- */
$$('.split').forEach(el => {
  const heading = el.closest('h1, h2');
  if (heading && !heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-hidden', 'true');
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
  }
});

const statement = $('#statement');
if (statement) {
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w => `<span class="word">${w}</span>`).join(' ');
}

/* ---------- Cena 3D ---------- */
let scene = null;
const scenePromise = (async () => {
  try {
    const mod = await import('./scene.js');
    scene = mod.initScene($('#webgl'), { isMobile, reducedMotion });
  } catch (e) {
    console.warn('WebGL indisponível', e);
  }
  if (!scene) document.body.classList.add('no-webgl');
  loader.target = 85;
})();

const presetsDesktop = {
  hero:    { x: 3,    y: -.2, z: 0,    scale: 1,    hue: 0,   amp: .32 },
  about:   { x: -3.4, y: .5,  z: -1.5, scale: .8,   hue: .18, amp: .38 },
  exp:     { x: 3.6,  y: -.4, z: -2,   scale: .75,  hue: .32, amp: .3 },
  work:    { x: 0,    y: 3.1, z: -5,   scale: .7,   hue: .48, amp: .45 },
  skills:  { x: -3.3, y: -.6, z: -2.5, scale: .8,   hue: .62, amp: .34 },
  contact: { x: 0,    y: -2.5, z: -3.5, scale: .9,   hue: .82, amp: .5 },
};
const presetsMobile = {
  hero:    { x: .6,  y: -2,  z: -1.5, scale: .85, hue: 0,   amp: .32 },
  about:   { x: -1,  y: 1.5, z: -4,   scale: .75, hue: .18, amp: .38 },
  exp:     { x: 1.2, y: -1,  z: -5,   scale: .7,  hue: .32, amp: .3 },
  work:    { x: 0,   y: 2,   z: -6,   scale: .7,  hue: .48, amp: .45 },
  skills:  { x: -1,  y: 0,   z: -5,   scale: .7,  hue: .62, amp: .34 },
  contact: { x: 0,   y: -4.6, z: -4,  scale: .85, hue: .82, amp: .5 },
};
const presets = isMobile ? presetsMobile : presetsDesktop;
const applyPreset = name => { if (scene && presets[name]) Object.assign(scene.state, presets[name]); };

/* ---------- Scroll suave ---------- */
let lenis = null;
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis && !reducedMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
}

$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const target = $(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  closeMenu();
  if (lenis) lenis.scrollTo(target, { offset: a.getAttribute('href') === '#inicio' ? 0 : -20, duration: 1.6 });
  else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}));

/* ---------- Menu mobile ---------- */
const menu = $('#menu'), burger = $('#menu-toggle');
function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
});

/* ---------- Nav fixa: fundo ao rolar, link ativo ---------- */
const nav = $('.nav'), fab = $('.wa-fab');
function onScroll() {
  const y = scrollY;
  nav.classList.toggle('is-scrolled', y > 20);
  fab.classList.toggle('is-visible', y > innerHeight * .6);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = $$('.nav__links a');
const spy = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

/* ---------- Texto embaralhado ---------- */
const roles = ['Desenvolvedor Full Stack', 'Laravel & PHP', 'Vue 3 & Nuxt', 'Experiências 3D na web', 'APIs REST'];
const scrambleEl = $('#scramble');
const glyphs = '!<>-_\\/[]{}—=+*^?#ABCDEFXYZ01';
function scrambleTo(text) {
  const from = scrambleEl.textContent;
  const len = Math.max(from.length, text.length);
  const queue = [];
  for (let i = 0; i < len; i++) {
    const start = Math.floor(Math.random() * 20), end = start + Math.floor(Math.random() * 20);
    queue.push({ from: from[i] || '', to: text[i] || '', start, end });
  }
  let frame = 0;
  (function update() {
    let out = '', done = 0;
    for (const q of queue) {
      if (frame >= q.end) { done++; out += q.to; }
      else if (frame >= q.start) out += `<span style="color:var(--accent)">${glyphs[Math.floor(Math.random() * glyphs.length)]}</span>`;
      else out += q.from;
    }
    scrambleEl.innerHTML = out;
    frame++;
    if (done < queue.length) requestAnimationFrame(update);
  })();
}
let roleIdx = 0;
if (!reducedMotion) setInterval(() => { roleIdx = (roleIdx + 1) % roles.length; scrambleTo(roles[roleIdx]); }, 3200);

/* ---------- Animações GSAP ---------- */
function setupAnimations() {
  if (!hasGsap) return;

  // Estado da cena por seção
  $$('[data-scene]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 45%',
    onToggle: self => self.isActive && applyPreset(sec.dataset.scene),
  }));
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => { if (scene) scene.state.spin = self.progress * Math.PI * 2; },
  });

  // Frase do "Sobre" acende palavra por palavra
  gsap.to('#statement .word', {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: '#statement', start: 'top 80%', end: 'bottom 50%', scrub: true },
  });

  // Contadores
  $$('[data-count]').forEach(el => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });

  // Títulos e blocos
  $$('.title, .kicker').forEach(el => gsap.from(el, {
    y: 60, opacity: 0, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  }));
  gsap.set('.job, .bento__item, .stat, .card', { y: 70, opacity: 0 });
  ScrollTrigger.batch('.job, .bento__item, .stat, .card', {
    start: 'top 90%',
    onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 1, stagger: .1, ease: 'expo.out', overwrite: true }),
  });

  // Linha da timeline
  gsap.to('.timeline__line span', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });

  // Título do contato
  gsap.from('.contact__title .char', {
    yPercent: 110, rotate: 6, duration: 1.1, stagger: .025, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact__title', start: 'top 85%' },
  });

  // Marquee reage à velocidade do scroll
  const track = $('.marquee__track');
  ScrollTrigger.create({
    onUpdate: self => gsap.to(track, { skewX: gsap.utils.clamp(-12, 12, self.getVelocity() / -150), duration: .4, overwrite: true }),
  });
}

/* ---------- Intro ---------- */
function intro() {
  document.body.classList.remove('is-loading');
  $('#loader').classList.add('is-done');
  applyPreset('hero');
  lenis?.start();
  if (!hasGsap) return;
  const tl = gsap.timeline({ delay: .35 });
  tl.from('.hero__title .char', { yPercent: 115, rotate: 8, duration: 1.4, stagger: .045, ease: 'expo.out' })
    .from('.reveal-up', { y: 30, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out' }, '-=1')
    .from('.nav__inner', { y: -24, opacity: 0, duration: .9, ease: 'expo.out', clearProps: 'transform,opacity' }, '-=1')
    .from('.scroll-hint', { opacity: 0, duration: .8 }, '-=.4');
  if (scene) gsap.from(scene.state, { scale: .2, duration: 2.2, ease: 'expo.out' });
}

Promise.all([
  document.fonts?.ready.then(() => { loader.target = Math.max(loader.target, 45); }),
  scenePromise,
  new Promise(r => setTimeout(r, 1100)),
]).then(() => {
  loader.target = 100;
  setupAnimations();
  setTimeout(intro, 450);
});
setTimeout(() => { if (document.body.classList.contains('is-loading')) { loader.target = 100; setupAnimations(); intro(); } }, 7000);

/* ---------- Cursor, magnetismo e tilt (só mouse) ---------- */
if (finePointer && !reducedMotion) {
  document.documentElement.classList.add('has-cursor');
  const cursor = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...p };
  addEventListener('pointermove', e => {
    p.x = e.clientX; p.y = e.clientY;
    dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
  }, { passive: true });
  (function loop() {
    r.x += (p.x - r.x) * .18; r.y += (p.y - r.y) * .18;
    ring.style.transform = `translate(${r.x}px, ${r.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover', e => {
    const t = e.target;
    cursor.classList.toggle('is-view', !!t.closest('[data-cursor]') && !t.closest('a, button'));
    cursor.classList.toggle('is-hover', !!t.closest('a, button'));
  });
  document.addEventListener('pointerleave', () => cursor.style.opacity = 0);
  document.addEventListener('pointerenter', () => cursor.style.opacity = 1);

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      const x = e.clientX - b.left - b.width / 2, y = e.clientY - b.top - b.height / 2;
      el.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
    });
    el.addEventListener('pointerleave', () => {
      if (hasGsap) gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .35)', clearProps: 'transform' });
      else el.style.transform = '';
    });
  });

  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      el.style.transform = `perspective(1000px) rotateY(${(x - .5) * 10}deg) rotateX(${(.5 - y) * 10}deg) translateZ(0)`;
      el.style.setProperty('--gx', x * 100 + '%');
      el.style.setProperty('--gy', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1), border-color .35s, box-shadow .35s';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 600);
    });
  });

  $$('.bento__item').forEach(el => el.addEventListener('pointermove', e => {
    const b = el.getBoundingClientRect();
    el.style.setProperty('--gx', e.clientX - b.left + 'px');
    el.style.setProperty('--gy', e.clientY - b.top + 'px');
  }));
}

/* ---------- Copiar e-mail ---------- */
const toast = $('#toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}
$('#copy-email').addEventListener('click', async e => {
  const email = e.currentTarget.dataset.email;
  window.trackEvent?.('copiar-email');
  try { await navigator.clipboard.writeText(email); showToast('E-mail copiado!'); }
  catch { showToast(email); }
});

$('#year').textContent = new Date().getFullYear();

/* ---------- Formulário de contato (Formspree) ---------- */
const cform = $('#cform');
if (cform) {
  const status = $('#cform-status');
  const submitBtn = $('button[type="submit"]', cform);
  const setStatus = (msg, kind = '') => { status.textContent = msg; status.className = 'cform__status' + (kind ? ' is-' + kind : ''); };
  const configured = !/SEU_ID_AQUI/.test(cform.action);

  cform.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    $$('input[required], textarea[required]', cform).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
      f.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { setStatus('Preencha nome, um e-mail válido e a mensagem.', 'err'); return; }

    const data = new FormData(cform);
    if (!configured) {
      // Formspree ainda sem ID: abre o e-mail já preenchido
      const body = `${data.get('mensagem')}\n\n— ${data.get('nome')} (${data.get('email')})`;
      location.href = `mailto:nathanzurita8@gmail.com?subject=${encodeURIComponent('Contato pelo portfólio')}&body=${encodeURIComponent(body)}`;
      setStatus('Abrindo seu app de e-mail…');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Enviando…');
    try {
      const res = await fetch(cform.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      cform.reset();
      setStatus('Mensagem enviada! Respondo o quanto antes.', 'ok');
      window.trackEvent?.('formulario-enviado');
    } catch {
      setStatus('Não consegui enviar agora. Tente pelo WhatsApp ou e-mail.', 'err');
    } finally {
      submitBtn.disabled = false;
    }
  });
  cform.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));
}

/* ---------- Simulador: cubo arrastável e troca de cor ---------- */
const sim = $('#sim');
if (sim) {
  const cube = $('.cube', sim);
  const baseSpeed = reducedMotion ? 0 : .35;
  const rot = { x: -22, y: 0, vy: baseSpeed };
  let drag = null, visible = false;
  const loop = () => {
    if (!drag) {
      rot.y += rot.vy;
      rot.vy += (baseSpeed - rot.vy) * .03;
      rot.x += (-22 - rot.x) * .03;
    }
    cube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
    if (visible) requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) requestAnimationFrame(loop);
  }).observe(sim);

  sim.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    drag = { x: e.clientX, y: e.clientY };
    sim.setPointerCapture(e.pointerId);
    sim.classList.add('is-dragging', 'was-dragged');
  });
  sim.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    rot.y += dx * .6;
    rot.x = Math.max(-80, Math.min(80, rot.x - dy * .6));
    rot.vy = dx * .6;
    drag = { x: e.clientX, y: e.clientY };
  });
  const endDrag = () => { drag = null; sim.classList.remove('is-dragging'); };
  sim.addEventListener('pointerup', endDrag);
  sim.addEventListener('pointercancel', endDrag);

  $$('.swatches button', sim).forEach(btn => btn.addEventListener('click', () => {
    sim.style.setProperty('--c', btn.dataset.c);
    $$('.swatches button', sim).forEach(b => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    rot.vy = 6; // giro rápido ao trocar de cor
  }));
}

/* ---------- Terminal interativo ---------- */
const termOut = $('#term-out'), termForm = $('#term-form'), termInput = $('#term-input');
if (termOut && termForm) {
  const WA = 'https://wa.me/5527999299325?text=Ol%C3%A1%20Nathan!%20Vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar.';
  const LINKS = {
    whatsapp: WA,
    github: 'https://github.com/Nathan-Zurita-Student',
    linkedin: 'https://www.linkedin.com/in/nathan-zurita',
    acadflow: 'https://acadflow.online',
  };
  const esc = t => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const print = (html = '') => {
    const p = document.createElement('p');
    p.innerHTML = html;
    termOut.appendChild(p);
    termOut.scrollTop = termOut.scrollHeight;
  };
  const open = url => window.open(url, '_blank', 'noopener');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const history = [];
  let histIdx = 0, busy = false;

  const commands = {
    help: () => [
      '<span class="c">Comandos disponíveis:</span>',
      '  <span class="cmd">whoami</span>        quem sou eu',
      '  <span class="cmd">projetos</span>      meus trabalhos',
      '  <span class="cmd">stack</span>         tecnologias que uso',
      '  <span class="cmd">curl /api/projetos</span>  a mesma lista, em JSON',
      '  <span class="cmd">contato</span>       como falar comigo',
      '  <span class="cmd">whatsapp</span> · <span class="cmd">github</span> · <span class="cmd">linkedin</span> · <span class="cmd">acadflow</span>  abre o link',
      '  <span class="cmd">cv</span>            baixa meu currículo',
      '  <span class="cmd">email</span>         copia meu e-mail',
      '  <span class="cmd">blob</span>          muda a cor da cena 3D',
      '  <span class="cmd">ls</span> · <span class="cmd">cat</span> · <span class="cmd">history</span> · <span class="cmd">clear</span>',
      '<span class="d">Dica: ↑/↓ navegam no histórico e Tab completa o comando.</span>',
    ],
    whoami: () => [
      '<span class="cmd">Nathan Zurita Barreto</span> — Desenvolvedor Full Stack',
      'Estagiário na <span class="c">North Sales</span> desde jun/2025 · Ciência da Computação na UVV (6º período)',
      'PHP/Laravel no backend, Vue 3/Nuxt no frontend e um pé no 3D com Three.js.',
    ],
    projetos: () => [
      '<span class="d">#   projeto               tipo</span>',
      '01  <span class="cmd">simulador-3d</span>          corporativo · confidencial',
      '02  <span class="cmd">backoffice</span>            corporativo · confidencial',
      '03  <span class="cmd">acadflow</span>              full stack · <span class="ok">no ar</span> (digite <span class="cmd">acadflow</span>)',
      '04  <span class="cmd">uvv-monitor</span>           bot com IA no Telegram',
      '05  <span class="cmd">student-hub</span>           app desktop (Tauri)',
      '06  <span class="cmd">raizes-do-amanha</span>      jogo 3D em Unity',
    ],
    stack: () => [
      '<span class="k">backend</span>   PHP · Laravel · Eloquent · Sanctum · Node.js',
      '<span class="k">frontend</span>  Vue 3 · Nuxt · TypeScript · Pinia · Tailwind',
      '<span class="k">3d</span>        Three.js · WebGL · Unity · C#',
      '<span class="k">dados</span>     MySQL · SQLite',
      '<span class="k">devops</span>    Git · Docker · GitHub Actions',
    ],
    curl: args => {
      if (!/projetos/.test(args.join(' '))) return ['<span class="err">curl: tente</span> <span class="cmd">curl /api/projetos</span>'];
      const rows = [['Simulador 3D', 'confidencial'], ['Backoffice', 'confidencial'], ['AcadFlow', 'no ar'], ['UVV Monitor', 'ativo'], ['Student Hub', 'concluído'], ['Raízes do Amanhã', 'concluído']];
      return [
        `<span class="ok">HTTP/1.1 200 OK</span> <span class="d">· ${20 + Math.round(Math.random() * 60)} ms</span>`,
        '[',
        ...rows.map(([n, st], i) => `  { <span class="k">"id"</span>: <span class="n">${i + 1}</span>, <span class="k">"nome"</span>: <span class="s">"${n}"</span>, <span class="k">"status"</span>: <span class="s">"${st}"</span> }${i < rows.length - 1 ? ',' : ''}`),
        ']',
      ];
    },
    contato: () => [
      `<span class="k">whatsapp</span>  <a href="${WA}" target="_blank" rel="noopener">(27) 99929-9325</a>`,
      '<span class="k">email</span>     <a href="mailto:nathanzurita8@gmail.com">nathanzurita8@gmail.com</a>',
      `<span class="k">linkedin</span>  <a href="${LINKS.linkedin}" target="_blank" rel="noopener">linkedin.com/in/nathan-zurita</a>`,
    ],
    cv: () => {
      const a = document.createElement('a');
      a.href = 'assets/Curriculo-Nathan-Zurita.pdf';
      a.download = '';
      a.click();
      return ['<span class="ok">Baixando</span> Curriculo-Nathan-Zurita.pdf…'];
    },
    email: () => {
      navigator.clipboard?.writeText('nathanzurita8@gmail.com').then(() => showToast('E-mail copiado!')).catch(() => {});
      return ['<span class="ok">Copiado:</span> nathanzurita8@gmail.com'];
    },
    blob: () => {
      if (!scene) return ['<span class="err">A cena 3D não está disponível neste dispositivo.</span>'];
      scene.state.hue += .27;
      const amp = scene.state.amp;
      scene.state.amp = amp + .35;
      setTimeout(() => { scene.state.amp = amp; }, 700);
      return ['<span class="ok">Blob recolorido.</span> <span class="d">Roda de novo para outra cor.</span>'];
    },
    ls: () => ['<span class="k">projetos/</span>  <span class="k">stack/</span>  sobre.txt  contato.txt  curriculo.pdf'],
    cat: args => {
      const f = args[0] || '';
      if (f.startsWith('sobre')) return commands.whoami();
      if (f.startsWith('contato')) return commands.contato();
      if (f.startsWith('curriculo')) return ['<span class="d">É um PDF — use</span> <span class="cmd">cv</span> <span class="d">para baixar.</span>'];
      return [`<span class="err">cat: ${esc(f || '(vazio)')}: arquivo não encontrado</span>`];
    },
    pwd: () => ['/home/nathan/portfolio'],
    date: () => [new Date().toLocaleString('pt-BR')],
    echo: args => [esc(args.join(' '))],
    history: () => history.map((h, i) => `<span class="d">${String(i + 1).padStart(3)}</span>  ${esc(h)}`),
    clear: () => { termOut.innerHTML = ''; return []; },
    exit: () => ['<span class="d">Não dá pra sair: o portfólio é bom demais.</span>'],
    sudo: async args => {
      if (args.join(' ') !== 'contratar') return ['<span class="err">Permissão negada.</span> <span class="d">Tente</span> <span class="cmd">sudo contratar</span>'];
      print('[sudo] senha para recrutador: ********');
      await wait(600);
      print('<span class="ok">Acesso concedido.</span> Ótima escolha.');
      await wait(500);
      print('Abrindo o WhatsApp…');
      await wait(400);
      open(WA);
      return [];
    },
  };
  for (const k of ['whatsapp', 'github', 'linkedin', 'acadflow']) {
    commands[k] = () => { open(LINKS[k]); return [`<span class="ok">Abrindo</span> ${LINKS[k].replace(/^https:\/\/(www\.)?/, '')}…`]; };
  }
  const aliases = { ajuda: 'help', sobre: 'whoami', skills: 'stack', zap: 'whatsapp', curriculo: 'cv', limpar: 'clear', cls: 'clear' };

  async function run(raw) {
    const line = raw.trim();
    print(`<span class="u">nathan@portfolio</span>:<span class="k">~</span>$ <span class="cmd">${esc(line)}</span>`);
    if (!line) return;
    history.push(line);
    histIdx = history.length;
    const [name, ...args] = line.split(/\s+/);
    const key = aliases[name.toLowerCase()] || name.toLowerCase();
    const fn = commands[key];
    if (!fn) { print(`<span class="err">comando não encontrado: ${esc(name)}</span> <span class="d">— digite</span> <span class="cmd">help</span>`); return; }
    window.trackEvent?.('terminal-' + key);
    busy = true;
    try { (await fn(args)).forEach(l => print(l)); } finally { busy = false; }
  }

  termForm.addEventListener('submit', e => {
    e.preventDefault();
    if (busy) return;
    const v = termInput.value;
    termInput.value = '';
    run(v);
  });
  termInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      histIdx = Math.max(0, Math.min(history.length, histIdx + (e.key === 'ArrowUp' ? -1 : 1)));
      termInput.value = history[histIdx] || '';
    } else if (e.key === 'Tab') {
      const v = termInput.value.trim().toLowerCase();
      if (!v) return;
      const match = Object.keys(commands).find(c => c.startsWith(v));
      if (match) { e.preventDefault(); termInput.value = match + (match === 'curl' ? ' /api/projetos' : ''); }
    }
  });
  $('#term').addEventListener('click', e => {
    if (!e.target.closest('a') && !getSelection().toString()) termInput.focus({ preventScroll: true });
  });

  print('<span class="c">Bem-vindo!</span> Este terminal funciona de verdade.');
  print('Digite <span class="cmd">help</span> para ver os comandos.');

  // Demonstração: digita "whoami" sozinho na primeira vez que o terminal aparece
  const demo = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    demo.disconnect();
    if (reducedMotion || termInput.value || history.length) return;
    await wait(700);
    for (const ch of 'whoami') {
      if (document.activeElement === termInput) return;
      termInput.value += ch;
      await wait(90);
    }
    await wait(300);
    if (document.activeElement === termInput && termInput.value !== 'whoami') return;
    termInput.value = '';
    run('whoami');
  }, { threshold: .6 });
  demo.observe(termOut);
}
