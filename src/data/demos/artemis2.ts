/**
 * Artemis II — stylized free-return lunar flyby demo (historical archive animation).
 *
 * Timeline is mission-progress based (not uniform arc-length), so phase labels
 * stay aligned with the craft’s geometry. Scene scale matches the Earth archive’s
 * compressed Luna SMA (~28 R⊕).
 *
 * Real mission (~9–10 day free return): LEO → orbit raises → HEO checkout →
 * Orion/ICPS sep → TLI → outbound → lunar far-side flyby → return → CM/SM sep → splashdown.
 */
import { Vector3 } from 'three';
import { GLOBE_RADIUS } from '@/three/constants';
import { latLngToVector3 } from '@/three/coordinateUtils';

/** Must match PlanetMoons VISUAL_LUNA_EARTH_RADII. */
export const ARTEMIS2_LUNA_EARTH_RADII = 28;

/** Wall-clock duration options (seconds) for compressing ~10 mission days. */
export type Artemis2TimelineSpeed = '2min' | '2hour';

export const ARTEMIS2_WALL_CLOCK_SEC: Record<Artemis2TimelineSpeed, number> = {
  '2min': 120,
  '2hour': 7200,
};

/** Approximate real mission duration (for UI scale copy). */
export const ARTEMIS2_MISSION_DAYS = 10;

export type Artemis2CameraMode = 'capsule' | 'earth' | 'moon';

export type Artemis2PhaseId =
  | 'launch'
  | 'leo'
  | 'perigee_raise'
  | 'apogee_raise'
  | 'heo'
  | 'icps_sep'
  | 'tli'
  | 'coast_out'
  | 'lunar_flyby'
  | 'coast_home'
  | 'cm_sm_sep'
  | 'reentry';

export interface Artemis2Phase {
  id: Artemis2PhaseId;
  label: string;
  /** Fraction of total duration [0, 1] when this phase ends. */
  end: number;
}

/**
 * Phase ends are weighted for a readable demo (Earth checkout stretched;
 * multi-day coasts still dominate).
 */
export const ARTEMIS2_PHASES: Artemis2Phase[] = [
  { id: 'launch', label: 'Liftoff · Kennedy Space Center', end: 0.04 },
  { id: 'leo', label: 'LEO checkout · 185 × 2,253 km', end: 0.1 },
  { id: 'perigee_raise', label: 'Perigee raise burn', end: 0.14 },
  { id: 'apogee_raise', label: 'Apogee raise · HEO insertion', end: 0.2 },
  { id: 'heo', label: 'HEO checkout · ~23.5 h orbit', end: 0.3 },
  { id: 'icps_sep', label: 'Orion / ICPS separation', end: 0.34 },
  { id: 'tli', label: 'Trans-lunar injection', end: 0.38 },
  { id: 'coast_out', label: 'Coast to the Moon', end: 0.55 },
  { id: 'lunar_flyby', label: 'Lunar far-side flyby · ~6,500 km', end: 0.62 },
  { id: 'coast_home', label: 'Return coast', end: 0.85 },
  { id: 'cm_sm_sep', label: 'Crew module / service module sep', end: 0.9 },
  { id: 'reentry', label: 'Re-entry · Pacific splashdown', end: 1 },
];

export function phaseAtProgress(t: number): Artemis2Phase {
  const clamped = Math.min(1, Math.max(0, t));
  for (const phase of ARTEMIS2_PHASES) {
    if (clamped <= phase.end) return phase;
  }
  return ARTEMIS2_PHASES[ARTEMIS2_PHASES.length - 1]!;
}

export function phaseStart(phase: Artemis2Phase): number {
  const idx = ARTEMIS2_PHASES.indexOf(phase);
  if (idx <= 0) return 0;
  return ARTEMIS2_PHASES[idx - 1]!.end;
}

export function phaseLocalT(t: number, phase = phaseAtProgress(t)): number {
  const start = phaseStart(phase);
  const span = Math.max(1e-6, phase.end - start);
  return Math.min(1, Math.max(0, (Math.min(1, Math.max(0, t)) - start) / span));
}

/** True once CM/SM separation begins (service module drifts away). */
export function smSeparatedAt(t: number): boolean {
  // NASA Horizons path is progress-normalized; sep is late in the return.
  return t >= 0.88;
}

/** Kennedy Space Center LC-39B (approx). */
const KSC = { lat: 28.6, lng: -80.6 };
/** Pacific splashdown zone (stylized). */
const SPLASHDOWN = { lat: 22, lng: -155 };

