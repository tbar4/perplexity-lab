// orbital.js — Orbital mechanics engine
// All units: km, km/s, seconds, radians

export const MU_EARTH = 398600.4418;          // km^3/s^2
export const MU_MOON  = 4902.800066;          // km^3/s^2
export const R_EARTH  = 6378.137;             // km
export const J2       = 1.08262668e-3;
export const OMEGA_EARTH = 7.2921159e-5;      // rad/s
export const MOON_A   = 384400;               // km (mean)
export const MOON_PERIOD = 27.321661 * 86400; // sidereal month, seconds
export const MOON_INC = 5.145 * Math.PI/180;  // approximate inclination to ecliptic

// ============================================================
// Vector helpers
// ============================================================
export const v = {
  add:  (a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
  sub:  (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
  scale:(a,s) => [a[0]*s, a[1]*s, a[2]*s],
  dot:  (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross:(a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  norm: (a)   => Math.hypot(a[0],a[1],a[2]),
  unit: (a)   => { const n = Math.hypot(a[0],a[1],a[2]); return [a[0]/n,a[1]/n,a[2]/n]; },
};

// ============================================================
// Classical orbital elements -> ECI state
// a: semi-major axis (km), e: ecc, i: incl (rad),
// raan: longitude of ascending node (rad), argp: arg of periapsis (rad),
// nu: true anomaly (rad)
// ============================================================
export function coeToRv(a, e, i, raan, argp, nu, mu = MU_EARTH) {
  const p = a * (1 - e*e);
  const r = p / (1 + e * Math.cos(nu));

  // Perifocal frame
  const rPQW = [r * Math.cos(nu), r * Math.sin(nu), 0];
  const vPQW = [
    -Math.sqrt(mu/p) * Math.sin(nu),
     Math.sqrt(mu/p) * (e + Math.cos(nu)),
     0
  ];

  // Rotation: R3(-raan) * R1(-i) * R3(-argp)
  const cO = Math.cos(raan), sO = Math.sin(raan);
  const ci = Math.cos(i),    si = Math.sin(i);
  const cw = Math.cos(argp), sw = Math.sin(argp);

  // Composite rotation matrix from PQW -> ECI
  const R = [
    [cO*cw - sO*sw*ci, -cO*sw - sO*cw*ci,  sO*si],
    [sO*cw + cO*sw*ci, -sO*sw + cO*cw*ci, -cO*si],
    [sw*si,             cw*si,              ci   ]
  ];
  const apply = (M, x) => [
    M[0][0]*x[0] + M[0][1]*x[1] + M[0][2]*x[2],
    M[1][0]*x[0] + M[1][1]*x[1] + M[1][2]*x[2],
    M[2][0]*x[0] + M[2][1]*x[1] + M[2][2]*x[2]
  ];
  return { r: apply(R, rPQW), v: apply(R, vPQW) };
}

// State -> orbital elements (for diagnostics)
export function rvToCoe(rVec, vVec, mu = MU_EARTH) {
  const r = v.norm(rVec);
  const sp = v.norm(vVec);
  const h = v.cross(rVec, vVec);
  const hMag = v.norm(h);
  const energy = sp*sp/2 - mu/r;
  const a = -mu / (2 * energy);
  const eVec = v.scale(
    v.sub(v.scale(rVec, sp*sp - mu/r), v.scale(vVec, v.dot(rVec, vVec))),
    1/mu
  );
  const e = v.norm(eVec);
  const i = Math.acos(Math.max(-1, Math.min(1, h[2]/hMag)));
  const T = 2 * Math.PI * Math.sqrt(a*a*a / mu);
  return { a, e, i, period: T, energy, h: hMag };
}

// ============================================================
// Acceleration models
// ============================================================
function accelTwoBody(rVec, mu = MU_EARTH) {
  const r = v.norm(rVec);
  const k = -mu / (r*r*r);
  return [k*rVec[0], k*rVec[1], k*rVec[2]];
}

function accelJ2(rVec) {
  const r = v.norm(rVec);
  const z2 = rVec[2]*rVec[2];
  const k = 1.5 * J2 * MU_EARTH * R_EARTH*R_EARTH / (r*r*r*r*r);
  const factor = 5 * z2 / (r*r);
  return [
    k * rVec[0] * (factor - 1),
    k * rVec[1] * (factor - 1),
    k * rVec[2] * (factor - 3),
  ];
}

// Simple analytic Moon position in ECI (circular, fixed inclination, t=0 at +X axis)
export function moonPosition(t) {
  const n = 2 * Math.PI / MOON_PERIOD;
  const theta = n * t;
  // Orbit in plane inclined by MOON_INC, ascending node at +X
  const x = MOON_A * Math.cos(theta);
  const y = MOON_A * Math.sin(theta) * Math.cos(MOON_INC);
  const z = MOON_A * Math.sin(theta) * Math.sin(MOON_INC);
  return [x, y, z];
}

function accelMoon(rVec, t) {
  const rMoon = moonPosition(t);
  const d = v.sub(rMoon, rVec);
  const dMag = v.norm(d);
  const rmMag = v.norm(rMoon);
  // Battin's formulation (avoids cancellation, but standard form is fine here)
  const k1 = MU_MOON / (dMag*dMag*dMag);
  const k2 = MU_MOON / (rmMag*rmMag*rmMag);
  return [
    k1*d[0] - k2*rMoon[0],
    k1*d[1] - k2*rMoon[1],
    k1*d[2] - k2*rMoon[2]
  ];
}

export function totalAccel(rVec, t, opts) {
  let a = accelTwoBody(rVec);
  if (opts.j2)   { const aj = accelJ2(rVec);     a = [a[0]+aj[0], a[1]+aj[1], a[2]+aj[2]]; }
  if (opts.moon) { const am = accelMoon(rVec,t); a = [a[0]+am[0], a[1]+am[1], a[2]+am[2]]; }
  return a;
}

// ============================================================
// RK4 propagator: one step of dt seconds
// state = [rx,ry,rz, vx,vy,vz]
// ============================================================
export function rk4Step(state, t, dt, opts) {
  const deriv = (s, t) => {
    const a = totalAccel([s[0],s[1],s[2]], t, opts);
    return [s[3], s[4], s[5], a[0], a[1], a[2]];
  };
  const add = (s, k, h) => s.map((v,i) => v + k[i]*h);

  const k1 = deriv(state, t);
  const k2 = deriv(add(state, k1, dt/2), t + dt/2);
  const k3 = deriv(add(state, k2, dt/2), t + dt/2);
  const k4 = deriv(add(state, k3, dt),   t + dt);
  return state.map((v,i) => v + (dt/6)*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
}

// Propagate for total time T, stepping with sub-steps of stepDt
// Returns final state. Optionally collects trail samples.
export function propagate(state, t0, T, stepDt, opts, trail) {
  let s = state.slice();
  let t = t0;
  const end = t0 + T;
  let sinceSample = 0;
  const sampleEvery = (trail && trail.sampleEvery) || stepDt * 5;
  while (t < end - 1e-9) {
    const dt = Math.min(stepDt, end - t);
    s = rk4Step(s, t, dt, opts);
    t += dt;
    sinceSample += dt;
    if (trail && sinceSample >= sampleEvery) {
      trail.points.push([s[0], s[1], s[2]]);
      sinceSample = 0;
    }
  }
  return { state: s, time: t };
}

// ============================================================
// Hohmann transfer between coplanar circular orbits
// r1, r2 in km. Returns dv1, dv2, transfer time, and phase angle.
// Phase angle: angle target should lead chaser at burn time.
// ============================================================
export function hohmann(r1, r2, mu = MU_EARTH) {
  const aT = (r1 + r2) / 2;
  const vc1 = Math.sqrt(mu / r1);
  const vc2 = Math.sqrt(mu / r2);
  const vp  = Math.sqrt(mu * (2/r1 - 1/aT));    // periapsis of transfer (at r1)
  const va  = Math.sqrt(mu * (2/r2 - 1/aT));    // apoapsis of transfer (at r2)
  const dv1 = vp - vc1;
  const dv2 = vc2 - va;
  const tof = Math.PI * Math.sqrt(aT*aT*aT / mu);
  // Required lead angle of target: during TOF target sweeps n2*TOF rad,
  // chaser arrives at angular pos = pi rad from burn. Lead = pi - n2*TOF.
  const n2 = Math.sqrt(mu / (r2*r2*r2));
  const leadAngle = Math.PI - n2 * tof;         // radians
  return { dv1, dv2, tof, aT, leadAngle, totalDv: Math.abs(dv1) + Math.abs(dv2) };
}

// ============================================================
// Lambert solver (Universal Variables, Bate/Mueller/White)
// Given r1, r2 vectors and TOF, solve for v1, v2 of transfer.
// "shortWay" = true for the prograde / short transfer angle.
// ============================================================
function C2(psi) {
  if (psi > 1e-6) {
    const sq = Math.sqrt(psi);
    return (1 - Math.cos(sq)) / psi;
  } else if (psi < -1e-6) {
    const sq = Math.sqrt(-psi);
    return (1 - Math.cosh(sq)) / psi;
  }
  return 1/2 - psi/24 + psi*psi/720;
}
function C3(psi) {
  if (psi > 1e-6) {
    const sq = Math.sqrt(psi);
    return (sq - Math.sin(sq)) / Math.sqrt(psi*psi*psi);
  } else if (psi < -1e-6) {
    const sq = Math.sqrt(-psi);
    return (Math.sinh(sq) - sq) / Math.sqrt(-psi*psi*psi);
  }
  return 1/6 - psi/120 + psi*psi/5040;
}

export function lambert(r1Vec, r2Vec, tof, shortWay = true, mu = MU_EARTH) {
  const r1 = v.norm(r1Vec);
  const r2 = v.norm(r2Vec);
  const cosDnu = v.dot(r1Vec, r2Vec) / (r1*r2);
  // determine sign of sin(dnu) based on z component of cross product (prograde assumption: +z)
  const crossZ = r1Vec[0]*r2Vec[1] - r1Vec[1]*r2Vec[0];
  let dm = shortWay ? 1 : -1;
  // A from Bate
  const A = dm * Math.sqrt(r1 * r2 * (1 + cosDnu));
  if (Math.abs(A) < 1e-9) return null;

  let psi = 0;
  let c2 = 0.5;
  let c3 = 1/6;
  let psiUp = 4 * Math.PI * Math.PI;
  let psiLow = -4 * Math.PI;
  let y = 0;
  let tofComputed = 0;

  for (let iter = 0; iter < 200; iter++) {
    y = r1 + r2 + A * (psi * c3 - 1) / Math.sqrt(c2);
    if (A > 0 && y < 0) {
      // adjust psi lower bound
      psiLow += 0.1;
      psi = (psiUp + psiLow) / 2;
      c2 = C2(psi); c3 = C3(psi);
      continue;
    }
    const chi = Math.sqrt(y / c2);
    tofComputed = (chi*chi*chi * c3 + A * Math.sqrt(y)) / Math.sqrt(mu);

    if (Math.abs(tofComputed - tof) < 1e-5) break;
    if (tofComputed < tof) psiLow = psi;
    else psiUp = psi;
    psi = (psiUp + psiLow) / 2;
    c2 = C2(psi); c3 = C3(psi);
  }

  const f = 1 - y/r1;
  const gdot = 1 - y/r2;
  const g = A * Math.sqrt(y / mu);
  if (Math.abs(g) < 1e-12) return null;
  const v1 = [
    (r2Vec[0] - f*r1Vec[0]) / g,
    (r2Vec[1] - f*r1Vec[1]) / g,
    (r2Vec[2] - f*r1Vec[2]) / g
  ];
  const v2 = [
    (gdot*r2Vec[0] - r1Vec[0]) / g,
    (gdot*r2Vec[1] - r1Vec[1]) / g,
    (gdot*r2Vec[2] - r1Vec[2]) / g
  ];
  return { v1, v2, tof: tofComputed };
}

// ============================================================
// Line-of-sight check between two points around a sphere of radius R.
// Returns { clear, grazeDistance }.
// Uses the parametric segment + closest approach test.
// ============================================================
export function losClear(p1, p2, R = R_EARTH + 50 /* atmosphere */) {
  const d = v.sub(p2, p1);
  const dLen2 = v.dot(d, d);
  if (dLen2 < 1e-9) return { clear: true, grazeDistance: v.norm(p1) - R };
  // Closest approach to origin on the segment
  const t = -v.dot(p1, d) / dLen2;
  const tc = Math.max(0, Math.min(1, t));
  const closest = [p1[0] + tc*d[0], p1[1] + tc*d[1], p1[2] + tc*d[2]];
  const dist = v.norm(closest);
  return { clear: dist > R, grazeDistance: dist - R };
}

// Convenience: compute a full sampled orbit (one period) given current state
export function sampleOrbit(state, opts, samples = 256) {
  const rVec = [state[0], state[1], state[2]];
  const vVec = [state[3], state[4], state[5]];
  const coe = rvToCoe(rVec, vVec);
  const T = coe.period;
  const dt = T / samples;
  const pts = [];
  let s = state.slice();
  let t = 0;
  pts.push([s[0], s[1], s[2]]);
  const subStep = Math.min(dt, 30); // keep accuracy
  for (let i = 0; i < samples; i++) {
    const steps = Math.ceil(dt / subStep);
    const h = dt / steps;
    for (let k = 0; k < steps; k++) {
      s = rk4Step(s, t, h, opts);
      t += h;
    }
    pts.push([s[0], s[1], s[2]]);
  }
  return pts;
}
