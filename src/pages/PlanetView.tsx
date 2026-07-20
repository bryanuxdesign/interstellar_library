import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { getPlanet } from '@/data/planets';
import { getMissionsByPlanet } from '@/data/missions';
import { getOrbitersByPlanet } from '@/data/orbiters';
import {
  findPlanetMoon,
  moonsForPlanet,
  outermostMoonSemiMajorKm,
} from '@/data/planetMoons';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CAMERA_DISTANCE, GLOBE_RADIUS } from '@/three/constants';
import { computeNearSideCluster } from '@/three/coordinateUtils';
import { Scene } from '@/three/Scene';
import { preloadPlanetModel } from '@/three/CelestialGlobe';
import { preloadPlanetMoonModels } from '@/three/PlanetMoons';
import { PlanetSidebar } from '@/components/planet/PlanetSidebar';
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
import { DossierPanel } from '@/components/dossier/DossierPanel';
import { planetOverviewAltitude } from '@/utils/missionCamera';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useViewportHeight } from '@/utils/useViewportHeight';
import {
  mobileCanvasHeight,
} from '@/utils/mobileSheetLayout';

/** Pull camera back far enough that the outermost moon orbit fits in overview. */
function overviewAltitudeForPlanet(planetId: string, aspect: number): number {
  const base = planetOverviewAltitude(aspect);
  const outerKm = outermostMoonSemiMajorKm(planetId);
  const planet = getPlanet(planetId);
  if (!outerKm || !planet) return base;
  const orbitScene = GLOBE_RADIUS * (outerKm / planet.radiusKm);
  const needDist = (orbitScene * 1.25) / 0.55;
  const needAlt = needDist / GLOBE_RADIUS - 1;
  // Cap so far outer moons (e.g. Iapetus) don't collapse the planet to a speck;
  // max zoom still reaches them via OrbitControls.
  return Math.min(Math.max(base, needAlt), 42);
}

export function PlanetView() {
  const { planetId = '' } = useParams();
  const navigate = useNavigate();

  const planet = getPlanet(planetId);
  const missions = useMemo(() => getMissionsByPlanet(planetId), [planetId]);
  const orbiterCount = getOrbitersByPlanet(planetId).length;
  const moonCount = moonsForPlanet(planetId).length;

  const setActivePlanet = useAppStore((s) => s.setActivePlanet);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const clearSurfacePreview = useAppStore((s) => s.clearSurfacePreview);
  const flyTo = useAppStore((s) => s.flyTo);
  const focusMoon = useAppStore((s) => s.focusMoon);
  const focusedMoonId = useAppStore((s) => s.focusedMoonId);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const mobileDossierExpanded = useAppStore((s) => s.mobileDossierExpanded);
  const lastFocus = useAppStore((s) => s.lastFocus);

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

  const focusedMoon = focusedMoonId ? findPlanetMoon(focusedMoonId) : undefined;

  useEffect(() => {
    if (!planet || !planet.available) {
      navigate('/', { replace: true });
      return;
    }
    preloadPlanetModel(planet.id);
    if (moonsForPlanet(planet.id).length) preloadPlanetMoonModels(planet.id);
    setActivePlanet(planet.id);
    const coords = cluster ?? { lat: 0, lng: 0 };
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const altitude = overviewAltitudeForPlanet(planet.id, aspect);
    queueMicrotask(() => flyTo(coords, altitude));
  }, [planetId, planet, cluster, navigate, setActivePlanet, flyTo]);

  // Escape / Focus planet — return camera to the parent body.
  useEffect(() => {
    if (!focusedMoonId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        focusMoon(null);
        const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
        const altitude =
          lastFocus?.altitude ??
          overviewAltitudeForPlanet(planetId, aspect);
        const coords = lastFocus?.coordinates ?? cluster ?? { lat: 0, lng: 0 };
        flyTo(coords, altitude);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedMoonId, focusMoon, flyTo, lastFocus, planetId, cluster]);

  // Dev helper for smoke tests / console probing.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as Window & {
      __archiveFocusMoon?: (id: string | null) => void;
    };
    w.__archiveFocusMoon = (id) => {
      if (!id) {
        focusMoon(null);
        const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
        flyTo(
          lastFocus?.coordinates ?? { lat: 0, lng: 0 },
          lastFocus?.altitude ?? overviewAltitudeForPlanet(planetId, aspect),
        );
        return;
      }
      focusMoon(id);
    };
    return () => {
      delete w.__archiveFocusMoon;
    };
  }, [focusMoon, flyTo, lastFocus, planetId]);

  if (!planet || !planet.available) return null;

  const sheetSpring = { type: 'spring' as const, stiffness: 280, damping: 34, mass: 0.85 };

  const returnToPlanet = () => {
    focusMoon(null);
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const altitude =
      lastFocus?.altitude ?? overviewAltitudeForPlanet(planet.id, aspect);
    const coords = lastFocus?.coordinates ?? cluster ?? { lat: 0, lng: 0 };
    flyTo(coords, altitude);
  };

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
          {moonCount > 0 ? ` · ${moonCount} moon${moonCount === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      {focusedMoon && (
        <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-28">
          <p className="text-[11px] tracking-wide text-ink-faint">
            Focusing <span className="text-ink">{focusedMoon.name}</span>
          </p>
          <button
            type="button"
            onClick={returnToPlanet}
            className="rounded-sm border border-white/15 bg-black/55 px-3 py-1.5 text-[12px] tracking-wide text-ink backdrop-blur-sm transition hover:border-white/30 hover:bg-black/70"
          >
            Focus {planet.name}
            <span className="ml-2 text-ink-faint">Esc</span>
          </button>
        </div>
      )}

      <PlanetSidebar planet={planet} missions={missions} />
      <TimelineScrubber planetId={planet.id} />
      <DossierPanel />
    </div>
  );
}