/** Visual LEO altitude above globe surface. */
const LEO_ALT = GLOBE_RADIUS * 0.12;
const LEO_RADIUS = GLOBE_RADIUS + LEO_ALT;
/** Raised perigee still near LEO; apogee toward HEO. */
const HEO_PERIGEE = LEO_RADIUS;
const HEO_APOGEE = GLOBE_RADIUS * 6.5; // stylized HEO (~74,000 km class, compressed)

function surfacePoint(lat: number, lng: number, radius = GLOBE_RADIUS): Vector3 {
  return latLngToVector3({ lat, lng }, radius);
}

function orbitPoint(angleRad: number, radius: number, inclination = 0.49): Vector3 {
  const x = radius * Math.cos(angleRad);
  const z = radius * Math.sin(angleRad);
  const y = z * Math.sin(inclination) * 0.35;
  return new Vector3(x, y, z * Math.cos(inclination));
}

function ellipticalOrbitPoint(
  angleRad: number,
  perigee: number,
  apogee: number,
  inclination = 0.49,
): Vector3 {
  // Simple polar ellipse: r = ab / sqrt((b cos θ)² + (a sin θ)²) with a=apogee, b=perigee at θ=0 peri.
  const a = apogee;
  const b = perigee;
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const r = (a * b) / Math.sqrt((b * c) ** 2 + (a * s) ** 2);
  return orbitPoint(angleRad, r, inclination);
}

function easeInOut(u: number): number {
  return u * u * (3 - 2 * u);
}

export interface Artemis2PathContext {
  luna: Vector3;
  lunaDir: Vector3;
  lunaDist: number;
  flybyRadius: number;
  peri: Vector3;
  out: Vector3;
  pad: Vector3;
  injectAngle: number;
  splash: Vector3;
}

export function buildPathContext(lunaWorld?: Vector3 | null): Artemis2PathContext {
  const luna =
    lunaWorld && lunaWorld.length() > 1
      ? lunaWorld.clone()
      : new Vector3(GLOBE_RADIUS * ARTEMIS2_LUNA_EARTH_RADII, 0, 0);

  const lunaDir = luna.clone().normalize();
  const lunaDist = luna.length();
  // ~6500 km flyby ≈ 1 R⊕; compressed Luna is at 28 R⊕ so keep a readable visual gap.
  const flybyRadius = Math.max(lunaDist * 0.18, GLOBE_RADIUS * 3.2);

  const up = new Vector3(0, 1, 0);
  const peri = new Vector3().crossVectors(lunaDir, up);
  if (peri.lengthSq() < 1e-6) peri.set(0, 0, 1);
  peri.normalize();
  const out = new Vector3().crossVectors(peri, lunaDir).normalize();

  const pad = surfacePoint(KSC.lat, KSC.lng, GLOBE_RADIUS * 1.01);
  const injectAngle = Math.atan2(pad.z, pad.x);
  const splash = surfacePoint(SPLASHDOWN.lat, SPLASHDOWN.lng, GLOBE_RADIUS * 1.02);

  return { luna, lunaDir, lunaDist, flybyRadius, peri, out, pad, injectAngle, splash };
}

/**
 * Sample craft position from mission progress t ∈ [0, 1].
 * Geometry is phase-keyed so labels match altitude / destination.
 */
