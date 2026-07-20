import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { SolarPhase } from '@/solar/phases';
import { MILKY_WAY_FACTS } from '@/solar/data/milkyWayFacts';
import { SOLAR_BODIES } from '@/solar/data/bodies';
import { SOLAR_MOONS, findMoon } from '@/solar/data/moons';
import { IntroMilkyWayScene } from '@/solar/scenes/IntroMilkyWay';
import { GalaxyExploreScene } from '@/solar/scenes/GalaxyExplore';
import { SolSystemScene, type SolTimeMode } from '@/solar/scenes/SolSystem';
import { SIM_SPAN_YEARS } from '@/solar/nbody';

/** Sol framing is re-applied inside SolSystemScene — Canvas camera prop is initial-only. */
const SOL_CAM: [number, number, number] = [0, 9.5, 22];
/** Elevated look-down so the galactic plane reads as a thick disk, not an edge-on line. */
const GALAXY_CAM: [number, number, number] = [0, 18, 16];
const INTRO_CAM: [number, number, number] = [0, 2.2, 7.5];

function SidePanel({
  title,
  eyebrow,
  body,
  archiveHref,
}: {
  title: string;
  eyebrow: string;
  body: string;
  archiveHref?: string;
}) {
  return (
    <aside className="pointer-events-auto absolute right-4 top-20 z-20 w-[min(100%,300px)] rounded-2xl border border-white/10 bg-zinc-950/75 p-4 backdrop-blur-md sm:right-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      {archiveHref ? (
        <Link
          to={archiveHref}
          state={{ from: '/solar-system' }}
          className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-400/90 transition hover:text-emerald-300"
        >
          Open in Archive →
        </Link>
      ) : null}
    </aside>
  );
}

