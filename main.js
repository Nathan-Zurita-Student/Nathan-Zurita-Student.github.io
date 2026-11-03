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
  contact: { x: 0,    y: -1.7, z: -3,  scale: .95,  hue: .82, amp: .5 },
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

/* ---------- Nav: esconder ao descer, link ativo ---------- */
const nav = $('.nav'), fab = $('.wa-fab');
let lastY = 0;
function onScroll() {
  const y = scrollY;
  nav.classList.toggle('is-scrolled', y > 20);
  nav.classList.toggle('is-hidden', y > 400 && y > lastY && !menu.classList.contains('is-open'));
  fab.classList.toggle('is-visible', y > innerHeight * .6);
  lastY = y;
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
  gsap.set('.job, .bento__item, .stat', { y: 70, opacity: 0 });
  ScrollTrigger.batch('.job, .bento__item, .stat', {
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

  // Projetos: scroll horizontal no desktop
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const work = $('#work-track');
    const cards = $$('.card', work);
    const dist = () => work.scrollWidth - innerWidth;
    gsap.to(work, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#projetos', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true,
        onUpdate: self => {
          $('#work-bar').style.transform = `scaleX(${self.progress})`;
          $('#work-current').textContent = String(Math.min(cards.length, Math.round(self.progress * (cards.length - 1)) + 1)).padStart(2, '0');
        },
      },
    });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.utils.toArray('.card').forEach(c => gsap.from(c, {
      y: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' },
    }));
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
    .from('.nav', { y: -40, opacity: 0, duration: .9, ease: 'expo.out' }, '-=1')
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
  try { await navigator.clipboard.writeText(email); showToast('E-mail copiado! ✓'); }
  catch { showToast(email); }
});

$('#year').textContent = new Date().getFullYear();
