import { LANDER_FOOT_OFFSET, LANDER_HALF_H, LANDER_HALF_W } from './physics';
import type { CameraView, LanderState, Particle, Terrain } from './types';
import { terrainHeightAt } from './terrain';
import type { ParticleSystem } from './particles';

/** User zoom-out multiplier: 1 = default, up to ~1.85 for wide surface view. */
export const ZOOM_OUT_MIN = 1;
export const ZOOM_OUT_MAX = 1.85;
export const ZOOM_OUT_STEP = 0.15;

export function computeCamera(
  lander: LanderState,
  terrain: Terrain,
  zoomOut = 1,
): CameraView {
  const ground = terrainHeightAt(terrain, lander.x);
  // Use foot altitude so framing matches what the player sees.
  const altitude = Math.max(0, lander.y - LANDER_FOOT_OFFSET - ground);

  // Zoom = world units visible vertically. Wider near the surface so the pad is readable.
  let zoom: number;
  let curvature: number;

  if (altitude > 380) {
    zoom = 620;
    curvature = 1;
  } else if (altitude > 140) {
    const t = (altitude - 140) / 240;
    zoom = 280 + t * 340;
    curvature = t;
  } else {
    const t = Math.max(0, altitude / 140);
    // Was ~110 at touchdown (too tight + lander scale capped → fake gap).
    zoom = 200 + t * 80;
    curvature = 0;
  }

  const zOut = Math.max(ZOOM_OUT_MIN, Math.min(ZOOM_OUT_MAX, zoomOut));
  zoom *= zOut;

  return {
    zoom,
    curvature,
    centerX: lander.x,
    // Bias slightly toward ground so more surface is in frame when low.
    centerY: lander.y + zoom * (altitude < 80 ? 0.02 : 0.1),
  };
}