export function sampleArtemis2At(
  t: number,
  ctx: Artemis2PathContext,
  out = new Vector3(),
): Vector3 {
  const phase = phaseAtProgress(t);
  const u = phaseLocalT(t, phase);
  const { luna, lunaDir, lunaDist, flybyRadius, peri, out: outAxis, injectAngle, splash } =
    ctx;

  switch (phase.id) {
    case 'launch': {
      const r = GLOBE_RADIUS * 1.01 + (LEO_RADIUS - GLOBE_RADIUS * 1.01) * easeInOut(u);
      const ang = injectAngle + u * 0.35;
      return out.copy(orbitPoint(ang, r));
    }
    case 'leo': {
      // ~1.5 revs in initial LEO
      const ang = injectAngle + 0.35 + u * Math.PI * 3;
      return out.copy(orbitPoint(ang, LEO_RADIUS));
    }
    case 'perigee_raise': {
      // Slight radius bump while completing a partial rev
      const r = LEO_RADIUS + (HEO_PERIGEE * 1.02 - LEO_RADIUS) * u;
      const ang = injectAngle + 0.35 + Math.PI * 3 + u * Math.PI * 0.8;
      return out.copy(orbitPoint(ang, r));
    }
    case 'apogee_raise': {
      // Grow ellipse toward HEO
      const apogee = LEO_RADIUS + (HEO_APOGEE - LEO_RADIUS) * easeInOut(u);
      const ang = injectAngle + 0.35 + Math.PI * 3.8 + u * Math.PI * 1.2;
      return out.copy(ellipticalOrbitPoint(ang, HEO_PERIGEE, apogee));
    }
    case 'heo':
    case 'icps_sep': {
      // One HEO revolution; ICPS sep stays on the same track
      const base = phase.id === 'heo' ? u : 1;
      const extra = phase.id === 'icps_sep' ? u * 0.25 : 0;
      const ang =
        injectAngle + 0.35 + Math.PI * 5 + (base + extra) * Math.PI * 2;
      return out.copy(ellipticalOrbitPoint(ang, HEO_PERIGEE, HEO_APOGEE));
    }
    case 'tli': {
      const start = ellipticalOrbitPoint(
        injectAngle + 0.35 + Math.PI * 7.25,
        HEO_PERIGEE,
        HEO_APOGEE,
      );
      const midOut = lunaDir
        .clone()
        .multiplyScalar(lunaDist * 0.28)
        .add(outAxis.clone().multiplyScalar(lunaDist * 0.06));
      return out.lerpVectors(start, midOut, easeInOut(u));
    }
    case 'coast_out': {
      const midOut = lunaDir
        .clone()
        .multiplyScalar(lunaDist * 0.28)
        .add(outAxis.clone().multiplyScalar(lunaDist * 0.06));
      const approach = luna
        .clone()
        .add(lunaDir.clone().multiplyScalar(-flybyRadius * 1.35))
        .add(peri.clone().multiplyScalar(flybyRadius * 0.12));
      return out.lerpVectors(midOut, approach, easeInOut(u));
    }
    case 'lunar_flyby': {
      const ang = -0.55 + u * (Math.PI + 1.1);
      const radial = lunaDir
        .clone()
        .multiplyScalar(-Math.cos(ang))
        .add(peri.clone().multiplyScalar(Math.sin(ang)));
      return out.copy(luna).add(radial.multiplyScalar(flybyRadius));
    }
    case 'coast_home': {
      const leaveAng = -0.55 + Math.PI + 1.1;
      const leaveRadial = lunaDir
        .clone()
        .multiplyScalar(-Math.cos(leaveAng))
        .add(peri.clone().multiplyScalar(Math.sin(leaveAng)));
      const leaveMoon = luna.clone().add(leaveRadial.multiplyScalar(flybyRadius));
      const entryHigh = splash.clone().normalize().multiplyScalar(LEO_RADIUS * 1.5);
      return out.lerpVectors(leaveMoon, entryHigh, easeInOut(u));
    }
    case 'cm_sm_sep': {
      const entryHigh = splash.clone().normalize().multiplyScalar(LEO_RADIUS * 1.5);
      const corridor = splash.clone().normalize().multiplyScalar(LEO_RADIUS * 1.15);
      return out.lerpVectors(entryHigh, corridor, easeInOut(u));
    }
    case 'reentry': {
      const corridor = splash.clone().normalize().multiplyScalar(LEO_RADIUS * 1.15);
      return out.lerpVectors(corridor, splash, easeInOut(u));
    }
    default:
      return out.copy(splash);
  }
}

/** Dense polyline for the glowing trail (phase-aligned samples). */
export function buildArtemis2Path(lunaWorld?: Vector3 | null, samples = 320): Vector3[] {
  const ctx = buildPathContext(lunaWorld);
  const points: Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    points.push(sampleArtemis2At(i / samples, ctx));
  }
  return points;
}

/** How much of the trail to show behind the craft. */
export function trailPointCount(points: Vector3[], t: number): number {
  if (points.length < 2) return points.length;
  return Math.max(2, Math.floor(1 + t * (points.length - 1)));
}

/** Suggested camera mode default for a phase (user can override anytime). */
export function defaultCameraModeForPhase(phaseId: Artemis2PhaseId): Artemis2CameraMode {
  switch (phaseId) {
    case 'launch':
    case 'leo':
    case 'perigee_raise':
    case 'apogee_raise':
    case 'heo':
    case 'icps_sep':
    case 'tli':
    case 'cm_sm_sep':
    case 'reentry':
      return 'earth';
    case 'lunar_flyby':
      return 'moon';
    case 'coast_out':
    case 'coast_home':
      return 'capsule';
    default:
      return 'capsule';
  }
}
