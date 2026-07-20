import type { LandingZone, Terrain, TerrainPoint } from './types';

const WORLD_WIDTH = 2400;
const SEGMENTS = 180;
const FLAT_WIDTH = 90;

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Procedural lunar terrain with craters, jagged slopes, and exactly one
 * flat landing pad highlighted as the win zone.
 */
export function generateTerrain(seed = Date.now()): Terrain {
  const rand = mulberry32(seed);
  const step = WORLD_WIDTH / SEGMENTS;
  const points: TerrainPoint[] = [];

  // Place the flat zone somewhere in the middle 60% of the world.
  const zoneCenter =
    WORLD_WIDTH * 0.2 + rand() * WORLD_WIDTH * 0.6;
  const zoneStart = zoneCenter - FLAT_WIDTH / 2;
  const zoneEnd = zoneCenter + FLAT_WIDTH / 2;
  const zoneY = 40 + rand() * 30;

  let y = 80 + rand() * 40;

  for (let i = 0; i <= SEGMENTS; i++) {
    const x = i * step;
    const inZone = x >= zoneStart && x <= zoneEnd;

    if (inZone) {
      y = zoneY;
    } else {
      // Jagged slopes + occasional crater dips.
      const noise = (rand() - 0.5) * 18;
      const crater = rand() < 0.08 ? -25 - rand() * 35 : 0;
      const ridge = rand() < 0.05 ? 20 + rand() * 30 : 0;
      y = Math.max(10, Math.min(220, y + noise + crater + ridge));

      // Soft blend near zone edges so the pad isn't a cliff.
      const distToZone = Math.min(Math.abs(x - zoneStart), Math.abs(x - zoneEnd));
      if (distToZone < 40) {
        const t = distToZone / 40;
        y = zoneY + (y - zoneY) * t;
      }
    }

    points.push({ x, y });
  }

  // Force exact flatness across the pad samples.
  for (const p of points) {
    if (p.x >= zoneStart && p.x <= zoneEnd) p.y = zoneY;
  }

  const zone: LandingZone = {
    xStart: zoneStart,
    xEnd: zoneEnd,
    y: zoneY,
  };

  return { points, zone, width: WORLD_WIDTH };
}

/** Ground height at world X via linear interpolation. */
export function terrainHeightAt(terrain: Terrain, x: number): number {
  const pts = terrain.points;
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[pts.length - 1].y;
}

/** Approximate surface slope angle (degrees) at X. */
export function terrainSlopeAt(terrain: Terrain, x: number): number {
  const dx = 4;
  const y0 = terrainHeightAt(terrain, x - dx);
  const y1 = terrainHeightAt(terrain, x + dx);
  return (Math.atan2(y1 - y0, dx * 2) * 180) / Math.PI;
}

export function isOverLandingZone(terrain: Terrain, x: number, halfWidth: number): boolean {
  const { zone } = terrain;
  return x - halfWidth >= zone.xStart && x + halfWidth <= zone.xEnd;
}
