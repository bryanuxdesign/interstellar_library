import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { GLOBE_RADIUS, SURFACE_LIFT } from './constants';
import { latLngToVector3 } from './coordinateUtils';
import { observerCoordsFromTimezone } from '@/solar/sunLighting';

/**
 * Soft marker at the timezone-approximate observer location on Earth
 * so day/night under “you” is visually checkable.
 */
export function YouAreHereMarker() {
  const ref = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);

  const base = useMemo(() => {
    const { lat, lng } = observerCoordsFromTimezone();
    return latLngToVector3({ lat, lng }, GLOBE_RADIUS * (1 + SURFACE_LIFT));
  }, []);

  useFrame((_, delta) => {
    const { lat, lng } = observerCoordsFromTimezone(new Date());
    if (ref.current) {
      latLngToVector3({ lat, lng }, GLOBE_RADIUS * (1 + SURFACE_LIFT), ref.current.position);
      ref.current.lookAt(0, 0, 0);
    }
    if (ringRef.current) {
      const s = 1 + 0.15 * Math.sin(performance.now() * 0.003);
      ringRef.current.scale.setScalar(s);
      ringRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group ref={ref} position={base}>
      <mesh>
        <sphereGeometry args={[0.028, 16, 12]} />
        <meshBasicMaterial color="#5ec8ff" toneMapped={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.045, 0.062, 32]} />
        <meshBasicMaterial
          color="#8adbff"
          transparent
          opacity={0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
