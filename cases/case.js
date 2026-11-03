// Script das páginas de case: cena 3D de fundo, scroll suave, menu e animações de entrada.
import { initScene } from '../scene.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const isMobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);

let scene = null;
try { scene = initScene($('#webgl'), { isMobile, reducedMotion }); } catch (e) { console.warn('WebGL indisponível', e); }
if (!scene) document.body.classList.add('no-webgl');
const base = isMobile ? { x: 1.4, y: -3.4, z: -6, scale: .6 } : { x: 5.4, y: .2, z: -3, scale: .85 };
if (scene) Object.assign(scene.state, base, { hue: +document.body.dataset.hue || 0, amp: .34 });

// Menu mobile
const menu = $('#menu'), burger = $('#menu-toggle');
const closeMenu = () => { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', String(menu.classList.toggle('is-open'))));
$$('#menu a').forEach(a => a.addEventListener('click', closeMenu));

// Nav e botão do WhatsApp
const nav = $('.nav'), fab = $('.wa-fab');
const onScroll = () => {
  nav.classList.toggle('is-scrolled', scrollY > 20);
  fab.classList.toggle('is-visible', scrollY > innerHeight * .4);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis && !reducedMotion) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // A cena acompanha o scroll da página
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      if (!scene) return;
      scene.state.spin = self.progress * Math.PI * 2;
      scene.state.y = base.y + self.progress * (isMobile ? 5 : -2.4);
      scene.state.x = base.x * (self.progress > .5 ? -1 : 1);
    },
  });

  gsap.from('.case-hero .back, .case-hero .kicker, .case-title, .case-tagline, .case-meta, .case-actions', {
    y: 40, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', delay: .1,
  });
  gsap.from('.case-visual', { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', delay: .4 });

  gsap.set('.feature, .decision, .challenge, .node, .stat', { y: 50, opacity: 0 });
  ScrollTrigger.batch('.feature, .decision, .challenge, .node, .stat', {
    start: 'top 90%',
    onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: .9, stagger: .08, ease: 'expo.out', overwrite: true }),
  });
  $$('.case-section__label').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));

  $$('[data-count]').forEach(el => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });
} else {
  $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
}

$('#year').textContent = new Date().getFullYear();
