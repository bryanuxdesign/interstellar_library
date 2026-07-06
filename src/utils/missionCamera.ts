import type { Mission } from '@/types';
import { FLYBY_CAMERA_ALTITUDE } from '@/three/constants';
import { isFlybyMission } from '@/components/pins/FlybyTrack';

/** Camera altitude multiplier for flying to a mission on the globe. */
export const missionCameraAltitude = (mission: Mission): number =>
  isFlybyMission(mission) ? FLYBY_CAMERA_ALTITUDE : 1.35;
