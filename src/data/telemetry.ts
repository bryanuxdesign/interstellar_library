import type { Mission, Telemetry } from '@/types';
import { getMissionsByPlanet } from './missions';
import { getTimelineYear } from './timeline';

/**
 * Static footprint figures for bodies whose mission catalogue isn't wired up yet,
 * so the counters still show a real footprint instead of zeros.
 */
const TELEMETRY_OVERRIDES: Record<string, Telemetry> = {
  sun: {
    successfulLandings: 0,
    activeAssets: 5,
    impactSites: 0,
    totalMassKg: 0,
    agencies: 1,
    firstEventYear: 1610,
    latestEventYear: 2024,
  },
};

/**
 * Live-computed global telemetry for a body's surface footprint. Feeds the
 * mission-control counters on the Gateway and planet views.
 */
export const computeTelemetry = (planetId: string): Telemetry => {
  const missions = getMissionsByPlanet(planetId);

  if (missions.length === 0 && TELEMETRY_OVERRIDES[planetId]) {
    return TELEMETRY_OVERRIDES[planetId];
  }

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
