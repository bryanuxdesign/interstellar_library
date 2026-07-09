import type { Mission } from '@/types';
import type { RoverTraverseRecord } from '@/types';
import { FLYBY_CAMERA_ALTITUDE, GLOBE_RADIUS } from '@/three/constants';
import { isFlybyMission } from '@/components/pins/FlybyTrack';
import { isRoverClassification } from '@/data/roverTraverses';
import { computePathBounds, traverseCameraAltitude } from '@/three/surfacePath';

const PLANET_FOV_DEG = 45;

/**
 * Camera altitude multiplier so the full globe fits with ~20% padding on each side.
 * `altitude` maps to camera distance = GLOBE_RADIUS * (1 + altitude).
 */
export function planetOverviewAltitude(viewportAspect = 1): number {
  const halfFov = (PLANET_FOV_DEG * Math.PI) / 360;
  const sinHalf = Math.sin(halfFov);
  const distVertical = GLOBE_RADIUS / sinHalf;
  const distHorizontal = GLOBE_RADIUS / (sinHalf * Math.max(viewportAspect, 0.4));
  const fitDist = Math.max(distVertical, distHorizontal);
  const paddedDist = fitDist / 0.6;
  return paddedDist / GLOBE_RADIUS - 1;
}

/** Moderate zoom when closing mobile dossier — keeps asset in frame on full globe. */
export const missionPeekAltitude = (mission: Mission): number =>
  isFlybyMission(mission) ? FLYBY_CAMERA_ALTITUDE : 2.1;

/** Camera altitude multiplier for flying to a mission on the globe. */
export const missionCameraAltitude = (
  mission: Mission,
  traverse?: RoverTraverseRecord | null,
): number => {
  if (isFlybyMission(mission)) return FLYBY_CAMERA_ALTITUDE;
  if (traverse && isRoverClassification(mission.classification)) {
    const bounds = computePathBounds(traverse.path);
    if (bounds) return traverseCameraAltitude(bounds);
  }
  return 1.35;
};

/** Best camera target for a mission — traverse centroid for rovers with paths. */
export const missionCameraTarget = (
  mission: Mission,
  traverse?: RoverTraverseRecord | null,
) => {
  if (traverse && isRoverClassification(mission.classification)) {
    const bounds = computePathBounds(traverse.path);
    if (bounds) return bounds.centroid;
  }
  return mission.coordinates;
};
