// The MacBook screen with the island, shared by the studio page and the NotchIsland page.
// Pages put an empty <div class="notch-scene" data-notch-scene> where it should go.
export const NOTCH_SCENE = `
  <div class="mac"><div class="screen">
    <div class="menubar">
      <b>Finder</b><span data-i18n="notch.file">File</span><span data-i18n="notch.edit">Edit</span>
      <span class="mb-end">
        <svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="5" r="1.5" fill="currentColor"/><rect x="1.5" y="9" width="13" height="5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="11.5" r="1.5" fill="currentColor"/></svg>
        <span data-i18n="notch.date">Mon 27 Oct</span><span>9:41</span>
      </span>
    </div>
    <div class="island" id="island" data-state="compact">
      <button type="button" class="isl-hit" aria-label="Open NotchIsland" data-i18n-aria="isl.aria"></button>
      <div class="v v-compact" aria-hidden="true">
        <span class="art art-sm"><i></i></span>
        <span class="eq eq-sm"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="v v-charging" aria-hidden="true">
        <span data-i18n="isl.charging">Charging</span>
        <span class="ok">80% <svg viewBox="0 0 28 14"><rect x=".75" y=".75" width="23" height="12.5" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="3" width="15" height="8" rx="1.6" fill="currentColor"/><path d="M25.8 5v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
      </div>
      <div class="v v-airpods" aria-hidden="true">
        <div class="row">
          <svg viewBox="0 0 24 24" class="pods"><path fill="currentColor" d="M6.5 3a3.5 3.5 0 0 0-1 6.86V19a1.5 1.5 0 0 0 3 0V6.6A3.5 3.5 0 0 0 6.5 3Zm11 0a3.5 3.5 0 0 0-2 .6V19a1.5 1.5 0 0 0 3 0V9.86A3.5 3.5 0 0 0 17.5 3Z"/></svg>
          <span class="ok" data-i18n="isl.connected">Connected</span>
        </div>
        <b>AirPods Pro</b>
      </div>
      <div class="v v-timerdone" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="tm-ico"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4.5l3 2M9.5 2.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span data-i18n="isl.timerDone">Timer done</span>
      </div>
      <div class="v v-agent" aria-hidden="true">
        <div class="row">
          <svg viewBox="0 0 24 24" class="spark"><path fill="currentColor" d="M12 2.5c.5 4.6 2.6 6.9 7.5 7.5-4.9.6-7 2.9-7.5 7.5-.5-4.6-2.6-6.9-7.5-7.5 4.9-.6 7-2.9 7.5-7.5Zm6.5 11c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3Z"/></svg>
          <span class="agent-right">
            <span class="agent-time">0:00</span><i class="spin"></i>
            <svg viewBox="0 0 24 24" class="hand"><path fill="currentColor" d="M8.5 11V4.8a1.3 1.3 0 0 1 2.6 0V10h.4V3.6a1.3 1.3 0 0 1 2.6 0V10h.4V4.8a1.3 1.3 0 0 1 2.6 0V10.6h.3V7.4a1.3 1.3 0 0 1 2.6 0v6.8c0 4.4-2.7 7.3-6.6 7.3-2.4 0-4-.9-5.4-2.9l-3.4-5c-.5-.8-.3-1.7.4-2.1.7-.4 1.5-.2 2 .5l1.5 2.2Z"/></svg>
            <svg viewBox="0 0 24 24" class="check"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <div class="agent-line"><b>NotchIsland</b> · <span class="ph ph-work" data-i18n="isl.editing">Editing SettingsView.swift</span><span class="ph ph-ask" data-i18n="isl.ask">Needs permission</span><span class="ph ph-done" data-i18n="isl.done">Done</span></div>
      </div>
      <div class="v v-expanded">
        <div class="pages"><div class="pages-track">
          <section class="pg pg-player">
            <div class="np">
              <div class="art"><i></i></div>
              <div class="meta"><b class="t-title">Golden Hour Drive</b><span class="t-artist">Neon Coast</span></div>
              <button type="button" class="star" data-act="star" aria-pressed="false" aria-label="Favourite" data-i18n-aria="isl.star"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg></button>
              <div class="eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>
            <div class="prog"><span class="t-el">1:24</span><div class="track" data-seek><i></i></div><span class="t-rem">-2:09</span></div>
            <div class="ctrls">
              <button type="button" class="dim" data-act="shuffle" aria-pressed="false" aria-label="Shuffle" data-i18n-aria="isl.shuffle"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 7h3.5c4 0 6 10 10 10H21M3 17h3.5c1.6 0 2.8-1.6 3.9-3.6M13.6 9.6C14.7 8 15.6 7 17 7h4M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/></svg></button>
              <button type="button" data-act="prev" aria-label="Previous" data-i18n-aria="isl.prev"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.5 6.5v11L4 12zM20 6.5v11L12.5 12z"/></svg></button>
              <button type="button" class="big" data-act="play" aria-label="Play or pause" data-i18n-aria="isl.play"><svg viewBox="0 0 24 24" class="i-pause"><rect x="6.5" y="5" width="3.8" height="14" rx="1" fill="currentColor"/><rect x="13.7" y="5" width="3.8" height="14" rx="1" fill="currentColor"/></svg><svg viewBox="0 0 24 24" class="i-play"><path fill="currentColor" d="M7 4.8v14.4c0 .8.9 1.3 1.6.8l10.6-7.2a1 1 0 0 0 0-1.6L8.6 4c-.7-.5-1.6 0-1.6.8Z"/></svg></button>
              <button type="button" data-act="next" aria-label="Next" data-i18n-aria="isl.next"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 6.5v11l7.5-5.5zM12.5 6.5v11L20 12z"/></svg></button>
              <button type="button" class="dim" data-act="repeat" aria-pressed="false" aria-label="Repeat" data-i18n-aria="isl.repeat"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 12V10a3 3 0 0 1 3-3h12M16 4l3 3-3 3M20 12v2a3 3 0 0 1-3 3H5M8 20l-3-3 3-3"/></svg></button>
            </div>
            <div class="vol"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/></svg><div class="track" data-vol><i></i></div></div>
          </section>
          <section class="pg pg-stats">
            <div class="rings">
              <div class="ring" data-stat="cpu" style="--c: #30d158"><svg viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="15"/><circle class="rv" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="rn">9%</b><span>CPU</span><small class="rs">53 °C</small></div>
              <div class="ring" data-stat="mem" style="--c: #ffd60a"><svg viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="15"/><circle class="rv" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="rn">71%</b><span><span data-i18n="isl.memory">Memory</span></span><small class="rs">16.9 / 24 GB</small></div>
              <div class="ring" data-stat="gpu" style="--c: #30d158"><svg viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="15"/><circle class="rv" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="rn">0%</b><span>GPU</span><small class="rs">47 °C</small></div>
              <div class="ring" data-stat="disk" style="--c: #30d158"><svg viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="15"/><circle class="rv" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="rn">34%</b><span><span data-i18n="isl.disk">Disk</span></span><small class="rs">614 GB</small></div>
              <div class="ring" data-stat="fans" style="--c: #30d158"><svg viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="15"/><circle class="rv" cx="18" cy="18" r="15" pathLength="100"/></svg><b class="rn">1.5k</b><span><span data-i18n="isl.fans">Fans</span></span><small class="rs">1458 rpm</small></div>
            </div>
            <div class="stat-row"><span class="net">↓ <span class="rnet">3 KB/s</span></span><span class="rw">26 W</span><span>225 / 405 <span data-i18n="isl.nits">nits</span></span><span class="cool" data-i18n="isl.normal">Normal</span></div>
          </section>
          <section class="pg pg-agents">
            <div class="ag-head"><svg viewBox="0 0 24 24" class="spark"><path fill="currentColor" d="M12 2.5c.5 4.6 2.6 6.9 7.5 7.5-4.9.6-7 2.9-7.5 7.5-.5-4.6-2.6-6.9-7.5-7.5 4.9-.6 7-2.9 7.5-7.5Zm6.5 11c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3Z"/></svg><b data-i18n="isl.agents">AI agents</b></div>
            <div class="ag"><svg viewBox="0 0 24 24" class="spark"><path fill="currentColor" d="M12 2.5c.5 4.6 2.6 6.9 7.5 7.5-4.9.6-7 2.9-7.5 7.5-.5-4.6-2.6-6.9-7.5-7.5 4.9-.6 7-2.9 7.5-7.5Zm6.5 11c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3Z"/></svg><div><b>NotchIsland</b> <span>· Claude Code</span><small><span data-i18n="isl.editing">Editing SettingsView.swift</span> · 2:16</small></div><span class="open-pill" data-i18n="isl.open">Open</span><i class="spin"></i></div>
            <div class="ag"><svg viewBox="0 0 24 24" class="spark"><path fill="currentColor" d="M12 2.5c.5 4.6 2.6 6.9 7.5 7.5-4.9.6-7 2.9-7.5 7.5-.5-4.6-2.6-6.9-7.5-7.5 4.9-.6 7-2.9 7.5-7.5Zm6.5 11c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3Z"/></svg><div><b>promo-site</b> <span>· Claude Code</span><small><span data-i18n="isl.tests">Run test suite</span> · 2:16</small></div><span class="open-pill" data-i18n="isl.open">Open</span><i class="spin"></i></div>
            <div class="ag"><svg viewBox="0 0 24 24" class="spark"><path fill="currentColor" d="M12 2.5c.5 4.6 2.6 6.9 7.5 7.5-4.9.6-7 2.9-7.5 7.5-.5-4.6-2.6-6.9-7.5-7.5 4.9-.6 7-2.9 7.5-7.5Zm6.5 11c.2 1.9 1 2.8 3 3-2 .2-2.8 1.1-3 3-.2-1.9-1-2.8-3-3 2-.2 2.8-1.1 3-3Z"/></svg><div><b>api</b> <span>· Claude Code</span><small class="ok" data-i18n="isl.doneAgo">Done · 2 sec ago</small></div><span class="open-pill" data-i18n="isl.open">Open</span><svg viewBox="0 0 24 24" class="check"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="lim"><span data-i18n="isl.h5">5 hours</span><div class="bar"><i style="width: 43%"></i></div><span data-i18n="isl.r1">43% · resets in 2 h 16 min</span></div>
            <div class="lim"><span data-i18n="isl.week">Week</span><div class="bar"><i style="width: 61%"></i></div><span data-i18n="isl.r2">61% · resets Sat 09:48</span></div>
          </section>
        </div></div>
        <div class="dots">
          <button type="button" data-page="0" aria-current="true" aria-label="Player" data-i18n-aria="isl.p1"></button>
          <button type="button" data-page="1" aria-label="Stats" data-i18n-aria="isl.p2"></button>
          <button type="button" data-page="2" aria-label="AI agents" data-i18n-aria="isl.agents"></button>
        </div>
      </div>
    </div>
    <div class="cam-bubble" aria-hidden="true"><i class="cam"></i><i class="mic"></i></div>
    <div class="timer-bubble" aria-hidden="true"><svg viewBox="0 0 36 36"><circle class="tb-bg" cx="18" cy="18" r="12"/><circle class="tb-ring" cx="18" cy="18" r="12" pathLength="100"/></svg></div>
    <div class="dock">
      <img src="/assets/img/notchisland-icon.png" alt=""><img src="/assets/img/outputs-icon.png" alt=""><img src="/assets/img/conversio-icon.png" alt="">
    </div>
  </div></div>
`;

export function renderNotchScenes(root = document) {
  for (const el of root.querySelectorAll('[data-notch-scene]')) if (!el.firstElementChild) el.innerHTML = NOTCH_SCENE;
}
