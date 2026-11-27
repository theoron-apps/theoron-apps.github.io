// The NotchIsland page. A MacBook stays on stage while the scenes change around it: each scene
// moves the camera (data-shot on the stage) and plays its part on the island, like a keynote demo.
// The island stays live: clicking it hands control to the visitor until the next scene.
import { addStrings, initLang } from './lang.js';
import { strings } from './i18n-notchisland.js';
import { renderNotchScenes } from './notch-scene.js';
import { initIsland } from './island.js';
import { initCinema } from './cinema.js';

addStrings(strings);
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cinema = () => root.classList.contains('cinema');

renderNotchScenes();
initLang();

const stage = document.querySelector('.ni-stage');
const island = initIsland(stage.querySelector('.notch-scene'), null, { reducedMotion });

// ------------------------------------------------------------------ the director
let timers = [];
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const cut = () => { timers.forEach(clearTimeout); timers = []; };

const TIMER_DEMO = 15;
const PLANS = {
  top() { island.playing(true); },
  music() { island.playing(true); later(500, () => island.expand(0)); },
  agents() {
    const loop = () => {
      island.agent();                                   // works for 3.2 s, then asks
      later(5600, () => island.approve());              // approved, "Done"
      later(8600, () => island.expand(2));              // the list of agents and limits
      later(14000, () => island.reset());
      later(15200, loop);
    };
    later(500, loop);
  },
  notifications() {
    const loop = () => {
      island.activity('charging', 3000);
      later(3900, () => island.activity('airpods', 3300));
      later(8200, loop);
    };
    later(500, loop);
  },
  activities() {
    const loop = () => { island.indicators(true); island.timer(true, TIMER_DEMO); later(TIMER_DEMO * 1000 + 3800, loop); };
    later(500, loop);
  },
  stats() { later(500, () => island.expand(1)); },
  more() {},
  get() {},
};

let shot = null;
function direct(id) {
  if (id === shot || !PLANS[id]) return;
  shot = id;
  cut();
  island.reset();
  stage.dataset.shot = id;
  PLANS[id]();
}
// The visitor takes over: the scene stops driving the island until the next one.
stage.addEventListener('pointerdown', cut);
stage.addEventListener('keydown', cut);
addEventListener('theoron:scene', (e) => direct(e.detail.id));

// On a normal scrolling page (phones, small windows, reduced motion), the scene crossing the
// middle of the window directs the island.
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    if (cinema()) return;
    for (const e of entries) if (e.isIntersecting) direct(e.target.dataset.scene);
  }, { rootMargin: '-58% 0px -41% 0px' });
  for (const el of document.querySelectorAll('.ni-scene[data-scene]')) io.observe(el);
}

// The notification shown on the island lights up its name in the list.
const chips = [...document.querySelectorAll('[data-chip]')];
const islandEl = stage.querySelector('.island');
new MutationObserver(() => {
  for (const c of chips) c.classList.toggle('on', c.dataset.chip === islandEl.dataset.state);
}).observe(islandEl, { attributes: true, attributeFilter: ['data-state'] });

// ------------------------------------------------------------------ reveal, nav, progress
if ('IntersectionObserver' in window && !reducedMotion) {
  const io = new IntersectionObserver((entries) => {
    if (cinema()) return; // scenes reveal themselves
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  for (const el of document.querySelectorAll('[data-reveal]')) io.observe(el);
} else {
  for (const el of document.querySelectorAll('[data-reveal]')) el.classList.add('in');
}

const nav = document.getElementById('nav');
const progress = document.getElementById('progress');
function onScroll() {
  if (cinema()) return;
  const max = root.scrollHeight - innerHeight;
  nav.classList.toggle('scrolled', scrollY > 24);
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (matchMedia('(pointer: fine)').matches) {
  for (const el of document.querySelectorAll('.spot')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
}

// ------------------------------------------------------------------ latest version
fetch('/data/releases.json', { cache: 'no-cache' })
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    const latest = data?.apps?.NotchIsland?.latest;
    if (!latest) return;
    const v = `v${String(latest.tag).replace(/^v/i, '')}`;
    for (const el of document.querySelectorAll('[data-version="NotchIsland"]')) el.textContent = v;
    if (latest.dmg) for (const el of document.querySelectorAll('[data-download="NotchIsland"]')) el.href = latest.dmg;
    if (latest.url) for (const el of document.querySelectorAll('[data-notes="NotchIsland"]')) el.href = latest.url;
  })
  .catch(() => {});

initCinema({ reducedMotion });
if (!shot) direct('top');
