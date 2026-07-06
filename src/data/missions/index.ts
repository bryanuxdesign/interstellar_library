import type { Mission } from '@/types';
import { moonMissions } from './moon';

export const allMissions: Mission[] = [...moonMissions];

export const getMissionsByPlanet = (planetId: string): Mission[] =>
  allMissions.filter((m) => m.planetId === planetId);

export const getMissionById = (id: string): Mission | undefined =>
  allMissions.find((m) => m.id === id);

export { moonMissions };
