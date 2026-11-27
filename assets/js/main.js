import { dict, LANGS } from './i18n.js';
import { initIsland } from './island.js';
import { initCinema } from './cinema.js';

const APPS = {
  NotchIsland: { icon: 'assets/img/notchisland-icon.png', tag: 'notch.tag', repo: 'theoron-apps/NotchIsland' },
  Outputs: { icon: 'assets/img/outputs-icon.png', tag: 'outputs.tag', repo: 'theoron-apps/Outputs' },
  Conversio: { icon: 'assets/img/conversio-icon.png', tag: 'conversio.tag', repo: 'theoron-apps/Conversio' },
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = 'en';
let releases = null;

// ------------------------------------------------------------------ language
function storedLang() {
  try { return localStorage.getItem('theoron-lang'); } catch { return null; }
}
function pickLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = storedLang();
  if (LANGS.includes(saved)) return saved;
  for (const l of navigator.languages || [navigator.language]) {
    const code = (l || '').slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}
const t = (key) => dict[lang][key] ?? dict.en[key] ?? '';

function applyLang(next, { remember = false } = {}) {
  lang = next;
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]').setAttribute('content', t('meta.description'));
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-split]')) splitWords(el);
  for (const el of document.querySelectorAll('[data-i18n-alt]')) el.alt = t(el.dataset.i18nAlt);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('[data-img-lang]')) el.src = el.dataset.imgLang.replace('{lang}', lang);
  for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  if (releases) renderReleases();
  if (remember) {
    try { localStorage.setItem('theoron-lang', lang); } catch { /* private mode */ }
    const url = new URL(location.href);
    if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
}

for (const b of document.querySelectorAll('.lang button')) {
  b.addEventListener('click', () => applyLang(b.dataset.lang, { remember: true }));
}

// ------------------------------------------------------------------ releases
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const version = (tag) => String(tag).replace(/^v/i, '');

