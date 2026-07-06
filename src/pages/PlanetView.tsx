import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { getPlanet } from '@/data/planets';
import { getMissionsByPlanet } from '@/data/missions';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CAMERA_DISTANCE } from '@/three/constants';
import { computeNearSideCluster } from '@/three/coordinateUtils';
import { Scene } from '@/three/Scene';
import { PlanetSidebar } from '@/components/planet/PlanetSidebar';
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
import { DossierPanel } from '@/components/dossier/DossierPanel';

export function PlanetView() {
  const { planetId = '' } = useParams();
  const navigate = useNavigate();

  const planet = getPlanet(planetId);
  const missions = getMissionsByPlanet(planetId);

  const setActivePlanet = useAppStore((s) => s.setActivePlanet);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const flyTo = useAppStore((s) => s.flyTo);

  const cluster = useMemo(
    () => (missions.length ? computeNearSideCluster(missions) : null),
    [missions],
  );

  useEffect(() => {
    if (!planet || !planet.available) {
      navigate('/', { replace: true });
      return;
    }
    setActivePlanet(planet.id);
    if (!cluster) return;
    queueMicrotask(() => flyTo(cluster, 1.65));
  }, [planet, cluster, navigate, setActivePlanet, flyTo]);

  if (!planet || !planet.available) return null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-deep">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ touchAction: 'none' }}
      >
        <Canvas
          camera={{ position: [0, 0.6, DEFAULT_CAMERA_DISTANCE], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          onPointerMissed={() => closeDossier()}
        >
          <Scene missions={missions} planetId={planet.id} />
        </Canvas>
      </motion.div>

      {/* Top-right telemetry glyph */}
      <div className="pointer-events-none absolute right-5 top-5 z-10 hidden text-right md:block">
        <span className="eyebrow text-active">Live Feed</span>
        <p className="tabular mt-1 text-[11px] text-ink-faint">
          {missions.length} catalogued touchpoints
        </p>
      </div>

      <PlanetSidebar planet={planet} missions={missions} />
      <TimelineScrubber planetId={planet.id} />
      <DossierPanel />
    </div>
  );
}
