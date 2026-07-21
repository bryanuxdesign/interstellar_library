import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { SOLAR_BODIES } from '@/solar/data/bodies';
import { SOLAR_MOONS, findMoon } from '@/solar/data/moons';
import { SolSystemScene, type SolTimeMode } from '@/solar/scenes/SolSystem';
import { SIM_SPAN_YEARS } from '@/solar/nbody';
import { TourSidePanel } from '@/solar/TourSidePanel';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useTouchPrimary } from '@/utils/useTouchPrimary';

/** Sol framing is re-applied inside SolSystemScene — Canvas camera prop is initial-only. */
const SOL_CAM: [number, number, number] = [0, 9.5, 22];

export function SolarSystem() {
  const [selectedId, setSelectedId] = useState<string | null>('sun');
  const [viewReset, setViewReset] = useState(0);
  const [timeMode, setTimeMode] = useState<SolTimeMode>('live');
  const [simYears, setSimYears] = useState(0);
  const [simPlaying, setSimPlaying] = useState(false);
  const [epochMs, setEpochMs] = useState(() => Date.now());
  const [simOpen, setSimOpen] = useState(false);
  const playRef = useRef<number | null>(null);

  const isNarrow = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const touchPrimary = useTouchPrimary();

  const selectedPlanet = useMemo(
    () => SOLAR_BODIES.find((b) => b.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedMoon = useMemo(
    () => (selectedId ? findMoon(selectedId) ?? null : null),
    [selectedId],
  );
  const selected = selectedPlanet ?? selectedMoon;

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
    setSimOpen(true);
  };

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

  const orbitHint = touchPrimary
    ? 'Drag to orbit · pinch to zoom · tap a body'
    : 'Drag to orbit · scroll to zoom · click a body or moon';

  const canvasDpr: [number, number] = isNarrow ? [1, 1.25] : isTablet ? [1, 1.5] : [1, 1.75];

  /** Distinguishes empty-space click (reset) from orbit drag. */
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const resetToSolOverview = () => {
    setSelectedId('sun');
    setViewReset((n) => n + 1);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950 text-zinc-100 supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/milky-way"
            className="shrink-0 rounded-lg px-1 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-200"
          >
            ← Milky Way
          </Link>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Sol System
          </h1>
        </div>
        <Link
          to="/"
          className="pointer-events-auto rounded-lg border border-white/15 bg-zinc-900/80 px-2.5 py-2 text-[10px] font-medium text-zinc-300 transition hover:border-white/30 sm:px-3 sm:text-[11px]"
        >
          Home
        </Link>
      </header>

      <div
        className="absolute inset-0"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          pointerDownRef.current = { x: e.clientX, y: e.clientY };
        }}
      >
        <Canvas
          dpr={canvasDpr}
          camera={{ position: SOL_CAM, fov: isNarrow ? 50 : 45, near: 0.1, far: 400 }}
          gl={{ antialias: !isNarrow, alpha: false, powerPreference: 'high-performance' }}
          style={{ touchAction: 'none' }}
          onPointerMissed={(e) => {
            const start = pointerDownRef.current;
            pointerDownRef.current = null;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            // Ignore orbit/pan drags — only a short tap/click in empty space resets.
            if (dx * dx + dy * dy > 36) return;
            if (selectedId === 'sun') {
              setViewReset((n) => n + 1);
              return;
            }
            resetToSolOverview();
          }}
        >
          <Suspense fallback={null}>
            <SolSystemScene
              selectedId={selectedId}
              onSelect={selectBody}
              viewReset={viewReset}
              timeMode={timeMode}
              simYears={simYears}
              epochMs={epochMs}
            />
          </Suspense>
        </Canvas>
      </div>

      {selected ? (
        <TourSidePanel
          eyebrow={selectedPlanet?.kind ?? 'moon'}
          title={selected.name}
          body={selected.fact}
          archiveHref={
            selected.archivePlanetId === 'moon'
              ? '/earth?focus=luna'
              : selected.archivePlanetId
                ? `/${selected.archivePlanetId}`
                : undefined
          }
          compact={isNarrow || isTablet}
        />
      ) : null}

      <div
        className={`pointer-events-auto absolute z-20 flex flex-col gap-2 ${
          isNarrow
            ? 'left-3 top-[3.25rem] w-[min(100%-1.5rem,11.5rem)]'
            : 'left-4 top-20 w-[min(100%-2rem,280px)] sm:left-6'
        }`}
      >
        <div className="flex rounded-lg border border-white/10 bg-zinc-950/80 p-0.5 backdrop-blur-md">
          <button
            type="button"
            onClick={enterLive}
            className={`min-h-9 flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold tracking-wide transition ${
              timeMode === 'live'
                ? 'bg-emerald-500/20 text-emerald-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={enterSimulate}
            className={`min-h-9 flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold tracking-wide transition ${
              timeMode === 'simulate'
                ? 'bg-amber-400/20 text-amber-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isNarrow ? '10y' : 'Simulate 10y'}
          </button>
        </div>
        {timeMode === 'simulate' && (!isNarrow || simOpen) ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                N-body · {simYearLabel}
              </p>
              {isNarrow ? (
                <button
                  type="button"
                  onClick={() => setSimOpen(false)}
                  className="text-[10px] text-zinc-500"
                  aria-label="Collapse simulator"
                >
                  Hide
                </button>
              ) : (
                <p className="text-[10px] tabular-nums text-zinc-400">
                  +{simYears.toFixed(2)}y
                </p>
              )}
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
                className="min-h-9 rounded-md border border-white/15 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-200 transition hover:border-white/30"
              >
                {simPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={enterLive}
                className="min-h-9 rounded-md border border-white/15 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition hover:border-white/30"
              >
                Live
              </button>
            </div>
          </div>
        ) : timeMode === 'simulate' && isNarrow ? (
          <button
            type="button"
            onClick={() => setSimOpen(true)}
            className="rounded-lg border border-amber-400/30 bg-amber-950/50 px-2.5 py-1.5 text-left text-[10px] font-medium text-amber-100/90 backdrop-blur"
          >
            Sim +{simYears.toFixed(1)}y · controls
          </button>
        ) : !isNarrow ? (
          <p className="px-0.5 text-[10px] leading-relaxed text-zinc-600">
            Positions from approximate J2000 ephemeris · {SOLAR_MOONS.length} moons
          </p>
        ) : null}
      </div>

      <div
        className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex w-[min(100%-1rem,720px)] -translate-x-1/2 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
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
              className={`min-h-10 shrink-0 rounded-lg border px-3 py-2 text-[10px] font-semibold tracking-wide transition ${
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
              onClick={resetToSolOverview}
              className="ml-1 min-h-10 shrink-0 rounded-lg border border-white/15 bg-zinc-900/80 px-3 py-2 text-[10px] font-semibold tracking-wide text-zinc-300 transition hover:border-white/30 hover:text-zinc-100"
            >
              Reset
            </button>
      </div>
      {!isNarrow ? (
        <p className="pointer-events-none absolute bottom-5 left-5 z-20 max-w-xs text-[10px] leading-relaxed text-zinc-600">
          {orbitHint}. Approximate ephemeris — museum-scale, not DE440.
        </p>
      ) : null}
    </div>
  );
}