function formatDate(iso) {
  if (!iso) return '';
  const locale = { en: 'en-GB', uk: 'uk-UA', ru: 'ru-RU' }[lang];
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

function renderReleases() {
  const list = document.getElementById('release-list');
  const items = (releases.releases || []).filter((r) => APPS[r.app]).slice(0, 6);
  list.innerHTML = items.map((r, i) => `
    <li class="rel" style="--i: ${i}">
      <img src="${APPS[r.app].icon}" width="44" height="44" alt="">
      <div>
        <div class="rel-app">${esc(r.app)}<span class="ver">${esc(version(r.tag))}</span></div>
        ${r.date ? `<time datetime="${esc(r.date)}">${esc(formatDate(r.date))}${r.prerelease ? ' · ' + esc(t('rel.pre')) : ''}</time>` : ''}
      </div>
      <p class="rel-sum">${r.summary ? esc(r.summary) : ''}</p>
      <a class="rel-link" href="${esc(r.url)}">${esc(t('rel.notes'))}&nbsp;↗</a>
    </li>`).join('');

  // Hero pill: the newest release across all apps.
  const newest = items[0];
  if (newest) {
    document.getElementById('hero-pill-app').textContent = `${newest.app} ${version(newest.tag)}`;
    const text = document.getElementById('hero-pill-text');
    text.dataset.i18n = APPS[newest.app].tag;
    text.textContent = t(APPS[newest.app].tag);
  }
}

async function loadReleases() {
  try {
    const res = await fetch('data/releases.json', { cache: 'no-cache' });
    if (!res.ok) return;
    releases = await res.json();
  } catch { return; }
  for (const [app, info] of Object.entries(releases.apps || {})) {
    const latest = info && info.latest;
    if (!latest) continue;
    for (const el of document.querySelectorAll(`[data-version="${app}"]`)) el.textContent = `v${version(latest.tag)}`;
    if (latest.dmg) for (const el of document.querySelectorAll(`[data-download="${app}"]`)) el.href = latest.dmg;
  }
  renderReleases();
}

// ------------------------------------------------------------------ nav + reveal
const nav = document.getElementById('nav');
const onScroll = () => { if (!document.documentElement.classList.contains('cinema')) nav.classList.toggle('scrolled', scrollY > 24); };
addEventListener('scroll', onScroll, { passive: true });
onScroll();

if ('IntersectionObserver' in window && !reducedMotion) {
  const io = new IntersectionObserver((entries) => {
    if (document.documentElement.classList.contains('cinema')) return; // scenes reveal themselves
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  for (const el of document.querySelectorAll('[data-reveal]')) io.observe(el);
} else {
  for (const el of document.querySelectorAll('[data-reveal]')) el.classList.add('in');
}

// ------------------------------------------------------------------ headings word by word
function splitWords(el) {
  let i = 0;
  el.innerHTML = el.innerHTML.split(/(<br\s*\/?>)/).map((part) => part.startsWith('<br') ? part
    : part.split(/(\s+)/).map((w) => (!w || /^\s+$/.test(w)) ? w : `<span class="w"><span style="--i: ${i++}">${w}</span></span>`).join('')).join('');
}

// ------------------------------------------------------------------ scroll effects
const fx = {
  progress: document.getElementById('progress'),
  heroCopy: document.querySelector('.hero-copy'),
  stages: [...document.querySelectorAll('.app-stage > img, .patch-icon')],
  parallax: [...document.querySelectorAll('[data-parallax]')],
  marquee: document.querySelector('[data-marquee]'),
  orbit: document.querySelector('.support-orbit'),
};
let fxQueued = false;
function updateFx() {
  fxQueued = false;
  const vh = innerHeight, y = scrollY, max = document.documentElement.scrollHeight - vh;
  if (document.documentElement.classList.contains('cinema')) return; // scenes drive everything there
  fx.progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (reducedMotion) return;
  if (y < vh * 1.2) {
    fx.heroCopy.style.transform = `translate3d(0, ${y * -0.22}px, 0)`;
    fx.heroCopy.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)));
  }
  for (const el of fx.stages) { // screenshots drift slower than the page
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const p = (r.top + r.height / 2 - vh / 2) / vh;
    el.style.transform = el.tagName === 'IMG' ? `translate3d(0, ${p * -48}px, 0) scale(1.04)` : `translate3d(0, ${p * -36}px, 0)`;
  }
  for (const el of fx.parallax) {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < -400 || r.top > vh + 400) continue;
    el.style.transform = `translate3d(0, ${(r.top - vh / 2) * parseFloat(el.dataset.parallax)}px, 0)`;
  }
  if (fx.marquee) {
    const r = fx.marquee.getBoundingClientRect();
    if (r.bottom > -50 && r.top < vh + 50) fx.marquee.style.transform = `translate3d(${(r.top - vh) * 0.55 - 120}px, 0, 0)`;
  }
  if (fx.orbit) {
    const r = fx.orbit.getBoundingClientRect();
    fx.orbit.style.setProperty('--turn', `${((r.top - vh / 2) / vh) * -90}deg`);
  }
}
const queueFx = () => { if (!fxQueued) { fxQueued = true; requestAnimationFrame(updateFx); } };
addEventListener('scroll', queueFx, { passive: true });
addEventListener('resize', queueFx);
updateFx();

// A soft light follows the cursor over cards.
if (matchMedia('(pointer: fine)').matches) {
  for (const el of document.querySelectorAll('.spot')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
}

// ------------------------------------------------------------------ sphere
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}
function showFallback() {
  const img = document.querySelector('.sphere-fallback');
  img.hidden = false;
  document.getElementById('sphere').remove();
}

const canvas = document.getElementById('sphere');
if (webglAvailable()) {
  import('./sphere.js')
    .then(({ createSphere }) => createSphere(canvas, {
      reducedMotion,
      hero: document.getElementById('top'),
    }))
    .then(() => document.getElementById('top').classList.add('sphere-ready'))
    .catch((err) => { console.warn('Sphere failed to start', err); showFallback(); });
} else {
  showFallback();
}

applyLang(pickLang());
loadReleases();

const notchScene = document.querySelector('.notch-scene');
if (notchScene) initIsland(notchScene, document.querySelector('.try'), { reducedMotion });
initCinema({ reducedMotion });
