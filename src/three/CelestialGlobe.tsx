import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { GLOBE_RADIUS } from './constants';

/** NASA VTAD / Solar System GLB models, self-hosted under public/models/. */
const PLANET_MODELS: Record<string, string> = {
  mercury: '/models/mercury.glb',
  venus: '/models/venus.glb',
  earth: '/models/earth.glb',
  moon: '/models/moon.glb',
  mars: '/models/mars.glb',
  jupiter: '/models/jupiter.glb',
  saturn: '/models/saturn.glb',
  uranus: '/models/uranus.glb',
  neptune: '/models/neptune.glb',
};

const DEFAULT_MODEL = PLANET_MODELS.moon;
const preloaded = new Set<string>();

/** Fetch a planet GLB only when needed — avoids downloading all ~22MB on the home page. */
export function preloadPlanetModel(planetId: string) {
  const url = PLANET_MODELS[planetId];
  if (!url || preloaded.has(url)) return;
  preloaded.add(url);
  useGLTF.preload(url);
}

interface CelestialGlobeProps {
  planetId?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  radius?: number;
  /** Longitude alignment offset (radians) so pins sit over the correct terrain. */
  rotationOffset?: number;
}

/** Tune NASA GLB materials so rocky worlds read as matte surfaces, not chrome. */
function normalizeGlobeMaterials(root: Group, planetId: string) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    const mesh = obj as Mesh;
    mesh.raycast = () => {};
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!(mat instanceof MeshStandardMaterial)) continue;
      if (mat.map) mat.map.colorSpace = SRGBColorSpace;
      // Earth GLB ships with metallicFactor 0.25 — looks like brushed metal, not a planet.
      if (planetId === 'earth') {
        mat.metalness = 0;
        mat.roughness = Math.max(mat.roughness, 0.72);
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.04);
        mat.emissive.set('#0a1520');
      } else if (mat.metalness > 0.1) {
        mat.metalness = 0;
      }
      mat.needsUpdate = true;
    }
  });
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
    normalizeGlobeMaterials(clone, planetId);
    return clone;
  }, [scene, radius, planetId]);

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