export function SolarSystem() {
  const [phase, setPhase] = useState<SolarPhase>('intro');
  const [factIndex, setFactIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>('sun');
  const [viewReset, setViewReset] = useState(0);
  const [timeMode, setTimeMode] = useState<SolTimeMode>('live');
  const [simYears, setSimYears] = useState(0);
  const [simPlaying, setSimPlaying] = useState(false);
  const [epochMs, setEpochMs] = useState(() => Date.now());
  const playRef = useRef<number | null>(null);

  const selectedPlanet = useMemo(
    () => SOLAR_BODIES.find((b) => b.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedMoon = useMemo(
    () => (selectedId ? findMoon(selectedId) ?? null : null),
    [selectedId],
  );
  const selected = selectedPlanet ?? selectedMoon;

  const galaxyFact = MILKY_WAY_FACTS[factIndex % MILKY_WAY_FACTS.length];

  const goPhase = (next: SolarPhase) => {
    setPhase(next);
  };

  const selectBody = (id: string) => {
    setSelectedId(id);
  };

  const enterLive = () => {
    setTimeMode('live');
    setSimPlaying(false);
    setSimYears(0);
    setEpochMs(Date.now());
  };

  const enterSimulate = () => {
    setEpochMs(Date.now());
    setSimYears(0);
    setSimPlaying(false);
    setTimeMode('simulate');
  };

  // Advance sim years while playing (~1 year / 2.5s wall time).
  useEffect(() => {
    if (timeMode !== 'simulate' || !simPlaying) {
      if (playRef.current != null) {
        cancelAnimationFrame(playRef.current);
        playRef.current = null;
      }
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSimYears((y) => {
        const next = y + dt * 0.4;
        if (next >= SIM_SPAN_YEARS) {
          setSimPlaying(false);
          return SIM_SPAN_YEARS;
        }
        return next;
      });
      playRef.current = requestAnimationFrame(tick);
    };
    playRef.current = requestAnimationFrame(tick);
    return () => {
      if (playRef.current != null) cancelAnimationFrame(playRef.current);
    };
  }, [timeMode, simPlaying]);

  /** Sun, Earth, planets/dwarfs, then probes (Parker, cruise craft, Voyagers) in catalog order. */
  const pickerBodies = useMemo(() => {
    const pool = SOLAR_BODIES.filter(
      (b) =>
        b.kind === 'star' ||
        b.kind === 'planet' ||
        b.kind === 'dwarf' ||
        b.kind === 'probe',
    );
    const sun = pool.filter((b) => b.id === 'sun');
    const earth = pool.filter((b) => b.id === 'earth');
    const probes = pool.filter((b) => b.kind === 'probe');
    const rest = pool.filter(
      (b) => b.id !== 'sun' && b.id !== 'earth' && b.kind !== 'probe',
    );
    return [...sun, ...earth, ...rest, ...probes];
  }, []);

  const simYearLabel = useMemo(() => {
    const d = new Date(epochMs + simYears * 365.25 * 86400000);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }, [epochMs, simYears]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            to="/"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-200"
          >
            ← Archive
          </Link>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <h1 className="text-sm font-semibold tracking-tight sm:text-base">Solar System</h1>
        </div>
        {phase !== 'intro' ? (
          <div className="pointer-events-auto flex gap-2">
            {phase === 'sol' ? (
              <button
                type="button"
                onClick={() => {
                  goPhase('galaxy');
                  setSelectedId('sun');
                  enterLive();
                }}
                className="rounded-lg border border-white/15 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-white/30"
              >
                ← Milky Way
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                goPhase('intro');
                enterLive();
              }}
              className="rounded-lg border border-white/15 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-white/30"
            >
              Restart
            </button>
          </div>
        ) : null}
      </header>

      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          camera={{
            position:
              phase === 'sol' ? SOL_CAM : phase === 'galaxy' ? GALAXY_CAM : INTRO_CAM,
            fov: 45,
            near: 0.1,
            far: 400,
          }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            {phase === 'intro' ? <IntroMilkyWayScene /> : null}
            {phase === 'galaxy' ? (
              <>
                <GalaxyExploreScene
                  onSelectSol={() => {
                    goPhase('sol');
                    setSelectedId('sun');
                    enterLive();
                  }}
                />
                <OrbitControls
                  enablePan={false}
                  minPolarAngle={0.2}
                  maxPolarAngle={Math.PI / 2 + 0.35}
                  minDistance={10}
                  maxDistance={48}
                  target={[0, 0, 0]}
                  rotateSpeed={0.45}
                />
              </>
            ) : null}
            {phase === 'sol' ? (
              <SolSystemScene
                selectedId={selectedId}
                onSelect={selectBody}
                viewReset={viewReset}
                timeMode={timeMode}
                simYears={simYears}
                epochMs={epochMs}
              />
            ) : null}
          </Suspense>
        </Canvas>
      </div>

      {phase === 'intro' ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pb-16 sm:pb-20">
          <p className="pointer-events-none text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">
            Local neighborhood
          </p>
          <h2 className="mt-2 max-w-lg text-center font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            The Milky Way
          </h2>
          <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-zinc-400">
            A stylized flight from the galactic disk to Sol — click bodies to focus, read dossiers,
            and explore our neighborhood at museum pace.
          </p>
          <button
            type="button"
            onClick={() => goPhase('galaxy')}
            className="pointer-events-auto mt-8 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Enter the Milky Way
          </button>
        </div>
      ) : null}

      {phase === 'galaxy' ? (
        <>
          <SidePanel
            eyebrow="Galactic context"
            title="Milky Way"
            body={galaxyFact}
          />
          <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            <button
              type="button"
              onClick={() => setFactIndex((i) => i + 1)}
              className="rounded-full border border-white/15 bg-zinc-950/70 px-4 py-2 text-[11px] font-medium text-zinc-300 backdrop-blur transition hover:border-white/30"
            >
              Next fact
            </button>
            <p className="rounded-full border border-white/10 bg-zinc-950/60 px-4 py-2 text-[11px] text-zinc-500 backdrop-blur">
              Drag to look · click the Sol point
            </p>
          </div>
        </>
      ) : null}

      {phase === 'sol' && selected ? (
        <SidePanel
          eyebrow={selectedPlanet?.kind ?? 'moon'}
          title={selected.name}
          body={selected.fact}
          archiveHref={
            selected.archivePlanetId ? `/${selected.archivePlanetId}` : undefined
          }
        />
      ) : null}

      {phase === 'sol' ? (
        <>
          {/* Live / Simulate 10y */}
          <div className="pointer-events-auto absolute left-4 top-20 z-20 flex w-[min(100%-2rem,280px)] flex-col gap-2 sm:left-6">
            <div className="flex rounded-lg border border-white/10 bg-zinc-950/75 p-0.5 backdrop-blur-md">
              <button
                type="button"
                onClick={enterLive}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition ${
                  timeMode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Live sky
              </button>
              <button
                type="button"
                onClick={enterSimulate}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition ${
                  timeMode === 'simulate'
                    ? 'bg-amber-400/20 text-amber-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Simulate 10y
              </button>
            </div>
            {timeMode === 'simulate' ? (
              <div className="rounded-xl border border-white/10 bg-zinc-950/75 px-3 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    N-body · {simYearLabel}
                  </p>
                  <p className="text-[10px] tabular-nums text-zinc-400">
                    +{simYears.toFixed(2)}y
                  </p>
                </div>
                <input
                  type="range"
                  min={0}
                  max={SIM_SPAN_YEARS}
                  step={0.02}
                  value={simYears}
                  onChange={(e) => {
                    setSimPlaying(false);
                    setSimYears(Number(e.target.value));
                  }}
                  className="mt-2 w-full accent-amber-400"
                />
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSimPlaying((p) => !p)}
                    className="rounded-md border border-white/15 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-200 transition hover:border-white/30"
                  >
                    {simPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={enterLive}
                    className="rounded-md border border-white/15 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition hover:border-white/30"
                  >
                    Reset to live
                  </button>
                </div>
              </div>
            ) : (
              <p className="px-0.5 text-[10px] leading-relaxed text-zinc-600">
                Positions from approximate J2000 ephemeris · {SOLAR_MOONS.length} moons
              </p>
            )}
          </div>

          <div className="pointer-events-auto absolute bottom-14 left-1/2 z-20 flex w-[min(100%-2rem,720px)] -translate-x-1/2 items-center gap-1.5 overflow-x-auto pb-1">
            {pickerBodies.map((b) => {
              const active =
                selectedId === b.id ||
                (selectedMoon != null && selectedMoon.parentId === b.id && !selectedPlanet);
              const isEarth = b.id === 'earth';
              const isProbe = b.kind === 'probe';
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBody(b.id)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold tracking-wide transition ${
                    active
                      ? isEarth
                        ? 'border-sky-400/60 bg-sky-400/20 text-sky-50'
                        : isProbe
                          ? 'border-cyan-400/55 bg-cyan-400/15 text-cyan-50'
                          : 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                      : isEarth
                        ? 'border-sky-400/35 bg-sky-950/70 text-sky-200 hover:border-sky-300/50 hover:text-sky-50'
                        : isProbe
                          ? 'border-cyan-400/30 bg-cyan-950/60 text-cyan-200/90 hover:border-cyan-300/45 hover:text-cyan-50'
                          : 'border-white/10 bg-zinc-950/70 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setSelectedId('sun');
                setViewReset((n) => n + 1);
              }}
              className="ml-1 shrink-0 rounded-lg border border-white/15 bg-zinc-900/80 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-zinc-300 transition hover:border-white/30 hover:text-zinc-100"
            >
              Reset view
            </button>
          </div>
          <p className="pointer-events-none absolute bottom-5 left-5 z-20 max-w-xs text-[10px] leading-relaxed text-zinc-600">
            Drag to orbit · scroll to zoom · click a body or moon to fly to it. Approximate
            ephemeris — museum-scale, not DE440.
          </p>
        </>
      ) : null}
    </div>
  );
}
