import { Vector3 } from 'three';
import type { Coordinates } from '@/types';
import { latLngToVector3 } from './coordinateUtils';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function toRad(c: Coordinates): { lat: number; lng: number } {
  return { lat: c.lat * DEG2RAD, lng: c.lng * DEG2RAD };
}

/** Spherical linear interpolation between two surface coordinates. */
export function interpolateGreatCircle(
  a: Coordinates,
  b: Coordinates,
  segments: number,
): Coordinates[] {
  if (segments < 1) return [a, b];

  const p1 = toRad(a);
  const p2 = toRad(b);

  const ax = Math.cos(p1.lat) * Math.cos(p1.lng);
  const ay = Math.cos(p1.lat) * Math.sin(p1.lng);
  const az = Math.sin(p1.lat);

  const bx = Math.cos(p2.lat) * Math.cos(p2.lng);
  const by = Math.cos(p2.lat) * Math.sin(p2.lng);
  const bz = Math.sin(p2.lat);

  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
  const omega = Math.acos(dot);
  if (omega < 1e-8) return [a, b];

  const sinOmega = Math.sin(omega);
  const out: Coordinates[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    const x = s1 * ax + s2 * bx;
    const y = s1 * ay + s2 * by;
    const z = s1 * az + s2 * bz;
    const lat = Math.asin(Math.max(-1, Math.min(1, z))) * RAD2DEG;
    const lng = Math.atan2(y, x) * RAD2DEG;
    out.push({ lat, lng });
  }

  return out;
}

/** Densify a sparse path with great-circle segments between waypoints. */
export function densifyPath(path: Coordinates[], segmentsPerLeg = 4): Coordinates[] {
  if (path.length < 2) return path;

  const out: Coordinates[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const leg = interpolateGreatCircle(path[i - 1], path[i], segmentsPerLeg);
    out.push(...leg.slice(1));
  }
  return out;
}

/**
 * Convert a lat/lng path to scene vectors that hug the globe surface.
 * Uses the same mapping engine as pins and adaptively subdivides long legs
 * so straight line segments never tunnel through the sphere.
 */
export function pathToSurfaceVectors(
  path: Coordinates[],
  radius: number,
  maxStepDeg = 0.25,
): Vector3[] {
  if (path.length === 0) return [];
  if (path.length === 1) return [latLngToVector3(path[0], radius)];

  const maxStepRad = maxStepDeg * DEG2RAD;
  const out: Vector3[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const v0 = latLngToVector3(path[i], 1).normalize();
    const v1 = latLngToVector3(path[i + 1], 1).normalize();
    const dot = Math.max(-1, Math.min(1, v0.dot(v1)));
    const omega = Math.acos(dot);
    const segments = Math.max(1, Math.ceil(omega / maxStepRad));

    const start = i === 0 ? 0 : 1;
    for (let s = start; s <= segments; s++) {
      const t = s / segments;
      if (omega < 1e-8) {
        out.push(latLngToVector3(path[i], radius));
        continue;
      }
      const sinOmega = Math.sin(omega);
      const s1 = Math.sin((1 - t) * omega) / sinOmega;
      const s2 = Math.sin(t * omega) / sinOmega;
      out.push(
        v0
          .clone()
          .multiplyScalar(s1)
          .add(v1.clone().multiplyScalar(s2))
          .normalize()
          .multiplyScalar(radius),
      );
    }
  }

  return out;
}

/** Max angular span (deg) and chord tunnel depth for a vector path on a sphere. */
export function measurePathOnSphere(points: Vector3[], radius: number): {
  maxSegmentAngularDeg: number;
  maxChordTunnelDepth: number;
} {
  let maxAngularDeg = 0;
  let maxTunnel = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].clone().normalize();
    const b = points[i].clone().normalize();
    const dot = Math.max(-1, Math.min(1, a.dot(b)));
    maxAngularDeg = Math.max(maxAngularDeg, (Math.acos(dot) * 180) / Math.PI);

    const mid = points[i - 1].clone().add(points[i]).multiplyScalar(0.5);
    maxTunnel = Math.max(maxTunnel, Math.max(0, radius - mid.length()));
  }

  return { maxSegmentAngularDeg: maxAngularDeg, maxChordTunnelDepth: maxTunnel };
}

/** Uniform decimation to a maximum point count. */
export function simplifyPath(path: Coordinates[], maxPoints: number): Coordinates[] {
  if (path.length <= maxPoints) return path;
  const step = (path.length - 1) / (maxPoints - 1);
  const out: Coordinates[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(path[Math.round(i * step)]);
  }
  return out;
}

export interface PathBounds {
  centroid: Coordinates;
  maxSpanDeg: number;
}

/** Centroid and angular span for camera framing. */
export function computePathBounds(path: Coordinates[]): PathBounds | null {
  if (path.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  for (const p of path) {
    sumLat += p.lat;
    sumLng += p.lng;
  }

  const centroid = { lat: sumLat / path.length, lng: sumLng / path.length };
  let maxSpan = 0;

  for (const p of path) {
    const dLat = Math.abs(p.lat - centroid.lat);
    const dLng = Math.abs(p.lng - centroid.lng);
    maxSpan = Math.max(maxSpan, dLat, dLng);
  }

  return { centroid, maxSpanDeg: maxSpan * 2 || 1 };
}

/** Camera altitude multiplier from traverse span. */
export function traverseCameraAltitude(bounds: PathBounds): number {
  const span = bounds.maxSpanDeg;
  if (span > 30) return 3.2;
  if (span > 15) return 2.4;
  if (span > 5) return 1.8;
  return 1.45;
}
