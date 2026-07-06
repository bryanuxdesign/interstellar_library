import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import {
  GATEWAY_CARD_ORDER,
  GATEWAY_PLANET_ORDER,
  getPlanet,
} from '@/data/planets';
import { computeTelemetry } from '@/data/telemetry';
import { PlanetOrb } from '@/components/gateway/PlanetOrb';
import { TelemetryCounter } from '@/components/gateway/TelemetryCounter';
import { CreatorAboutButton } from '@/components/ui/CreatorAbout';

export function Gateway() {
  const navigate = useNavigate();
  const [focusedId, setFocusedId] = useState<string>('moon');
  const [departingId, setDepartingId] = useState<string | null>(null);

  const heroPlanets = useMemo(
    () =>
      GATEWAY_PLANET_ORDER.map((id) => getPlanet(id)).filter(
        (p): p is NonNullable<typeof p> => p !== undefined,
      ),
    [],
  );

  const cardPlanets = useMemo(
    () =>
      GATEWAY_CARD_ORDER.map((id) => getPlanet(id)).filter(
        (p): p is NonNullable<typeof p> => p !== undefined,
      ),
    [],
  );

  const telemetry = useMemo(() => computeTelemetry(focusedId), [focusedId]);

  const launch = (planetId: string) => {
    const planet = getPlanet(planetId);
    if (!planet?.available) return;
    setDepartingId(planetId);
    window.setTimeout(() => navigate(`/${planetId}`), 650);
  };

  const handlePlanetSelect = (planetId: string) => {
    if (focusedId === planetId) {
      launch(planetId);
      return;
    }
    setFocusedId(planetId);
  };

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden bg-void"
      initial={{ opacity: 0 }}
      animate={{ opacity: departingId ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Starfield backdrop */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}>
          <Stars radius={90} depth={50} count={5000} factor={4} fade speed={0.4} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,6,0.85)_100%)]" />

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6 sm:p-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-active shadow-[0_0_10px_#22e06b]" />
            <span className="eyebrow text-active">Interstellar Archive</span>
          </div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-soft">
            Cataloguing humanity&rsquo;s surface footprint across the solar system.
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <CreatorAboutButton />
          <span className="eyebrow hidden sm:block">MISSION CONTROL // v0.1</span>
        </div>
      </header>

      {/* Hero: Venus · Moon · Mars with title + telemetry overlaid */}
      <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-[46%] px-2 sm:px-4">
        <div className="relative mx-auto w-full max-w-[min(98vw,1320px)]">
          {/* Planet cluster — flanking worlds at the sides of the moon */}
          <div className="relative flex h-[min(76vh,820px)] min-h-[min(68vw,420px)] items-center justify-center">
            {heroPlanets.map((planet) => (
              <PlanetOrb
                key={planet.id}
                planet={planet}
                focused={focusedId === planet.id}
                onSelect={() => handlePlanetSelect(planet.id)}
                hero
              />
            ))}
          </div>

          {/* Title overlaid on the focused body */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.h1
              className="max-w-[min(88vw,680px)] text-center text-5xl font-extrabold leading-[0.95] tracking-tight text-ink drop-shadow-[0_2px_28px_rgba(0,0,0,0.9)] sm:text-7xl md:text-8xl lg:text-[5.5rem]"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              THE SURFACE
              <br />
              <span className="text-ink-soft">OF EVERYTHING</span>
            </motion.h1>
          </div>

          {/* Telemetry strip overlaid on lower hemisphere */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[4%] flex justify-center sm:bottom-[6%]"
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

      {/* Destination selector */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-stretch">
          {cardPlanets.map((planet) => {
            const focused = focusedId === planet.id;
            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => handlePlanetSelect(planet.id)}
                className={`group flex-1 rounded-lg border px-4 py-3 text-left backdrop-blur transition ${
                  focused
                    ? planet.available
                      ? 'border-active bg-panel hover:bg-raised'
                      : 'border-active/40 bg-panel/80'
                    : planet.available
                      ? 'border-strong bg-panel hover:border-active hover:bg-raised'
                      : 'border-sharp bg-panel/70 hover:border-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      planet.available || focused ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {planet.name}
                  </span>
                  <span
                    className={`eyebrow ${
                      planet.available && focused
                        ? 'text-active'
                        : planet.available
                          ? 'text-ink-soft group-hover:text-active'
                          : 'text-ink-soft'
                    }`}
                  >
                    {planet.available ? (focused ? 'ENTER →' : 'SELECT') : 'SOON'}
                  </span>
                </div>
                <span className="mt-1 block text-[11px] text-ink-soft">
                  {planet.available
                    ? planet.subtitle
                    : `${planet.subtitle} · Coming soon`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
