import { Suspense, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Group, Vector3 } from 'three';
import { planets } from '@/data/planets';
import { computeTelemetry } from '@/data/telemetry';
import { CelestialGlobe, GlobeFallback } from '@/three/CelestialGlobe';
import { TelemetryCounter } from '@/components/gateway/TelemetryCounter';

const telemetry = computeTelemetry('moon');

function IntroGlobe({ departing }: { departing: boolean }) {
  const ref = useRef<Group>(null);
  const scratch = useRef(new Vector3());

  useFrame(() => {
    if (!ref.current) return;
    const target = departing ? 3.4 : 1;
    ref.current.scale.lerp(scratch.current.set(target, target, target), 0.08);
  });

  return (
    <group ref={ref} scale={0.2}>
      <CelestialGlobe autoRotate rotationSpeed={0.05} radius={2.1} />
    </group>
  );
}

export function Gateway() {
  const navigate = useNavigate();
  const [departingId, setDepartingId] = useState<string | null>(null);

  const launch = (planetId: string) => {
    setDepartingId(planetId);
    window.setTimeout(() => navigate(`/${planetId}`), 650);
  };

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden bg-void"
      initial={{ opacity: 0 }}
      animate={{ opacity: departingId ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Backdrop 3D viewport */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 2, 5]} intensity={2.4} color="#fff6ec" />
          <Stars radius={90} depth={50} count={5000} factor={4} fade speed={0.4} />
          <Suspense fallback={<GlobeFallback radius={2.1} />}>
            <IntroGlobe departing={departingId !== null} />
          </Suspense>
        </Canvas>
      </div>

      {/* Vignette for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,6,0.85)_100%)]" />

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 sm:p-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-active shadow-[0_0_10px_#22e06b]" />
            <span className="eyebrow text-active">Interstellar Archive</span>
          </div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-soft">
            Cataloguing humanity&rsquo;s surface footprint across the solar system.
          </p>
        </div>
        <span className="eyebrow hidden sm:block">MISSION CONTROL // v0.1</span>
      </header>

      {/* Title + telemetry */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-6 text-center">
        <motion.h1
          className="text-5xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          THE SURFACE
          <br />
          <span className="text-ink-soft">OF EVERYTHING</span>
        </motion.h1>
      </div>

      {/* Telemetry strip */}
      <motion.div
        className="absolute inset-x-0 bottom-40 flex justify-center px-6 md:bottom-44"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: departingId ? 0 : 1 }}
        transition={{ delay: 0.35, duration: 0.7 }}
      >
        <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl border border-sharp bg-deep/55 px-8 py-4 backdrop-blur-md sm:gap-14">
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

      {/* Destination selector */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-stretch">
          {planets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              disabled={!planet.available}
              onClick={() => planet.available && launch(planet.id)}
              className={`group flex-1 rounded-lg border px-4 py-3 text-left backdrop-blur transition ${
                planet.available
                  ? 'border-strong bg-panel hover:border-active hover:bg-raised'
                  : 'cursor-not-allowed border-sharp bg-panel/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    planet.available ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  {planet.name}
                </span>
                <span
                  className={`eyebrow ${
                    planet.available ? 'text-active' : 'text-ink-soft'
                  }`}
                >
                  {planet.available ? 'ENTER →' : 'SOON'}
                </span>
              </div>
              <span className="mt-1 block text-[11px] text-ink-soft">
                {planet.available ? planet.subtitle : `${planet.subtitle} · Coming soon`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
