// The armillary sphere in the hero: oxidized silver rings around an engraved silver globe.
// Everything is built from code: no model files, so it stays sharp at any size and weighs
// a few kilobytes on top of three.js.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const TILT = THREE.MathUtils.degToRad(23.4);
const BASE_ROTATION = new THREE.Euler(0.12, 0, -0.42); // the meridian faces the viewer, like the avatar

// Options: centered/scale/fixedTime render a still, centred frame (used for avatars and previews);
// onFirstDrag fires once when the visitor first turns the sphere.
export async function createSphere(canvas, { reducedMotion = false, hero, centered = false, scale = 1, fixedTime = null, onFirstDrag = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const weakDevice = (navigator.hardwareConcurrency || 8) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio, weakDevice ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  if (!centered) scene.fog = new THREE.Fog(0x070909, 12, 34); // far things sink into the dark

  // A warm key light, a green rim from behind (the brand colour) and a soft fill.
  const key = new THREE.DirectionalLight(0xfff6ea, 3); key.position.set(-4, 5, 6);
  const rim = new THREE.DirectionalLight(0x8cc2ab, 10); rim.position.set(5, 1.5, -5);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(2, -4, 3);
  scene.add(key, rim, fill);

  // ---------------------------------------------------------------- materials
  // Oxidized, brushed silver; engravings are dark, like niello.
  try { await document.fonts.load('500 120px "EB Garamond"', 'ΘΕΩΡΝ'); } catch { /* falls back to a system serif */ }
  const brushed = brushedTexture();
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x99a0a4, metalness: 1, roughness: 0.34, roughnessMap: brushed, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const engraved = new THREE.MeshStandardMaterial({ color: 0x1b1f21, metalness: 1, roughness: 0.22 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xaee0ca, emissive: 0x5fb08f, emissiveIntensity: 2.2, roughness: 0.3 });
  const band = new THREE.MeshPhysicalMaterial({ map: engravingTexture(renderer), metalness: 1, roughness: 0.38, roughnessMap: brushed, side: THREE.DoubleSide });
  const globe = new THREE.MeshPhysicalMaterial({ map: globeTexture(renderer), metalness: 1, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });

  // ---------------------------------------------------------------- parts
  // A ring with a machined cross-section (a rectangle with chamfered edges),
  // turned around the Y axis, so it lies flat in the XZ plane.
  function ring(radius, radial, axial, chamfer, material = metal) {
    const w = radial / 2, h = axial / 2, c = chamfer;
    const profile = [[radius - w + c, -h], [radius + w - c, -h], [radius + w, -h + c], [radius + w, h - c],
      [radius + w - c, h], [radius - w + c, h], [radius - w, h - c], [radius - w, -h + c], [radius - w + c, -h]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.Mesh(new THREE.LatheGeometry(profile, 320), material);
  }

  // Graduation marks around a circle of the given radius in the XY plane.
  function ticks(radius, count, every, size, z = 0) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), engraved, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), axis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2, major = i % every === 0;
      const len = major ? size[0] * 1.9 : size[0];
      p.set(Math.cos(a) * (radius + len / 2), Math.sin(a) * (radius + len / 2), z);
      q.setFromAxisAngle(axis, a);
      s.set(len, size[1], size[2]);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    return mesh;
  }

  const R = 1.72;          // outer meridian
  const r = 1.56;          // inner sphere of rings
  const E = 1.3;           // ecliptic band

  const root = new THREE.Group();
  const anchor = new THREE.Group(); // where the sphere stands; carries its floor and shadow
  const rig = new THREE.Group();    // follows the pointer and drags
  rig.add(root); anchor.add(rig); scene.add(anchor);

  // Fixed meridian: a wide flat ring facing the viewer, engraved on its face.
  const meridian = new THREE.Group();
  const meridianRing = ring(R, 0.16, 0.045, 0.014); meridianRing.rotation.x = Math.PI / 2;
  meridian.add(meridianRing, ticks(R - 0.07, 180, 15, [0.045, 0.008, 0.01], 0.025));
  root.add(meridian);

  // Everything inside turns slowly around the polar axis.
  const spin = new THREE.Group(); root.add(spin);

  const equator = ring(r, 0.035, 0.13, 0.01); spin.add(equator);
  const colure1 = ring(r, 0.1, 0.03, 0.01); colure1.rotation.z = Math.PI / 2; spin.add(colure1);
  const colure2 = ring(r, 0.1, 0.03, 0.01); colure2.rotation.x = Math.PI / 2; spin.add(colure2);
  for (const y of [-1, 1]) {
    const tropic = ring(Math.sqrt(r * r - 0.62 * 0.62), 0.022, 0.022, 0.006); tropic.position.y = y * 0.62; spin.add(tropic);
    const polar = ring(Math.sqrt(r * r - 1.43 * 1.43), 0.022, 0.022, 0.006); polar.position.y = y * 1.43; spin.add(polar);
  }

  // The ecliptic: an engraved band tilted 23.4°, with the green planet riding on it.
  const ecliptic = new THREE.Group(); ecliptic.rotation.z = TILT; spin.add(ecliptic);
  ecliptic.add(new THREE.Mesh(new THREE.CylinderGeometry(E, E, 0.22, 320, 1, true), band));
  for (const y of [-0.11, 0.11]) { const lip = ring(E, 0.035, 0.028, 0.008); lip.position.y = y; ecliptic.add(lip); }
  const orbit = new THREE.Group(); ecliptic.add(orbit);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(0.085, 48, 48), glow);
  planet.position.set(E + 0.2, 0, 0);
  planet.add(new THREE.PointLight(0x8cc2ab, 2.5, 3, 2));
  orbit.add(planet);

  // The globe at the centre, and the polar axis that ends on the meridian.
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.59, 128, 128), globe));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, R * 1.92, 16), metal));
  for (const y of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 32), metal); cap.position.y = y * R * 0.96; root.add(cap);
  }
  root.rotation.copy(BASE_ROTATION);
  const env = centered ? null : buildEnvironment(scene, anchor, camera, { weak: weakDevice });

  let time = fixedTime ?? 0, last = performance.now(), running = false, visible = true;
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  // ---------------------------------------------------------------- layout
  // The rig carries the position, so every rotation turns the sphere around its own centre.
  const layout = { x: 0, y: 0, scale: 1 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const viewW = viewH * camera.aspect;
    const wide = w / h > 1.1;
    if (centered) Object.assign(layout, { x: 0, y: 0, scale });
    else Object.assign(layout, { x: wide ? Math.min(viewW * 0.22, 3.1) : 0, y: wide ? 0 : viewH * 0.27, scale: wide ? 1 : Math.min(0.62, viewW / 5.2) });
  }
  new ResizeObserver(() => { resize(); env?.setDim(canvas.clientWidth / Math.max(1, canvas.clientHeight) > 1.1 ? 1 : 0.4); if (!running) render(); }).observe(canvas);
  resize();

  // ---------------------------------------------------------------- input
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => { parallax.tx = e.clientX / innerWidth - 0.5; parallax.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  }

  // Drag to turn the sphere, with a little inertia after letting go.
  const drag = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, active: false, id: null, x: 0, y: 0 };
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), bounds = new THREE.Sphere();
  function overSphere(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    bounds.set(anchor.position, 1.95 * anchor.scale.x * root.scale.x);
    return raycaster.ray.intersectsSphere(bounds);
  }
  if (fixedTime === null) {
    canvas.addEventListener('pointerdown', (e) => {
      if (!overSphere(e)) return;
      Object.assign(drag, { active: true, id: e.pointerId, x: e.clientX, y: e.clientY, vYaw: 0, vPitch: 0 });
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      if (onFirstDrag) { onFirstDrag(); onFirstDrag = null; }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag.active) { if (e.pointerType === 'mouse') canvas.style.cursor = overSphere(e) ? 'grab' : ''; return; }
      if (e.pointerId !== drag.id) return;
      drag.vYaw = (e.clientX - drag.x) * 0.006;
      drag.vPitch = (e.clientY - drag.y) * 0.004;
      drag.yaw += drag.vYaw;
      drag.pitch = THREE.MathUtils.clamp(drag.pitch + drag.vPitch, -0.9, 0.9);
      drag.x = e.clientX; drag.y = e.clientY;
      if (!running) render();
    });
    const release = (e) => {
      if (!drag.active || e.pointerId !== drag.id) return;
      drag.active = false;
      canvas.style.cursor = e.pointerType === 'mouse' && overSphere(e) ? 'grab' : '';
      if (reducedMotion) { drag.vYaw = drag.vPitch = 0; }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  let scroll = 0;
  const stage = canvas.parentElement;
  function onScroll() {
    const h = hero ? hero.offsetHeight : innerHeight;
    scroll = Math.min(1, Math.max(0, scrollY / h));
    stage.style.opacity = document.documentElement.classList.contains('cinema') ? '' : String(1 - scroll * 0.75);
    if (!running) render();
  }
  if (fixedTime === null) { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // ---------------------------------------------------------------- loop
  function render() {
    const intro = reducedMotion || fixedTime !== null ? 1 : ease(Math.min(1, time / 2.4));
    root.scale.setScalar(0.86 + 0.14 * intro);
    anchor.scale.setScalar(layout.scale);
    anchor.position.set(layout.x, layout.y + scroll * 0.9, 0);
    root.rotation.x = BASE_ROTATION.x - (env ? 0.2 : 0) + scroll * 0.5; // with the camera above the floor, tilt back to face it
    spin.rotation.y = time * 0.12 + scroll * 1.2 - (1 - intro) * 1.4;
    orbit.rotation.y = -time * 0.45;
    ecliptic.rotation.z = TILT + scroll * 0.35;
    meridian.rotation.y = Math.sin(time * 0.15) * 0.08;
    if (!drag.active) { // inertia
      drag.yaw += drag.vYaw; drag.pitch = THREE.MathUtils.clamp(drag.pitch + drag.vPitch, -0.9, 0.9);
      drag.vYaw *= 0.94; drag.vPitch *= 0.9;
    }
    parallax.x += (parallax.tx - parallax.x) * 0.05;
    parallax.y += (parallax.ty - parallax.y) * 0.05;
    rig.rotation.set(parallax.y * 0.2 + drag.pitch, parallax.x * 0.35 + drag.yaw, 0, 'YXZ');
    if (env) {
      // The camera drifts with the pointer: near dust slides past, far dust barely moves.
      camera.position.set(parallax.x * 0.9, 2.3 - parallax.y * 0.6, 11);
      camera.lookAt(parallax.x * 0.3, 0.05 - parallax.y * 0.12, 0);
      env.update(time, intro);
    }
    renderer.render(scene, camera);
  }

  function frame(now) {
    if (!running) return;
    time += Math.min(0.05, (now - last) / 1000);
    last = now;
    render();
    requestAnimationFrame(frame);
  }
  function setRunning(on) {
    on = on && !reducedMotion && fixedTime === null && visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); requestAnimationFrame(frame); }
  }

  if (hero && 'IntersectionObserver' in window) {
    const hidden = () => hero.classList.contains('scene') && !hero.classList.contains('is-active');
    new IntersectionObserver(([e]) => { visible = e.isIntersecting && !hidden(); setRunning(true); }).observe(hero);
    // In presentation mode the hero is a scene; stop drawing while another scene is shown.
    let pauseTimer = null;
    addEventListener('theoron:hero', (e) => {
      clearTimeout(pauseTimer);
      if (e.detail) { visible = true; setRunning(true); }
      else pauseTimer = setTimeout(() => { visible = false; setRunning(true); }, 1100); // let it fade out first
    });
  }
  document.addEventListener('visibilitychange', () => setRunning(true));

  render();
  canvas.classList.add('ready');
  setRunning(true);
  return { render };
}

