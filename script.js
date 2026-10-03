(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  function splitWords(el, { mask }) {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.setAttribute('aria-label', text);
    el.textContent = '';
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.setAttribute('aria-hidden', 'true');
      outer.style.setProperty('--i', i);
      if (mask) {                       
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.textContent = word;
        outer.appendChild(inner);
      } else {                          
        outer.className = 'word';
        outer.textContent = word;
      }
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('[data-split]').forEach(el => splitWords(el, { mask: true }));
  $$('[data-words]').forEach(el => splitWords(el, { mask: false }));
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduced) { el.textContent = target; return; }
    const duration = 1800;
    const t0 = performance.now();
    const tick = now => {
      const p = clamp((now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (!reduced) $$('[data-count]').forEach(el => (el.textContent = '0'));
  const cols = window.innerWidth > 1024 ? 3 : window.innerWidth > 720 ? 2 : 1;
  $$('.product').forEach((el, i) => el.style.setProperty('--d', `${(i % cols) * 0.09}s`));
  const revealTargets = $$('[data-reveal], [data-split], [data-draw], [data-count]');
  if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      (el._mask || [el]).forEach(t => t.classList.add('is-in'));
      if (el.hasAttribute('data-count')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => {
    if (el.dataset.reveal === 'mask') {
      const p = el.parentElement;       
      p._mask = [...(p._mask || []), el];
      io.observe(p);
    } else {
      io.observe(el);
    }
  });
} else {
  revealTargets.forEach(el => el.classList.add('is-in'));
}
  const header     = $('.site-header');
  const parallax   = $$('[data-parallax]');
  const scalers    = $$('[data-scale]');
  const wordBlocks = $$('[data-words]').map(el => ({ el, words: $$('.word', el) }));
  let ticking = false;
  function update() {
    ticking = false;
    const y  = window.scrollY;
    const vh = window.innerHeight;
    header.classList.toggle('is-scrolled', y > 24);
    const max = root.scrollHeight - vh;
    header.style.setProperty('--progress', max > 0 ? clamp(y / max).toFixed(4) : 0);
    if (reduced) return;
    parallax.forEach(img => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const offset = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2); 
      img.style.transform = `translate3d(0, ${(-offset * box.height * 0.06).toFixed(1)}px, 0) scale(1.14)`;
    });
    scalers.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 0.75));
      el.style.transform = `scale(${(0.88 + 0.12 * p).toFixed(3)})`;
    });
    wordBlocks.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25));
      const t = p * (words.length + 3);
      words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(t - i)).toFixed(2); });
    });
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
  const navLinks = $$('.nav a, .menu a');
  const sections = $$('[data-section]');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          const active = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => so.observe(s));
  }
  const burger = $('.burger');
  const menu   = $('.menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 720) setMenu(false); });
  $$('img').forEach(img => {
    const hide = () => img.classList.add('is-missing');
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
