/**
 * Approximate heliocentric positions from simplified Keplerian elements (J2000).
 * Good enough for NASA Eyes–style visualization — not a rigorous DE440 ephemeris.
 */

import * as THREE from 'three';

/** Julian day for J2000.0 epoch. */
export const J2000_JD = 2451545.0;

/** Scene scale: sceneRadius ≈ 2.93 × AU^0.48 (matches bodies.ts table). */
export const AU_SCENE_SCALE = 2.93;
export const AU_SCENE_POWER = 0.48;

/** Gaussian gravitational constant squared — AU³ / day² / M☉. */
export const G_AU = 2.95912208286e-4;

export function auToScene(au: number): number {
  return AU_SCENE_SCALE * Math.pow(Math.max(au, 1e-6), AU_SCENE_POWER);
}

export function julianDayFromDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

export function daysSinceJ2000(d: Date = new Date()): number {
  return julianDayFromDate(d) - J2000_JD;
}

export interface KeplerElements {
  /** Semi-major axis (AU). */
  a: number;
  /** Eccentricity. */
  e: number;
  /** Inclination (rad). */
  i: number;
  /** Longitude of ascending node Ω (rad). */
  Omega: number;
  /** Argument of perihelion ω (rad). */
  omega: number;
  /** Mean anomaly at J2000 (rad). */
  M0: number;
  /** Mean motion (rad / day). */
  n: number;
  /** Mass in solar masses (for n-body). */
  mass: number;
}

const DEG = Math.PI / 180;

/** Approximate J2000 ecliptic elements (public NASA/Wikipedia-class values). */
export const PLANET_ELEMENTS: Record<string, KeplerElements> = {
  mercury: {
    a: 0.387098,
    e: 0.20563,
    i: 7.005 * DEG,
    Omega: 48.331 * DEG,
    omega: 29.124 * DEG,
    M0: 174.796 * DEG,
    n: (2 * Math.PI) / 87.969,
    mass: 1.66e-7,
  },
  venus: {
    a: 0.723332,
    e: 0.006772,
    i: 3.3947 * DEG,
    Omega: 76.68 * DEG,
    omega: 54.884 * DEG,
    M0: 50.416 * DEG,
    n: (2 * Math.PI) / 224.701,
    mass: 2.447e-6,
  },
  earth: {
    a: 1.000001,
    e: 0.016708,
    i: 0.00005 * DEG,
    Omega: -11.261 * DEG,
    omega: 114.208 * DEG,
    M0: 358.617 * DEG,
    n: (2 * Math.PI) / 365.256,
    mass: 3.003e-6,
  },
  mars: {
    a: 1.523679,
    e: 0.0934,
    i: 1.85 * DEG,
    Omega: 49.558 * DEG,
    omega: 286.502 * DEG,
    M0: 19.373 * DEG,
    n: (2 * Math.PI) / 686.98,
    mass: 3.227e-7,
  },
  jupiter: {
    a: 5.2044,
    e: 0.0489,
    i: 1.303 * DEG,
    Omega: 100.464 * DEG,
    omega: 273.867 * DEG,
    M0: 20.02 * DEG,
    n: (2 * Math.PI) / 4332.59,
    mass: 9.547e-4,
  },
  saturn: {
    a: 9.5826,
    e: 0.0565,
    i: 2.485 * DEG,
    Omega: 113.665 * DEG,
    omega: 339.392 * DEG,
    M0: 317.02 * DEG,
    n: (2 * Math.PI) / 10759.22,
    mass: 2.858e-4,
  },
  uranus: {
    a: 19.2184,
    e: 0.0457,
    i: 0.773 * DEG,
    Omega: 74.006 * DEG,
    omega: 96.998 * DEG,
    M0: 142.239 * DEG,
    n: (2 * Math.PI) / 30685.4,
    mass: 4.366e-5,
  },
  neptune: {
    a: 30.1104,
    e: 0.0113,
    i: 1.77 * DEG,
    Omega: 131.784 * DEG,
    omega: 273.187 * DEG,
    M0: 256.225 * DEG,
    n: (2 * Math.PI) / 60189,
    mass: 5.151e-5,
  },
};

