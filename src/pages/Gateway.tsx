import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { GATEWAY_PLANET_ORDER, getPlanet } from '@/data/planets';
import { computeTelemetry } from '@/data/telemetry';
import { preloadPlanetModel } from '@/three/CelestialGlobe';
import { HeroCenterGlobeLayer, PlanetOrb, HERO_ORB_SIZE, type HeroSlot } from '@/components/gateway/PlanetOrb';
import { isGlobeLoaded } from '@/components/gateway/globeLoadedCache';
import { TelemetryCounter } from '@/components/gateway/TelemetryCounter';
import { CreatorAboutButton } from '@/components/ui/CreatorAbout';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const SLOT_ORDER: HeroSlot[] = ['left', 'center', 'right'];

/** Initial arrangement — Moon centered, flanked by Venus (left) and Mars (right). */
function initialSlots(): Record<string, HeroSlot> {
  const map: Record<string, HeroSlot> = {};
  GATEWAY_PLANET_ORDER.forEach((id, index) => {
    map[id] = SLOT_ORDER[index] ?? 'center';
  });
  return map;
}

export function Gateway() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [slots, setSlots] = useState<Record<string, HeroSlot>>(initialSlots);
  const [departingId, setDepartingId] = useState<string | null>(null);
  const [paintedId, setPaintedId] = useState<string | null>(null);
  const [displayGlobeId, setDisplayGlobeId] = useState('moon');
  const [departingCenterId, setDepartingCenterId] = useState<string | null>(null);
  const [carouselIdle, setCarouselIdle] = useState(true);
  const [swapEpoch, setSwapEpoch] = useState(0);
  const swapEpochRef = useRef(0);
  /** Defer the heavy hero WebGL layer until after first paint. */
  const [globeLayerReady, setGlobeLayerReady] = useState(false);

  useEffect(() => {
    preloadPlanetModel('moon');
    const ric = window.requestIdleCallback?.(
      () => {
        setGlobeLayerReady(true);
        void import('@/pages/PlanetView');
      },
      { timeout: 1200 },
    );
    const tid = ric === undefined ? window.setTimeout(() => setGlobeLayerReady(true), 400) : undefined;
    return () => {
      if (ric !== undefined) window.cancelIdleCallback?.(ric);
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, []);

  const heroPlanets = useMemo(
    () =>
      GATEWAY_PLANET_ORDER.map((id) => getPlanet(id)).filter(
        (p): p is NonNullable<typeof p> => p !== undefined,
      ),
    [],
  );

  const focusedId = useMemo(
    () => Object.keys(slots).find((id) => slots[id] === 'center') ?? 'moon',
    [slots],
  );

  const globeVisible = carouselIdle && paintedId === displayGlobeId;

  const handlePainted = useCallback(
    (planetId: string) => {
      if (carouselIdle && planetId === displayGlobeId) {
        setPaintedId(planetId);
      }
    },
    [carouselIdle, displayGlobeId],
  );

  const handleCarouselSettled = useCallback(
    (planetId: string, epoch: number) => {
      if (epoch !== swapEpochRef.current) return;
      const centerId = Object.keys(slots).find((id) => slots[id] === 'center');
      if (centerId !== planetId) return;
      setDisplayGlobeId(planetId);
      setDepartingCenterId(null);
      setCarouselIdle(true);
      if (isGlobeLoaded(planetId)) setPaintedId(planetId);
    },
    [slots],
  );

  const telemetry = useMemo(() => computeTelemetry(focusedId), [focusedId]);

  const launch = (planetId: string) => {
    const planet = getPlanet(planetId);
    if (!planet?.available) return;
    setDepartingId(planetId);
    // Moon opens inside the unified Earth+Moon archive.
    const href =
      planetId === 'moon' ? '/earth?focus=luna' : `/${planetId}`;
    window.setTimeout(() => navigate(href), 650);
  };

  const handlePlanetSelect = (planetId: string) => {
    // Clicking the centered planet opens its archive ("know more").
    if (slots[planetId] === 'center') {
      launch(planetId);
      return;
    }
    // Clicking a flanking planet swaps it into the center; the outgoing
    // centered planet takes the slot the clicked planet just vacated.
    const nextEpoch = swapEpochRef.current + 1;
    swapEpochRef.current = nextEpoch;
    setSwapEpoch(nextEpoch);
    setDepartingCenterId(focusedId);
    setCarouselIdle(false);
    setPaintedId(null);
    setSlots((prev) => {
      const targetSlot = prev[planetId];
      const centerId = Object.keys(prev).find((id) => prev[id] === 'center');
      if (!centerId) return prev;
      return { ...prev, [planetId]: 'center', [centerId]: targetSlot };
    });
  };

  const focusedPlanet = getPlanet(focusedId);
  const canExploreFocused =
    carouselIdle && focusedPlanet?.available === true;

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden bg-void"
      initial={{ opacity: 0 }}
      animate={{ opacity: departingId ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Starfield backdrop */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.25]}>
          <Stars radius={90} depth={50} count={2000} factor={3.5} fade speed={0.3} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,6,0.85)_100%)]" />

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-active shadow-[0_0_10px_#22e06b]" />
          <span className="eyebrow text-active">Interstellar Archive</span>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <CreatorAboutButton />
          <Link
            to="/milky-way"
            className="eyebrow text-ink-faint transition hover:text-active"
          >
            Milky Way →
          </Link>
          <Link
            to="/solar-system"
            className="eyebrow text-ink-faint transition hover:text-active"
          >
            Sol System →
          </Link>
          {isDesktop !== false ? (
            <Link
              to="/lander"
              className="eyebrow text-ink-faint transition hover:text-active"
            >
              Lunar Descent →
            </Link>
          ) : null}
          <nav
            className="mt-1 flex max-w-[min(92vw,420px)] flex-wrap justify-end gap-x-2.5 gap-y-1"
            aria-label="Planet archives"
          >
            {(
              [
                ['sun', 'Sun'],
                ['mercury', 'Mercury'],
                ['venus', 'Venus'],
                ['earth', 'Earth'],
                ['mars', 'Mars'],
                ['jupiter', 'Jupiter'],
                ['saturn', 'Saturn'],
                ['uranus', 'Uranus'],
                ['neptune', 'Neptune'],
              ] as const
            ).map(([id, label]) => (
              <Link
                key={id}
                to={`/${id}`}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint/70 transition hover:text-active"
              >
                {label}
              </Link>
            ))}
            <Link
              to="/earth?focus=luna"
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint/70 transition hover:text-active"
            >
              Moon
            </Link>
          </nav>
          <span className="eyebrow hidden sm:block">MISSION CONTROL // v0.1</span>
        </div>
      </header>

      {/* Hero: focused world centered, others flanking it */}
      <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-[46%] px-2 sm:px-4">
        <div className="relative mx-auto w-full max-w-[min(98vw,1320px)]">
          {/* Planet carousel — absolute slots keep the focused body dead-center */}
          <div className="relative flex h-[min(76vh,820px)] min-h-[min(68vw,420px)] items-center justify-center">
            {heroPlanets.map((planet) => (
              <PlanetOrb
                key={planet.id}
                planet={planet}
                slot={slots[planet.id]}
                focused={slots[planet.id] === 'center'}
                onSelect={() => handlePlanetSelect(planet.id)}
                paintedId={paintedId}
                departingCenterId={departingCenterId}
                carouselIdle={carouselIdle}
                swapEpoch={swapEpoch}
                onCarouselSettled={handleCarouselSettled}
                hero
              />
            ))}
            {globeLayerReady && (
              <HeroCenterGlobeLayer
                displayGlobeId={displayGlobeId}
                visible={globeVisible}
                onPainted={handlePainted}
              />
            )}
            {canExploreFocused && (
              <button
                type="button"
                className="absolute left-1/2 top-1/2 z-[16] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-0"
                style={{ width: HERO_ORB_SIZE, height: HERO_ORB_SIZE }}
                aria-label={`${focusedPlanet.name} — click to explore`}
                onClick={() => launch(focusedId)}
              />
            )}
          </div>

          {/* Title overlaid on the focused body */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
            <motion.h1
              className="max-w-[min(88vw,680px)] text-center leading-[0.95] tracking-tight drop-shadow-[0_2px_28px_rgba(0,0,0,0.9)]"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="block text-5xl font-extrabold italic text-ink sm:text-7xl md:text-8xl lg:text-[5.5rem]">
                Interstellar.
              </span>
              <span className="block text-5xl font-extrabold text-ink-soft sm:text-7xl md:text-8xl lg:text-[5.5rem]">
                Archive.
              </span>
            </motion.h1>
            <motion.p
              className="max-w-md px-4 text-center text-sm font-medium leading-relaxed text-ink drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:max-w-lg sm:text-base"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              Cataloguing humanity&rsquo;s surface footprint across the solar system.
            </motion.p>
          </div>

          {/* Telemetry strip overlaid on lower hemisphere */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[4%] z-20 flex justify-center sm:bottom-[6%]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: departingId ? 0 : 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            key={focusedId}
          >
            <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl border border-sharp bg-deep/55 px-6 py-3 backdrop-blur-md sm:gap-14 sm:px-8 sm:py-4">
              <TelemetryCounter
                label="Successful Landings"
                value={telemetry.successfulLandings}
                accent="#22e06b"
              />
              <TelemetryCounter label="Active Assets" value={telemetry.activeAssets} />
              <TelemetryCounter
                label="Surface Mass"
                value={telemetry.totalMassKg / 1000}
                suffix="t"
                decimals={1}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
