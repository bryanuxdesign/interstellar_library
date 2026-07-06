import { Vector3 } from 'three';
import type { Coordinates, Mission } from '@/types';

const DEG2RAD = Math.PI / 180;

/**
 * The Celestial Mapping Engine.
 *
 * Translates selenographic / planetographic latitude and longitude into a
 * precise 3D position on a sphere of the given radius. This is the single
 * source of truth for placing surface hardware and for aiming the camera.
 */
export function latLngToVector3(
  { lat, lng }: Coordinates,
  radius: number,
  target = new Vector3(),
): Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lng + 180) * DEG2RAD;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return target.set(x, y, z);
}

/**
 * Outward surface normal at a coordinate — used to orient pins so they stand
 * up from the regolith rather than lying flat against it.
 */
export function surfaceNormal(coords: Coordinates, target = new Vector3()): Vector3 {
  return latLngToVector3(coords, 1, target).normalize();
}

/**
 * Centroid of near-side landing sites — where the densest cluster of hardware
 * sits (Apollo, Surveyor, Chang'e near-side, etc.). Excludes far-side outliers.
 */
export function computeNearSideCluster(missions: Mission[]): Coordinates {
  const landed = missions.filter((m) => m.status !== 'planned');
  const pool = landed.length > 0 ? landed : missions;
  const nearSide = pool.filter((m) => Math.abs(m.coordinates.lng) <= 90);
  const set = nearSide.length >= 3 ? nearSide : pool;
  const lat = set.reduce((s, m) => s + m.coordinates.lat, 0) / set.length;
  const lng = set.reduce((s, m) => s + m.coordinates.lng, 0) / set.length;
  return { lat, lng };
}