// The ecliptic band: graduations along both edges and "ΘΕΩΡΩΝ" engraved twice around.
function engravingTexture(renderer) {
  const W = 4096, H = 320;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#8b9194'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { // brushed metal
    g.fillStyle = `rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})`;
    g.fillRect(0, Math.random() * H, W, 1);
  }
  g.fillStyle = '#111416';
  for (let i = 0; i < 360; i++) {
    const x = (i / 360) * W, len = i % 30 === 0 ? 74 : i % 5 === 0 ? 46 : 26;
    g.fillRect(x - 1.5, 0, 3, len);
    g.fillRect(x - 1.5, H - len, 3, len);
  }
  g.fillRect(0, 86, W, 3); g.fillRect(0, H - 89, W, 3);
  g.font = '500 118px "EB Garamond", Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const word = [...'ΘΕΩΡΩΝΘΕΩΡΩΝ'];
  word.forEach((ch, i) => g.fillText(ch, ((i + 0.5) / word.length) * W, H / 2 + 8));
  for (let i = 0; i < 12; i++) { // small stars between the letters
    g.beginPath(); g.arc((i / 12) * W, H / 2, 6, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// The globe: a graticule every 15°, dashed tropics and "ΘΕΩΡΩΝ" along the equator.
function globeTexture(renderer) {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#9aa1a5'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.06).toFixed(3)})`; g.fillRect(Math.random() * W, 0, 1, H); }
  g.strokeStyle = '#1b1f21';
  for (let lon = 0; lon < 24; lon++) {
    g.lineWidth = lon % 6 === 0 ? 5 : 2.5;
    const x = (lon / 24) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    g.lineWidth = lat === 0 ? 6 : 2.5;
    const y = H / 2 - (lat / 180) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  g.setLineDash([14, 12]); g.lineWidth = 2.5;
  for (const lat of [-23.4, 23.4]) { const y = H / 2 - (lat / 180) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.setLineDash([]);
  g.fillStyle = '#1b1f21'; g.font = '500 54px "EB Garamond", Georgia, serif'; g.textAlign = 'center';
  [...'ΘΕΩΡΩΝ'].forEach((ch, i) => g.fillText(ch, ((i + 0.5) / 6) * W, H / 2 - 22));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Brushed metal: fine streaks running around each ring (u goes around, v across the profile).
function brushedTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 1024;
  const g = c.getContext('2d');
  for (let y = 0; y < 1024; y++) {
    const v = Math.round(160 + (Math.random() - 0.5) * 133);
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 64, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3);
  return t;
}

// Space around the sphere: three layers of dust at different depths, a floor of engraved orbits
// fading into the dark, and a soft pool of light with a shadow under the sphere.
function buildEnvironment(scene, anchor, camera, { weak }) {
  const glowTex = (inner, outer) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, inner); r.addColorStop(1, outer);
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const dotTex = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  // Dust: near, middle and far layers.
  const dust = new THREE.Group(); scene.add(dust);
  const warm = new THREE.Color(0xf2efe6), green = new THREE.Color(0x8cc2ab);
  for (const L of [
    { n: 60, z: [3, 7], size: 0.085, opacity: 0.5 },
    { n: 150, z: [-4, 3], size: 0.05, opacity: 0.45 },
    { n: 340, z: [-26, -4], size: 0.06, opacity: 0.4 },
  ]) {
    const count = weak ? Math.round(L.n / 2) : L.n;
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = rnd(...L.z), halfH = tanHalf * (11 - z) * 1.25, halfW = halfH * 2.1;
      pos.set([rnd(-halfW, halfW), rnd(-halfH, halfH), z], i * 3);
      const c = warm.clone().lerp(green, Math.random() * 0.6).multiplyScalar(rnd(0.5, 1));
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    dust.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: L.size, map: dotTex, vertexColors: true, transparent: true,
      opacity: L.opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })));
  }

  // The floor: concentric orbits under the sphere, wider and fainter as they go.
  const floor = new THREE.Group(); floor.position.y = -2.3; anchor.add(floor);
  // Each ring is brightest behind the sphere and fades on the side facing the viewer,
  // so the arcs that pass under the text stay quiet.
  const ringLine = (r, strength) => {
    const n = 256, pos = new Float32Array((n + 1) * 3), col = new Float32Array((n + 1) * 3), base = new THREE.Color(0x8cc2ab);
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r;
      const f = strength * (0.05 + 0.95 * (1 - Math.max(0, z / r)) ** 2);
      pos.set([x, 0, z], i * 3); col.set([base.r * f, base.g * f, base.b * f], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  };
  const radii = [];
  for (let k = 0; k < 8; k++) {
    const r = 2.1 * Math.pow(1.32, k); radii.push(r);
    floor.add(ringLine(r, (1 - k / 9) ** 1.4));
  }
  // A few small bodies travel along the orbits.
  const bodies = [1, 3, 5].map((k, i) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: i ? 0xdcebe4 : 0x8cc2ab, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.scale.setScalar(0.22 - i * 0.03);
    floor.add(m);
    return { m, r: radii[k], speed: 0.09 / (i + 1), phase: i * 2.1 };
  });
  // A pool of light and a soft shadow right under the sphere.
  const flat = (size, tex, blending, opacity, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, blending, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; floor.add(m); return m;
  };
  flat(7.5, glowTex('rgba(140,194,171,0.28)', 'rgba(140,194,171,0)'), THREE.AdditiveBlending, 1, 0.005);
  const shadow = flat(3.6, glowTex('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)'), THREE.NormalBlending, 1, 0.01);

  const lines = floor.children.filter((c) => c.isLine);
  return {
    // Quieter floor on portrait screens, where the text sits right under the sphere.
    setDim(f) { for (const l of lines) l.material.opacity = 0.55 * f; },
    update(time, intro) {
      dust.rotation.y = time * 0.012;
      dust.position.y = Math.sin(time * 0.1) * 0.15;
      for (const b of bodies) { const t = time * b.speed + b.phase; b.m.position.set(Math.cos(t) * b.r, 0.02, Math.sin(t) * b.r); }
      shadow.material.opacity = 0.9 * intro;
      floor.position.y = -2.3 + (1 - intro) * -0.6;
    },
  };
}
