// Orbital Mechanics & Space Warfare — Interactive Explainer
// ----------------------------------------------------------
// Four canvas-2D simulations:
//   1. Clohessy–Wiltshire relative motion
//   2. Lagrange point stability (CR3BP, simplified)
//   3. Line-of-sight windows over a 90-min LEO orbit
//   4. Hohmann transfer vs. direct intercept Δv comparison

const $ = (id) => document.getElementById(id);

// ---------- Tab routing ----------
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
function showTab(name) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  panels.forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  // re-fit canvases now that they're visible
  requestAnimationFrame(fitAllCanvases);
}
tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.goto)));

// ---------- Canvas helpers ----------
function fitCanvas(canvas) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(2, Math.floor(rect.width * dpr));
  canvas.height = Math.max(2, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
function fitAllCanvases() {
  ['heroCanvas','cwCanvas','lagrangeCanvas','losCanvas','transferCanvas'].forEach(id => fitCanvas($(id)));
}
window.addEventListener('resize', fitAllCanvases);

// =====================================================
// HERO — animated orbit ring with three satellites
// =====================================================
function startHero() {
  const c = $('heroCanvas');
  const ctx = fitCanvas(c);
  let t = 0;
  function draw() {
    const w = c.clientWidth, h = c.clientHeight;
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 80; i++) {
      const x = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const y = (Math.sin(i * 39.346 + 11.135) * 43758.5453) % 1;
      const a = 0.3 + 0.6 * Math.abs(Math.sin(t * 0.001 + i));
      ctx.globalAlpha = a;
      ctx.fillRect(((x + 1) % 1) * w, ((y + 1) % 1) * h, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    // Earth
    const earthR = Math.min(w, h) * 0.16;
    const earthGrad = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, earthR * 0.1, cx, cy, earthR);
    earthGrad.addColorStop(0, '#5b8fc4');
    earthGrad.addColorStop(0.7, '#2c4d77');
    earthGrad.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = earthGrad;
    ctx.beginPath(); ctx.arc(cx, cy, earthR, 0, Math.PI * 2); ctx.fill();
    // continents hint
    ctx.fillStyle = 'rgba(100,180,120,0.35)';
    ctx.beginPath(); ctx.ellipse(cx - earthR * 0.3, cy - earthR * 0.2, earthR * 0.4, earthR * 0.25, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + earthR * 0.2, cy + earthR * 0.25, earthR * 0.3, earthR * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();

    // orbit rings
    const rings = [
      { r: earthR * 1.7, color: 'rgba(93,211,255,0.25)' },
      { r: earthR * 2.3, color: 'rgba(245,185,85,0.2)' },
      { r: earthR * 3.0, color: 'rgba(249,122,108,0.18)' },
    ];
    rings.forEach(({ r, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.setLineDash([]);

    // satellites
    const sats = [
      { r: earthR * 1.7, speed: 0.00065, phase: 0, color: '#5dd3ff' },
      { r: earthR * 1.7, speed: 0.00065, phase: 0.7, color: '#f5b955' },
      { r: earthR * 3.0, speed: 0.00028, phase: 1.6, color: '#f97a6c' },
    ];
    sats.forEach(s => {
      const a = t * s.speed + s.phase;
      const x = cx + Math.cos(a) * s.r;
      const y = cy + Math.sin(a) * s.r;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    t += 16;
    requestAnimationFrame(draw);
  }
  draw();
}

// =====================================================
// MODULE 1 — Clohessy–Wiltshire relative motion
// =====================================================
// CW equations in target-centered LVLH frame (n = mean motion):
//   x_dd - 2 n y_d - 3 n^2 x = 0
//   y_dd + 2 n x_d = 0
// x = radial (out from Earth), y = along-track.
// Closed-form solution given initial state (x0, y0, vx0, vy0):
//   x(t) = (4 - 3 cos(nt)) x0 + sin(nt)/n * vx0 + 2/n (1 - cos(nt)) vy0
//   y(t) = 6 (sin(nt) - nt) x0 + y0 - 2/n (1 - cos(nt)) vx0 + (4 sin(nt) - 3 nt)/n vy0

function startCW() {
  const c = $('cwCanvas');
  const ctx = fitCanvas(c);

  const n = 0.0011;        // mean motion (rad/s) for ~400 km LEO ~ 0.00114
  let state = { x: 0, y: -5000, vx: 0, vy: 0 }; // chaser starts 5 km behind target
  let elapsed = 0;
  let dvTotal = 0;
  let trail = [];

  function reset() {
    state = { x: 0, y: -5000, vx: 0, vy: 0 };
    elapsed = 0;
    dvTotal = 0;
    trail = [];
  }
  $('cwResetBtn').addEventListener('click', reset);
  $('cwProgradeBtn').addEventListener('click', () => { state.vy += 1.0; dvTotal += 1.0; });   // +1 m/s along-track
  $('cwRetroBtn').addEventListener('click', () => { state.vy -= 1.0; dvTotal += 1.0; });     // -1 m/s along-track

  function step(dt) {
    // semi-implicit: integrate accelerations directly using CW ODEs
    // a_x = 2 n vy + 3 n^2 x
    // a_y = -2 n vx
    const ax = 2 * n * state.vy + 3 * n * n * state.x;
    const ay = -2 * n * state.vx;
    state.vx += ax * dt;
    state.vy += ay * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
  }

  function draw() {
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Frame: x (radial) along screen-Y up, y (along-track) along screen-X right
    // Scale: ~20 km window
    const cx = w * 0.5, cy = h * 0.55;
    const scale = Math.min(w, h) / 22000; // px per meter (~20-22 km visible)

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let g = -10; g <= 10; g++) {
      const xPx = cx + g * 1000 * scale;
      const yPx = cy - g * 1000 * scale;
      ctx.beginPath(); ctx.moveTo(xPx, 0); ctx.lineTo(xPx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, yPx); ctx.lineTo(w, yPx); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // labels
    ctx.fillStyle = '#64748b'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('← retrograde         along-track →', w - 230, cy - 8);
    ctx.save(); ctx.translate(cx + 8, 14); ctx.fillText('radial out ↑', 0, 0); ctx.restore();
    ctx.fillText('Target-centered LVLH frame · 1 grid = 1 km', 12, h - 12);

    // step physics multiple times per frame for stability
    const subSteps = 8;
    const dtSim = 8.0; // simulated seconds per substep
    for (let i = 0; i < subSteps; i++) {
      step(dtSim);
      elapsed += dtSim;
    }
    trail.push({ x: state.x, y: state.y });
    if (trail.length > 600) trail.shift();

    // draw target
    const tx = cx, ty = cy;
    ctx.fillStyle = '#f5b955'; ctx.shadowColor = '#f5b955'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(tx, ty, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5b955'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('TARGET', tx + 12, ty - 8);

    // draw trail
    ctx.strokeStyle = 'rgba(93,211,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const px = cx + p.y * scale;
      const py = cy - p.x * scale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // draw chaser
    const chx = cx + state.y * scale;
    const chy = cy - state.x * scale;
    ctx.fillStyle = '#5dd3ff'; ctx.shadowColor = '#5dd3ff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(chx, chy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5dd3ff'; ctx.fillText('CHASER', chx + 10, chy + 4);

    // HUD
    const range = Math.sqrt(state.x * state.x + state.y * state.y);
    $('cwDv').textContent = dvTotal.toFixed(1) + ' m/s';
    $('cwRange').textContent = (range / 1000).toFixed(2) + ' km';
    const mm = Math.floor(elapsed / 60);
    $('cwTime').textContent = mm + ' min ' + Math.floor(elapsed % 60) + ' s';

    requestAnimationFrame(draw);
  }
  draw();
}

// =====================================================
// MODULE 2 — Lagrange point stability
// =====================================================
// Visualize Earth-Moon system. We don't run a full CR3BP integration; we use the
// known qualitative behavior at each point: saddle (L1,L2,L3) vs. stable well (L4,L5),
// with a deterministic "drift" that runs the perturbed particle correctly.

function startLagrange() {
  const c = $('lagrangeCanvas');
  const ctx = fitCanvas(c);

  // Earth-Moon system (not to scale, but L points placed correctly relative to baryline)
  // Mass ratio mu ≈ 0.01215. Earth at -mu, Moon at 1-mu (in units of EM distance).
  const mu = 0.01215;
  // Approximate L positions along x-axis in units of EM distance:
  // L1 ~ 0.8369, L2 ~ 1.1557, L3 ~ -1.005
  // L4, L5 at (0.5 - mu, ±sqrt(3)/2)
  const Lpts = {
    L1: { x: 0.8369 - mu, y: 0, stable: false },
    L2: { x: 1.1557 - mu, y: 0, stable: false },
    L3: { x: -1.005 - mu, y: 0, stable: false },
    L4: { x: 0.5 - mu, y:  Math.sqrt(3) / 2, stable: true },
    L5: { x: 0.5 - mu, y: -Math.sqrt(3) / 2, stable: true },
  };
  let selected = 'L1';
  let particle = { ...Lpts[selected], vx: 0, vy: 0, drift: 0 };
  let perturbed = false;

  document.querySelectorAll('[data-lag]').forEach(b => {
    b.addEventListener('click', () => {
      selected = b.dataset.lag;
      reset();
    });
  });
  $('lagPerturbBtn').addEventListener('click', () => {
    perturbed = true;
    // small random kick
    particle.vx = (Math.random() - 0.5) * 0.002;
    particle.vy = (Math.random() - 0.5) * 0.002;
  });
  $('lagResetBtn').addEventListener('click', reset);

  function reset() {
    particle = { x: Lpts[selected].x, y: Lpts[selected].y, vx: 0, vy: 0, drift: 0 };
    perturbed = false;
    trail = [];
  }

  let t = 0;
  let trail = [];

  function step(dt) {
    if (!perturbed) return;
    const L = Lpts[selected];
    if (L.stable) {
      // restoring force toward L point (damped oscillation)
      const dx = particle.x - L.x;
      const dy = particle.y - L.y;
      const k = 0.0008;
      const damp = 0.003;
      particle.vx += -k * dx * dt - damp * particle.vx * dt;
      particle.vy += -k * dy * dt - damp * particle.vy * dt;
    } else {
      // saddle: unstable along x (for L1/L2/L3 we say unstable axis = along Earth-Moon line)
      const dx = particle.x - L.x;
      const dy = particle.y - L.y;
      const ku = 0.0009;   // unstable axis grows
      const ks = 0.0005;   // stable axis oscillates
      particle.vx +=  ku * dx * dt;   // anti-restoring along x
      particle.vy += -ks * dy * dt;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }

  function draw() {
    const w = c.clientWidth, h = c.clientHeight;
    const cx = w * 0.4, cy = h * 0.5;
    const scale = Math.min(w, h) * 0.32; // 1 EM unit = scale px
    ctx.clearRect(0, 0, w, h);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 60; i++) {
      const x = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const y = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.001 + i));
      ctx.fillRect(x * w, y * h, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;

    // effective potential contours (just stylized)
    ctx.strokeStyle = 'rgba(93,211,255,0.06)'; ctx.lineWidth = 1;
    for (let r = 0.3; r < 1.6; r += 0.12) {
      ctx.beginPath(); ctx.arc(cx + scale * (0.5 - mu), cy, r * scale, 0, Math.PI * 2); ctx.stroke();
    }

    // Earth
    const earthX = cx + scale * (-mu);
    const earthY = cy;
    const eR = 18;
    const eg = ctx.createRadialGradient(earthX - 5, earthY - 5, 3, earthX, earthY, eR);
    eg.addColorStop(0, '#7aa8d4'); eg.addColorStop(1, '#1a3a60');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(earthX, earthY, eR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('Earth', earthX - 14, earthY + eR + 14);

    // Moon
    const moonX = cx + scale * (1 - mu);
    const moonY = cy;
    const mR = 8;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.arc(moonX, moonY, mR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.fillText('Moon', moonX - 12, moonY + mR + 14);

    // dotted line Earth-Moon
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(earthX, earthY); ctx.lineTo(moonX, moonY); ctx.stroke();
    ctx.setLineDash([]);

    // L points
    Object.entries(Lpts).forEach(([name, p]) => {
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;
      const isSel = name === selected;
      ctx.fillStyle = isSel ? (p.stable ? '#4ade80' : '#f97a6c') : 'rgba(148,163,184,0.4)';
      ctx.strokeStyle = isSel ? (p.stable ? '#4ade80' : '#f97a6c') : 'rgba(148,163,184,0.5)';
      ctx.lineWidth = 1.5;
      // marker = small cross + circle
      ctx.beginPath(); ctx.arc(px, py, isSel ? 9 : 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py); ctx.moveTo(px, py - 4); ctx.lineTo(px, py + 4); ctx.stroke();
      ctx.fillStyle = isSel ? '#fff' : '#64748b';
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(name, px + 12, py + 4);
    });

    // step physics
    step(1);
    t += 1;

    // trail and particle — bound to a reasonable radius around the system to keep trail readable
    const maxRadius = 1.8;
    if (perturbed) {
      const dxL = particle.x - Lpts[selected].x;
      const dyL = particle.y - Lpts[selected].y;
      const driftMag = Math.sqrt(dxL*dxL + dyL*dyL);
      // for unstable saddles, soft-cap so it doesn't visually escape to infinity
      if (!Lpts[selected].stable && driftMag > 0.9) {
        perturbed = false; // stop integrating; leave trail visible to show it escaped
      } else {
        trail.push({ x: particle.x, y: particle.y });
        if (trail.length > 600) trail.shift();
      }
    } else if (trail.length === 0) {
      // no trail when reset
    }

    const isStable = Lpts[selected].stable;
    const ptColor = isStable ? '#4ade80' : '#f97a6c';
    ctx.strokeStyle = ptColor; ctx.lineWidth = 1.5;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const ppx = cx + particle.x * scale;
    const ppy = cy - particle.y * scale;
    ctx.fillStyle = ptColor; ctx.shadowColor = ptColor; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(ppx, ppy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    $('lagSel').textContent = selected;
    $('lagStab').textContent = isStable ? 'STABLE WELL' : 'SADDLE (UNSTABLE)';
    $('lagStab').style.color = isStable ? '#4ade80' : '#f97a6c';
    const dx = particle.x - Lpts[selected].x;
    const dy = particle.y - Lpts[selected].y;
    const drift = Math.sqrt(dx * dx + dy * dy);
    // Earth-Moon distance ≈ 384,400 km; report drift in km
    $('lagDrift').textContent = (drift * 384400).toFixed(0) + ' km';

    // legend
    ctx.fillStyle = '#94a3b8'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('Earth–Moon rotating frame · not to scale', 12, h - 12);

    requestAnimationFrame(draw);
  }
  draw();
}

// =====================================================
// MODULE 3 — Line-of-sight windows
// =====================================================
// 400 km LEO, ground station at fixed longitude on Earth's surface.
// Compute angular separation between satellite radius vector and station radius vector;
// LOS exists if angle < arccos(R_e / (R_e + h)) — i.e. satellite above local horizon.

function startLOS() {
  const c = $('losCanvas');
  const ctx = fitCanvas(c);

  const Re = 6371;       // km
  const alt = 400;       // km
  const orbitR = Re + alt;
  const periodMin = 92.6; // ~90 min for 400 km LEO
  const horizonAngle = Math.acos(Re / orbitR); // max half-angle for LOS

  let speed = 60;   // simulated minutes per real second
  let simMin = 0;
  let passCount = 0;
  let inWindow = false;
  let windowTimer = 0;

  $('losSpeed1').addEventListener('click', () => speed = 1);
  $('losSpeed10').addEventListener('click', () => speed = 10);
  $('losSpeed60').addEventListener('click', () => speed = 60);
  $('losResetBtn').addEventListener('click', () => { simMin = 0; passCount = 0; inWindow = false; });

  let lastT = performance.now();

  function draw(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    simMin += dt * speed;

    const w = c.clientWidth, h = c.clientHeight;
    const cx = w * 0.5, cy = h * 0.5;
    const earthPx = Math.min(w, h) * 0.18;
    const orbitPx = earthPx * (orbitR / Re);
    ctx.clearRect(0, 0, w, h);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 70; i++) {
      const x = ((Math.sin(i * 92.71) * 43758.5453) % 1 + 1) % 1;
      const y = ((Math.sin(i * 13.91) * 43758.5453) % 1 + 1) % 1;
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(now * 0.001 + i));
      ctx.fillRect(x * w, y * h, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;

    // Earth
    const eg = ctx.createRadialGradient(cx - earthPx * 0.3, cy - earthPx * 0.3, earthPx * 0.1, cx, cy, earthPx);
    eg.addColorStop(0, '#5b8fc4'); eg.addColorStop(0.7, '#2c4d77'); eg.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(cx, cy, earthPx, 0, Math.PI * 2); ctx.fill();

    // ground station (fixed in rotating Earth frame — for simplicity station is at fixed inertial angle here; satellite orbits, station rotates with Earth at slow rate)
    const stationAngle = 0 + simMin * (2 * Math.PI / (24 * 60)); // Earth rotates once per day
    const sx = cx + Math.cos(stationAngle) * earthPx;
    const sy = cy + Math.sin(stationAngle) * earthPx;

    // satellite position
    const satAngle = -Math.PI / 2 + simMin * (2 * Math.PI / periodMin);
    const satX = cx + Math.cos(satAngle) * orbitPx;
    const satY = cy + Math.sin(satAngle) * orbitPx;

    // determine LOS: angle between station vector and satellite vector
    const stationVec = { x: Math.cos(stationAngle), y: Math.sin(stationAngle) };
    const satVec = { x: Math.cos(satAngle) * (orbitR / Re), y: Math.sin(satAngle) * (orbitR / Re) };
    // satellite is above horizon of station if dot product of (satVec - stationVec) with stationVec > 0
    const dx = satVec.x - stationVec.x;
    const dy = satVec.y - stationVec.y;
    const dot = dx * stationVec.x + dy * stationVec.y;
    const hasLOS = dot > 0;

    // visualization: draw the cone of LOS from station tangent to Earth horizon
    // tangent half-angle from station to horizon (looking outward) = 90° from local up
    ctx.save();
    ctx.translate(sx, sy);
    const upAngle = stationAngle; // outward-pointing direction
    // Draw horizon plane (perpendicular to up direction) as faded line
    ctx.rotate(upAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, 200); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // orbit ring
    ctx.strokeStyle = 'rgba(93,211,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, orbitPx, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // beam from station to satellite
    ctx.lineWidth = 2;
    if (hasLOS) {
      ctx.strokeStyle = 'rgba(74,222,128,0.85)';
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(239,107,107,0.5)';
      ctx.setLineDash([6, 6]);
    }
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(satX, satY); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setLineDash([]);

    // station marker
    ctx.fillStyle = '#4ade80'; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // satellite marker
    ctx.fillStyle = hasLOS ? '#5dd3ff' : '#94a3b8';
    ctx.shadowColor = hasLOS ? '#5dd3ff' : 'transparent'; ctx.shadowBlur = hasLOS ? 12 : 0;
    ctx.beginPath(); ctx.arc(satX, satY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // edge labels
    ctx.fillStyle = '#94a3b8'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('Ground Station', sx + 10, sy - 8);
    ctx.fillText('LEO Sat (400 km)', satX + 8, satY - 8);

    // window tracking
    if (hasLOS && !inWindow) { inWindow = true; passCount++; windowTimer = 0; }
    if (!hasLOS && inWindow) { inWindow = false; }
    if (inWindow) windowTimer += dt * speed;

    // HUD
    const hh = Math.floor(simMin / 60); const mm = Math.floor(simMin % 60);
    $('losT').textContent = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    $('losStatus').textContent = hasLOS ? 'ACQUIRED' : 'OCCLUDED';
    $('losStatus').style.color = hasLOS ? '#4ade80' : '#ef6b6b';
    $('losWindow').textContent = passCount + ' passes · ' + (hasLOS ? `${windowTimer.toFixed(1)}m live` : `next pass soon`);

    // bottom legend
    ctx.fillStyle = '#64748b'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('Speed: ' + speed + '× real-time · orbit period 92.6 min · ~10 min per pass', 12, h - 12);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// =====================================================
// MODULE 4 — Hohmann vs. direct intercept
// =====================================================
function startTransfer() {
  const c = $('transferCanvas');
  const ctx = fitCanvas(c);

  // Earth params
  const mu = 398600.4418;          // km^3/s^2
  const Re = 6371;
  const r1 = Re + 400;             // interceptor orbit km
  const r2 = Re + 1400;            // target orbit km
  const v1 = Math.sqrt(mu / r1);
  const v2 = Math.sqrt(mu / r2);
  const aT = (r1 + r2) / 2;
  // Hohmann burns
  const vpT = Math.sqrt(mu * (2 / r1 - 1 / aT));
  const vaT = Math.sqrt(mu * (2 / r2 - 1 / aT));
  const dv1 = vpT - v1;
  const dv2 = v2 - vaT;
  const dvHoh = (dv1 + dv2) * 1000; // m/s
  const Thoh = Math.PI * Math.sqrt(aT * aT * aT / mu); // seconds half-period
  // "Direct" radial burn cost: simplified — large impulse to climb r2-r1 at v1, equivalent to enormous radial component
  // Use a representative figure: direct radial intercept ~ 2.5x Hohmann delta-v for 1000 km climb
  const dvDirect = dvHoh * 2.6;
  const Tdirect = 10 * 60; // ~10 min

  let running = false;
  let t = 0;     // sim seconds
  let lastT = performance.now();

  $('transferLaunchBtn').addEventListener('click', () => { running = true; t = 0; });
  $('transferResetBtn').addEventListener('click', () => { running = false; t = 0; });

  // initial HUD
  function setStaticHud() {
    $('hohDv').textContent = dvHoh.toFixed(0) + ' m/s';
    $('hohTime').textContent = (Thoh / 60).toFixed(1) + ' min';
    $('dirDv').textContent = dvDirect.toFixed(0) + ' m/s';
    $('dirTime').textContent = (Tdirect / 60).toFixed(1) + ' min';
  }
  setStaticHud();

  function draw(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (running) t += dt * 60; // 1 real sec = 60 sim sec (compressed)

    const w = c.clientWidth, h = c.clientHeight;
    const cx = w * 0.5, cy = h * 0.5;
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min(w, h) / (2.6 * r2);
    const earthPx = Re * scale;
    const r1Px = r1 * scale;
    const r2Px = r2 * scale;

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 80; i++) {
      const x = ((Math.sin(i * 51.7) * 43758.5453) % 1 + 1) % 1;
      const y = ((Math.sin(i * 18.21) * 43758.5453) % 1 + 1) % 1;
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(now * 0.001 + i));
      ctx.fillRect(x * w, y * h, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;

    // Earth
    const eg = ctx.createRadialGradient(cx - earthPx * 0.3, cy - earthPx * 0.3, earthPx * 0.1, cx, cy, earthPx);
    eg.addColorStop(0, '#5b8fc4'); eg.addColorStop(0.7, '#2c4d77'); eg.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(cx, cy, earthPx, 0, Math.PI * 2); ctx.fill();

    // initial orbit
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, r1Px, 0, Math.PI * 2); ctx.stroke();
    // target orbit
    ctx.strokeStyle = 'rgba(245,185,85,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy, r2Px, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Hohmann transfer ellipse — semi-major a=(r1+r2)/2, apsides on x-axis
    // We center the ellipse so perigee is at angle 0 (right) at r1, apogee at angle π at r2.
    // That means ellipse center is shifted left by (r2 - r1)/2 from Earth.
    const aPx = ((r1 + r2) / 2) * scale;
    const cPx = ((r2 - r1) / 2) * scale; // focal offset
    const bPx = Math.sqrt(aPx * aPx - cPx * cPx);
    ctx.strokeStyle = 'rgba(93,211,255,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx - cPx, cy, aPx, bPx, 0, 0, Math.PI * 2); ctx.stroke();

    // Target satellite — circular orbit at r2, angular rate w2 = v2/r2 (rad/s)
    const w2 = v2 / r2;
    // Target starts at angle π (left side, apogee meeting point) at t=0 minus phase needed for rendezvous
    // For visualization: place target so that at t = Thoh, target is at angle π.
    const targetStartAngle = Math.PI - w2 * Thoh;
    const targetAngle = targetStartAngle + w2 * t;
    const tgtX = cx + Math.cos(targetAngle) * r2Px;
    const tgtY = cy + Math.sin(targetAngle) * r2Px;
    ctx.fillStyle = '#f5b955'; ctx.shadowColor = '#f5b955'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(tgtX, tgtY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5b955'; ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('TARGET', tgtX + 9, tgtY - 8);

    // Hohmann interceptor — travels along ellipse perigee → apogee in time Thoh
    // Parametrize true anomaly nu from 0 to π over time t in [0, Thoh].
    // For a real elliptic orbit, this isn't linear in time; for clarity we use mean anomaly approximation.
    const tH = Math.min(t, Thoh);
    const nu = Math.PI * (tH / Thoh);
    // Radius and position
    const eEll = (r2 - r1) / (r2 + r1);
    const p = ((r1 + r2) / 2) * (1 - eEll * eEll);
    const rH = p / (1 + eEll * Math.cos(nu));
    const rHpx = rH * scale;
    const hohX = cx + Math.cos(nu) * rHpx;
    const hohY = cy + Math.sin(nu) * rHpx;
    if (t > 0) {
      ctx.fillStyle = '#5dd3ff'; ctx.shadowColor = '#5dd3ff'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(hohX, hohY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#5dd3ff'; ctx.fillText('HOHMANN', hohX + 9, hohY + 4);
    }

    // Direct interceptor — radial-ish trajectory from start to target initial position, in 10 minutes
    // Start at angle 0 on r1; aims for current target position, but for simplicity straight line
    if (t > 0) {
      const tD = Math.min(t, Tdirect);
      const frac = tD / Tdirect;
      // direct path: starts at r1, angle 0; moves to angle π on r2 (where target started) over Tdirect
      // straight line in 2D
      const startX = cx + r1Px;
      const startY = cy;
      const endX = cx + Math.cos(targetStartAngle) * r2Px;
      const endY = cy + Math.sin(targetStartAngle) * r2Px;
      const dirPx = startX + (endX - startX) * frac;
      const dirPy = startY + (endY - startY) * frac;

      // path trace
      ctx.strokeStyle = 'rgba(249,122,108,0.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(dirPx, dirPy); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f97a6c'; ctx.shadowColor = '#f97a6c'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(dirPx, dirPy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f97a6c'; ctx.fillText('DIRECT', dirPx + 9, dirPy + 4);
    }

    // start marker
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(cx + r1Px, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText('Start (LEO 400 km)', cx + r1Px + 10, cy - 8);

    // bottom legend
    ctx.fillStyle = '#64748b';
    const simT = (t / 60).toFixed(1);
    ctx.fillText(`Sim time: ${simT} min · Hohmann: ${(Thoh/60).toFixed(1)} min · Direct: ${(Tdirect/60).toFixed(1)} min`, 12, h - 12);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// ---------- Boot ----------
window.addEventListener('load', () => {
  fitAllCanvases();
  startHero();
  startCW();
  startLagrange();
  startLOS();
  startTransfer();
});
