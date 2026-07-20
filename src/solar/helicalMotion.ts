import * as THREE from 'three';

/** Sun advances along +X; orbits lie in the YZ plane (legacy helical travel view). */
export function helicalPosition(
  time: number,
  orbitalRadius: number,
  orbitalSpeed: number,
  phase = 0,
  sunSpeed = 0.35,
): THREE.Vector3 {
  const sunX = time * sunSpeed;
  const angle = time * orbitalSpeed + phase;
  return new THREE.Vector3(
    sunX,
    Math.cos(angle) * orbitalRadius,
    Math.sin(angle) * orbitalRadius,
  );
}

export function sunPosition(time: number, sunSpeed = 0.35): THREE.Vector3 {
  return new THREE.Vector3(time * sunSpeed, 0, 0);
}

/** Sample a helix trail behind the current time. */
export function sampleHelixTrail(
  time: number,
  orbitalRadius: number,
  orbitalSpeed: number,
  phase: number,
  samples: number,
  duration: number,
  sunSpeed = 0.35,
): Float32Array {
  const arr = new Float32Array(samples * 3);
  for (let i = 0; i < samples; i++) {
    const t = time - (duration * i) / Math.max(1, samples - 1);
    const p = helicalPosition(Math.max(0, t), orbitalRadius, orbitalSpeed, phase, sunSpeed);
    arr[i * 3] = p.x;
    arr[i * 3 + 1] = p.y;
    arr[i * 3 + 2] = p.z;
  }
  return arr;
}

export function sampleSunTrail(
  time: number,
  samples: number,
  duration: number,
  sunSpeed = 0.35,
): Float32Array {
  const arr = new Float32Array(samples * 3);
  for (let i = 0; i < samples; i++) {
    const t = Math.max(0, time - (duration * i) / Math.max(1, samples - 1));
    arr[i * 3] = t * sunSpeed;
    arr[i * 3 + 1] = 0;
    arr[i * 3 + 2] = 0;
  }
  return arr;
}

/**
 * NASA Eyes–style planar orbit in the XZ ecliptic.
 * Optional inclination (radians) lifts the path gently out of the plane.
 * Writes into `out` to avoid per-frame Vector3 allocations.
 */
export function writeOrbitalPosition(
  out: THREE.Vector3,
  time: number,
  orbitalRadius: number,
  orbitalSpeed: number,
  phase = 0,
  inclination = 0,
): THREE.Vector3 {
  const angle = time * orbitalSpeed + phase;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);
  out.set(cosA * orbitalRadius, sinA * orbitalRadius * sinI, sinA * orbitalRadius * cosI);
  return out;
}

/**
 * Outbound probe on a fixed ecliptic ray (interstellar hyperbolic-ish path).
 * `dir` is an ecliptic direction (Y = north); falls back to a planar angle if omitted.
 */
export function writeOutboundPosition(
  out: THREE.Vector3,
  time: number,
  baseRadius: number,
  angularSpeed: number,
  phase: number,
  driftSpeed: number,
  dir?: [number, number, number] | null,
): THREE.Vector3 {
  const r = baseRadius + time * driftSpeed;
  if (dir) {
    const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    out.set((dir[0] / len) * r, (dir[1] / len) * r, (dir[2] / len) * r);
    return out;
  }
  const angle = time * angularSpeed + phase;
  out.set(Math.cos(angle) * r, 0.02, Math.sin(angle) * r);
  return out;
}

/**
 * Thin outbound trajectory from near Sol (or a flyby radius) through the probe
 * and a short distance beyond — stylized, not a full ephemeris.
 */
export function fillOutboundTrajectory(
  out: Float32Array,
  dir: [number, number, number],
  startRadius: number,
  endRadius: number,
  segments: number,
): void {
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const ux = dir[0] / len;
  const uy = dir[1] / len;
  const uz = dir[2] / len;
  const n = Math.max(2, segments);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = startRadius + (endRadius - startRadius) * t;
    out[i * 3] = ux * r;
    out[i * 3 + 1] = uy * r;
    out[i * 3 + 2] = uz * r;
  }
}

/** Static circular orbit ring in the XZ plane (optionally inclined). */
export function fillOrbitRing(
  out: Float32Array,
  radius: number,
  segments: number,
  inclination = 0,
): void {
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    out[i * 3] = cosA * radius;
    out[i * 3 + 1] = sinA * radius * sinI;
    out[i * 3 + 2] = sinA * radius * cosI;
  }
}