function worldToScreen(
  wx: number,
  wy: number,
  cam: CameraView,
  w: number,
  h: number,
): { sx: number; sy: number } {
  const scale = h / cam.zoom;
  const sx = w / 2 + (wx - cam.centerX) * scale;
  // World Y up → screen Y down
  const sy = h / 2 - (wy - cam.centerY) * scale;
  return { sx, sy };
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cam: CameraView,
  seed: number,
) {
  ctx.save();
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const count = 90;
  for (let i = 0; i < count; i++) {
    const px = ((rand() * w * 3 + cam.centerX * 0.02) % w + w) % w;
    const py = rand() * h * 0.72;
    const r = rand() * 1.4 + 0.3;
    ctx.globalAlpha = 0.35 + rand() * 0.55;
    ctx.fillStyle = '#e8ecf4';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCurvedMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  curvature: number,
) {
  if (curvature < 0.02) return;

  const radius = w * (1.8 - curvature * 0.4);
  const cx = w / 2;
  const cy = h + radius * (0.55 - curvature * 0.08);

  ctx.save();
  ctx.globalAlpha = Math.min(1, curvature * 1.2);

  // Limb glow
  const glow = ctx.createRadialGradient(cx, cy - radius * 0.15, radius * 0.7, cx, cy, radius);
  glow.addColorStop(0, 'rgba(180, 185, 195, 0.15)');
  glow.addColorStop(0.7, 'rgba(120, 125, 135, 0.35)');
  glow.addColorStop(1, 'rgba(40, 42, 48, 0.9)');

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 0, true);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = glow;
  ctx.fill();

  // Surface arc line
  ctx.strokeStyle = 'rgba(200, 205, 215, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 1.05, Math.PI * -0.05, true);
  ctx.stroke();

  // Subtle crater dots on the limb
  ctx.fillStyle = 'rgba(90, 95, 105, 0.5)';
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const rr = radius * (0.82 + (i % 3) * 0.04);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.35 - radius * 0.2;
    if (y < h - 20) {
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + (i % 4) * 4, 4 + (i % 3) * 2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  cam: CameraView,
  w: number,
  h: number,
) {
  const scale = h / cam.zoom;
  const flatness = 1 - cam.curvature;

  if (flatness < 0.05) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, flatness * 1.4);

  // Terrain fill
  ctx.beginPath();
  let started = false;
  for (const p of terrain.points) {
    const { sx, sy } = worldToScreen(p.x, p.y, cam, w, h);
    if (!started) {
      ctx.moveTo(sx, sy);
      started = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.lineTo(w + 20, h + 20);
  ctx.lineTo(-20, h + 20);
  ctx.closePath();

  const fill = ctx.createLinearGradient(0, h * 0.4, 0, h);
  fill.addColorStop(0, '#6b7078');
  fill.addColorStop(0.5, '#3a3d44');
  fill.addColorStop(1, '#1a1b1f');
  ctx.fillStyle = fill;
  ctx.fill();

  // Surface stroke
  ctx.beginPath();
  started = false;
  for (const p of terrain.points) {
    const { sx, sy } = worldToScreen(p.x, p.y, cam, w, h);
    if (!started) {
      ctx.moveTo(sx, sy);
      started = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.strokeStyle = 'rgba(210, 215, 225, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Landing zone highlight
  const { zone } = terrain;
  const a = worldToScreen(zone.xStart, zone.y, cam, w, h);
  const b = worldToScreen(zone.xEnd, zone.y, cam, w, h);
  const padH = Math.max(4, 6 * scale);

  ctx.fillStyle = 'rgba(34, 224, 107, 0.25)';
  ctx.fillRect(a.sx, a.sy - 2, b.sx - a.sx, padH + 8);

  ctx.strokeStyle = '#22e06b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(a.sx, a.sy);
  ctx.lineTo(b.sx, b.sy);
  ctx.stroke();

  // Zone markers
  ctx.fillStyle = '#22e06b';
  ctx.font = `bold ${Math.max(10, 11 * Math.min(scale, 1.4))}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('MARKED PAD', (a.sx + b.sx) / 2, a.sy + Math.max(14, 12 * scale));

  ctx.restore();
}

function drawLander(
  ctx: CanvasRenderingContext2D,
  lander: LanderState,
  cam: CameraView,
  w: number,
  h: number,
  crashed: boolean,
  groundY: number,
) {
  const { sx, sy } = worldToScreen(lander.x, lander.y, cam, w, h);
  // 1:1 with world — never cap scale or feet drift above the collision plane.
  const scale = h / cam.zoom;
  const s = scale;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate((lander.angle * Math.PI) / 180);
  ctx.scale(s, s);

  const clearance = Math.max(0, lander.y - LANDER_FOOT_OFFSET - groundY);

  // Exhaust plume (clipped by clearance so it doesn't fake contact)
  if (lander.thrusting && lander.fuel > 0 && !crashed) {
    const throttle = Math.max(0.15, lander.throttle);
    const flicker = 0.7 + Math.random() * 0.3;
    const rawLen = 10 + 16 * throttle * flicker;
    const len = Math.min(rawLen, Math.max(2, clearance + 1));
    const grad = ctx.createLinearGradient(0, LANDER_HALF_H - 2, 0, LANDER_HALF_H - 2 + len);
    grad.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
    grad.addColorStop(0.45, 'rgba(255, 120, 40, 0.7)');
    grad.addColorStop(1, 'rgba(255, 60, 20, 0)');
    ctx.fillStyle = grad;
    const halfW = 3 + 3 * throttle;
    ctx.beginPath();
    ctx.moveTo(-halfW, LANDER_HALF_H - 2);
    ctx.lineTo(halfW, LANDER_HALF_H - 2);
    ctx.lineTo(2 + Math.random() * 2, LANDER_HALF_H - 2 + len * 0.95);
    ctx.lineTo(-2 - Math.random() * 2, LANDER_HALF_H - 2 + len * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  // Ascent / descent body
  ctx.fillStyle = crashed ? '#6b3030' : '#c8ccd4';
  ctx.strokeStyle = crashed ? '#ff453a' : '#8b93a1';
  ctx.lineWidth = 1.5 / s;

  // Cabin
  ctx.beginPath();
  const cabinX = -8;
  const cabinY = -LANDER_HALF_H;
  const cabinW = 16;
  const cabinH = 14;
  const r = 3;
  ctx.moveTo(cabinX + r, cabinY);
  ctx.lineTo(cabinX + cabinW - r, cabinY);
  ctx.quadraticCurveTo(cabinX + cabinW, cabinY, cabinX + cabinW, cabinY + r);
  ctx.lineTo(cabinX + cabinW, cabinY + cabinH - r);
  ctx.quadraticCurveTo(cabinX + cabinW, cabinY + cabinH, cabinX + cabinW - r, cabinY + cabinH);
  ctx.lineTo(cabinX + r, cabinY + cabinH);
  ctx.quadraticCurveTo(cabinX, cabinY + cabinH, cabinX, cabinY + cabinH - r);
  ctx.lineTo(cabinX, cabinY + r);
  ctx.quadraticCurveTo(cabinX, cabinY, cabinX + r, cabinY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Window
  ctx.fillStyle = '#3a6a9a';
  ctx.fillRect(-4, -LANDER_HALF_H + 3, 8, 5);

  // Descent stage
  ctx.fillStyle = crashed ? '#5a2828' : '#9aa0aa';
  ctx.beginPath();
  ctx.moveTo(-LANDER_HALF_W, 2);
  ctx.lineTo(LANDER_HALF_W, 2);
  ctx.lineTo(LANDER_HALF_W - 3, LANDER_HALF_H - 2);
  ctx.lineTo(-LANDER_HALF_W + 3, LANDER_HALF_H - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Landing legs — tips at LANDER_FOOT_OFFSET (matches collision)
  ctx.strokeStyle = crashed ? '#ff453a' : '#d0d4dc';
  ctx.lineWidth = 2 / s;
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-LANDER_HALF_W - 4, LANDER_FOOT_OFFSET);
  ctx.moveTo(6, 4);
  ctx.lineTo(LANDER_HALF_W + 4, LANDER_FOOT_OFFSET);
  ctx.stroke();

  // Footpads (bottom edge = LANDER_FOOT_OFFSET)
  ctx.fillStyle = '#e8ecf4';
  ctx.fillRect(-LANDER_HALF_W - 6, LANDER_FOOT_OFFSET - 2, 5, 2);
  ctx.fillRect(LANDER_HALF_W + 1, LANDER_FOOT_OFFSET - 2, 5, 2);

  // Engine bell
  ctx.fillStyle = '#5a5e68';
  ctx.beginPath();
  ctx.moveTo(-4, LANDER_HALF_H - 4);
  ctx.lineTo(4, LANDER_HALF_H - 4);
  ctx.lineTo(6, LANDER_HALF_H);
  ctx.lineTo(-6, LANDER_HALF_H);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Screen-space ascent / descent arrow (world up / toward ground). */
function drawVelocityArrow(
  ctx: CanvasRenderingContext2D,
  lander: LanderState,
  cam: CameraView,
  w: number,
  h: number,
) {
  if (Math.abs(lander.vy) < 0.05) return;

  const { sx, sy } = worldToScreen(lander.x, lander.y, cam, w, h);
  const scale = h / cam.zoom;
  const ascending = lander.vy > 0;
  // Screen Y: up is negative
  const dir = ascending ? -1 : 1;
  const tipY = sy + dir * (LANDER_FOOT_OFFSET * scale + 18);
  const baseY = sy + dir * (LANDER_FOOT_OFFSET * scale + 4);
  const color = ascending ? '#38bdf8' : '#fbbf24';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(sx, baseY);
  ctx.lineTo(sx, tipY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, tipY);
  ctx.lineTo(sx - 5, tipY - dir * 7);
  ctx.lineTo(sx + 5, tipY - dir * 7);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cam: CameraView,
  w: number,
  h: number,
) {
  for (const p of particles) {
    const { sx, sy } = worldToScreen(p.x, p.y, cam, w, h);
    const t = Math.max(0, p.life / p.maxLife);
    const scale = h / cam.zoom;
    const r = Math.max(0.8, p.size * scale * 0.55);
    if (p.kind === 'ember') {
      ctx.fillStyle = `rgba(255, ${Math.floor(140 + 80 * t)}, 60, ${0.85 * t})`;
    } else {
      ctx.fillStyle = `rgba(190, 185, 170, ${0.55 * t})`;
    }
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lander: LanderState,
  terrain: Terrain,
  cam: CameraView,
  phase: 'ready' | 'playing' | 'crashed',
  particles?: ParticleSystem,
) {
  // Space background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#050508');
  bg.addColorStop(0.55, '#0a0a10');
  bg.addColorStop(1, '#121218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const groundY = terrainHeightAt(terrain, lander.x);

  drawStars(ctx, w, h, cam, 42);
  drawCurvedMoon(ctx, w, h, cam.curvature);
  drawTerrain(ctx, terrain, cam, w, h);
  if (particles && particles.particles.length) {
    drawParticles(ctx, particles.particles, cam, w, h);
  }
  drawLander(ctx, lander, cam, w, h, phase === 'crashed', groundY);
  if ((phase === 'playing' || phase === 'ready') && !lander.grounded) {
    drawVelocityArrow(ctx, lander, cam, w, h);
  }
}