/** Approximate elements for dwarfs / asteroids (visual only). */
export const MINOR_ELEMENTS: Record<
  string,
  { a: number; e: number; i: number; M0: number; n: number; Omega?: number; omega?: number }
> = {
  vesta: { a: 2.36, e: 0.089, i: 7.1 * DEG, M0: 40 * DEG, n: (2 * Math.PI) / 1325 },
  pallas: { a: 2.77, e: 0.23, i: 34.8 * DEG, M0: 110 * DEG, n: (2 * Math.PI) / 1686 },
  hygiea: { a: 3.14, e: 0.12, i: 3.8 * DEG, M0: 200 * DEG, n: (2 * Math.PI) / 2030 },
  ceres: { a: 2.77, e: 0.076, i: 10.6 * DEG, M0: 80 * DEG, n: (2 * Math.PI) / 1681 },
  pluto: {
    a: 39.48,
    e: 0.2488,
    i: 17.16 * DEG,
    M0: 14.86 * DEG,
    n: (2 * Math.PI) / 90560,
    Omega: 110.3 * DEG,
    omega: 113.8 * DEG,
  },
  haumea: { a: 43.13, e: 0.191, i: 28.2 * DEG, M0: 220 * DEG, n: (2 * Math.PI) / 103774 },
  makemake: { a: 45.79, e: 0.159, i: 29.0 * DEG, M0: 160 * DEG, n: (2 * Math.PI) / 112897 },
  eris: { a: 67.86, e: 0.436, i: 44.0 * DEG, M0: 200 * DEG, n: (2 * Math.PI) / 204199 },
  parker: { a: 0.55, e: 0.7, i: 3.4 * DEG, M0: 90 * DEG, n: (2 * Math.PI) / 88 },
  // Active probes — mid-2026-ish approximate heliocentric placement (visual only).
  'osiris-apex': {
    a: 1.05,
    e: 0.12,
    i: 6.0 * DEG,
    M0: 210 * DEG,
    n: (2 * Math.PI) / 390,
    Omega: 40 * DEG,
    omega: 80 * DEG,
  },
  psyche: {
    a: 1.65,
    e: 0.18,
    i: 4.0 * DEG,
    M0: 95 * DEG,
    n: (2 * Math.PI) / 780,
    Omega: 55 * DEG,
    omega: 120 * DEG,
  },
  'europa-clipper': {
    a: 2.15,
    e: 0.28,
    i: 2.5 * DEG,
    M0: 140 * DEG,
    n: (2 * Math.PI) / 1150,
    Omega: 100 * DEG,
    omega: 200 * DEG,
  },
  juice: {
    a: 2.7,
    e: 0.32,
    i: 3.0 * DEG,
    M0: 60 * DEG,
    n: (2 * Math.PI) / 1620,
    Omega: 85 * DEG,
    omega: 160 * DEG,
  },
  lucy: {
    // Cruise toward Trojan L4 (~5.2 AU, ~60° ahead of Jupiter).
    a: 4.85,
    e: 0.16,
    i: 2.0 * DEG,
    M0: 80 * DEG,
    n: (2 * Math.PI) / 3900,
    Omega: 100.464 * DEG,
    omega: 273.867 * DEG,
  },
};

function wrapAngle(a: number) {
  const twoPi = Math.PI * 2;
  a %= twoPi;
  if (a < 0) a += twoPi;
  return a;
}

/** Solve Kepler’s equation M = E − e sin E (Newton). */
export function solveEccentricAnomaly(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    E -= f / fp;
  }
  return E;
}

type SoftElements = {
  a: number;
  e: number;
  i: number;
  M0: number;
  n: number;
  Omega?: number;
  omega?: number;
};

