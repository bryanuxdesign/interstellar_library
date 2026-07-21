import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { DirectionalLight, Vector3 } from 'three';
import type { Mission } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { isRoverMission } from '@/data/roverTraverses';
import { useRoverTraverses } from '@/utils/useRoverTraverses';
import { CelestialGlobe, GlobeFallback } from './CelestialGlobe';
import { EarthGlobe } from './EarthGlobe';
import { SunGlobe } from './SunGlobe';
import { PlanetMoons } from './PlanetMoons';
import { CameraController } from './CameraController';
import { Artemis2Demo } from './Artemis2Demo';
import { moonsForPlanet } from '@/data/planetMoons';
import { MissionPin } from '@/components/pins/MissionPin';
import { OrbitalLayer } from '@/components/pins/OrbitalLayer';
import { SelectedRoverLayer } from '@/components/pins/SelectedRoverLayer';
import { PLANET_ROTATION_OFFSET } from './constants';
import { planetSunDirectionWorld } from '@/solar/sunLighting';
import { YouAreHereMarker } from './YouAreHereMarker';

const _sun = new Vector3();
const _yAxis = new Vector3(0, 1, 0);
const LIGHT_DIST = 40;

interface SceneProps {
  missions: Mission[];
  planetId: string;
}

/** Key + fill lights that track wall-clock sun direction for this archive body. */
function RealtimeSunLight({ planetId }: { planetId: string }) {
  const keyRef = useRef<DirectionalLight>(null);
  const fillRef = useRef<DirectionalLight>(null);

  useFrame(() => {
    if (planetId === 'sun') return;
    planetSunDirectionWorld(planetId, new Date(), _sun);
    const off = ((PLANET_ROTATION_OFFSET[planetId] ?? 0) * Math.PI) / 180;
    if (off !== 0) _sun.applyAxisAngle(_yAxis, off);
    if (keyRef.current) {
      keyRef.current.position.copy(_sun).multiplyScalar(LIGHT_DIST);
      keyRef.current.target.position.set(0, 0, 0);
      keyRef.current.target.updateMatrixWorld();
    }
    if (fillRef.current) {
      fillRef.current.position.copy(_sun).multiplyScalar(-LIGHT_DIST * 0.55);
      fillRef.current.target.position.set(0, 0, 0);
      fillRef.current.target.updateMatrixWorld();
    }
  });

  if (planetId === 'sun') return null;

  const isEarth = planetId === 'earth';
  return (
    <>
      <directionalLight
        ref={keyRef}
        intensity={isEarth ? 3.4 : 2.6}
        color="#fff4e8"
        castShadow={false}
      />
      <directionalLight
        ref={fillRef}
        intensity={isEarth ? 0.05 : 0.08}
        color="#1a3050"
        castShadow={false}
      />
    </>
  );
}

export function Scene({ missions, planetId }: SceneProps) {
  const visibleStatuses = useAppStore((s) => s.visibleStatuses);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);

  const visibleMissions = useMemo(
    () => missions.filter((m) => visibleStatuses.includes(m.status)),
    [missions, visibleStatuses],
  );

  const roverMissionIds = useMemo(
    () => visibleMissions.filter((m) => isRoverMission(m.id)).map((m) => m.id),
    [visibleMissions],
  );

  const traverses = useRoverTraverses(planetId === 'mars' ? roverMissionIds : []);

  return (
    <>
      <color attach="background" args={['#050506']} />
      {planetId === 'sun' ? (
        <>
          <ambientLight intensity={0.08} />
          <hemisphereLight args={['#2a1810', '#020205', 0.25]} />
        </>
      ) : planetId === 'earth' ? (
        <>
          <ambientLight intensity={0.04} />
          <hemisphereLight args={['#1a2a44', '#020408', 0.1]} />
          <RealtimeSunLight planetId={planetId} />
        </>
      ) : (
        <>
          {/* Low ambient so ephemeris sun casts a real night hemisphere */}
          <ambientLight intensity={0.12} />
          <hemisphereLight args={['#2a3348', '#05060a', 0.18]} />
          <RealtimeSunLight planetId={planetId} />
        </>
      )}

      <Stars radius={80} depth={40} count={planetId === 'sun' ? 2800 : 4000} factor={3} saturation={0} fade speed={0.5} />

      <Suspense fallback={<GlobeFallback />}>
        {planetId === 'sun' ? (
          <SunGlobe />
        ) : planetId === 'earth' ? (
          <EarthGlobe
            rotationOffset={((PLANET_ROTATION_OFFSET.earth ?? 0) * Math.PI) / 180}
          />
        ) : (
          <CelestialGlobe
            planetId={planetId}
            rotationOffset={((PLANET_ROTATION_OFFSET[planetId] ?? 0) * Math.PI) / 180}
          />
        )}
        {planetId === 'earth' && <YouAreHereMarker />}
        {moonsForPlanet(planetId).length > 0 && <PlanetMoons planetId={planetId} />}
        {planetId !== 'sun' && <OrbitalLayer planetId={planetId} />}
        {planetId === 'mars' && <SelectedRoverLayer traverses={traverses} />}
        {planetId === 'earth' && <Artemis2Demo />}
        {visibleMissions.map((mission) => (
          <MissionPin
            key={mission.id}
            mission={mission}
            traverse={traverses.get(mission.id) ?? null}
            isSelected={selectedMissionId === mission.id}
          />
        ))}
      </Suspense>

      <CameraController planetId={planetId} />
    </>
  );
}
