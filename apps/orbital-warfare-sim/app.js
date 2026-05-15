// app.js — Orbital Warfare Simulator
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  MU_EARTH, R_EARTH, MOON_A,
  coeToRv, rvToCoe, propagate, rk4Step,
  hohmann, lambert, losClear, moonPosition, sampleOrbit, v
} from './orbital.js';

// ============================================================
// Scene setup
// ============================================================
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x05070d, 1);

const scene = new THREE.Scene();

// Scale: 1 unit = 1000 km. Keeps everything within reasonable numbers for floats.
const KM = 1 / 1000;

const camera = new THREE.PerspectiveCamera(50, 1, 0.001, 10000);
camera.position.set(20, 12, 28);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = R_EARTH * KM * 1.05;
controls.maxDistance = MOON_A * KM * 2;

// Lighting — Sun-like directional plus subtle ambient
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(200, 60, 100);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x223344, 0.45));

// Stars (random distant points)
function makeStars(count = 4000, radius = 4000) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Spherical
    const u = Math.random(); const vv = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * vv - 1);
    pos[i*3]   = radius * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = radius * Math.cos(phi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.85 });
  return new THREE.Points(geo, mat);
}
scene.add(makeStars());

// ============================================================
// Earth (procedural — no external textures needed)
// ============================================================
function makeEarth() {
  const group = new THREE.Group();

  // Land/sea via canvas texture
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  // Ocean base
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#0a2540');
  grad.addColorStop(0.5, '#0d3a66');
  grad.addColorStop(1, '#0a2540');
  ctx.fillStyle = grad; ctx.fillRect(0,0,1024,512);

  // Procedurally place "continents" — overlapping ellipses with varied land colors
  const seed = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(42);
  const landColors = ['#3a5a3a', '#4a5f3a', '#5a5a3a', '#3a4a3a', '#6a5a4a', '#7a6a4a'];
  for (let i = 0; i < 500; i++) {
    const x = seed() * 1024;
    const y = 80 + seed() * 352;
    const rx = 20 + seed() * 90;
    const ry = 12 + seed() * 50;
    ctx.fillStyle = landColors[(seed()*landColors.length)|0];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, seed()*Math.PI, 0, 2*Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Cloud highlights
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.08 + seed()*0.12})`;
    ctx.beginPath();
    ctx.ellipse(seed()*1024, 30 + seed()*450, 30 + seed()*60, 8 + seed()*20, seed()*Math.PI, 0, 2*Math.PI);
    ctx.fill();
  }
  // Polar caps
  ctx.fillStyle = '#dfe9f3';
  ctx.fillRect(0, 0, 1024, 30);
  ctx.fillRect(0, 482, 1024, 30);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R_EARTH * KM, 64, 64),
    new THREE.MeshPhongMaterial({ map: tex, shininess: 8, specular: 0x111122 })
  );
  group.add(earth);

  // Atmosphere glow (back-side rim)
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R_EARTH * KM * 1.025, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x4fa3ff, transparent: true, opacity: 0.12, side: THREE.BackSide
    })
  );
  group.add(atmo);

  // Equator ring (subtle reference)
  const equ = new THREE.Mesh(
    new THREE.RingGeometry(R_EARTH * KM * 1.001, R_EARTH * KM * 1.0015, 128),
    new THREE.MeshBasicMaterial({ color: 0x4fd1ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  equ.rotation.x = Math.PI / 2;
  group.add(equ);

  return { group, mesh: earth };
}
const { group: earthGroup, mesh: earthMesh } = makeEarth();
scene.add(earthGroup);

// Moon
function makeMoon() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9aa0a8'; ctx.fillRect(0,0,256,128);
  const seed = (s => () => (s = (s*9301+49297)%233280)/233280)(7);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = `rgba(60,60,68,${0.2 + seed()*0.4})`;
    ctx.beginPath();
    ctx.arc(seed()*256, seed()*128, 1 + seed()*4, 0, 2*Math.PI);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(1737.4 * KM, 32, 32),
    new THREE.MeshPhongMaterial({ map: tex, shininess: 1 })
  );
  return m;
}
const moonMesh = makeMoon();
scene.add(moonMesh);

// Moon orbit ring (visual hint)
const moonRing = new THREE.Mesh(
  new THREE.RingGeometry(MOON_A * KM * 0.999, MOON_A * KM * 1.001, 256),
  new THREE.MeshBasicMaterial({ color: 0x556677, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
);
moonRing.rotation.x = Math.PI / 2;
scene.add(moonRing);

// ============================================================
// Satellite + orbit-trail factories
// ============================================================
function makeSat(color) {
  const grp = new THREE.Group();
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.12),
    new THREE.MeshPhongMaterial({ color: 0xdddddd })
  );
  grp.add(body);
  // Solar panels
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.02, 0.18),
    new THREE.MeshPhongMaterial({ color: 0x1d2b4a })
  );
  grp.add(panel);
  // Halo (so it's always visible at distance)
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  grp.add(halo);
  grp.userData.halo = halo;
  return grp;
}

function makeOrbitLine(color, opacity = 0.8, dashed = false) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 512), 3));
  geo.setDrawRange(0, 0);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.4, gapSize: 0.2, transparent: true, opacity })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

const chaser = makeSat(0x4fd1ff);
const target = makeSat(0xff5d6e);
scene.add(chaser);
scene.add(target);

const chaserOrbit = makeOrbitLine(0x4fd1ff, 0.55);
const targetOrbit = makeOrbitLine(0xff5d6e, 0.55);
const transferOrbit = makeOrbitLine(0xffd24f, 0.9);
scene.add(chaserOrbit);
scene.add(targetOrbit);
scene.add(transferOrbit);

// Trails (history)
function makeTrail(color, maxPoints = 2000) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3*maxPoints), 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const line = new THREE.Line(geo, mat);
  line.userData = { idx: 0, max: maxPoints };
  return line;
}
const chaserTrail = makeTrail(0x4fd1ff);
const targetTrail = makeTrail(0xff5d6e);
scene.add(chaserTrail);
scene.add(targetTrail);

function pushTrail(line, p) {
  const arr = line.geometry.attributes.position.array;
  const max = line.userData.max;
  let idx = line.userData.idx;
  if (idx >= max) {
    // shift down by 1 (drop oldest) — simple but fine at this size
    arr.copyWithin(0, 3, max*3);
    idx = max - 1;
  }
  arr[idx*3]   = p[0] * KM;
  arr[idx*3+1] = p[1] * KM;
  arr[idx*3+2] = p[2] * KM;
  idx++;
  line.userData.idx = idx;
  line.geometry.setDrawRange(0, idx);
  line.geometry.attributes.position.needsUpdate = true;
}
function clearTrail(line) {
  line.userData.idx = 0;
  line.geometry.setDrawRange(0, 0);
}

// LOS line
const losGeo = new THREE.BufferGeometry();
losGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
const losMat = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.7 });
const losLine = new THREE.Line(losGeo, losMat);
scene.add(losLine);

// ============================================================
// Simulation state
// ============================================================
const sim = {
  t: 0,                    // seconds since scenario start
  running: true,
  speedSteps: [1, 10, 100, 1000, 5000, 20000, 100000],
  speedIdx: 3,
  chaserState: null,       // [x,y,z, vx,vy,vz]
  targetState: null,
  opts: { j2: false, moon: false },
  dvUsed: 0,
  // Pending burn (Hohmann/Lambert) scheduled at absolute time
  pendingBurn: null,       // { t: absolute, dv: [vx,vy,vz] (added to chaser velocity), label }
  pendingBurn2: null,      // second burn (for Hohmann)
  transferActive: false,
  banner: null,
};

function updateOrbitLine(line, samples) {
  const arr = new Float32Array(samples.length * 3);
  for (let i = 0; i < samples.length; i++) {
    arr[i*3]   = samples[i][0] * KM;
    arr[i*3+1] = samples[i][1] * KM;
    arr[i*3+2] = samples[i][2] * KM;
  }
  line.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  line.geometry.setDrawRange(0, samples.length);
  line.geometry.attributes.position.needsUpdate = true;
  if (line.material.isLineDashedMaterial) line.computeLineDistances();
}

function rebuildStaticOrbits() {
  // Rebuilds chaser & target ellipses (assuming two-body) for visual reference.
  const cSamples = sampleOrbit(sim.chaserState, { j2: false, moon: false }, 200);
  const tSamples = sampleOrbit(sim.targetState, { j2: false, moon: false }, 200);
  updateOrbitLine(chaserOrbit, cSamples);
  updateOrbitLine(targetOrbit, tSamples);
}

function clearTransfer() {
  transferOrbit.geometry.setDrawRange(0, 0);
  sim.transferActive = false;
}

// ============================================================
// UI wiring
// ============================================================
const ui = {
  cAlt: document.getElementById('c-alt'),
  cInc: document.getElementById('c-inc'),
  cRaan: document.getElementById('c-raan'),
  cTa: document.getElementById('c-ta'),
  tAlt: document.getElementById('t-alt'),
  tInc: document.getElementById('t-inc'),
  tRaan: document.getElementById('t-raan'),
  tTa: document.getElementById('t-ta'),
};
function bindLabel(id, fmt) {
  const el = document.getElementById(id);
  const lab = document.getElementById(id + '-v');
  const update = () => lab.textContent = fmt(parseFloat(el.value));
  el.addEventListener('input', update);
  update();
  return el;
}
bindLabel('c-alt', v => `${v|0} km`);
bindLabel('c-inc', v => `${v.toFixed(1)}°`);
bindLabel('c-raan', v => `${v|0}°`);
bindLabel('c-ta', v => `${v|0}°`);
bindLabel('t-alt', v => `${v|0} km`);
bindLabel('t-inc', v => `${v.toFixed(1)}°`);
bindLabel('t-raan', v => `${v|0}°`);
bindLabel('t-ta', v => `${v|0}°`);
bindLabel('lam-tof', v => {
  if (v < 3600) return `${(v/60).toFixed(0)} min`;
  return `${(v/3600).toFixed(2)} hr`;
});
bindLabel('m-prog', v => `${v.toFixed(2)} km/s`);
bindLabel('m-rad', v => `${v.toFixed(2)} km/s`);
bindLabel('m-norm', v => `${v.toFixed(2)} km/s`);

function buildStateFromUI(prefix) {
  const alt = parseFloat(document.getElementById(prefix+'-alt').value);
  const inc = parseFloat(document.getElementById(prefix+'-inc').value) * Math.PI/180;
  const raan = parseFloat(document.getElementById(prefix+'-raan').value) * Math.PI/180;
  const nu = parseFloat(document.getElementById(prefix+'-ta').value) * Math.PI/180;
  const a = R_EARTH + alt;
  const { r, v: vel } = coeToRv(a, 0, inc, raan, 0, nu);
  return [...r, ...vel];
}

function applyOrbitChanges() {
  sim.chaserState = buildStateFromUI('c');
  sim.targetState = buildStateFromUI('t');
  rebuildStaticOrbits();
  clearTrail(chaserTrail);
  clearTrail(targetTrail);
  clearTransfer();
  sim.t = 0;
  sim.dvUsed = 0;
  sim.pendingBurn = sim.pendingBurn2 = null;
}
// Update orbits live as sliders move
['c-alt','c-inc','c-raan','c-ta','t-alt','t-inc','t-raan','t-ta'].forEach(id => {
  document.getElementById(id).addEventListener('change', applyOrbitChanges);
});

// Scenario presets
const scenarios = {
  hohmann: {
    c: { alt: 400,  inc: 28.5, raan: 0, ta: 0   },
    t: { alt: 35786, inc: 28.5, raan: 0, ta: 50  },
    moon: false, j2: false, mode: 'hohmann'
  },
  lambert: {
    c: { alt: 500,  inc: 51.6, raan: 0, ta: 0   },
    t: { alt: 1200, inc: 53.0, raan: 10, ta: 90 },
    moon: false, j2: false, mode: 'lambert', tof: 5400
  },
  coorbital: {
    c: { alt: 35780, inc: 0.1, raan: 0, ta: 95  },
    t: { alt: 35786, inc: 0.1, raan: 0, ta: 100 },
    moon: false, j2: false, mode: 'manual'
  },
  lunar: {
    // Cislunar regime where Moon perturbation visibly bends the chase
    c: { alt: 150000, inc: 18, raan: 0, ta: 0  },
    t: { alt: 150000, inc: 18, raan: 0, ta: 25 },
    moon: true, j2: false, mode: 'lambert', tof: 86400
  }
};
function loadScenario(name) {
  const s = scenarios[name];
  if (!s) return;
  for (const [k,val] of Object.entries(s.c)) setSlider('c-'+k, val);
  for (const [k,val] of Object.entries(s.t)) setSlider('t-'+k, val);
  document.getElementById('pert-moon').checked = !!s.moon;
  document.getElementById('pert-j2').checked = !!s.j2;
  sim.opts = { moon: !!s.moon, j2: !!s.j2 };
  setMode(s.mode);
  if (s.tof) setSlider('lam-tof', s.tof);
  applyOrbitChanges();
  // Auto-fit camera to the larger orbit
  fitCamera(Math.max(s.c.alt, s.t.alt) + R_EARTH, s.moon);
  showBanner(`Scenario loaded: ${name}`);
}

function fitCamera(maxR /* km */, includeMoon = false) {
  const r = (includeMoon ? MOON_A * 1.3 : maxR * 3.5) * KM;
  // Maintain current direction
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(dir.multiplyScalar(r));
  camera.updateProjectionMatrix();
}
function setSlider(id, v) {
  const el = document.getElementById(id);
  el.value = String(v);
  el.dispatchEvent(new Event('input'));
}
document.getElementById('apply-scenario').addEventListener('click', () => {
  loadScenario(document.getElementById('scenario').value);
});

// Mode tabs
function setMode(mode) {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('hohmann-ctrl').classList.toggle('hidden', mode !== 'hohmann');
  document.getElementById('lambert-ctrl').classList.toggle('hidden', mode !== 'lambert');
  document.getElementById('manual-ctrl').classList.toggle('hidden', mode !== 'manual');
}
document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

// Perturbation toggles
document.getElementById('pert-moon').addEventListener('change', e => { sim.opts.moon = e.target.checked; });
document.getElementById('pert-j2').addEventListener('change', e => { sim.opts.j2 = e.target.checked; });

// Display toggles
document.getElementById('show-los').addEventListener('change', e => { losLine.visible = e.target.checked; });
document.getElementById('show-moon').addEventListener('change', e => {
  moonMesh.visible = e.target.checked;
  moonRing.visible = e.target.checked;
});

// Speed
const speedSlider = document.getElementById('speed');
const speedLabel = document.getElementById('speed-v');
function setSpeedIdx(i) {
  sim.speedIdx = Math.max(0, Math.min(sim.speedSteps.length-1, i));
  speedSlider.value = String(sim.speedIdx);
  const v = sim.speedSteps[sim.speedIdx];
  speedLabel.textContent = v >= 1000 ? `${v/1000|0}k×` : `${v}×`;
}
speedSlider.addEventListener('input', () => setSpeedIdx(parseInt(speedSlider.value, 10)));
setSpeedIdx(3);

// Play/reset
document.getElementById('play').addEventListener('click', e => {
  sim.running = !sim.running;
  e.target.textContent = sim.running ? '❚❚' : '▶';
});
document.getElementById('reset').addEventListener('click', () => {
  applyOrbitChanges();
  showBanner('Simulation reset');
});

// ============================================================
// Frame helpers (RIC: radial/in-track/cross-track)
// ============================================================
function ricFrame(rVec, vVec) {
  const R = v.unit(rVec);
  const H = v.unit(v.cross(rVec, vVec));     // normal
  const I = v.unit(v.cross(H, R));            // in-track (~prograde for near-circular)
  return { R, I, H };
}
function applyDv(state, dvLocal /* {prograde, radial, normal} */) {
  const r = [state[0], state[1], state[2]];
  const v0 = [state[3], state[4], state[5]];
  const { R, I, H } = ricFrame(r, v0);
  const dvECI = [
    R[0]*dvLocal.radial + I[0]*dvLocal.prograde + H[0]*dvLocal.normal,
    R[1]*dvLocal.radial + I[1]*dvLocal.prograde + H[1]*dvLocal.normal,
    R[2]*dvLocal.radial + I[2]*dvLocal.prograde + H[2]*dvLocal.normal,
  ];
  return [r[0], r[1], r[2], v0[0]+dvECI[0], v0[1]+dvECI[1], v0[2]+dvECI[2]];
}

// ============================================================
// Maneuver planners
// ============================================================
function planHohmann() {
  const rC = [sim.chaserState[0], sim.chaserState[1], sim.chaserState[2]];
  const vC = [sim.chaserState[3], sim.chaserState[4], sim.chaserState[5]];
  const rT = [sim.targetState[0], sim.targetState[1], sim.targetState[2]];
  const vT = [sim.targetState[3], sim.targetState[4], sim.targetState[5]];
  const r1 = v.norm(rC);
  const r2 = v.norm(rT);
  const h = hohmann(r1, r2);

  // Mean motions
  const nC = Math.sqrt(MU_EARTH / (r1*r1*r1));
  const nT = Math.sqrt(MU_EARTH / (r2*r2*r2));

  // Current angle of chaser & target in their planes (use true anomaly proxy via atan2 in ECI XY for simplicity if coplanar)
  // We'll approximate the planar phase by angle in the chaser's orbital plane.
  // Compute angle between chaser and target position vectors (signed by chaser's angular momentum).
  const hC = v.cross(rC, vC);
  const hHat = v.unit(hC);
  const cAng = Math.atan2(rC[1], rC[0]);
  const tAng = Math.atan2(rT[1], rT[0]);
  // Current target-lead = tAng - cAng, normalized to [0, 2π)
  let currentLead = tAng - cAng;
  while (currentLead < 0) currentLead += 2*Math.PI;
  while (currentLead >= 2*Math.PI) currentLead -= 2*Math.PI;

  const requiredLead = h.leadAngle; // radians
  let normReq = requiredLead;
  while (normReq < 0) normReq += 2*Math.PI;
  while (normReq >= 2*Math.PI) normReq -= 2*Math.PI;

  // Relative angular rate target relative to chaser: target moves slower if r2>r1
  // We want currentLead(t) = normReq.  d(lead)/dt = nT - nC (rad/s)
  let waitT = 0;
  const autoPhase = document.getElementById('auto-phase').checked;
  if (autoPhase) {
    const dn = nT - nC;
    let delta = normReq - currentLead;
    if (dn > 0) {
      while (delta < 0) delta += 2*Math.PI;
    } else if (dn < 0) {
      while (delta > 0) delta -= 2*Math.PI;
    }
    waitT = Math.abs(dn) > 1e-12 ? delta / dn : 0;
    if (waitT < 0) waitT += 2*Math.PI / Math.abs(dn);
  }

  // Schedule burn1 at t = sim.t + waitT, burn2 at +tof
  const tBurn1 = sim.t + waitT;
  const tBurn2 = tBurn1 + h.tof;

  // We'll determine burn vector at the burn instant (prograde Δv1).
  sim.pendingBurn = {
    t: tBurn1,
    label: 'Hohmann burn 1',
    apply: (state) => applyDv(state, { prograde: h.dv1, radial: 0, normal: 0 }),
    dvMag: Math.abs(h.dv1),
    onApply: () => {
      // Show transfer ellipse at burn time
      // Take current post-burn state and sample one ellipse
      const samples = sampleOrbit(sim.chaserState, { j2: false, moon: false }, 200);
      // Only show half the ellipse (the transfer arc)
      const half = samples.slice(0, Math.floor(samples.length/2) + 1);
      updateOrbitLine(transferOrbit, half);
      sim.transferActive = true;
    }
  };
  sim.pendingBurn2 = {
    t: tBurn2,
    label: 'Hohmann burn 2',
    apply: (state) => applyDv(state, { prograde: h.dv2, radial: 0, normal: 0 }),
    dvMag: Math.abs(h.dv2),
    onApply: () => { clearTransfer(); }
  };

  document.getElementById('hohmann-info').innerHTML =
    `<b>Δv₁</b> ${h.dv1.toFixed(4)} km/s (prograde)\n` +
    `<b>Δv₂</b> ${h.dv2.toFixed(4)} km/s (prograde at apoapsis)\n` +
    `<b>Total Δv</b> ${h.totalDv.toFixed(4)} km/s\n` +
    `<b>TOF</b> ${(h.tof/60).toFixed(1)} min  (${(h.tof/3600).toFixed(3)} hr)\n` +
    `<b>Required lead</b> ${(requiredLead*180/Math.PI).toFixed(2)}°\n` +
    `<b>Current lead</b> ${(currentLead*180/Math.PI).toFixed(2)}°\n` +
    (autoPhase
      ? `<b>Phase wait</b> ${(waitT/60).toFixed(1)} min`
      : `Auto phasing OFF — burning immediately`);

  showBanner(`Hohmann armed. Burn 1 in ${(waitT/60).toFixed(1)} min.`);
}

function planLambert() {
  const tof = parseFloat(document.getElementById('lam-tof').value);
  const short = document.getElementById('lam-short').checked;

  // Propagate target forward by TOF to know intercept point
  const tFinal = propagate(sim.targetState.slice(), sim.t, tof, 5, sim.opts);
  const r1 = [sim.chaserState[0], sim.chaserState[1], sim.chaserState[2]];
  const r2 = [tFinal.state[0], tFinal.state[1], tFinal.state[2]];

  const lam = lambert(r1, r2, tof, short);
  if (!lam) {
    showBanner('Lambert solver failed (try different TOF)');
    return;
  }
  const vC = [sim.chaserState[3], sim.chaserState[4], sim.chaserState[5]];
  const dv1Vec = [lam.v1[0]-vC[0], lam.v1[1]-vC[1], lam.v1[2]-vC[2]];
  const dv1 = v.norm(dv1Vec);

  // Sample transfer trajectory for display
  const transferState = [...r1, ...lam.v1];
  const samples = [r1];
  let s = transferState.slice();
  const steps = 80;
  const dt = tof / steps;
  let tt = sim.t;
  for (let i = 0; i < steps; i++) {
    s = rk4Step(s, tt, dt, sim.opts);
    tt += dt;
    samples.push([s[0], s[1], s[2]]);
  }
  updateOrbitLine(transferOrbit, samples);
  sim.transferActive = true;

  // Arm burn now (at sim.t) and arrival burn at sim.t + tof to match target velocity
  sim.pendingBurn = {
    t: sim.t,
    label: 'Lambert burn 1',
    apply: (state) => [state[0],state[1],state[2], lam.v1[0], lam.v1[1], lam.v1[2]],
    dvMag: dv1,
    onApply: () => {}
  };
  sim.pendingBurn2 = {
    t: sim.t + tof,
    label: 'Lambert arrival',
    apply: (state) => [state[0],state[1],state[2], tFinal.state[3], tFinal.state[4], tFinal.state[5]],
    dvMag: v.norm([tFinal.state[3]-lam.v2[0], tFinal.state[4]-lam.v2[1], tFinal.state[5]-lam.v2[2]]),
    onApply: () => { clearTransfer(); }
  };
  const dv2 = sim.pendingBurn2.dvMag;
  document.getElementById('lambert-info').innerHTML =
    `<b>Δv₁ (departure)</b> ${dv1.toFixed(4)} km/s\n` +
    `<b>Δv₂ (rendezvous)</b> ${dv2.toFixed(4)} km/s\n` +
    `<b>Total Δv</b> ${(dv1+dv2).toFixed(4)} km/s\n` +
    `<b>TOF</b> ${(tof/60).toFixed(1)} min`;
  showBanner('Lambert intercept armed. Burning now.');
}

function execManual() {
  const dv = {
    prograde: parseFloat(document.getElementById('m-prog').value),
    radial:   parseFloat(document.getElementById('m-rad').value),
    normal:   parseFloat(document.getElementById('m-norm').value),
  };
  const mag = Math.hypot(dv.prograde, dv.radial, dv.normal);
  if (mag < 1e-6) { showBanner('Δv is zero'); return; }
  sim.chaserState = applyDv(sim.chaserState, dv);
  sim.dvUsed += mag;
  rebuildStaticOrbits();
  showBanner(`Manual burn: ${mag.toFixed(3)} km/s`);
}
document.getElementById('plan-hohmann').addEventListener('click', planHohmann);
document.getElementById('plan-lambert').addEventListener('click', planLambert);
document.getElementById('exec-manual').addEventListener('click', execManual);

// ============================================================
// Banner
// ============================================================
const bannerEl = document.getElementById('banner');
let bannerTimer = null;
function showBanner(msg) {
  bannerEl.textContent = msg;
  bannerEl.classList.remove('hidden');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => bannerEl.classList.add('hidden'), 2800);
}

// ============================================================
// Camera modes
// ============================================================
const camMode = document.getElementById('cam-mode');
const camOffset = new THREE.Vector3();
function updateCamera(chaserPos, targetPos) {
  const mode = camMode.value;
  if (mode === 'free') return;
  if (mode === 'chaser') {
    const cp = new THREE.Vector3(...chaserPos).multiplyScalar(KM);
    controls.target.lerp(cp, 0.12);
  } else if (mode === 'target') {
    const tp = new THREE.Vector3(...targetPos).multiplyScalar(KM);
    controls.target.lerp(tp, 0.12);
  }
}

// ============================================================
// Main loop
// ============================================================
function fmtMET(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return `${String(d).padStart(3,'0')}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const readouts = {
  met: document.getElementById('r-met'),
  range: document.getElementById('r-range'),
  rrate: document.getElementById('r-rrate'),
  los: document.getElementById('r-los'),
  dv: document.getElementById('r-dv'),
};

