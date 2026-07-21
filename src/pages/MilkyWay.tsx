import { Suspense, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';
import { MILKY_WAY_FACTS } from '@/solar/data/milkyWayFacts';
import { GalaxyExploreScene, getSolWorldApprox } from '@/solar/scenes/GalaxyExplore';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useTouchPrimary } from '@/utils/useTouchPrimary';

const GALAXY_CAM: [number, number, number] = [0, 18, 16];

/** Smoothly aims OrbitControls at Sol when `focusToken` increments. */
function SolFocusRig({ focusToken }: { focusToken: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const goal = useMemo(() => new Vector3(), []);
  const camGoal = useMemo(() => new Vector3(), []);
  const active = useRef(false);
  const lastToken = useRef(0);

  useFrame(() => {
    if (focusToken !== lastToken.current) {
      lastToken.current = focusToken;
      if (focusToken > 0) {
        const sol = getSolWorldApprox();
        goal.set(sol[0], sol[1], sol[2]);
        camGoal.set(sol[0] * 0.25 + 2, Math.max(9, Math.abs(sol[1]) + 9), sol[2] * 0.25 + 12);
        active.current = true;
      }
    }
    const c = controlsRef.current;
    if (!active.current || !c) return;
    camera.position.lerp(camGoal, 0.08);
    c.target.lerp(goal, 0.1);
    c.update();
    if (camera.position.distanceTo(camGoal) < 0.2) {
      active.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 + 0.45}
      minDistance={10}
      maxDistance={56}
      target={[0, 0, 0]}
      rotateSpeed={0.5}
      zoomSpeed={0.85}
      makeDefault
    />
  );
}

export function MilkyWay() {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);
  const [focusToken, setFocusToken] = useState(0);

  const isNarrow = useMediaQuery('(max-width: 767px)');
  const touchPrimary = useTouchPrimary();
  const galaxyFact = MILKY_WAY_FACTS[factIndex % MILKY_WAY_FACTS.length];

  const enterSol = () => {
    navigate('/solar-system', { state: { from: '/milky-way' } });
  };

  const canvasDpr: [number, number] = isNarrow ? [1, 1.25] : [1, 1.5];

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="shrink-0 rounded-lg px-1 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-200"
          >
            ← Home
          </Link>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Milky Way
          </h1>
        </div>
        <Link
          to="/solar-system"
          state={{ from: '/milky-way' }}
          className="pointer-events-auto hidden rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200 transition hover:border-emerald-300/50 sm:inline-flex"
        >
          Sol System →
        </Link>
      </header>

      <div className="absolute inset-0">
        <Canvas
          dpr={canvasDpr}
          camera={{ position: GALAXY_CAM, fov: isNarrow ? 52 : 45, near: 0.1, far: 400 }}
          gl={{ antialias: !isNarrow, alpha: false, powerPreference: 'high-performance' }}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <GalaxyExploreScene
              onSelectSol={enterSol}
              touchFriendly={touchPrimary || isNarrow}
              alwaysShowSolLabel
              highlightSol
            />
            <SolFocusRig focusToken={focusToken} />
          </Suspense>
        </Canvas>
      </div>

      {/* Fact card — top on mobile so it never covers Enter Sol */}
      <aside
        className={`pointer-events-auto absolute z-20 rounded-2xl border border-white/10 bg-zinc-950/85 p-3.5 backdrop-blur-md ${
          isNarrow
            ? 'inset-x-3 top-[3.4rem]'
            : 'right-4 top-20 w-[min(100%,300px)] sm:right-6'
        }`}
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Galactic context
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-50">Milky Way</h2>
        <p
          className={`mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-sm ${
            isNarrow ? 'line-clamp-2' : ''
          }`}
        >
          {galaxyFact}
        </p>
      </aside>

      <div className="pointer-events-auto absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 sm:inset-x-auto sm:left-1/2 sm:w-[min(100%-2rem,440px)] sm:-translate-x-1/2 sm:bottom-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFocusToken((n) => n + 1)}
            className="min-h-11 flex-1 rounded-xl border border-sky-400/40 bg-sky-950/70 px-3 py-2.5 text-[12px] font-semibold text-sky-100 backdrop-blur transition hover:border-sky-300/55"
          >
            Find Sol
          </button>
          <button
            type="button"
            onClick={() => setFactIndex((i) => i + 1)}
            className="min-h-11 shrink-0 rounded-xl border border-white/15 bg-zinc-950/80 px-3 py-2.5 text-[11px] font-medium text-zinc-300 backdrop-blur transition hover:border-white/30"
          >
            Next fact
          </button>
        </div>
        <button
          type="button"
          onClick={enterSol}
          className="min-h-12 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
        >
          Enter Sol System →
        </button>
        <p className="text-center text-[10px] text-zinc-500">
          {touchPrimary
            ? 'Or tap the glowing Sol marker on the disk'
            : 'Or click the glowing Sol marker on the disk'}
        </p>
      </div>
    </div>
  );
}
