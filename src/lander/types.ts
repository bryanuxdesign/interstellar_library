export type GamePhase = 'ready' | 'playing' | 'crashed';

export type CrashReason =
  | 'fuel'
  | 'hard-landing'
  | 'tilt'
  | 'horizontal';

export interface LanderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Rotation in degrees. 0 = upright (thrust down cancels gravity). */
  angle: number;
  fuel: number;
  /** Main engine armed / firing (Space toggles). */
  engineOn: boolean;
  /** Throttle 0..1 mapped to profile minThrust..maxThrust while engine is on. */
  throttle: number;
  /** True when engine is producing thrust this frame (for plume / HUD). */
  thrusting: boolean;
  /** Soft-landed on the surface; can throttle up to launch again. */
  grounded: boolean;
  rotatingLeft: boolean;
  rotatingRight: boolean;
}

export interface LandingZone {
  xStart: number;
  xEnd: number;
  y: number;
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface Terrain {
  points: TerrainPoint[];
  zone: LandingZone;
  /** World X extent. */
  width: number;
}

export interface CameraView {
  /** World units visible vertically. */
  zoom: number;
  /** 0 = flat terrain, 1 = full planetary curvature. */
  curvature: number;
  centerX: number;
  centerY: number;
}

export interface InputState {
  engineOn: boolean;
  throttle: number;
  left: boolean;
  right: boolean;
}

export type ParticleKind = 'dust' | 'ember';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: ParticleKind;
}
