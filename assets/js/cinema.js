// Presentation mode. On large screens the page never scrolls: the site is a deck of
// full-screen scenes, and one wheel or trackpad gesture, an arrow key, Space or a swipe moves to
// the next scene. Smaller screens keep a normal page with inertial smooth scrolling.
import Lenis from '../vendor/lenis.mjs';

const STEP_MS = 1050;           // one transition
const GESTURE_GAP = 200;        // a pause this long usually ends a wheel gesture

export function initCinema({ reducedMotion }) {
  const root = document.documentElement;
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const dots = [...document.querySelectorAll('.scene-dots button')];
  const hero = document.getElementById('top');
  const heroCopy = hero.querySelector('.hero-copy');
  const heroStage = hero.querySelector('.hero-stage');
  const apps = document.getElementById('apps');
  const support = document.getElementById('support');
  const footer = document.querySelector('footer');

  // The deck, in order. Each scene is one or more elements shown together.
  const scenes = [
    { id: 'top', els: [hero] },
    { id: 'apps', els: [apps.querySelector('.sec-head')] },
    { id: 'notchisland', els: [document.getElementById('notchisland')], app: true },
    { id: 'outputs', els: [document.getElementById('outputs')], app: true },
    { id: 'conversio', els: [document.getElementById('conversio')], app: true },
    { id: 'releases', els: [document.getElementById('releases')] },
    { id: 'principles', els: [document.getElementById('principles')] },
    { id: 'support', els: [support, footer] },
  ];
  const indexOf = (id) => scenes.findIndex((s) => s.id === id);

  // ---------------------------------------------------------------- smooth scroll for normal mode
  let lenis = null;
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // ---------------------------------------------------------------- mode
  // 1021px: the mobile layout rules apply up to and including 1020px.
  const query = matchMedia('(min-width: 1021px) and (min-height: 680px)');
  let on = false;
  let current = 0;
  let lockedUntil = 0;
  let firstRun = true;

  // Switch classes without playing transitions, so nothing flashes on load or on resize.
  function quietly(fn) {
    root.classList.add('cinema-init');
    fn();
    void root.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('cinema-init')));
  }

  // In normal mode, the scene whose element is nearest the middle of the window.
  function sceneInView() {
    let best = 0, dist = Infinity;
    scenes.forEach((s, i) => {
      const r = s.els[0].getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - innerHeight / 2);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function setMode() {
    const next = !reducedMotion && query.matches;
    if (next === on) { if (on) fit(); return; }
    const hashIndex = indexOf(location.hash.slice(1));
    const start = firstRun ? Math.max(0, hashIndex) : sceneInView();
    firstRun = false;
    on = next;
    quietly(() => {
      root.classList.toggle('cinema', on);
      scenes.forEach((s, i) => s.els.forEach((el) => {
        el.classList.toggle('scene', on);
        el.classList.toggle('scene-app', on && !!s.app);
        el.style.setProperty('--z', String(i + 1));
        if (!on) { el.classList.remove('is-active', 'is-before', 'is-after', 'is-next', 'tilting'); el.inert = false; el.removeAttribute('tabindex'); for (const v of ['--rx', '--ry', '--tilt']) el.style.removeProperty(v); }
        else el.tabIndex = -1;
      }));
      if (on) {
        lenis?.stop();
        // Clear what the scroll effects left behind; the scenes take over from here.
        for (const el of [heroCopy, heroStage, ...document.querySelectorAll('.app-stage > img, .patch-icon, .glow, [data-marquee]')]) {
          el.style.transform = ''; el.style.opacity = '';
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
        show(start, true);
        fit();
      } else {
        lenis?.start();
        for (const el of document.querySelectorAll('[data-reveal]')) el.classList.add('in');
        dispatchEvent(new CustomEvent('theoron:hero', { detail: true }));
        // Land on the scene that was showing.
        const y = current === 0 ? 0 : scenes[current].els[0].getBoundingClientRect().top + scrollY - 80;
        window.scrollTo({ top: y, behavior: 'instant' });
        lenis?.scrollTo(y, { immediate: true, force: true });
        requestAnimationFrame(() => { if (Math.abs(scrollY - y) > 2) { window.scrollTo({ top: y, behavior: 'instant' }); lenis?.scrollTo(y, { immediate: true, force: true }); } });
        nav.classList.toggle('scrolled', y > 24);
      }
    });
  }

  // Scale scenes down when a short window cannot fit them. Only the scene content is scaled;
  // the footer of the last scene keeps its size, so it is subtracted from the room first.
  const avail = () => innerHeight - 96;
  function fit() {
    if (!on) return;
    const footH = footer.offsetHeight;
    support.style.setProperty('--foot-h', `${footH}px`);
    for (const s of scenes) {
      const el = s.els[0];
      const target = s.app ? el : el.querySelector(':scope > .wrap');
      if (!target) continue;
      const room = avail() - (s.app ? 24 : 0) - (s.id === 'support' ? footH : 0);
      const h = s.app ? el.offsetHeight : target.scrollHeight;
      el.style.setProperty('--fit', Math.min(1, room / Math.max(1, h)).toFixed(3));
    }
  }
  // Content changes height after load (releases arrive, the language changes, fonts swap).
  let fitQueued = false;
  const queueFit = () => { if (!fitQueued) { fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fit(); }); } };
  const ro = new ResizeObserver(queueFit);
  for (const s of scenes) {
    const el = s.els[0];
    ro.observe(s.app ? el : (el.querySelector(':scope > .wrap') || el));
  }
  ro.observe(footer);
  document.fonts?.ready.then(queueFit);

  // ---------------------------------------------------------------- showing a scene
  function show(i, instant = false, { focus = false } = {}) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    const focusWasInside = scenes[current].els.some((el) => el.contains(document.activeElement));
    current = i;
    scenes.forEach((s, k) => s.els.forEach((el) => {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-before', k < i);
      el.classList.toggle('is-after', k > i);
      el.classList.toggle('is-next', k === i + 1);
      el.classList.remove('tilting');
      // Depth order: passed scenes fly past in front, scenes ahead wait behind, nearest first.
      el.style.setProperty('--z', String(k === i ? 50 : k < i ? 60 : 40 - (k - i)));
      el.inert = k !== i;
      // Reveal animations replay each time a scene comes into view.
      const reveals = el.matches('[data-reveal]') ? [el, ...el.querySelectorAll('[data-reveal]')] : [...el.querySelectorAll('[data-reveal]')];
      for (const r of reveals) r.classList.toggle('in', k === i);
    }));
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    progress.style.transform = `scaleX(${i / (scenes.length - 1)})`;
    nav.classList.toggle('scrolled', i > 0);
    dispatchEvent(new CustomEvent('theoron:hero', { detail: i === 0 }));
    history.replaceState(null, '', i === 0 ? location.pathname + location.search : `#${scenes[i].id}`);
    // Keep keyboard focus with the visible scene, so Tab continues from there.
    if (focus || focusWasInside) scenes[i].els[0].focus({ preventScroll: true });
    if (!instant) lockedUntil = performance.now() + STEP_MS;
    clearTimeout(tiltTimer);
    if (scenes[i].app) tiltTimer = setTimeout(() => scenes[i].els[0].classList.add('tilting'), instant ? 0 : STEP_MS);
  }
  let tiltTimer = null;

  // ---------------------------------------------------------------- card tilt
  // The current app card leans a little toward the pointer, like a glass panel.
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    for (const s of scenes.filter((x) => x.app)) {
      const card = s.els[0];
      card.addEventListener('pointermove', (e) => {
        if (!on || !card.classList.contains('is-active')) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        card.style.setProperty('--tilt', Math.min(1, Math.hypot(x, y) * 2).toFixed(2));
      });
      card.addEventListener('pointerleave', () => { for (const v of ['--rx', '--ry', '--tilt']) card.style.removeProperty(v); });
    }
  }
  const go = (delta, opts) => {
    if (performance.now() < lockedUntil) return false;
    const next = current + delta;
    if (next < 0 || next >= scenes.length) return false;
    show(next, false, opts);
    lastStepAt = performance.now();
    return true;
  };

  // ---------------------------------------------------------------- wheel
  // One gesture moves one scene. A trackpad keeps sending events after the fingers lift (inertia),
  // and during a strong swipe the speed wobbles and can pick up again as the inertia takes over.
  // All of that belongs to the same gesture. A new flick counts only once the stream has clearly
  // died down (below 40% of its peak, at least 600 ms after the step) and then speeds up again.
  const FRESH_AFTER_MS = 600, FRESH_DROP = 0.4;
  let gestureUsed = false, flickHandled = false, lastWheel = -Infinity, prevAbs = 0, rising = 0, decaying = 0, acc = 0;
  let peak = 0, trough = 0;
  let lastStepAt = -Infinity, pendingTimer = null;
  // A flick made while a transition is still running is not lost: it lands when the transition ends.
  function queueStep(dir) {
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pendingTimer = null; go(dir); }, Math.max(0, lockedUntil - performance.now()) + 20);
  }
  addEventListener('wheel', (e) => {
    if (!on || e.ctrlKey) return;                               // pinch / Ctrl+wheel zoom
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;        // leave horizontal swipes (back/forward) alone
    e.preventDefault();
    const t = e.timeStamp, abs = Math.abs(e.deltaY), gap = t - lastWheel, now = performance.now(), prev = prevAbs;
    const wasDecaying = decaying >= 3;
    rising = abs > prev ? rising + 1 : 0;
    decaying = abs < prev ? decaying + 1 : 0;
    if (decaying >= 3) flickHandled = false;                    // the flick has turned into its inertial tail
    lastWheel = t; prevAbs = abs;
    if (gestureUsed) {
      if (abs > peak && trough >= peak * 0.95) peak = trough = abs; // still speeding up into the swipe
      else trough = Math.min(trough, abs);
    }
    if (gap > GESTURE_GAP) {
      // A pause ends the gesture, unless the transition is still running or it was only a hiccup
      // in a decaying inertial tail (a real new flick is caught by its speed-up below).
      const tail = gestureUsed && (now < lockedUntil || (wasDecaying && abs <= prev * 1.25));
      if (!tail) { gestureUsed = false; flickHandled = false; acc = 0; }
    } else if (gestureUsed && !flickHandled && now - lastStepAt >= FRESH_AFTER_MS && trough <= peak * FRESH_DROP
      && rising >= 3 && abs >= Math.max(12, trough * 2.5)) {
      // Speed building up again on top of a tail: the fingers flicked once more.
      flickHandled = true;
      peak = trough = abs;
      if (now < lockedUntil) { queueStep(Math.sign(e.deltaY)); return; }
      gestureUsed = false; acc = 0;
    }
    if (gestureUsed) return;
    acc += e.deltaY;
    if (Math.abs(acc) > 24 && now >= lockedUntil) {
      gestureUsed = true; flickHandled = true; peak = trough = abs;
      go(acc > 0 ? 1 : -1);
    }
  }, { passive: false });

  // ---------------------------------------------------------------- keys
  addEventListener('keydown', (e) => {
    if (!on || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const space = e.key === ' ';
    if (space && e.target.closest('button')) return;            // Space presses buttons
    const next = e.key === 'ArrowDown' || e.key === 'PageDown' || (space && !e.shiftKey);
    const prev = e.key === 'ArrowUp' || e.key === 'PageUp' || (space && e.shiftKey);
    if (next || prev) { e.preventDefault(); go(next ? 1 : -1, { focus: true }); }
    else if (e.key === 'Home') { e.preventDefault(); show(0, false, { focus: true }); }
    else if (e.key === 'End') { e.preventDefault(); show(scenes.length - 1, false, { focus: true }); }
  });

  // ---------------------------------------------------------------- touch (an iPad in landscape)
  // A clear vertical one-finger swipe moves a scene. Drags that belong to something else (the
  // sphere, the island's pages and bars) and two-finger gestures such as pinch-zoom are left alone.
  const OWN_DRAG = '#sphere, .pages, [data-seek], [data-vol]';
  let touch = null;
  addEventListener('touchstart', (e) => {
    touch = on && e.touches.length === 1 && !e.target.closest(OWN_DRAG)
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!touch || e.touches.length !== 1) { touch = null; return; }
    e.preventDefault();                                         // no rubber-band scrolling of the deck
  }, { passive: false });
  addEventListener('touchend', (e) => {
    if (!touch) return;
    const dx = touch.x - e.changedTouches[0].clientX, dy = touch.y - e.changedTouches[0].clientY;
    touch = null;
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) * 1.5) go(dy > 0 ? 1 : -1);
  });

  // ---------------------------------------------------------------- links and dots
  // In-page links and the dots land on scenes; the address shows the current scene.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const i = indexOf(id || 'top');
    if (i < 0) return;
    if (on) { e.preventDefault(); show(i); }
    else if (lenis) { e.preventDefault(); lenis.scrollTo(i === 0 ? 0 : `#${id}`, { offset: -80, duration: 1.4 }); }
  });
  dots.forEach((d) => d.addEventListener('click', () => show(+d.dataset.go)));
  addEventListener('hashchange', () => { if (on) { const i = indexOf(location.hash.slice(1)); if (i >= 0) show(i); } });

  // The hero copy rises in with a CSS animation on load; afterwards transitions take over.
  setTimeout(() => heroCopy.classList.add('settled'), 1900);

  addEventListener('resize', setMode);
  query.addEventListener('change', setMode);
  setMode();
  if (!on && location.hash.length > 1 && lenis) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => lenis.scrollTo(el, { offset: -80, immediate: true }), 60);
  }
}
