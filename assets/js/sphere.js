// The armillary sphere in the hero. Everything is built from code: no model files,
// so it stays sharp at any size and weighs a few kilobytes on top of three.js.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const TILT = THREE.MathUtils.degToRad(23.4);
const BASE_ROTATION = new THREE.Euler(0.32, -0.45, -0.38);

export async function createSphere(canvas, { reducedMotion = false, hero } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const weakDevice = (navigator.hardwareConcurrency || 8) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio, weakDevice ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // A warm key light, a green rim from behind (the brand colour) and a soft fill.
  const key = new THREE.DirectionalLight(0xfff6ea, 2.4); key.position.set(-4, 5, 6);
  const rim = new THREE.DirectionalLight(0x8cc2ab, 3.2); rim.position.set(5, 1.5, -5);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(2, -4, 3);
  scene.add(key, rim, fill);

  // ---------------------------------------------------------------- materials
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x23272a, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25 });
  const engraved = new THREE.MeshStandardMaterial({ color: 0x9aa09d, metalness: 1, roughness: 0.22 });
  const obsidian = new THREE.MeshPhysicalMaterial({ color: 0x07090a, metalness: 0.15, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xaee0ca, emissive: 0x5fb08f, emissiveIntensity: 2.2, roughness: 0.3 });
  const band = new THREE.MeshPhysicalMaterial({ map: await engravingTexture(renderer), metalness: 1, roughness: 0.36, side: THREE.DoubleSide });

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
  const rig = new THREE.Group();   // follows the pointer
  rig.add(root); scene.add(rig);

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

  // Obsidian core, polar axis and finials.
  root.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 96, 96), obsidian));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, R * 2.55, 16), metal));
  for (const y of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 32), metal); cap.position.y = y * R * 1.275; root.add(cap);
  }
  root.rotation.copy(BASE_ROTATION);

  let time = 0, last = performance.now(), running = false, visible = true;
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  // ---------------------------------------------------------------- layout
  const layout = { x: 0, y: 0, scale: 1 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const viewW = viewH * camera.aspect;
    const wide = w / h > 1.1;
    layout.x = wide ? Math.min(viewW * 0.22, 3.1) : 0;
    layout.y = wide ? 0 : viewH * 0.25;
    layout.scale = wide ? 1 : Math.min(0.62, viewW / 5.2);
  }
  new ResizeObserver(() => { resize(); if (!running) render(); }).observe(canvas);
  resize();

  // ---------------------------------------------------------------- input
  const pointer = { x: 0, y: 0 };
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  }
  let scroll = 0;
  const stage = canvas.parentElement;
  function onScroll() {
    const h = hero ? hero.offsetHeight : innerHeight;
    scroll = Math.min(1, Math.max(0, scrollY / h));
    stage.style.opacity = String(1 - scroll * 0.75);
    if (!running) render();
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- loop

  function render() {
    const intro = reducedMotion ? 1 : ease(Math.min(1, time / 2.4));
    const s = layout.scale * (0.86 + 0.14 * intro);
    root.scale.setScalar(s);
    root.position.set(layout.x, layout.y + scroll * 0.9, 0);
    root.rotation.x = BASE_ROTATION.x + scroll * 0.5;
    spin.rotation.y = time * 0.12 + scroll * 1.2 - (1 - intro) * 1.4;
    orbit.rotation.y = -time * 0.45;
    ecliptic.rotation.z = TILT + scroll * 0.35;
    meridian.rotation.y = Math.sin(time * 0.15) * 0.08;
    rig.rotation.y += (pointer.x * 0.35 - rig.rotation.y) * 0.05;
    rig.rotation.x += (pointer.y * 0.2 - rig.rotation.x) * 0.05;
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
    on = on && !reducedMotion && visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); requestAnimationFrame(frame); }
  }

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(true); }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => setRunning(true));

  render();
  canvas.classList.add('ready');
  setRunning(true);
}

// The ecliptic band: graduations along both edges and "ΘΕΩΡΩΝ" engraved twice around.
async function engravingTexture(renderer) {
  try { await document.fonts.load('500 120px "EB Garamond"', 'ΘΕΩΡΝ'); } catch { /* falls back to a system serif */ }
  const W = 4096, H = 320;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#4f5557'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { // brushed metal
    g.fillStyle = `rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})`;
    g.fillRect(0, Math.random() * H, W, 1);
  }
  g.fillStyle = '#e6ebe8';
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
