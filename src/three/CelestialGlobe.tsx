import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';
import { GLOBE_RADIUS } from './constants';

const MODEL_URL = '/models/moon.glb';

interface CelestialGlobeProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
  radius?: number;
  /** Longitude alignment offset (radians) so pins sit over the correct terrain. */
  rotationOffset?: number;
}

export function CelestialGlobe({
  autoRotate = false,
  rotationSpeed = 0.03,
  radius = GLOBE_RADIUS,
  rotationOffset = Math.PI,
}: CelestialGlobeProps) {
  const ref = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  // Clone and normalise the NASA model to our target radius, centred at origin.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = (radius * 2) / maxDim;
    clone.scale.setScalar(scale);
    clone.position.copy(center.multiplyScalar(-scale));
    return clone;
  }, [scene, radius]);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={ref} rotation={[0, rotationOffset, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Neutral sphere shown while the surface model streams in. */
export function GlobeFallback({ radius = GLOBE_RADIUS }: { radius?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial color="#1a1a1e" roughness={1} metalness={0} wireframe />
    </mesh>
  );
}

useGLTF.preload(MODEL_URL);
