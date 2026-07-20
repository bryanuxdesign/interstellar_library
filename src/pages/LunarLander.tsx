import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LANDER_PROFILES,
  LANDER_PROFILE_LIST,
  thrustForceAt,
  type LanderProfileId,
} from '@/lander/profiles';
import {
  createInitialLander,
  stepPhysics,
  GRAVITY,
  DEFAULT_THROTTLE,
  LANDER_FOOT_OFFSET,
} from '@/lander/physics';
import {
  clearParticles,
  createParticleSystem,
  spawnCrashDust,
  spawnSurfacePlumeDust,
  spawnTouchdownDust,
  updateParticles,
} from '@/lander/particles';
import { generateTerrain, terrainHeightAt } from '@/lander/terrain';
import { computeCamera, renderFrame, ZOOM_OUT_MAX, ZOOM_OUT_MIN, ZOOM_OUT_STEP } from '@/lander/render';
import type { CrashReason, GamePhase, LanderState, Terrain } from '@/lander/types';

const THROTTLE_STEP = 0.05;
/** Delay before crash overlay so dust / impact can play out. */
const CRASH_OVERLAY_DELAY_MS = 1400;

const CRASH_COPY: Record<CrashReason, string> = {
  fuel: 'Fuel depleted — unable to arrest descent.',
  'hard-landing': 'Vertical velocity exceeded safe limit (2.0).',
  tilt: 'Attitude exceeded ±5° from upright.',
  horizontal: 'Horizontal velocity exceeded safe limit (1.0).',
};

