/**
 * Artemis II path from NASA/JPL Horizons state vectors
 * (public/data/artemis2/trajectory.json).
 *
 * Sampling uses spherical interpolation (radius lerp + direction slerp) so
 * chords between sparse samples never cut through Earth.
 */
import { Vector3 } from 'three';
import { GLOBE_RADIUS } from '@/three/constants';
import type { Artemis2Phase, Artemis2PhaseId } from './artemis2';

export interface Artemis2TrajectoryFile {
  source: string;
  closestApproachIndex: number;
  closestApproachKm: number;
  jdtdb: number[];
  orion: [number, number, number][];
  moon: [number, number, number][];
  arcLength: number[];
}

export interface Artemis2Trajectory {
  source: string;
  closestApproachIndex: number;
  closestApproachKm: number;
  pointCount: number;
  totalArc: number;
  /** Dense smooth samples for the trail ribbon. */
  smoothPath: Vector3[];
  sampleOrion: (t: number, out?: Vector3) => Vector3;
  sampleMoon: (t: number, out?: Vector3) => Vector3;
  phaseAt: (t: number) => Artemis2Phase;
}

const TRAJ_URL = '/data/artemis2/trajectory.json';
const SMOOTH_SAMPLES = 2400;
/** Keep craft outside the globe (+ thin clearance). */
const MIN_ORION_R = GLOBE_RADIUS * 1.02;

let cached: Promise<Artemis2Trajectory> | null = null;

const _a = new Vector3();
const _b = new Vector3();
const _da = new Vector3();
const _db = new Vector3();

/** Radius-preserving blend between two Earth-centered positions. */
function sphericalLerp(
  a: [number, number, number],
  b: [number, number, number],
  u: number,
  out: Vector3,
  minR = 0,
): Vector3 {
  _a.set(a[0], a[1], a[2]);
  _b.set(b[0], b[1], b[2]);
  const ra = _a.length();
  const rb = _b.length();
  if (ra < 1e-9 && rb < 1e-9) return out.set(0, 0, 0);
  if (ra < 1e-9) return out.copy(_b).multiplyScalar(u);
  if (rb < 1e-9) return out.copy(_a).multiplyScalar(1 - u);

  _da.copy(_a).multiplyScalar(1 / ra);
  _db.copy(_b).multiplyScalar(1 / rb);
  const dot = Math.min(1, Math.max(-1, _da.dot(_db)));
  const omega = Math.acos(dot);
  let dir: Vector3;
  if (omega < 1e-4) {
    dir = out.copy(_da).lerp(_db, u).normalize();
  } else {
    const so = Math.sin(omega);
    const s0 = Math.sin((1 - u) * omega) / so;
    const s1 = Math.sin(u * omega) / so;
    dir = out
      .set(0, 0, 0)
      .addScaledVector(_da, s0)
      .addScaledVector(_db, s1)
      .normalize();
  }
  const r = Math.max(minR, ra + (rb - ra) * u);
  return dir.multiplyScalar(r);
}

function samplePolyline(
  pts: [number, number, number][],
  arcs: number[],
  t: number,
  out: Vector3,
  minR = 0,
): Vector3 {
  const n = pts.length;
  if (n === 0) return out.set(0, 0, 0);
  if (n === 1) return out.set(pts[0]![0], pts[0]![1], pts[0]![2]);
  const total = arcs[n - 1] || 1;
  const target = Math.min(1, Math.max(0, t)) * total;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arcs[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const a0 = arcs[i - 1]!;
  const a1 = arcs[i]!;
  const span = Math.max(1e-9, a1 - a0);
  const u = (target - a0) / span;
  return sphericalLerp(pts[i - 1]!, pts[i]!, u, out, minR);
}

function densifySpherical(
  pts: [number, number, number][],
  count: number,
  minR: number,
): Vector3[] {
  if (pts.length < 2) {
    return pts.map((p) => new Vector3(p[0], p[1], p[2]));
  }
  // Arc-length table for uniform densification
  const arcs = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    arcs.push(
      arcs[i - 1]! +
        Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    );
  }
  const out: Vector3[] = [];
  const scratch = new Vector3();
  for (let i = 0; i <= count; i++) {
    samplePolyline(pts, arcs, i / count, scratch, minR);
    out.push(scratch.clone());
  }
  return out;
}

