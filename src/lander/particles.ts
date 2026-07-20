import type { Particle } from './types';

export interface ParticleSystem {
  particles: Particle[];
}

export function createParticleSystem(): ParticleSystem {
  return { particles: [] };
}

export function clearParticles(sys: ParticleSystem) {
  sys.particles.length = 0;
}

function push(
  sys: ParticleSystem,
  partial: Omit<Particle, 'life'> & { life?: number },
) {
  if (sys.particles.length > 280) return;
  sys.particles.push({
    ...partial,
    life: partial.life ?? partial.maxLife,
  });
}

/** Burst of lunar dust on soft touchdown. */
export function spawnTouchdownDust(
  sys: ParticleSystem,
  x: number,
  groundY: number,
  impactSpeed: number,
) {
  const intensity = Math.min(1.4, 0.45 + impactSpeed * 0.55);
  const count = Math.floor(18 + intensity * 28);
  for (let i = 0; i < count; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const speed = (20 + Math.random() * 55) * intensity;
    const ang = -Math.PI / 2 + side * (0.35 + Math.random() * 1.1);
    push(sys, {
      x: x + (Math.random() - 0.5) * 22,
      y: groundY + 1,
      vx: Math.cos(ang) * speed * side,
      vy: Math.sin(ang) * speed * 0.55 + Math.random() * 12,
      maxLife: 0.7 + Math.random() * 0.9,
      size: 1.2 + Math.random() * 3.2 * intensity,
      kind: 'dust',
    });
  }
  // Warm embers from residual plume heat
  const embers = Math.floor(6 + intensity * 10);
  for (let i = 0; i < embers; i++) {
    push(sys, {
      x: x + (Math.random() - 0.5) * 10,
      y: groundY + 2,
      vx: (Math.random() - 0.5) * 28,
      vy: 8 + Math.random() * 22,
      maxLife: 0.35 + Math.random() * 0.45,
      size: 1 + Math.random() * 2,
      kind: 'ember',
    });
  }
}

/** Continuous dust kicked up while thrusting near / on the surface. */
export function spawnSurfacePlumeDust(
  sys: ParticleSystem,
  x: number,
  groundY: number,
  throttle: number,
  dt: number,
) {
  const rate = 40 * Math.max(0.2, throttle);
  const n = Math.min(8, Math.floor(rate * dt + Math.random()));
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    push(sys, {
      x: x + (Math.random() - 0.5) * 14,
      y: groundY + 0.5,
      vx: side * (15 + Math.random() * 40 * throttle),
      vy: 4 + Math.random() * 18 * throttle,
      maxLife: 0.35 + Math.random() * 0.5,
      size: 1 + Math.random() * 2.4,
      kind: 'dust',
    });
  }
}

/** Heavier debris cloud for a hard impact. */
export function spawnCrashDust(
  sys: ParticleSystem,
  x: number,
  groundY: number,
  impactSpeed: number,
) {
  spawnTouchdownDust(sys, x, groundY, impactSpeed * 1.6);
  const count = 20;
  for (let i = 0; i < count; i++) {
    push(sys, {
      x: x + (Math.random() - 0.5) * 30,
      y: groundY + 2,
      vx: (Math.random() - 0.5) * 90,
      vy: 10 + Math.random() * 50,
      maxLife: 0.9 + Math.random() * 1.1,
      size: 1.5 + Math.random() * 4,
      kind: Math.random() < 0.35 ? 'ember' : 'dust',
    });
  }
}

export function updateParticles(sys: ParticleSystem, dt: number) {
  const next: Particle[] = [];
  for (const p of sys.particles) {
    p.life -= dt;
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 4.5 * dt; // light lunar settle
    p.vx *= 1 - 1.8 * dt;
    next.push(p);
  }
  sys.particles = next;
}