function ControlButton({
  label,
  active,
  onDown,
  onUp,
  className = '',
}: {
  label: string;
  active: boolean;
  onDown: () => void;
  onUp: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`select-none rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide transition active:scale-95 ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
          : 'border-white/15 bg-zinc-900/80 text-zinc-200 hover:border-white/30'
      } ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
    >
      {label}
    </button>
  );
}

export function LunarLander() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const landerRef = useRef<LanderState | null>(null);
  const terrainRef = useRef<Terrain | null>(null);
  const particlesRef = useRef(createParticleSystem());
  const zoomOutRef = useRef(1);
  const phaseRef = useRef<GamePhase>('ready');
  const profileIdRef = useRef<LanderProfileId>('apollo');
  const inputRef = useRef({
    engineOn: false,
    throttle: DEFAULT_THROTTLE,
    left: false,
    right: false,
  });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const crashOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileId, setProfileId] = useState<LanderProfileId>('apollo');
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [crashReason, setCrashReason] = useState<CrashReason | undefined>();
  const [showCrashOverlay, setShowCrashOverlay] = useState(false);
  const [groundedUi, setGroundedUi] = useState(false);
  const [zoomOut, setZoomOut] = useState(1);
  const [hud, setHud] = useState({
    altitude: 0,
    vx: 0,
    vy: 0,
    fuel: 1000,
    fuelMax: 1000,
    angle: 0,
    engineOn: false,
    throttle: DEFAULT_THROTTLE,
    grounded: false,
  });
  const [engineOnUi, setEngineOnUi] = useState(false);
  const [leftHeld, setLeftHeld] = useState(false);
  const [rightHeld, setRightHeld] = useState(false);
  const [missionKey, setMissionKey] = useState(0);

  const profile = LANDER_PROFILES[profileId];

  const syncHudFromLander = useCallback((lander: LanderState, terrain: Terrain, pid: LanderProfileId) => {
    const ground = terrainHeightAt(terrain, lander.x);
    setHud({
      altitude: Math.max(0, lander.y - LANDER_FOOT_OFFSET - ground),
      vx: lander.vx,
      vy: lander.vy,
      fuel: lander.fuel,
      fuelMax: LANDER_PROFILES[pid].fuel,
      angle: lander.angle,
      engineOn: lander.engineOn,
      throttle: lander.throttle,
      grounded: lander.grounded,
    });
    setGroundedUi(lander.grounded);
  }, []);

  const nudgeZoom = useCallback((delta: number) => {
    setZoomOut((z) => {
      const next = Math.max(ZOOM_OUT_MIN, Math.min(ZOOM_OUT_MAX, Math.round((z + delta) * 100) / 100));
      zoomOutRef.current = next;
      return next;
    });
  }, []);

  const resetMission = useCallback((nextProfileId: LanderProfileId = profileIdRef.current) => {
    if (crashOverlayTimerRef.current) {
      clearTimeout(crashOverlayTimerRef.current);
      crashOverlayTimerRef.current = null;
    }
    const terrain = generateTerrain(Date.now() + Math.floor(Math.random() * 1e6));
    const lander = createInitialLander(LANDER_PROFILES[nextProfileId], terrain);
    terrainRef.current = terrain;
    landerRef.current = lander;
    clearParticles(particlesRef.current);
    phaseRef.current = 'ready';
    profileIdRef.current = nextProfileId;
    inputRef.current = {
      engineOn: false,
      throttle: DEFAULT_THROTTLE,
      left: false,
      right: false,
    };
    setPhase('ready');
    setCrashReason(undefined);
    setShowCrashOverlay(false);
    setGroundedUi(false);
    setEngineOnUi(false);
    setLeftHeld(false);
    setRightHeld(false);
    zoomOutRef.current = 1;
    setZoomOut(1);
    setMissionKey((k) => k + 1);
    syncHudFromLander(lander, terrain, nextProfileId);
  }, [syncHudFromLander]);

  const beginMission = useCallback(() => {
    if (phaseRef.current !== 'ready') return;
    phaseRef.current = 'playing';
    setPhase('playing');
  }, []);

  const toggleEngine = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const next = !inputRef.current.engineOn;
    inputRef.current.engineOn = next;
    setEngineOnUi(next);
    if (landerRef.current) landerRef.current.engineOn = next;
  }, []);

  const adjustThrottle = useCallback((delta: number) => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'ready') return;
    const stepped = Math.round((inputRef.current.throttle + delta) / THROTTLE_STEP) * THROTTLE_STEP;
    const next = Math.max(0, Math.min(1, stepped));
    inputRef.current.throttle = next;
    if (landerRef.current) landerRef.current.throttle = next;
    setHud((h) => ({ ...h, throttle: next }));
  }, []);

  const setRotate = useCallback((partial: Partial<{ left: boolean; right: boolean }>) => {
    inputRef.current = { ...inputRef.current, ...partial };
    if (partial.left !== undefined) setLeftHeld(partial.left);
    if (partial.right !== undefined) setRightHeld(partial.right);
  }, []);

  useEffect(() => {
    resetMission(profileId);
  }, [resetMission, profileId]);

  useEffect(() => {
    return () => {
      if (crashOverlayTimerRef.current) clearTimeout(crashOverlayTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const isThrottleKey =
        k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's';
      if (e.repeat && !isThrottleKey) return;

      if (k === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        resetMission(profileIdRef.current);
        return;
      }

      if (k === '=' || k === '+' || k === ']') {
        e.preventDefault();
        nudgeZoom(ZOOM_OUT_STEP);
        return;
      }
      if (k === '-' || k === '_' || k === '[') {
        e.preventDefault();
        nudgeZoom(-ZOOM_OUT_STEP);
        return;
      }

      if (k === ' ' || k === 'spacebar') {
        e.preventDefault();
        if (phaseRef.current === 'ready') {
          beginMission();
          return;
        }
        if (phaseRef.current === 'playing') {
          toggleEngine();
        }
        return;
      }

      if (k === 'enter' && phaseRef.current === 'ready') {
        e.preventDefault();
        beginMission();
        return;
      }

      if (phaseRef.current !== 'playing' && phaseRef.current !== 'ready') return;

      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        adjustThrottle(THROTTLE_STEP);
      }
      if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        adjustThrottle(-THROTTLE_STEP);
      }

      if (phaseRef.current !== 'playing') return;

      if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        setRotate({ left: true });
      }
      if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        setRotate({ right: true });
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') setRotate({ left: false });
      if (k === 'arrowright' || k === 'd') setRotate({ right: false });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [adjustThrottle, beginMission, nudgeZoom, resetMission, setRotate, toggleEngine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let hudAcc = 0;
    lastTsRef.current = performance.now();

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const rawDt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const dt = Math.min(rawDt, 0.033);

      const lander = landerRef.current;
      const terrain = terrainRef.current;
      if (!lander || !terrain) return;

      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const particles = particlesRef.current;

      if (phaseRef.current === 'ready') {
        lander.throttle = inputRef.current.throttle;
        lander.engineOn = false;
        lander.thrusting = false;
      } else if (phaseRef.current === 'playing') {
        lander.engineOn = inputRef.current.engineOn;
        lander.throttle = inputRef.current.throttle;
        lander.rotatingLeft = inputRef.current.left;
        lander.rotatingRight = inputRef.current.right;

        const wasGrounded = lander.grounded;
        const result = stepPhysics(
          lander,
          LANDER_PROFILES[profileIdRef.current],
          terrain,
          dt,
        );
        landerRef.current = result.lander;

        for (const ev of result.events) {
          if (ev.type === 'touchdown') {
            spawnTouchdownDust(particles, ev.x, ev.groundY, ev.impactSpeed);
          } else if (ev.type === 'liftoff') {
            spawnTouchdownDust(particles, ev.x, ev.groundY, 0.8);
          } else if (ev.type === 'surface-plume') {
            spawnSurfacePlumeDust(particles, ev.x, ev.groundY, ev.throttle, dt);
          } else if (ev.type === 'crash') {
            spawnCrashDust(particles, ev.x, ev.groundY, ev.impactSpeed);
          }
        }

        if (result.phase === 'crashed') {
          phaseRef.current = 'crashed';
          setPhase('crashed');
          setCrashReason(result.crashReason);
          setShowCrashOverlay(false);
          inputRef.current.engineOn = false;
          setEngineOnUi(false);
          if (crashOverlayTimerRef.current) clearTimeout(crashOverlayTimerRef.current);
          crashOverlayTimerRef.current = setTimeout(() => {
            setShowCrashOverlay(true);
          }, CRASH_OVERLAY_DELAY_MS);
        } else if (wasGrounded !== result.lander.grounded) {
          setGroundedUi(result.lander.grounded);
        }
      } else if (phaseRef.current === 'crashed') {
        // Keep animating dust after impact; craft is frozen.
      }

      updateParticles(particles, dt);

      const cam = computeCamera(landerRef.current!, terrain, zoomOutRef.current);
      renderFrame(
        ctx,
        w,
        h,
        landerRef.current!,
        terrain,
        cam,
        phaseRef.current,
        particles,
      );

      hudAcc += dt;
      if (hudAcc >= 0.08) {
        hudAcc = 0;
        const L = landerRef.current!;
        const ground = terrainHeightAt(terrain, L.x);
        const altitude = Math.max(0, L.y - LANDER_FOOT_OFFSET - ground);
        setHud({
          altitude,
          vx: L.vx,
          vy: L.vy,
          fuel: L.fuel,
          fuelMax: LANDER_PROFILES[profileIdRef.current].fuel,
          angle: L.angle,
          engineOn: L.engineOn,
          throttle: L.throttle,
          grounded: L.grounded,
        });
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [missionKey]);

  const fuelPct = (hud.fuel / Math.max(hud.fuelMax, 1)) * 100;
  const throttlePct = Math.round(hud.throttle * 100);
  const currentForce = thrustForceAt(profile, hud.throttle);
  const vyDanger = Math.abs(hud.vy) >= 2;
  const vxDanger = Math.abs(hud.vx) >= 1;
  const angleDanger = Math.abs(hud.angle) >= 5;
  const vsMode = hud.grounded
    ? 'LANDED'
    : hud.vy < -0.05
      ? 'DESCENT'
      : hud.vy > 0.05
        ? 'ASCENT'
        : 'HOVER';
  const vsArrow = hud.vy < -0.05 ? '↓' : hud.vy > 0.05 ? '↑' : '·';
  const hsArrow = hud.vx < -0.05 ? '←' : hud.vx > 0.05 ? '→' : '·';

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-200"
          >
            ← Archive
          </Link>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">
            Lunar Descent
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="hidden sm:inline">Craft</span>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value as LanderProfileId)}
              className="max-w-[180px] rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-emerald-500/50 sm:max-w-none"
            >
              {LANDER_PROFILE_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => nudgeZoom(ZOOM_OUT_STEP)}
            disabled={zoomOut >= ZOOM_OUT_MAX}
            className="rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 disabled:opacity-40"
            title="Zoom out (]) — see more surface"
          >
            Zoom out
          </button>
          <button
            type="button"
            onClick={() => nudgeZoom(-ZOOM_OUT_STEP)}
            disabled={zoomOut <= ZOOM_OUT_MIN}
            className="rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 disabled:opacity-40"
            title="Zoom in ([)"
          >
            Zoom in
          </button>
          <button
            type="button"
            onClick={() => resetMission(profileId)}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-500/20"
          >
            Reset
          </button>
        </div>
      </header>

      <div ref={wrapRef} className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-3 p-3 sm:p-4">
          <div className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-md sm:min-w-[180px]">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Surface relative
            </p>
            <div className="mt-2 space-y-1.5 font-mono text-[11px] sm:text-xs">
              <HudRow label="ALT" value={`${hud.altitude.toFixed(0)} m`} />
              <HudRow
                label="VS"
                value={`${vsArrow} ${Math.abs(hud.vy).toFixed(2)} m/s`}
                danger={vyDanger}
                accent={
                  vsMode === 'ASCENT'
                    ? 'text-sky-400'
                    : vsMode === 'DESCENT'
                      ? 'text-amber-300'
                      : vsMode === 'LANDED'
                        ? 'text-emerald-400'
                        : undefined
                }
              />
              <p
                className={`text-[9px] font-semibold tracking-[0.14em] ${
                  vsMode === 'ASCENT'
                    ? 'text-sky-400'
                    : vsMode === 'DESCENT'
                      ? 'text-amber-300'
                      : vsMode === 'LANDED'
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                }`}
              >
                {vsMode}
              </p>
              <HudRow
                label="HS"
                value={`${hsArrow} ${Math.abs(hud.vx).toFixed(2)} m/s`}
                danger={vxDanger}
              />
              <HudRow
                label="ATT"
                value={`${hud.angle >= 0 ? '+' : ''}${hud.angle.toFixed(1)}°`}
                danger={angleDanger}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-md sm:min-w-[150px]">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Propulsion
            </p>
            <div className="mt-2 space-y-1.5 font-mono text-[11px] sm:text-xs">
              <HudRow
                label="ENG"
                value={hud.engineOn ? 'ON' : 'OFF'}
                accent={hud.engineOn ? 'text-emerald-400' : 'text-zinc-500'}
              />
              <HudRow label="THR" value={`${throttlePct}%`} />
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-75 ${
                    hud.engineOn ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                  style={{ width: `${throttlePct}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                {currentForce.toFixed(1)} / {profile.maxThrust} F
                <span className="text-zinc-600"> · min {profile.minThrust}</span>
              </p>
            </div>
            <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Propellant
            </p>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${
                  fuelPct < 15
                    ? 'bg-red-500'
                    : fuelPct < 40
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, fuelPct)}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-zinc-300">
              {hud.fuel.toFixed(0)} / {hud.fuelMax}
            </p>
            <p className="mt-2 max-w-[170px] text-[10px] leading-snug text-zinc-500">
              {profile.description}
            </p>
          </div>
        </div>

        {groundedUi && phase === 'playing' && (
          <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] flex justify-center px-3 sm:top-28">
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
              Touchdown — engine on + raise throttle to launch
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-[10px] text-zinc-500 backdrop-blur sm:block">
          Soft land anywhere: VS &lt; 2 · HS &lt; 1 · |ATT| &lt; 5° · then launch again
        </div>

        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="button"
            onClick={() => resetMission(profileId)}
            className="rounded-xl border border-amber-500/40 bg-zinc-950/80 px-4 py-2 text-xs font-semibold text-amber-200 backdrop-blur transition hover:border-amber-400/60 hover:bg-amber-500/15"
          >
            Reset mission
          </button>
        </div>

        {phase === 'ready' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                Pre-descent
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
                Ready for lunar descent
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Land softly anywhere, kick up dust, then throttle up to fly again.
                Hard impacts still wreck the craft — use Reset anytime (or press R).
              </p>
              <button
                type="button"
                onClick={beginMission}
                className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Start Descent
              </button>
              <p className="mt-3 text-[11px] text-zinc-500">or press Space / Enter</p>
            </div>
          </div>
        )}

        {phase === 'crashed' && showCrashOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
                Hard impact
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
                Craft wrecked
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {crashReason ? CRASH_COPY[crashReason] : 'Contact lost.'}
              </p>
              <button
                type="button"
                onClick={() => resetMission(profileId)}
                className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Reset mission
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-zinc-950 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-xl flex-wrap items-stretch justify-center gap-2 sm:gap-3">
          <ControlButton
            label="⟲ Left"
            active={leftHeld}
            onDown={() => setRotate({ left: true })}
            onUp={() => setRotate({ left: false })}
            className="min-w-[72px] flex-1"
          />
          <button
            type="button"
            onClick={() => adjustThrottle(-THROTTLE_STEP)}
            className="min-w-[56px] flex-1 select-none rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/30 active:scale-95"
          >
            Thrust −
          </button>
          <button
            type="button"
            onClick={toggleEngine}
            disabled={phase !== 'playing'}
            className={`min-w-[88px] flex-[1.2] select-none rounded-xl border px-3 py-3 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
              engineOnUi
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                : 'border-white/15 bg-zinc-900/80 text-zinc-200 hover:border-white/30'
            }`}
          >
            Engine {engineOnUi ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => adjustThrottle(THROTTLE_STEP)}
            className="min-w-[56px] flex-1 select-none rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/30 active:scale-95"
          >
            Thrust +
          </button>
          <ControlButton
            label="Right ⟳"
            active={rightHeld}
            onDown={() => setRotate({ right: true })}
            onUp={() => setRotate({ right: false })}
            className="min-w-[72px] flex-1"
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Space engine · ↑/↓ throttle · A/D rotate · [ ] zoom · R reset · g=
          {GRAVITY.toFixed(1)}
        </p>
      </div>
    </div>
  );
}

function HudRow({
  label,
  value,
  danger,
  accent,
}: {
  label: string;
  value: string;
  danger?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className={danger ? 'text-red-400' : accent ?? 'text-zinc-100'}>{value}</span>
    </div>
  );
}
