import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import type { Coordinates } from '@/types';
import { latLngToVector3 } from '@/three/coordinateUtils';
import { GLOBE_RADIUS, SURFACE_LIFT } from '@/three/constants';

const UP = new Vector3(0, 0, 1);
const LAST_KNOWN_COLOR = '#f59e0b';

interface RoverLastKnownMarkerProps {
  coordinates: Coordinates;
  isActive: boolean;
}

/** Amber octahedron at last-known / retirement position — distinct from landing ring. */
export function RoverLastKnownMarker({ coordinates, isActive }: RoverLastKnownMarkerProps) {
  const { position, quaternion } = useMemo(() => {
    const pos = latLngToVector3(coordinates, GLOBE_RADIUS + SURFACE_LIFT + 0.006);
    const normal = pos.clone().normalize();
    const quat = new Quaternion().setFromUnitVectors(UP, normal);
    return { position: pos, quaternion: quat };
  }, [coordinates]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 0, 0.02]}>
        <octahedronGeometry args={[0.038, 0]} />
        <meshStandardMaterial
          color={LAST_KNOWN_COLOR}
          emissive={LAST_KNOWN_COLOR}
          emissiveIntensity={isActive ? 1.4 : 0.9}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.05, 0.062, 32]} />
        <meshBasicMaterial color={LAST_KNOWN_COLOR} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
