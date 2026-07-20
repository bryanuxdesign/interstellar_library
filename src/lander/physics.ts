import type { LanderProfile } from './profiles';
import { thrustForceAt } from './profiles';
import type { CrashReason, GamePhase, LanderState, Terrain } from './types';
import { terrainHeightAt } from './terrain';

/** Lunar-like gravity (m/s²) — slow, readable descent. */
export const GRAVITY = 1.62;

/** Lander collision half-extents in world units (metres). */
export const LANDER_HALF_W = 10;
export const LANDER_HALF_H = 12;
/** Bottom of footpads below craft center — must match drawn legs. */
export const LANDER_FOOT_OFFSET = LANDER_HALF_H + 2;

/** Soft-landing envelope (m/s and degrees). */
export const MAX_SAFE_VY = 2.0;
export const MAX_SAFE_VX = 1.0;
export const MAX_SAFE_ANGLE = 5;

/** Default throttle (~hover band for most profiles). */
export const DEFAULT_THROTTLE = 0.35;

/** Net upward accel needed to leave the surface. */
const LIFTOFF_AY = 0.08;

export function createInitialLander(
  profile: LanderProfile,
  terrain: Terrain,
): LanderState {
  const startX = terrain.width * 0.5 + (Math.random() - 0.5) * 200;
  return {
    x: startX,
    y: 420 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.15,
    angle: (Math.random() - 0.5) * 6,
    fuel: profile.fuel,
    engineOn: false,
    throttle: DEFAULT_THROTTLE,
    thrusting: false,
    grounded: false,
    rotatingLeft: false,
    rotatingRight: false,
  };
}

export type ContactEvent =
  | { type: 'touchdown'; impactSpeed: number; x: number; groundY: number }
  | { type: 'liftoff'; x: number; groundY: number }
  | { type: 'crash'; reason: CrashReason; impactSpeed: number; x: number; groundY: number }
  | { type: 'surface-plume'; x: number; groundY: number; throttle: number };

export interface StepResult {
  lander: LanderState;
  phase: GamePhase;
  crashReason?: CrashReason;
  events: ContactEvent[];
}

export function stepPhysics(
  lander: LanderState,
  profile: LanderProfile,
  terrain: Terrain,
  dt: number,
): StepResult {
  if (dt <= 0 || dt > 0.05) dt = 0.016;

  let { x, y, vx, vy, angle, fuel, engineOn, throttle, grounded } = lander;
  const thrusting = engineOn && fuel > 0;
  const rotatingLeft = lander.rotatingLeft;
  const rotatingRight = lander.rotatingRight;
  const events: ContactEvent[] = [];

  if (rotatingLeft) angle -= profile.rcsSpeed * dt;
  if (rotatingRight) angle += profile.rcsSpeed * dt;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;

  const rad = (angle * Math.PI) / 180;
  let ax = 0;
  let ay = -GRAVITY;
  let thrustAccel = 0;

  if (thrusting) {
    const force = thrustForceAt(profile, throttle);
    thrustAccel = force / profile.mass;
    ax += Math.sin(rad) * thrustAccel;
    ay += Math.cos(rad) * thrustAccel;
    const burnFrac = force / profile.maxThrust;
    fuel = Math.max(0, fuel - profile.fuelBurnRate * burnFrac * dt);
  }

  // --- Grounded: sit on surface until liftoff thrust ---
  if (grounded) {
    const groundY = terrainHeightAt(terrain, x);
    x += 0;
    y = groundY + LANDER_FOOT_OFFSET;
    vx = 0;
    vy = 0;

    const verticalThrust = thrusting ? Math.cos(rad) * thrustAccel : 0;
    const netUp = verticalThrust - GRAVITY;

    if (thrusting && Math.abs(angle) < 55) {
      events.push({
        type: 'surface-plume',
        x,
        groundY,
        throttle,
      });
    }

    if (thrusting && netUp > LIFTOFF_AY && Math.abs(angle) < 55) {
      grounded = false;
      vy = netUp * dt * 8;
      vx = Math.sin(rad) * thrustAccel * dt * 4;
      events.push({ type: 'liftoff', x, groundY });
    }

    return {
      lander: {
        x,
        y,
        vx,
        vy,
        angle,
        fuel,
        engineOn,
        throttle,
        thrusting,
        grounded,
        rotatingLeft,
        rotatingRight,
      },
      phase: 'playing',
      events,
    };
  }

  // --- Free flight ---
  vx += ax * dt;
  vy += ay * dt;
  x += vx * dt;
  y += vy * dt;

  if (x < 40) {
    x = 40;
    vx = Math.abs(vx) * 0.4;
  }
  if (x > terrain.width - 40) {
    x = terrain.width - 40;
    vx = -Math.abs(vx) * 0.4;
  }

  const groundY = terrainHeightAt(terrain, x);
  const feetY = y - LANDER_FOOT_OFFSET;

  // Near-surface plume dust while hovering / descending (only when truly close)
  if (thrusting && feetY - groundY < 14) {
    events.push({
      type: 'surface-plume',
      x,
      groundY,
      throttle,
    });
  }

  const next: LanderState = {
    x,
    y,
    vx,
    vy,
    angle,
    fuel,
    engineOn,
    throttle,
    thrusting,
    grounded: false,
    rotatingLeft,
    rotatingRight,
  };

  if (feetY <= groundY) {
    const impactVy = Math.abs(vy);
    const absVx = Math.abs(vx);
    const absAngle = Math.abs(angle);

    next.y = groundY + LANDER_FOOT_OFFSET;
    next.vy = 0;
    next.vx = 0;

    const unsafe =
      impactVy >= MAX_SAFE_VY ||
      absVx >= MAX_SAFE_VX ||
      absAngle >= MAX_SAFE_ANGLE;

    if (unsafe) {
      next.engineOn = false;
      next.thrusting = false;
      next.grounded = false;
      const reason: CrashReason =
        impactVy >= MAX_SAFE_VY
          ? 'hard-landing'
          : absVx >= MAX_SAFE_VX
            ? 'horizontal'
            : 'tilt';
      events.push({
        type: 'crash',
        reason,
        impactSpeed: impactVy,
        x,
        groundY,
      });
      return { lander: next, phase: 'crashed', crashReason: reason, events };
    }

    // Soft touchdown anywhere — stay in play, can launch again
    next.grounded = true;
    events.push({
      type: 'touchdown',
      impactSpeed: impactVy,
      x,
      groundY,
    });
    return { lander: next, phase: 'playing', events };
  }

  return { lander: next, phase: 'playing', events };
}
