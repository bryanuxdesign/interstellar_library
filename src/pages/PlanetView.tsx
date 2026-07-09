import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { getPlanet } from '@/data/planets';
import { getMissionsByPlanet } from '@/data/missions';
import { getOrbitersByPlanet } from '@/data/orbiters';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CAMERA_DISTANCE } from '@/three/constants';
import { computeNearSideCluster } from '@/three/coordinateUtils';
import { Scene } from '@/three/Scene';
import { preloadPlanetModel } from '@/three/CelestialGlobe';
import { PlanetSidebar } from '@/components/planet/PlanetSidebar';
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
import { DossierPanel } from '@/components/dossier/DossierPanel';
import { planetOverviewAltitude } from '@/utils/missionCamera';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useViewportHeight } from '@/utils/useViewportHeight';
import {
  mobileCanvasHeight,
} from '@/utils/mobileSheetLayout';

export function PlanetView() {
  const { planetId = '' } = useParams();
  const navigate = useNavigate();

  const planet = getPlanet(planetId);
  const missions = useMemo(() => getMissionsByPlanet(planetId), [planetId]);
  const orbiterCount = getOrbitersByPlanet(planetId).length;

  const setActivePlanet = useAppStore((s) => s.setActivePlanet);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const clearSurfacePreview = useAppStore((s) => s.clearSurfacePreview);
  const flyTo = useAppStore((s) => s.flyTo);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const mobileDossierExpanded = useAppStore((s) => s.mobileDossierExpanded);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const viewportH = useViewportHeight();
  const mobileDossierOpen = isMobile && Boolean(selectedMissionId || selectedOrbiterId);

  const canvasHeight = mobileCanvasHeight(
    viewportH,
    mobileDossierOpen,
    mobileDossierExpanded,
  );

  const cluster = useMemo(
    () => (missions.length ? computeNearSideCluster(missions) : null),
    [planetId, missions],
  );

  useEffect(() => {
    if (!planet || !planet.available) {
      navigate('/', { replace: true });
      return;
    }
    preloadPlanetModel(planet.id);
    setActivePlanet(planet.id);
    const coords = cluster ?? { lat: 0, lng: 0 };
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const altitude = planetOverviewAltitude(aspect);
    queueMicrotask(() => flyTo(coords, altitude));
  }, [planetId, planet, cluster, navigate, setActivePlanet, flyTo]);

  if (!planet || !planet.available) return null;

  const sheetSpring = { type: 'spring' as const, stiffness: 280, damping: 34, mass: 0.85 };

  return (
    <div className="relative h-full w-full overflow-hidden bg-deep">
      <motion.div
        className="absolute inset-x-0 top-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{
          height: canvasHeight,
          opacity: mobileDossierExpanded ? 0 : 1,
        }}
        transition={sheetSpring}
        style={{ touchAction: 'none', pointerEvents: mobileDossierExpanded ? 'none' : 'auto' }}
      >
        <Canvas
          camera={{ position: [0, 0.6, DEFAULT_CAMERA_DISTANCE], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance' }}
          onPointerMissed={() => {
            const { hoveredMissionId, hoveredOrbiterId } = useAppStore.getState();
            if (hoveredMissionId || hoveredOrbiterId) return;
            closeDossier();
            clearSurfacePreview();
          }}
        >
          <Scene missions={missions} planetId={planet.id} />
        </Canvas>
      </motion.div>

      {/* Top-right telemetry glyph */}
      <div className="pointer-events-none absolute right-5 top-5 z-10 hidden text-right md:block">
        <span className="eyebrow text-active">Live Feed</span>
        <p className="tabular mt-1 text-[11px] text-ink-faint">
          {missions.length} surface · {orbiterCount} in orbit
        </p>
      </div>

      <PlanetSidebar planet={planet} missions={missions} />
      <TimelineScrubber planetId={planet.id} />
      <DossierPanel />
    </div>
  );
}
