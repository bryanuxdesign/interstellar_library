import type { Mission, TimelineEvent } from '@/types';
import { getMissionsByPlanet } from './missions';

/**
 * Derives a chronologically ordered set of timeline events from the mission
 * catalogue for a given body. Each event marks the moment a mission reached
 * the surface (soft landing or impact).
 */
export const buildTimeline = (planetId: string): TimelineEvent[] =>
  getMissionsByPlanet(planetId)
    .map((mission: Mission) => ({
      id: `${mission.id}-arrival`,
      missionId: mission.id,
      date: mission.landingDate,
      label: mission.name,
      status: mission.status,
      coordinates: mission.coordinates,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

export const getTimelineYear = (isoDate: string): number =>
  new Date(isoDate).getUTCFullYear();
