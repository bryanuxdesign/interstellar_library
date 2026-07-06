import type { Mission, Telemetry } from '@/types';
import { getMissionsByPlanet } from './missions';
import { getTimelineYear } from './timeline';

/**
 * Live-computed global telemetry for a body's surface footprint. Feeds the
 * mission-control counters on the Gateway and planet views.
 */
export const computeTelemetry = (planetId: string): Telemetry => {
  const missions = getMissionsByPlanet(planetId);

  const successfulLandings = missions.filter(
    (m: Mission) => m.status !== 'impact' && m.status !== 'planned',
  ).length;
  const activeAssets = missions.filter((m) => m.status === 'active').length;
  const impactSites = missions.filter((m) => m.status === 'impact').length;
  const totalMassKg = missions
    .filter((m) => m.status !== 'planned')
    .reduce((sum, m) => sum + m.massKg, 0);
  const agencies = new Set(missions.map((m) => m.agency)).size;

  const years = missions.map((m) => getTimelineYear(m.landingDate));

  return {
    successfulLandings,
    activeAssets,
    impactSites,
    totalMassKg,
    agencies,
    firstEventYear: years.length ? Math.min(...years) : 0,
    latestEventYear: years.length ? Math.max(...years) : 0,
  };
};
