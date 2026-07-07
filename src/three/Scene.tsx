import { Suspense, useMemo } from 'react';
import { Stars } from '@react-three/drei';
import type { Mission } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { CelestialGlobe, GlobeFallback } from './CelestialGlobe';
import { CameraController } from './CameraController';
import { MissionPin } from '@/components/pins/MissionPin';
import { OrbitalLayer } from '@/components/pins/OrbitalLayer';
import { PLANET_ROTATION_OFFSET } from './constants';

interface SceneProps {
  missions: Mission[];
  planetId: string;
}

export function Scene({ missions, planetId }: SceneProps) {
  const visibleStatuses = useAppStore((s) => s.visibleStatuses);

  const visibleMissions = useMemo(
    () => missions.filter((m) => visibleStatuses.includes(m.status)),
    [missions, visibleStatuses],
  );

  return (
    <>
      <color attach="background" args={['#050506']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={2.2} color="#fff6ec" />
      <directionalLight position={[-6, -2, -4]} intensity={0.25} color="#3a4a6a" />

      <Stars radius={80} depth={40} count={4000} factor={3} saturation={0} fade speed={0.5} />

      <Suspense fallback={<GlobeFallback />}>
        <CelestialGlobe
          planetId={planetId}
          rotationOffset={((PLANET_ROTATION_OFFSET[planetId] ?? 0) * Math.PI) / 180}
        />
        <OrbitalLayer planetId={planetId} />
        {visibleMissions.map((mission) => (
          <MissionPin key={mission.id} mission={mission} />
        ))}
      </Suspense>

      <CameraController planetId={planetId} />
    </>
  );
}
