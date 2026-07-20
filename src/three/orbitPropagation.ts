import type { OrbitalAsset, OrbitalElements, OrbitalState } from '@/types';
import { cartesianToLatLng, positionKmToSceneVector3 } from './coordinateUtils';
import { getPlanet } from '@/data/planets';
import { getOrbitersByPlanet } from '@/data/orbiters';
import { moonsForPlanet } from '@/data/planetMoons';
import { apoapsisRadiusKm } from './orbitElements';
import {
  CAMERA_ORBIT_MARGIN,
  GLOBE_RADIUS,
  MIN_ORBIT_ALTITUDE_KM,
  PLANET_ROTATION_OFFSET,
} from './constants';

const DEG2RAD = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

export { apoapsisRadiusKm, elementsFromPeriApo, periapsisRadiusKm } from './orbitElements';

/** Clamp a body-centred position so it never renders inside the surface. */
export function clampOrbitRadiusKm(
  pos: { x: number; y: number; z: number },
  planetRadiusKm: number,
): { x: number; y: number; z: number } {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const minR = planetRadiusKm + MIN_ORBIT_ALTITUDE_KM;
  if (r >= minR) return pos;
  const scale = minR / (r || 1);
  return { x: pos.x * scale, y: pos.y * scale, z: pos.z * scale };
}

/** Furthest camera distance (scene units) needed to frame all orbiters for a body. */
export function maxCameraDistanceForPlanet(planetId: string): number {
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  const orbiters = getOrbitersByPlanet(planetId);
  let maxApoKm = planetRadiusKm * 4;

  for (const o of orbiters) {
    const apo = apoapsisRadiusKm(o.elements.a, o.elements.e);
    maxApoKm = Math.max(maxApoKm, apo);
  }

  for (const moon of moonsForPlanet(planetId)) {
    maxApoKm = Math.max(maxApoKm, Math.abs(moon.semiMajorKm));
  }

  const maxSceneRadius = GLOBE_RADIUS * (maxApoKm / planetRadiusKm);
  return maxSceneRadius * CAMERA_ORBIT_MARGIN;
}

/** Solve Kepler's equation M = E - e·sin(E) via Newton-Raphson. */
function solveKepler(meanAnomalyRad: number, e: number): number {
  let E = meanAnomalyRad;
  for (let i = 0; i < 12; i++) {
    const f = E - e * Math.sin(E) - meanAnomalyRad;
    const fp = 1 - e * Math.cos(E);
    E -= f / fp;
  }
  return E;
}

function deg(v: number): number {
  return v * DEG2RAD;
}

/** Resample a polyline at uniform arc-length spacing (for smooth high-eccentricity rings). */
function resampleByArcLength(
  points: { x: number; y: number; z: number }[],
  targetCount: number,
): { x: number; y: number; z: number }[] {
  if (points.length < 2 || targetCount < 2) return points;

  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const q = points[i - 1];
    cumulative.push(
      cumulative[i - 1] + Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z),
    );
  }

  const total = cumulative[cumulative.length - 1];
  if (total === 0) return points;

  const out: { x: number; y: number; z: number }[] = [];
  let segment = 0;
  for (let s = 0; s < targetCount; s++) {
    const target = (s / targetCount) * total;
    while (segment < cumulative.length - 2 && cumulative[segment + 1] < target) {
      segment++;
    }
    const span = cumulative[segment + 1] - cumulative[segment];
    const t = span > 0 ? (target - cumulative[segment]) / span : 0;
    const a = points[segment];
    const b = points[segment + 1];
    out.push({
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y),
      z: a.z + t * (b.z - a.z),
    });
  }
  return out;
}

/** Rotate orbital-plane coordinates (perifocal) into body-centred equatorial frame. */
function orbitalPlaneToInertial(
  xP: number,
  yP: number,
  elements: OrbitalElements,
): { x: number; y: number; z: number } {
  const i = deg(elements.i);
  const raan = deg(elements.raan);
  const argP = deg(elements.argPeriapsis);

  const cosO = Math.cos(raan);
  const sinO = Math.sin(raan);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(argP);
  const sinW = Math.sin(argP);

  const x =
    (cosO * cosW - sinO * sinW * cosI) * xP +
    (-cosO * sinW - sinO * cosW * cosI) * yP;
  const y = sinW * sinI * xP + cosW * sinI * yP;
  const z =
    (sinO * cosW + cosO * sinW * cosI) * xP +
    (-sinO * sinW + cosO * cosW * cosI) * yP;

  return { x, y, z };
}