let lastFrame = performance.now();
let lastRangeStored = null;

function step(now) {
  const dtReal = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;

  if (sim.running) {
    const simSpeed = sim.speedSteps[sim.speedIdx];
    let simDt = dtReal * simSpeed;

    // Sub-step for accuracy: cap each integration step to ~30s
    const maxStep = 30;
    let remaining = simDt;
    while (remaining > 0) {
      const dt = Math.min(remaining, maxStep);

      // Process pending burns (apply if their time falls in this slice)
      for (const slot of ['pendingBurn','pendingBurn2']) {
        const b = sim[slot];
        if (b && sim.t + dt >= b.t && sim.t <= b.t) {
          // Step up to burn time first, then apply burn, then step the rest
          const dt1 = Math.max(0, b.t - sim.t);
          if (dt1 > 0) {
            sim.chaserState = rk4Step(sim.chaserState, sim.t, dt1, sim.opts);
            sim.targetState = rk4Step(sim.targetState, sim.t, dt1, sim.opts);
            sim.t += dt1;
          }
          // Apply burn
          const before = [sim.chaserState[3], sim.chaserState[4], sim.chaserState[5]];
          sim.chaserState = b.apply(sim.chaserState);
          const after = [sim.chaserState[3], sim.chaserState[4], sim.chaserState[5]];
          const actualDv = Math.hypot(after[0]-before[0], after[1]-before[1], after[2]-before[2]);
          sim.dvUsed += actualDv;
          b.onApply && b.onApply();
          showBanner(`${b.label}: Δv ${actualDv.toFixed(3)} km/s`);
          sim[slot] = null;
          // Step the remainder
          const dt2 = dt - dt1;
          if (dt2 > 0) {
            sim.chaserState = rk4Step(sim.chaserState, sim.t, dt2, sim.opts);
            sim.targetState = rk4Step(sim.targetState, sim.t, dt2, sim.opts);
            sim.t += dt2;
          }
          remaining -= dt;
          continue;
        }
      }
      sim.chaserState = rk4Step(sim.chaserState, sim.t, dt, sim.opts);
      sim.targetState = rk4Step(sim.targetState, sim.t, dt, sim.opts);
      sim.t += dt;
      remaining -= dt;
    }

    // Sample trails (not every frame to keep them readable)
    pushTrail(chaserTrail, [sim.chaserState[0], sim.chaserState[1], sim.chaserState[2]]);
    pushTrail(targetTrail, [sim.targetState[0], sim.targetState[1], sim.targetState[2]]);
  }

  // Position satellites
  const cp = [sim.chaserState[0], sim.chaserState[1], sim.chaserState[2]];
  const tp = [sim.targetState[0], sim.targetState[1], sim.targetState[2]];
  chaser.position.set(cp[0]*KM, cp[1]*KM, cp[2]*KM);
  target.position.set(tp[0]*KM, tp[1]*KM, tp[2]*KM);

  // Moon
  const mp = moonPosition(sim.t);
  moonMesh.position.set(mp[0]*KM, mp[1]*KM, mp[2]*KM);

  // LOS line
  const losArr = losLine.geometry.attributes.position.array;
  losArr[0] = cp[0]*KM; losArr[1] = cp[1]*KM; losArr[2] = cp[2]*KM;
  losArr[3] = tp[0]*KM; losArr[4] = tp[1]*KM; losArr[5] = tp[2]*KM;
  losLine.geometry.attributes.position.needsUpdate = true;
  const losStatus = losClear(cp, tp);
  losLine.material.color.setHex(losStatus.clear ? 0x4ade80 : 0xff5d6e);
  readouts.los.textContent = losStatus.clear ? 'CLEAR' : `OCCLUDED (${losStatus.grazeDistance.toFixed(0)} km)`;
  readouts.los.className = 'los ' + (losStatus.clear ? 'clear' : 'blocked');

  // Range + range-rate
  const dr = [tp[0]-cp[0], tp[1]-cp[1], tp[2]-cp[2]];
  const range = Math.hypot(dr[0], dr[1], dr[2]);
  const dv = [sim.targetState[3]-sim.chaserState[3], sim.targetState[4]-sim.chaserState[4], sim.targetState[5]-sim.chaserState[5]];
  const rangeRate = (dr[0]*dv[0] + dr[1]*dv[1] + dr[2]*dv[2]) / range; // km/s
  readouts.range.textContent = range > 10000 ? `${(range/1000).toFixed(2)} Mm` : `${range.toFixed(1)} km`;
  readouts.rrate.textContent = `${(rangeRate*1000).toFixed(1)} m/s`;
  readouts.met.textContent = fmtMET(sim.t);
  readouts.dv.textContent = `${sim.dvUsed.toFixed(3)} km/s`;

  // Rotate Earth slowly (sidereal: 7.29e-5 rad/s)
  earthGroup.rotation.y = 7.2921159e-5 * sim.t;

  updateCamera(cp, tp);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(step);
}

// ============================================================
// Boot
// ============================================================
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// Initial load: Hohmann scenario
loadScenario('hohmann');
requestAnimationFrame(now => { lastFrame = now; step(now); });
