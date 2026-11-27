// A small working model of NotchIsland: the island expands on click, plays music,
// swipes between pages and shows live activities, like the real app does.

const TRACKS = [
  { title: 'Golden Hour Drive', artist: 'Neon Coast', length: 213, colors: ['#f9b15f', '#ef8657', '#c94f69'], sun: '#fff3cf' },
  { title: 'Midnight Ferry', artist: 'Lumen Fields', length: 245, colors: ['#6fd0e8', '#3d74d6', '#2b2f7c'], sun: '#eef8ff' },
  { title: 'Paper Kingdom', artist: 'Static Bloom', length: 178, colors: ['#f7a8d2', '#b35fd1', '#5b3aa8'], sun: '#ffe8f6' },
];
const PAGES = 3;
const TIMER_SECONDS = 30;

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const rand = (a, b) => a + Math.random() * (b - a);

export function initIsland(scene, tryBar, { reducedMotion = false } = {}) {
  const screen = scene.querySelector('.screen');
  const isl = scene.querySelector('#island');
  const hit = isl.querySelector('.isl-hit');
  const $ = (sel) => isl.querySelector(sel);

  let state = 'compact';
  let page = 0;
  let activityTimer = null;

  // ---------------------------------------------------------------- states
  function setState(next, phase) {
    state = next;
    isl.dataset.state = next;
    screen.dataset.island = next;
    if (phase) isl.dataset.phase = phase; else delete isl.dataset.phase;
    hit.hidden = next === 'expanded';
  }
  function clearActivity() {
    clearTimeout(activityTimer);
    activityTimer = null;
    agent.stop();
  }
  function activity(name, ms) {
    clearActivity();
    setState(name);
    activityTimer = setTimeout(() => setState('compact'), ms);
  }
  function expand(p = 0) {
    clearActivity();
    setPage(p);
    setState('expanded');
  }
  function collapse() {
    if (state !== 'expanded') return;
    setState('compact');
    hit.focus({ preventScroll: true });
  }
  function wiggle() {
    if (reducedMotion) return;
    isl.classList.remove('wiggle');
    void isl.offsetWidth; // restart the animation
    isl.classList.add('wiggle');
  }

  // ---------------------------------------------------------------- agent
  const agent = {
    seconds: 0, tick: null, step: null,
    start() {
      clearActivity();
      this.seconds = 0;
      this.draw();
      this.tick = setInterval(() => { this.seconds++; this.draw(); }, 1000);
      setState('agent', 'work');
      this.step = setTimeout(() => {
        clearInterval(this.tick);
        setState('agent', 'ask');
        wiggle();
        this.step = setTimeout(() => this.approve(), 8000);
      }, 3200);
    },
    draw() { $('.agent-time').textContent = fmt(this.seconds); },
    approve() {
      this.stop();
      setState('agent', 'done');
      this.step = setTimeout(() => setState('compact'), 2200);
    },
    stop() { clearTimeout(this.step); clearInterval(this.tick); },
  };

  // ---------------------------------------------------------------- pages
  const dots = [...isl.querySelectorAll('.dots button')];
  function setPage(p) {
    page = (p + PAGES) % PAGES;
    isl.style.setProperty('--page', page);
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === page)));
    if (page === 1) updateStats();
  }
  dots.forEach((d) => d.addEventListener('click', () => setPage(+d.dataset.page)));

  // Swipe between pages with a finger or a mouse drag.
  const pages = isl.querySelector('.pages');
  let swipe = null;
  pages.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, [data-seek], [data-vol]')) return;
    swipe = { x: e.clientX, id: e.pointerId };
  });
  pages.addEventListener('pointerup', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dx = e.clientX - swipe.x;
    swipe = null;
    if (Math.abs(dx) > 24) setPage(page + (dx < 0 ? 1 : -1));
  });
  pages.addEventListener('pointercancel', () => { swipe = null; });

  // ---------------------------------------------------------------- player
  const player = { i: 0, t: 84, playing: true, shuffle: false, repeat: false };
  function applyTrack() {
    const tr = TRACKS[player.i];
    scene.style.setProperty('--a1', tr.colors[0]);
    scene.style.setProperty('--a2', tr.colors[1]);
    scene.style.setProperty('--a3', tr.colors[2]);
    scene.style.setProperty('--sun', tr.sun);
    $('.t-title').textContent = tr.title;
    $('.t-artist').textContent = tr.artist;
    drawTime();
  }
  function changeTrack(i) {
    player.i = (i + TRACKS.length) % TRACKS.length;
    player.t = 0;
    if (reducedMotion) return applyTrack();
    isl.classList.add('swap');
    setTimeout(() => { applyTrack(); isl.classList.remove('swap'); }, 180);
  }
  function nextTrack() {
    if (player.repeat) { player.t = 0; return drawTime(); }
    if (player.shuffle) {
      let j = player.i;
      while (j === player.i) j = Math.floor(Math.random() * TRACKS.length);
      return changeTrack(j);
    }
    changeTrack(player.i + 1);
  }
  function drawTime() {
    const len = TRACKS[player.i].length;
    $('.t-el').textContent = fmt(player.t);
    $('.t-rem').textContent = `-${fmt(len - player.t)}`;
    $('.prog .track i').style.width = `${(player.t / len) * 100}%`;
  }
  function setPlaying(on) {
    player.playing = on;
    scene.classList.toggle('paused', !on);
  }
  setInterval(() => {
    if (!player.playing) return;
    player.t++;
    if (player.t >= TRACKS[player.i].length) nextTrack(); else drawTime();
  }, 1000);

  isl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'play') setPlaying(!player.playing);
    else if (act === 'next') nextTrack();
    else if (act === 'prev') { if (player.t > 3) { player.t = 0; drawTime(); } else changeTrack(player.i - 1); }
    else {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      if (act === 'shuffle') player.shuffle = on;
      if (act === 'repeat') player.repeat = on;
    }
  });

  // Seek and volume: click or drag along the bar.
  function bindBar(bar, onRatio) {
    const set = (e) => {
      const r = bar.getBoundingClientRect();
      onRatio(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    };
    bar.addEventListener('pointerdown', (e) => { bar.setPointerCapture(e.pointerId); set(e); });
    bar.addEventListener('pointermove', (e) => { if (bar.hasPointerCapture(e.pointerId)) set(e); });
  }
  bindBar(isl.querySelector('[data-seek]'), (k) => { player.t = Math.round(k * TRACKS[player.i].length); drawTime(); });
  const vol = isl.querySelector('[data-vol] i');
  bindBar(isl.querySelector('[data-vol]'), (k) => { vol.style.width = `${k * 100}%`; });

  // ---------------------------------------------------------------- stats
  const stats = {
    cpu: { v: 9, min: 4, max: 28, sub: (v) => `${Math.round(50 + v / 4)} °C` },
    mem: { v: 71, min: 68, max: 75, sub: (v) => `${(24 * v / 100).toFixed(1)} / 24 GB` },
    gpu: { v: 0, min: 0, max: 14, sub: (v) => `${Math.round(45 + v / 3)} °C` },
    disk: { v: 34, min: 34, max: 34, sub: () => '614 GB' },
    fans: { v: 55, min: 50, max: 62, sub: (v) => `${Math.round(v * 26.5)} rpm`, label: (v) => `${(v * 26.5 / 1000).toFixed(1)}k` },
  };
  function updateStats() {
    for (const [key, s] of Object.entries(stats)) {
      s.v = Math.min(s.max, Math.max(s.min, s.v + rand(-4, 4)));
      const ring = isl.querySelector(`[data-stat="${key}"]`);
      ring.querySelector('.rv').style.strokeDasharray = `${s.v.toFixed(1)} 100`;
      ring.querySelector('.rn').textContent = s.label ? s.label(s.v) : `${Math.round(s.v)}%`;
      ring.querySelector('.rs').textContent = s.sub(s.v);
    }
    $('.rnet').textContent = `${Math.round(rand(1, 40))} KB/s`;
    $('.rw').textContent = `${Math.round(rand(18, 32))} W`;
  }
  setInterval(() => { if (state === 'expanded' && page === 1) updateStats(); }, 1600);

  // ---------------------------------------------------------------- timer
  const timerBtn = tryBar.querySelector('[data-try="timer"]');
  const ring = scene.querySelector('.tb-ring');
  const timer = {
    left: 0, tick: null,
    start() {
      this.left = TIMER_SECONDS;
      this.draw();
      screen.dataset.timer = 'on';
      timerBtn.setAttribute('aria-pressed', 'true');
      this.tick = setInterval(() => {
        this.left--;
        this.draw();
        if (this.left <= 0) { this.stop(); activity('timerdone', 2800); }
      }, 1000);
      if (state !== 'compact') { clearActivity(); setState('compact'); }
    },
    stop() {
      clearInterval(this.tick);
      this.tick = null;
      delete screen.dataset.timer;
      timerBtn.setAttribute('aria-pressed', 'false');
    },
    draw() { ring.style.strokeDasharray = `${(this.left / TIMER_SECONDS) * 100} 100`; },
  };

  // ---------------------------------------------------------------- input
  hit.addEventListener('click', () => {
    if (state === 'agent' && isl.dataset.phase === 'ask') return agent.approve();
    expand(state === 'agent' ? 2 : 0);
  });
  screen.addEventListener('click', (e) => {
    if (!isl.contains(e.target)) collapse();
  });
  scene.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') collapse();
    if (state === 'expanded' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) setPage(page + (e.key === 'ArrowRight' ? 1 : -1));
  });

  tryBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-try]');
    if (!btn) return;
    const what = btn.dataset.try;
    if (what === 'music') state === 'expanded' && page === 0 ? collapse() : expand(0);
    else if (what === 'charging') activity('charging', 3200);
    else if (what === 'airpods') activity('airpods', 3400);
    else if (what === 'timer') (timer.tick ? timer.stop() : timer.start());
    else if (what === 'agent') agent.start();
  });

  applyTrack();
  setState('compact');
  setPage(0);
}
