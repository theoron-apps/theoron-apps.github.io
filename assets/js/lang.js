// Language: English, Ukrainian and Russian. English is written into the HTML, so a page reads
// correctly before (or without) JavaScript; the other languages come from the dictionaries.
// Shared by the studio page and the app pages.
import { dict as studio, LANGS } from './i18n.js';

export { LANGS };

const dict = { en: { ...studio.en }, uk: { ...studio.uk }, ru: { ...studio.ru } };
let lang = 'en';
const listeners = [];

/** Add a page's own strings ({ en: {...}, uk: {...}, ru: {...} }). */
export function addStrings(more) {
  for (const l of LANGS) Object.assign(dict[l], more[l] || {});
}

export const t = (key) => dict[lang][key] ?? dict.en[key] ?? '';
export const currentLang = () => lang;
export const onLangChange = (fn) => listeners.push(fn);

function storedLang() {
  try { return localStorage.getItem('theoron-lang'); } catch { return null; }
}
export function pickLang() {
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

// Headings with data-split rise word by word: each word gets its own span.
function splitWords(el) {
  let i = 0;
  el.innerHTML = el.innerHTML.split(/(<br\s*\/?>)/).map((part) => part.startsWith('<br') ? part
    : part.split(/(\s+)/).map((w) => (!w || /^\s+$/.test(w)) ? w : `<span class="w"><span style="--i: ${i++}">${w}</span></span>`).join('')).join('');
}

export function applyLang(next, { remember = false } = {}) {
  lang = next;
  const root = document.documentElement;
  root.lang = lang;
  const titleKey = root.dataset.titleKey || 'meta.title';
  const descKey = root.dataset.descKey || 'meta.description';
  if (t(titleKey)) document.title = t(titleKey);
  if (t(descKey)) document.querySelector('meta[name="description"]')?.setAttribute('content', t(descKey));
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-split]')) splitWords(el);
  for (const el of document.querySelectorAll('[data-i18n-alt]')) el.alt = t(el.dataset.i18nAlt);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('[data-img-lang]')) el.src = el.dataset.imgLang.replace('{lang}', lang);
  for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  for (const fn of listeners) fn(lang);
  if (remember) {
    try { localStorage.setItem('theoron-lang', lang); } catch { /* private mode */ }
    const url = new URL(location.href);
    if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
}

export function initLang() {
  for (const b of document.querySelectorAll('.lang button')) {
    b.addEventListener('click', () => applyLang(b.dataset.lang, { remember: true }));
  }
  applyLang(pickLang());
}