/**
 * Heliocentric ecliptic position in AU.
 * Scene axes: XZ = ecliptic, +Y = north → (x_ecl, z_ecl, y_ecl).
 */
export function keplerPositionAu(
  el: SoftElements,
  daysFromJ2000: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const M = wrapAngle(el.M0 + el.n * daysFromJ2000);
  const E = solveEccentricAnomaly(M, el.e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const xv = el.a * (cosE - el.e);
  const yv = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e)) * sinE;
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);

  const Omega = el.Omega ?? 0;
  const omega = el.omega ?? 0;
  const i = el.i;

  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosVw = Math.cos(v + omega);
  const sinVw = Math.sin(v + omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const xEcl = r * (cosO * cosVw - sinO * sinVw * cosi);
  const yEcl = r * (sinO * cosVw + cosO * sinVw * cosi);
  const zEcl = r * (sinVw * sini);

  out.set(xEcl, zEcl, yEcl);
  return out;
}

/** Orbital velocity in AU/day (scene axes). */
export function keplerVelocityAuPerDay(
  el: KeplerElements,
  daysFromJ2000: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const M = wrapAngle(el.M0 + el.n * daysFromJ2000);
  const E = solveEccentricAnomaly(M, el.e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const dEdt = el.n / (1 - el.e * cosE);
  const dxv = -el.a * sinE * dEdt;
  const dyv = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e)) * cosE * dEdt;

  const Omega = el.Omega;
  const omega = el.omega;
  const i = el.i;
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);

  // Orbital-plane velocity → ecliptic via ω then Ω,i
  const px = dxv * cosw - dyv * sinw;
  const py = dxv * sinw + dyv * cosw;
  const xEcl = cosO * px - sinO * py * cosi;
  const yEcl = sinO * px + cosO * py * cosi;
  const zEcl = py * sini;

  out.set(xEcl, zEcl, yEcl);
  return out;
}

function applyAuCompression(auVec: THREE.Vector3, out: THREE.Vector3) {
  const au = auVec.length();
  if (au < 1e-9) {
    out.set(0, 0, 0);
    return;
  }
  out.copy(auVec).multiplyScalar(auToScene(au) / au);
}

/** Soft Kepler elements for planets or minors/probes (visual ephemeris). */
export function softElementsFor(bodyId: string): SoftElements | null {
  return PLANET_ELEMENTS[bodyId] ?? MINOR_ELEMENTS[bodyId] ?? null;
}

/**
 * Sample a closed Kepler orbit in compressed scene units (for lineLoop).
 * Mean anomaly is stepped 0…2π using the same elements as live ephemeris.
 */
export function sampleKeplerOrbitScene(el: SoftElements, segments: number): Float32Array {
  const n = Math.max(8, segments);
  const arr = new Float32Array(n * 3);
  const au = new THREE.Vector3();
  const scene = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const M = (i / n) * Math.PI * 2;
    keplerPositionAu({ ...el, M0: M, n: 0 }, 0, au);
    applyAuCompression(au, scene);
    arr[i * 3] = scene.x;
    arr[i * 3 + 1] = scene.y;
    arr[i * 3 + 2] = scene.z;
  }
  return arr;
}

/** Write compressed scene-space position for a known body id. */
export function writeEphemerisScenePosition(
  bodyId: string,
  date: Date,
  out: THREE.Vector3,
): boolean {
  const days = daysSinceJ2000(date);
  const planet = PLANET_ELEMENTS[bodyId];
  if (planet) {
    const au = keplerPositionAu(planet, days);
    applyAuCompression(au, out);
    return true;
  }
  const minor = MINOR_ELEMENTS[bodyId];
  if (minor) {
    const au = keplerPositionAu(minor, days);
    applyAuCompression(au, out);
    return true;
  }
  return false;
}

export const NBODY_PLANET_IDS = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
] as const;

export type NBodyPlanetId = (typeof NBODY_PLANET_IDS)[number];
