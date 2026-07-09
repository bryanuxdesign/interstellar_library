import type { OrbitalAsset, OrbitalState } from '@/types';
import { getPlanet } from '@/data/planets';
import { apoapsisRadiusKm, periapsisRadiusKm } from '@/three/orbitElements';

/** Moderate zoom when closing mobile dossier — keeps orbiter in frame. */
export function orbiterPeekAltitude(state: OrbitalState, planetRadiusKm: number): number {
  return Math.max(2.0, (state.altKm / planetRadiusKm) * 1.2 + 1.8);
}

export function orbiterCameraCoords(state: OrbitalState) {
  return { lat: state.lat, lng: state.lng };
}

export function formatOrbitalElements(orbiter: OrbitalAsset, planetRadiusKm: number) {
  const { elements } = orbiter;
  const peri = periapsisRadiusKm(elements.a, elements.e) - planetRadiusKm;
  const apo = apoapsisRadiusKm(elements.a, elements.e) - planetRadiusKm;
  return {
    semiMajorAxis: `${elements.a.toFixed(0)} km`,
    eccentricity: elements.e.toFixed(3),
    inclination: `${elements.i.toFixed(1)}°`,
    periapsisAlt: `${Math.round(peri)} km`,
    apoapsisAlt: `${Math.round(apo)} km`,
    epoch: elements.epoch.slice(0, 10),
  };
}

export function orbiterAltitudeMultiplier(
  state: OrbitalState,
  planetId: string,
): number {
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  return Math.max(2.4, (state.altKm / planetRadiusKm) * 1.2 + 1.5);
}
