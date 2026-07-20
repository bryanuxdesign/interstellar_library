import { Vector3 } from 'three';

/** Live world-space positions of archive moons — written by PlanetMoons, read by CameraController. */
const positions = new Map<string, Vector3>();

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

export function clearMoonWorldPositions() {
  positions.clear();
}
