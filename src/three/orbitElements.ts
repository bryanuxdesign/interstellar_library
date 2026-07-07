import type { OrbitalElements } from '@/types';

/** Periapsis radius (km) from semi-major axis and eccentricity. */
export function periapsisRadiusKm(a: number, e: number): number {
  return a * (1 - e);
}

/** Apoapsis radius (km) from semi-major axis and eccentricity. */
export function apoapsisRadiusKm(a: number, e: number): number {
  return a * (1 + e);
}

/** Build valid Keplerian elements from periapsis / apoapsis radii (km). */
export function elementsFromPeriApo(
  periRadiusKm: number,
  apoRadiusKm: number,
  partial: Omit<OrbitalElements, 'a' | 'e'>,
): OrbitalElements {
  const a = (periRadiusKm + apoRadiusKm) / 2;
  const e = (apoRadiusKm - periRadiusKm) / (apoRadiusKm + periRadiusKm);
  return { ...partial, a, e };
}
