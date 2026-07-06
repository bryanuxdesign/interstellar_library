import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { getPlanet } from '@/data/planets';
import { getMissionsByPlanet } from '@/data/missions';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CAMERA_DISTANCE } from '@/three/constants';
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

  useEffect(() => {
    if (!planet || !planet.available) {
      navigate('/', { replace: true });
      return;
    }
    setActivePlanet(planet.id);
  }, [planet, navigate, setActivePlanet]);

  if (!planet || !planet.available) return null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-deep">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      >
        <Canvas
          camera={{ position: [0, 0.6, DEFAULT_CAMERA_DISTANCE], fov: 45 }}
          dpr={[1, 2]}
          onPointerMissed={() => closeDossier()}
        >
          <Scene missions={missions} />
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
