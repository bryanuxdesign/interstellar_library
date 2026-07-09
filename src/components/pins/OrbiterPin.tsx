import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Mesh, Vector3 } from 'three';
import type { OrbitalAsset, OrbitalState } from '@/types';
import { getPlanet } from '@/data/planets';
import { positionKmToSceneVector3 } from '@/three/coordinateUtils';
import { propagateOrbiter } from '@/three/orbitPropagation';
import { orbiterAltitudeMultiplier } from '@/utils/orbiterCamera';
import { ORBITER_COLOR, PLANET_ROTATION_OFFSET } from '@/three/constants';
import { useAppStore } from '@/store/useAppStore';
import { useSurfaceOrbiterTouch } from '@/utils/surfaceAssetTouch';
import { OrbiterHoverCard } from './OrbiterHoverCard';
import { OrbitalPlane } from './OrbitalPlane';

const UPDATE_INTERVAL_MS = 30_000;
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface OrbiterPinProps {
  orbiter: OrbitalAsset;
}

export function OrbiterPin({ orbiter }: OrbiterPinProps) {
  const hoveredOrbiterId = useAppStore((s) => s.hoveredOrbiterId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const setHoveredOrbiter = useAppStore((s) => s.setHoveredOrbiter);
  const selectOrbiter = useAppStore((s) => s.selectOrbiter);
  const flyTo = useAppStore((s) => s.flyTo);

  const planetRadiusKm = getPlanet(orbiter.planetId)?.radiusKm ?? 1737.4;
  const offset = PLANET_ROTATION_OFFSET[orbiter.planetId] ?? 0;

  const [state, setState] = useState<OrbitalState>(() => propagateOrbiter(orbiter));
  const displayPos = useRef(new Vector3());
  const targetPos = useRef(new Vector3());
  const markerRef = useRef<Group>(null);
  const pulseRef = useRef<Mesh>(null);

  const openOrbiter = useCallback(() => {
    selectOrbiter(orbiter.id);
    flyTo(
      { lat: state.lat, lng: state.lng },
      orbiterAltitudeMultiplier(state, orbiter.planetId),
    );
  }, [selectOrbiter, orbiter.id, orbiter.planetId, state, flyTo]);

  const { handleClick } = useSurfaceOrbiterTouch(orbiter.id, openOrbiter);

  useEffect(() => {
    const tick = () => {
      const next = propagateOrbiter(orbiter);
      setState(next);
      positionKmToSceneVector3(next.positionKm, planetRadiusKm, offset, targetPos.current);
    };
    tick();
    const id = window.setInterval(tick, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [orbiter, planetRadiusKm, offset]);

  useEffect(() => {
    positionKmToSceneVector3(state.positionKm, planetRadiusKm, offset, targetPos.current);
    if (prefersReducedMotion) {
      displayPos.current.copy(targetPos.current);
    }
  }, [state, planetRadiusKm, offset]);

  useFrame(() => {
    if (!prefersReducedMotion) {
      displayPos.current.lerp(targetPos.current, 0.08);
    }
    if (markerRef.current) {
      markerRef.current.position.copy(displayPos.current);
    }
    if (pulseRef.current && !prefersReducedMotion) {
      const t = (performance.now() * 0.001 * 0.7) % 1;
      pulseRef.current.scale.setScalar(1 + t * 1.8);
      const mat = pulseRef.current.material as { opacity: number };
      mat.opacity = 0.35 * (1 - t);
    }
  });

  const isHovered = hoveredOrbiterId === orbiter.id;
  const isSelected = selectedOrbiterId === orbiter.id;
  const emphasized = isHovered || isSelected;

  const handleOver = () => {
    setHoveredOrbiter(orbiter.id);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = () => {
    setHoveredOrbiter(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group>
      <OrbitalPlane orbiter={orbiter} emphasized={emphasized} />

      <group ref={markerRef}>
        <mesh
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
        >
          <octahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial
            color={ORBITER_COLOR}
            emissive={ORBITER_COLOR}
            emissiveIntensity={emphasized ? 2 : 1.2}
          />
        </mesh>

        {!prefersReducedMotion && (
          <mesh ref={pulseRef}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshBasicMaterial
              color={ORBITER_COLOR}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        )}

        {(isHovered || isSelected) && (
          <Html
            position={[0, 0.14, 0]}
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <OrbiterHoverCard orbiter={orbiter} state={state} />
          </Html>
        )}
      </group>
    </group>
  );
}
