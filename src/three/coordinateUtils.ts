import { Vector3 } from 'three';
import type { Coordinates, Mission } from '@/types';
import { GLOBE_RADIUS } from './constants';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

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
 * Inverse of latLngToVector3 for a position on or above the reference sphere.
 * Input is body-centred Cartesian km; output lat/lng matches the mapping engine.
 */
export function cartesianToLatLng(
  { x, y, z }: { x: number; y: number; z: number },
  planetRadiusKm: number,
  rotationOffsetDeg = 0,
): Coordinates & { altKm: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = Math.acos(Math.max(-1, Math.min(1, y / r)));
  const lat = 90 - phi * RAD2DEG;
  const theta = Math.atan2(z, -x);
  let lng = theta * RAD2DEG - 180 - rotationOffsetDeg;
  lng = ((lng + 180) % 360) - 180;
  const altKm = Math.max(0, r - planetRadiusKm);
  return { lat, lng, altKm };
}

/** Convert body-centred km position to scene units at the correct altitude. */
export function positionKmToSceneVector3(
  { x, y, z }: { x: number; y: number; z: number },
  planetRadiusKm: number,
  rotationOffsetDeg = 0,
  target = new Vector3(),
): Vector3 {
  const rKm = Math.sqrt(x * x + y * y + z * z);
  const { lat, lng } = cartesianToLatLng({ x, y, z }, planetRadiusKm, rotationOffsetDeg);
  const sceneRadius = GLOBE_RADIUS * (rKm / planetRadiusKm);
  return latLngToVector3({ lat, lng }, sceneRadius, target);
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
