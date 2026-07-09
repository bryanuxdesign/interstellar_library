import type { Coordinates, RoverTraverseRecord } from '@/types';

const ROVER_MISSION_IDS = [
  'perseverance',
  'curiosity',
  'spirit',
  'opportunity',
  'mars-pathfinder',
  'zhurong',
] as const;

export type RoverMissionId = (typeof ROVER_MISSION_IDS)[number];

const cache = new Map<string, RoverTraverseRecord | null>();

export function isRoverMission(missionId: string): boolean {
  return (ROVER_MISSION_IDS as readonly string[]).includes(missionId);
}

export function isRoverClassification(classification: string): boolean {
  return classification.toLowerCase().includes('rover');
}

/** Load traverse bundle for a Mars rover mission (cached). */
export async function loadRoverTraverse(
  missionId: string,
): Promise<RoverTraverseRecord | null> {
  if (!isRoverMission(missionId)) return null;
  if (cache.has(missionId)) return cache.get(missionId) ?? null;

  try {
    const res = await fetch(`/data/traverses/${missionId}.json`);
    if (!res.ok) {
      cache.set(missionId, null);
      return null;
    }
    const data = (await res.json()) as RoverTraverseRecord;
    cache.set(missionId, data);
    return data;
  } catch {
    cache.set(missionId, null);
    return null;
  }
}

/** Pin position for a rover based on selection and status. */
export function roverPinCoordinates(
  mission: { status: string; coordinates: Coordinates },
  traverse: RoverTraverseRecord | null | undefined,
  isSelected: boolean,
): Coordinates {
  if (!traverse) return mission.coordinates;
  if (mission.status === 'active') return traverse.lastKnown;
  if (isSelected) return traverse.lastKnown;
  return mission.coordinates;
}

export function dataSourceLabel(source: RoverTraverseRecord['dataSource']): string {
  switch (source) {
    case 'nasa-mmgis':
      return 'NASA MMGIS';
    case 'pds-mer':
      return 'PDS Geosciences Node';
    default:
      return 'Published mission data';
  }
}