function phaseFromState(
  t: number,
  r: number,
  moonDist: number,
  caT: number,
  perigeeT: number,
): Artemis2Phase {
  let id: Artemis2PhaseId;
  let label: string;

  // HEO perigee is the near-Earth dip early in Horizons coverage.
  if (t < perigeeT - 0.04) {
    id = 'heo';
    label = 'HEO checkout · NASA Horizons';
  } else if (t < perigeeT + 0.035) {
    id = 'heo';
    label = 'HEO perigee pass';
  } else if (t < caT - 0.06) {
    if (r < 12) {
      id = 'tli';
      label = 'Trans-lunar injection';
    } else {
      id = 'coast_out';
      label = 'Coast to the Moon';
    }
  } else if (t < caT + 0.04) {
    id = 'lunar_flyby';
    label = 'Lunar far-side flyby · NASA ephemeris';
  } else if (t < 0.88) {
    id = 'coast_home';
    label = 'Return coast';
  } else if (t < 0.94) {
    id = 'cm_sm_sep';
    label = 'Crew module / service module sep';
  } else {
    id = 'reentry';
    label = 'Re-entry · Pacific splashdown';
  }

  if (id === 'coast_home' && r < 4.5) {
    id = 'cm_sm_sep';
    label = 'Crew module / service module sep';
  }
  if ((id === 'cm_sm_sep' || id === 'reentry') && r < 2.8) {
    id = 'reentry';
    label = 'Re-entry · Pacific splashdown';
  }
  if (id === 'lunar_flyby' && moonDist > 3.5 && t > caT) {
    id = 'coast_home';
    label = 'Return coast';
  }

  return { id, label, end: 1 };
}

function buildTrajectory(raw: Artemis2TrajectoryFile): Artemis2Trajectory {
  const { orion, moon, arcLength, closestApproachIndex } = raw;
  const totalArc = arcLength[arcLength.length - 1] || 1;
  const caT = (arcLength[closestApproachIndex] || 0) / totalArc;

  // Earliest near-Earth minimum after departure (HEO perigee).
  let perigeeIdx = 0;
  let perigeeR = Infinity;
  const earlyEnd = Math.min(orion.length, Math.floor(orion.length * 0.45));
  for (let i = 0; i < earlyEnd; i++) {
    const p = orion[i]!;
    const rr = Math.hypot(p[0], p[1], p[2]);
    if (rr < perigeeR) {
      perigeeR = rr;
      perigeeIdx = i;
    }
  }
  const perigeeT = (arcLength[perigeeIdx] || 0) / totalArc;

  const smoothPath = densifySpherical(orion, SMOOTH_SAMPLES, MIN_ORION_R);

  const oScratch = new Vector3();
  const mScratch = new Vector3();

  return {
    source: raw.source,
    closestApproachIndex,
    closestApproachKm: raw.closestApproachKm,
    pointCount: orion.length,
    totalArc,
    smoothPath,
    sampleOrion: (t, out = oScratch) =>
      samplePolyline(orion, arcLength, t, out, MIN_ORION_R),
    sampleMoon: (t, out = mScratch) => samplePolyline(moon, arcLength, t, out, 0),
    phaseAt: (t) => {
      const o = samplePolyline(orion, arcLength, t, oScratch, MIN_ORION_R);
      const m = samplePolyline(moon, arcLength, t, mScratch, 0);
      return phaseFromState(t, o.length(), o.distanceTo(m), caT, perigeeT);
    },
  };
}

export function loadArtemis2Trajectory(): Promise<Artemis2Trajectory> {
  if (!cached) {
    cached = fetch(TRAJ_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load Artemis II trajectory (${r.status})`);
        return r.json() as Promise<Artemis2TrajectoryFile>;
      })
      .then(buildTrajectory);
  }
  return cached;
}

/** Clear cached trajectory (tests / hot reload). */
export function clearArtemis2TrajectoryCache() {
  cached = null;
}
