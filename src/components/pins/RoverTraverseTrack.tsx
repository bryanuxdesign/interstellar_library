import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Mission, RoverTraverseRecord } from '@/types';
import { GLOBE_RADIUS, ROVER_TRAVERSE_COLORS, SURFACE_LIFT } from '@/three/constants';
import { pathToSurfaceVectors } from '@/three/surfacePath';

interface RoverTraverseTrackProps {
  mission: Mission;
  traverse: RoverTraverseRecord;
}

export function RoverTraverseTrack({ mission, traverse }: RoverTraverseTrackProps) {
  const points = useMemo(() => {
    const radius = GLOBE_RADIUS + SURFACE_LIFT;
    return pathToSurfaceVectors(traverse.path, radius, 0.25);
  }, [traverse]);

  const color =
    mission.status === 'active'
      ? ROVER_TRAVERSE_COLORS.active
      : ROVER_TRAVERSE_COLORS.decommissioned;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2.5}
      transparent
      opacity={0.9}
      raycast={() => {}}
    />
  );
}
