import { Quaternion, Vector3 } from 'three';
import { findPlanetMoon } from '@/data/planetMoons';
import { getPlanet } from '@/data/planets';
import { GLOBE_RADIUS } from './constants';

/** Live world-space poses of archive moons — written by PlanetMoons, read by CameraController. */
const positions = new Map<string, Vector3>();
const orientations = new Map<string, Quaternion>();

/** When set, PlanetMoons drives Luna from Artemis II NASA ephemeris instead of wall-clock. */
let artemisLunaOverride: Vector3 | null = null;

export function setArtemisLunaOverride(world: Vector3 | null) {
  if (!world) {
    artemisLunaOverride = null;
    return;
  }
  if (!artemisLunaOverride) artemisLunaOverride = new Vector3();
  artemisLunaOverride.copy(world);
}

export function getArtemisLunaOverride(): Vector3 | null {
  return artemisLunaOverride;
}

const MOON_MIN_RADIUS = 0.055;
const MOON_MAX_RADIUS = 0.28;
const SIZE_EXAGGERATION = 10;

export function setMoonWorldPose(id: string, world: Vector3, quat: Quaternion) {
  let storedPos = positions.get(id);
  if (!storedPos) {
    storedPos = new Vector3();
    positions.set(id, storedPos);
  }
  storedPos.copy(world);

  let storedQuat = orientations.get(id);
  if (!storedQuat) {
    storedQuat = new Quaternion();
    orientations.set(id, storedQuat);
  }
  storedQuat.copy(quat);
}

/** @deprecated Prefer setMoonWorldPose — kept for any leftover callers. */
export function setMoonWorldPosition(id: string, world: Vector3) {
  let stored = positions.get(id);
  if (!stored) {
    stored = new Vector3();
    positions.set(id, stored);
  }
  stored.copy(world);
}

export function getMoonWorldPosition(id: string): Vector3 | undefined {
  return positions.get(id);
}

export function getMoonWorldQuaternion(id: string): Quaternion | undefined {
  return orientations.get(id);
}

export function clearMoonWorldPositions() {
  positions.clear();
  orientations.clear();
}

/** Visual mesh radius in scene units (shared by camera framing + PlanetMoons). */
export function moonVisualRadiusFor(moonId: string, planetId: string): number {
  const def = findPlanetMoon(moonId);
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  if (!def) return GLOBE_RADIUS * 0.2;
  const trueRadius = GLOBE_RADIUS * (def.meanRadiusKm / planetRadiusKm);
  return Math.min(
    MOON_MAX_RADIUS,
    Math.max(MOON_MIN_RADIUS, trueRadius * SIZE_EXAGGERATION),
  );
}

/** Scene distance from moon centre for a comfortable close-up. */
export function moonFocusDistance(moonId: string, planetId: string): number {
  const r = moonVisualRadiusFor(moonId, planetId);
  return Math.max(0.7, r * 4.2);
}
