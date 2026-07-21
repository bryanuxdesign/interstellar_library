import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { SUN_TEXTURE_URL } from '@/three/SunGlobe';
import { useTexture } from '@react-three/drei';
import { preloadPlanetMoonModels } from '@/three/PlanetMoons';
import { PlanetSidebar } from '@/components/planet/PlanetSidebar';
import { TimelineScrubber } from '@/components/timeline/TimelineScrubber';
import { DossierPanel } from '@/components/dossier/DossierPanel';
import { SolarIlluminationBadge } from '@/components/planet/SolarIlluminationBadge';
import {
  earthOverviewAltitude,
  planetOverviewAltitude,
} from '@/utils/missionCamera';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useViewportHeight } from '@/utils/useViewportHeight';
import {
  mobileCanvasHeight,
} from '@/utils/mobileSheetLayout';

function isLunaFocusParam(value: string | null): boolean {
  return value === 'luna' || value === 'moon';
}

/** Pull camera back far enough that the outermost moon orbit fits in overview. */
function overviewAltitudeForPlanet(planetId: string, aspect: number): number {
  // Earth: keep the globe large (~70%+). Luna’s orbit is reachable by zoom-out / Focus Moon.
  if (planetId === 'earth') return earthOverviewAltitude(aspect);

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
  const [searchParams, setSearchParams] = useSearchParams();

  const routePlanet = getPlanet(planetId);
  const focusedMoonId = useAppStore((s) => s.focusedMoonId);

  /**
   * Earth+Moon unified archive: Luna focus only swaps sidebar / timeline /
   * dossier content. The 3D scene always hosts Earth with Luna on its orbit.
   */
  const lunaFocused =
    routePlanet?.id === 'earth' && focusedMoonId === 'luna';
  const contentPlanetId = lunaFocused ? 'moon' : planetId;
  const contentPlanet = getPlanet(contentPlanetId) ?? routePlanet;

  /** Globe host for the Canvas — never swap to moon-as-primary on /earth. */
  const scenePlanetId = routePlanet?.id ?? planetId;
  const sceneMissions = useMemo(
    () => getMissionsByPlanet(scenePlanetId === 'earth' ? 'earth' : contentPlanetId),
    [scenePlanetId, contentPlanetId],
  );

  const uiMissions = useMemo(
    () => getMissionsByPlanet(contentPlanetId),
    [contentPlanetId],
  );
  const orbiterCount = getOrbitersByPlanet(contentPlanetId).length;
  const moonCount = moonsForPlanet(
    routePlanet?.id === 'earth' ? 'earth' : contentPlanetId,
  ).length;

  const setActivePlanet = useAppStore((s) => s.setActivePlanet);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const clearSurfacePreview = useAppStore((s) => s.clearSurfacePreview);
  const flyTo = useAppStore((s) => s.flyTo);
  const focusMoon = useAppStore((s) => s.focusMoon);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const mobileDossierExpanded = useAppStore((s) => s.mobileDossierExpanded);
  const lastFocus = useAppStore((s) => s.lastFocus);
  const artemis2DemoPlaying = useAppStore((s) => s.artemis2DemoPlaying);
  const artemis2DemoPhase = useAppStore((s) => s.artemis2DemoPhase);
  const artemis2CameraMode = useAppStore((s) => s.artemis2CameraMode);
  const artemis2TimelineSpeed = useAppStore((s) => s.artemis2TimelineSpeed);
  const startArtemis2Demo = useAppStore((s) => s.startArtemis2Demo);
  const stopArtemis2Demo = useAppStore((s) => s.stopArtemis2Demo);
  const setArtemis2CameraMode = useAppStore((s) => s.setArtemis2CameraMode);
  const setArtemis2TimelineSpeed = useAppStore((s) => s.setArtemis2TimelineSpeed);
  const earthAtmosphereEnabled = useAppStore((s) => s.earthAtmosphereEnabled);
  const toggleEarthAtmosphere = useAppStore((s) => s.toggleEarthAtmosphere);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const viewportH = useViewportHeight();
  const mobileDossierOpen = isMobile && Boolean(selectedMissionId || selectedOrbiterId);

  const canvasHeight = mobileCanvasHeight(
    viewportH,
    mobileDossierOpen,
    mobileDossierExpanded,
  );

  const cluster = useMemo(
    () => (sceneMissions.length ? computeNearSideCluster(sceneMissions) : null),
    [scenePlanetId, sceneMissions],
  );

  const focusedMoon = focusedMoonId ? findPlanetMoon(focusedMoonId) : undefined;
  const prevLunaFocus = useRef(false);
  const urlHadLunaFocus = useRef(false);
  const hydratedEarthUrl = useRef<string | null>(null);
  const leaveLunaToEarthRef = useRef<() => void>(() => {});

  // Hydrate Luna focus from the URL once per Earth visit (Gateway / /moon / deep links).
  // Do NOT re-apply on every searchParams tick — that races with leave and traps the camera on Luna.
  useEffect(() => {
    if (routePlanet?.id !== 'earth') {
      hydratedEarthUrl.current = null;
      return;
    }
    const focus = searchParams.get('focus');
    const visitKey = planetId;
    if (hydratedEarthUrl.current === visitKey) return;
    hydratedEarthUrl.current = visitKey;
    if (isLunaFocusParam(focus)) {
      focusMoon('luna');
    }
  }, [routePlanet?.id, planetId, searchParams, focusMoon]);

  // State → URL only (never URL → state here).
  useEffect(() => {
    if (routePlanet?.id !== 'earth') return;
    const focus = searchParams.get('focus');
    if (focusedMoonId === 'luna') {
      urlHadLunaFocus.current = true;
      if (!isLunaFocusParam(focus)) {
        setSearchParams({ focus: 'luna' }, { replace: true });
      }
    } else if (urlHadLunaFocus.current) {
      urlHadLunaFocus.current = false;
      if (isLunaFocusParam(focus)) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [focusedMoonId, routePlanet?.id, searchParams, setSearchParams]);

  leaveLunaToEarthRef.current = () => {
    urlHadLunaFocus.current = false;
    if (isLunaFocusParam(searchParams.get('focus'))) {
      setSearchParams({}, { replace: true });
    }
    focusMoon(null);
    // Issue Earth overview flyTo in the same turn so CameraController receives
    // cameraTarget alongside trackingMoon=false (avoids a stuck far camera).
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    flyTo({ lat: 18, lng: -45 }, earthOverviewAltitude(aspect));
  };

  useEffect(() => {
    if (!routePlanet || !routePlanet.available) {
      navigate('/', { replace: true });
      return;
    }
    if (routePlanet.id === 'sun') {
      useTexture.preload(SUN_TEXTURE_URL);
    } else {
      preloadPlanetModel(routePlanet.id);
      if (moonsForPlanet(routePlanet.id).length) {
        preloadPlanetMoonModels(routePlanet.id);
      }
      if (routePlanet.id === 'earth') {
        preloadPlanetModel('moon');
      }
    }
    setActivePlanet(routePlanet.id);

    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const startOnLuna =
      routePlanet.id === 'earth' && isLunaFocusParam(searchParams.get('focus'));

    if (startOnLuna) {
      focusMoon('luna');
      return;
    }

    const coords = cluster ?? { lat: 0, lng: 0 };
    const altitude = overviewAltitudeForPlanet(routePlanet.id, aspect);
    queueMicrotask(() => flyTo(coords, altitude));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / planet change only
  }, [planetId, routePlanet, navigate, setActivePlanet, flyTo, focusMoon]);

  // Leaving Luna focus → reframe Earth overview (enter is camera-tracked by Scene).
  useEffect(() => {
    const entering = lunaFocused && !prevLunaFocus.current;
    const leaving = !lunaFocused && prevLunaFocus.current;
    prevLunaFocus.current = lunaFocused;

    if (entering) return; // CameraController flies to the orbiting Luna mesh.

    if (leaving && routePlanet?.id === 'earth') {
      // Aim toward the lit face (scene key light at ~[+X,+Y,+Z]).
      const coords = { lat: 18, lng: -45 };
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      const alt = earthOverviewAltitude(aspect);
      queueMicrotask(() => flyTo(coords, alt));
    }
  }, [lunaFocused, flyTo, routePlanet?.id]);

  // Escape / Focus planet — return camera to the parent body.
  useEffect(() => {
    if (!focusedMoonId && !artemis2DemoPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (artemis2DemoPlaying) {
          stopArtemis2Demo();
          return;
        }
        if (routePlanet?.id === 'earth' && focusedMoonId === 'luna') {
          leaveLunaToEarthRef.current();
          return;
        }
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
  }, [
    focusedMoonId,
    focusMoon,
    flyTo,
    lastFocus,
    planetId,
    cluster,
    routePlanet?.id,
    artemis2DemoPlaying,
    stopArtemis2Demo,
  ]);

  // Dev helper for smoke tests / console probing.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as Window & {
      __archiveFocusMoon?: (id: string | null) => void;
    };
    w.__archiveFocusMoon = (id) => {
      if (!id) {
        if (routePlanet?.id === 'earth') {
          leaveLunaToEarthRef.current();
          return;
        }
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
  }, [focusMoon, flyTo, lastFocus, planetId, routePlanet?.id]);

  if (!routePlanet || !routePlanet.available || !contentPlanet) return null;

  const sheetSpring = { type: 'spring' as const, stiffness: 280, damping: 34, mass: 0.85 };

  const returnToPlanet = () => {
    if (routePlanet.id === 'earth' && focusedMoonId === 'luna') {
      leaveLunaToEarthRef.current();
      return;
    }
    focusMoon(null);
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const altitude =
      lastFocus?.altitude ?? overviewAltitudeForPlanet(routePlanet.id, aspect);
    const coords = lastFocus?.coordinates ?? cluster ?? { lat: 0, lng: 0 };
    flyTo(coords, altitude);
  };

  const focusLabel =
    lunaFocused && focusedMoon
      ? focusedMoon.name
      : focusedMoon?.name;

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
          camera={{ position: [0, 0.6, DEFAULT_CAMERA_DISTANCE], fov: isMobile ? 50 : 45 }}
          dpr={isMobile ? [1, 1.25] : [1, 1.5]}
          gl={{ powerPreference: 'high-performance', antialias: !isMobile }}
          style={{ touchAction: 'none' }}
          onPointerMissed={() => {
            const { hoveredMissionId, hoveredOrbiterId } = useAppStore.getState();
            if (hoveredMissionId || hoveredOrbiterId) return;
            closeDossier();
            clearSurfacePreview();
          }}
        >
          <Scene missions={sceneMissions} planetId={scenePlanetId} />
        </Canvas>
      </motion.div>

      {/* Top-right telemetry glyph */}
      <div className="pointer-events-none absolute right-5 top-5 z-10 hidden text-right md:block">
        <span className="eyebrow text-active">Live Feed</span>
        <p className="tabular mt-1 text-[11px] text-ink-faint">
          {contentPlanet.id === 'sun'
            ? 'Photosphere · sunspots · flare animation'
            : `${uiMissions.length} surface · ${orbiterCount} in orbit${
                moonCount > 0 && !lunaFocused
                  ? ` · ${moonCount} moon${moonCount === 1 ? '' : 's'}`
                  : ''
              }`}
        </p>
        {contentPlanet.id !== 'sun' && contentPlanet.id !== 'earth' ? (
          <div className="mt-2 flex justify-end">
            <SolarIlluminationBadge planetId={contentPlanet.id} />
          </div>
        ) : null}
      </div>

      {focusedMoon ? (
        <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-28">
          <p className="text-[11px] tracking-wide text-ink-faint">
            Focusing <span className="text-ink">{focusLabel}</span>
            {lunaFocused ? (
              <span className="text-ink-faint"> · Earth archive</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={returnToPlanet}
            className="min-h-10 rounded-sm border border-white/15 bg-black/55 px-3 py-2 text-[12px] tracking-wide text-ink backdrop-blur-sm transition hover:border-white/30 hover:bg-black/70"
          >
            Focus {routePlanet.name}
            <span className="ml-2 hidden text-ink-faint md:inline">Esc</span>
          </button>
        </div>
      ) : routePlanet.id === 'earth' ? (
        <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-28">
          {artemis2DemoPlaying && artemis2DemoPhase ? (
            <p className="max-w-[min(90vw,26rem)] text-center text-[11px] tracking-wide text-amber-200/90">
              Artemis II · <span className="text-ink">{artemis2DemoPhase}</span>
            </p>
          ) : null}
          {artemis2DemoPlaying ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {(
                [
                  ['capsule', 'Chase'],
                  ['earth', 'Earth'],
                  ['moon', 'Moon'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setArtemis2CameraMode(mode)}
                  className={`min-h-8 rounded-sm border px-2.5 py-1.5 text-[11px] tracking-wide backdrop-blur-sm transition ${
                    artemis2CameraMode === mode
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                      : 'border-white/15 bg-black/55 text-ink-faint hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="mx-0.5 hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
              {(
                [
                  ['2min', '2 min'],
                  ['2hour', '2 hr'],
                ] as const
              ).map(([speed, label]) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setArtemis2TimelineSpeed(speed)}
                  className={`min-h-8 rounded-sm border px-2.5 py-1.5 text-[11px] tracking-wide backdrop-blur-sm transition ${
                    artemis2TimelineSpeed === speed
                      ? 'border-sky-400/45 bg-sky-500/15 text-sky-100'
                      : 'border-white/15 bg-black/55 text-ink-faint hover:border-white/30 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <SolarIlluminationBadge planetId="earth" />
            <button
              type="button"
              onClick={() => toggleEarthAtmosphere()}
              className={`min-h-10 rounded-sm border px-3 py-2 text-[12px] tracking-wide backdrop-blur-sm transition ${
                earthAtmosphereEnabled
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/55'
                  : 'border-white/15 bg-black/55 text-ink-faint hover:border-white/30 hover:text-ink'
              }`}
            >
              Clouds & auroras {earthAtmosphereEnabled ? 'on' : 'off'}
            </button>
            <button
              type="button"
              onClick={() => focusMoon('luna')}
              disabled={artemis2DemoPlaying}
              className="min-h-10 rounded-sm border border-white/15 bg-black/55 px-3 py-2 text-[12px] tracking-wide text-ink backdrop-blur-sm transition hover:border-white/30 hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Focus Moon
            </button>
            {artemis2DemoPlaying ? (
              <button
                type="button"
                onClick={() => stopArtemis2Demo()}
                className="min-h-10 rounded-sm border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-[12px] tracking-wide text-amber-100 backdrop-blur-sm transition hover:border-amber-300/55 hover:bg-amber-500/25"
              >
                Stop demo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startArtemis2Demo()}
                className="min-h-10 rounded-sm border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-[12px] tracking-wide text-sky-100 backdrop-blur-sm transition hover:border-sky-300/50 hover:bg-sky-500/20"
              >
                Play Artemis II path
              </button>
            )}
          </div>
        </div>
      ) : null}

      <PlanetSidebar
        planet={contentPlanet}
        missions={uiMissions}
        moonHostPlanetId={routePlanet.id === 'earth' ? 'earth' : undefined}
        onFocusHostPlanet={
          routePlanet.id === 'earth' ? () => leaveLunaToEarthRef.current() : undefined
        }
      />
      {contentPlanet.id !== 'sun' && (
        <TimelineScrubber planetId={contentPlanetId} />
      )}
      <DossierPanel />
    </div>
  );
}
