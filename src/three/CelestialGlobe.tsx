import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Group, Mesh, Vector3 } from 'three';
import { GLOBE_RADIUS } from './constants';

const PLANET_MODELS: Record<string, string> = {
  moon: '/models/moon.glb',
  venus: '/models/venus.glb',
  mars: '/models/mars.glb',
};

const DEFAULT_MODEL = PLANET_MODELS.moon;

interface CelestialGlobeProps {
  planetId?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  radius?: number;
  /** Longitude alignment offset (radians) so pins sit over the correct terrain. */
  rotationOffset?: number;
}

export function CelestialGlobe({
  planetId = 'moon',
  autoRotate = false,
  rotationSpeed = 0.03,
  radius = GLOBE_RADIUS,
  rotationOffset = 0,
}: CelestialGlobeProps) {
  const ref = useRef<Group>(null);
  const modelUrl = PLANET_MODELS[planetId] ?? DEFAULT_MODEL;
  const { scene } = useGLTF(modelUrl);

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
    clone.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        (obj as Mesh).raycast = () => {};
      }
    });
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

useGLTF.preload(PLANET_MODELS.moon);
useGLTF.preload(PLANET_MODELS.venus);
useGLTF.preload(PLANET_MODELS.mars);
