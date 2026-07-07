import type { OrbitalAsset } from '@/types';
import { moonOrbiters } from './moon';
import { marsOrbiters } from './mars';
import { venusOrbiters } from './venus';

export const allOrbiters: OrbitalAsset[] = [
  ...moonOrbiters,
  ...marsOrbiters,
  ...venusOrbiters,
];

export const getOrbitersByPlanet = (planetId: string): OrbitalAsset[] =>
  allOrbiters.filter((o) => o.planetId === planetId && o.status === 'active');

export const getOrbiterById = (id: string): OrbitalAsset | undefined =>
  allOrbiters.find((o) => o.id === id);

export { moonOrbiters, marsOrbiters, venusOrbiters };
