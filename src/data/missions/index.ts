import type { Mission } from '@/types';
import { moonMissions } from './moon';
import { venusMissions } from './venus';

export const allMissions: Mission[] = [...moonMissions, ...venusMissions];

export const getMissionsByPlanet = (planetId: string): Mission[] =>
  allMissions.filter((m) => m.planetId === planetId);

export const getMissionById = (id: string): Mission | undefined =>
  allMissions.find((m) => m.id === id);

export { moonMissions, venusMissions };