/** Position on the conic at true anomaly ν (radians) — used for smooth orbit visuals. */
export function positionFromTrueAnomalyKm(
  elements: OrbitalElements,
  nuRad: number,
): { x: number; y: number; z: number } {
  const { a, e } = elements;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nuRad));
  const xP = r * Math.cos(nuRad);
  const yP = r * Math.sin(nuRad);
  return orbitalPlaneToInertial(xP, yP, elements);
}

/**
 * Propagate osculating Keplerian elements to a Cartesian position in the
 * body's equatorial frame (km). +Y = north pole, prime meridian in X–Z plane.
 */
export function propagateToCartesianKm(
  elements: OrbitalElements,
  mu: number,
  at: Date,
): { x: number; y: number; z: number } {
  const epochMs = Date.parse(elements.epoch);
  const dtSec = (at.getTime() - epochMs) / 1000;

  const a = elements.a;
  const e = elements.e;
  const n = Math.sqrt(mu / (a * a * a)); // rad/s

  const M0 = deg(elements.meanAnomalyAtEpoch);
  let M = M0 + n * dtSec;
  M = ((M % TWO_PI) + TWO_PI) % TWO_PI;

  const E = solveKepler(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);

  const xOrb = a * (cosE - e);
  const yOrb = a * Math.sqrt(Math.max(0, 1 - e * e)) * sinE;

  const nu = Math.atan2(yOrb, xOrb);

  const cosNu = Math.cos(nu);
  const sinNu = Math.sin(nu);
  const rActual = (a * (1 - e * e)) / (1 + e * cosNu);

  return orbitalPlaneToInertial(rActual * cosNu, rActual * sinNu, elements);
}

/** Orbital period in minutes from semi-major axis and μ. */
export function orbitalPeriodMinutes(a: number, mu: number): number {
  const periodSec = TWO_PI * Math.sqrt((a * a * a) / mu);
  return periodSec / 60;
}
export function propagateOrbiter(
  orbiter: OrbitalAsset,
  at: Date = new Date(),
): OrbitalState {
  const planetRadiusKm = getPlanet(orbiter.planetId)?.radiusKm ?? 1737.4;
  const raw = propagateToCartesianKm(orbiter.elements, orbiter.mu, at);
  const positionKm = clampOrbitRadiusKm(raw, planetRadiusKm);
  const offset = PLANET_ROTATION_OFFSET[orbiter.planetId] ?? 0;
  const { lat, lng, altKm } = cartesianToLatLng(positionKm, planetRadiusKm, offset);

  return {
    positionKm,
    lat,
    lng,
    altKm,
    periodMinutes: orbitalPeriodMinutes(orbiter.elements.a, orbiter.mu),
  };
}

/** Sample one full orbit path for plane / trail rendering (scene units). */
export function sampleOrbitPath(
  orbiter: OrbitalAsset,
  segments = 128,
): { x: number; y: number; z: number }[] {
  const { elements, planetId } = orbiter;
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  const offset = PLANET_ROTATION_OFFSET[planetId] ?? 0;
  const highEccentricity = elements.e > 0.6;
  const denseCount = highEccentricity ? 1024 : segments;
  const outputCount = highEccentricity ? 1024 : segments;
  const kmPoints: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i <= denseCount; i++) {
    const nu = (i / denseCount) * TWO_PI;
    const raw = positionFromTrueAnomalyKm(elements, nu);
    kmPoints.push(clampOrbitRadiusKm(raw, planetRadiusKm));
  }

  const kmResampled = highEccentricity
    ? resampleByArcLength(kmPoints, outputCount)
    : kmPoints;

  const points = kmResampled.map((posKm) =>
    positionKmToSceneVector3(posKm, planetRadiusKm, offset),
  );

  if (points.length > 1) {
    points.push(points[0]);
  }

  return points;
}
