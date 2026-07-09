import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import type { Coordinates } from '@/types';
import { latLngToVector3 } from '@/three/coordinateUtils';
import { GLOBE_RADIUS, SURFACE_LIFT } from '@/three/constants';

const UP = new Vector3(0, 0, 1);
const LANDING_COLOR = '#6b9fff';

interface RoverLandingMarkerProps {
  coordinates: Coordinates;
}

/** Distinct blue double-ring marker at the rover landing site. */
export function RoverLandingMarker({ coordinates }: RoverLandingMarkerProps) {
  const { position, quaternion } = useMemo(() => {
    const pos = latLngToVector3(coordinates, GLOBE_RADIUS + SURFACE_LIFT + 0.004);
    const normal = pos.clone().normalize();
    const quat = new Quaternion().setFromUnitVectors(UP, normal);
    return { position: pos, quaternion: quat };
  }, [coordinates]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh>
        <ringGeometry args={[0.055, 0.072, 32]} />
        <meshBasicMaterial color={LANDING_COLOR} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.038, 0.046, 32]} />
        <meshBasicMaterial color={LANDING_COLOR} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color={LANDING_COLOR} />
      </mesh>
    </group>
  );
}
