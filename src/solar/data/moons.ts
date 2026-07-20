/**
 * Major moons — parent-relative Kepler orbits (compressed scene radii).
 * Sizes are visual, not to scale with planets.
 */

export type MoonBody = {
  id: string;
  name: string;
  parentId: string;
  /** Orbital radius from parent center (scene units). */
  orbitRadius: number;
  /** Orbital angular speed (rad / day) at live epoch pacing. */
  meanMotion: number;
  /** Mean anomaly at J2000 (rad). */
  M0: number;
  /** Inclination relative to parent equator / ecliptic (rad). */
  inclination: number;
  /** Visual sphere radius. */
  size: number;
  color: string;
  fact: string;
  /** Use moon.jpg when available. */
  textured?: boolean;
  archivePlanetId?: 'moon';
};

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/** ~22 major moons — capped for perf. */
export const SOLAR_MOONS: MoonBody[] = [
  // Earth
  {
    id: 'luna',
    name: 'Moon',
    parentId: 'earth',
    orbitRadius: 0.32,
    meanMotion: TWO_PI / 27.32,
    M0: 120 * DEG,
    inclination: 5.1 * DEG,
    size: 0.022,
    color: '#c8c4bc',
    fact: 'Earth’s companion — tidally locked, sculpting tides and stabilizing our axial tilt.',
    textured: true,
    archivePlanetId: 'moon',
  },
  // Mars
  {
    id: 'phobos',
    name: 'Phobos',
    parentId: 'mars',
    orbitRadius: 0.11,
    meanMotion: TWO_PI / 0.319,
    M0: 40 * DEG,
    inclination: 1.1 * DEG,
    size: 0.008,
    color: '#9a8070',
    fact: 'Mars’s larger moon — a battered potato spiraling slowly inward.',
  },
  {
    id: 'deimos',
    name: 'Deimos',
    parentId: 'mars',
    orbitRadius: 0.16,
    meanMotion: TWO_PI / 1.263,
    M0: 200 * DEG,
    inclination: 1.8 * DEG,
    size: 0.006,
    color: '#8a7870',
    fact: 'Tiny outer Martian moon — from the surface it is a dim, slow “star.”',
  },
  // Jupiter — Galileans
  {
    id: 'io',
    name: 'Io',
    parentId: 'jupiter',
    orbitRadius: 0.38,
    meanMotion: TWO_PI / 1.769,
    M0: 30 * DEG,
    inclination: 0.05 * DEG,
    size: 0.028,
    color: '#e8c060',
    fact: 'Most volcanic world known — Jupiter’s tides knead its interior.',
  },
  {
    id: 'europa',
    name: 'Europa',
    parentId: 'jupiter',
    orbitRadius: 0.48,
    meanMotion: TWO_PI / 3.551,
    M0: 100 * DEG,
    inclination: 0.47 * DEG,
    size: 0.024,
    color: '#d8c8a8',
    fact: 'Ice shell over a global ocean — a prime Archive target for habitability.',
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    parentId: 'jupiter',
    orbitRadius: 0.62,
    meanMotion: TWO_PI / 7.155,
    M0: 180 * DEG,
    inclination: 0.2 * DEG,
    size: 0.032,
    color: '#a89880',
    fact: 'Largest moon in the solar system — bigger than Mercury, with its own magnetic field.',
  },
  {
    id: 'callisto',
    name: 'Callisto',
    parentId: 'jupiter',
    orbitRadius: 0.78,
    meanMotion: TWO_PI / 16.69,
    M0: 260 * DEG,
    inclination: 0.19 * DEG,
    size: 0.03,
    color: '#7a7068',
    fact: 'Ancient, crater-scarred ice world — farthest of the Galilean moons.',
  },
  // Saturn
  {
    id: 'mimas',
    name: 'Mimas',
    parentId: 'saturn',
    orbitRadius: 0.3,
    meanMotion: TWO_PI / 0.942,
    M0: 50 * DEG,
    inclination: 1.5 * DEG,
    size: 0.012,
    color: '#c8c0b4',
    fact: 'Death-Star lookalike — Herschel crater dominates one hemisphere.',
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    parentId: 'saturn',
    orbitRadius: 0.38,
    meanMotion: TWO_PI / 1.37,
    M0: 90 * DEG,
    inclination: 0.02 * DEG,
    size: 0.014,
    color: '#e8f0f4',
    fact: 'Icy geysers feed Saturn’s E ring — a subsurface ocean world.',
  },
  {
    id: 'tethys',
    name: 'Tethys',
    parentId: 'saturn',
    orbitRadius: 0.46,
    meanMotion: TWO_PI / 1.888,
    M0: 140 * DEG,
    inclination: 1.1 * DEG,
    size: 0.016,
    color: '#d0ccc4',
    fact: 'Icy mid-sized Saturnian moon with a vast Ithaca Chasma canyon.',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    parentId: 'saturn',
    orbitRadius: 0.56,
    meanMotion: TWO_PI / 4.518,
    M0: 200 * DEG,
    inclination: 0.35 * DEG,
    size: 0.02,
    color: '#c4bcb0',
    fact: 'Saturn’s second-largest moon — heavily cratered water ice.',
  },
  {
    id: 'titan',
    name: 'Titan',
    parentId: 'saturn',
    orbitRadius: 0.72,
    meanMotion: TWO_PI / 15.95,
    M0: 280 * DEG,
    inclination: 0.35 * DEG,
    size: 0.036,
    color: '#d4a060',
    fact: 'Thick N₂ atmosphere and methane lakes — the most Earth-like surface chemistry abroad.',
  },
  // Uranus
  {
    id: 'ariel',
    name: 'Ariel',
    parentId: 'uranus',
    orbitRadius: 0.28,
    meanMotion: TWO_PI / 2.52,
    M0: 60 * DEG,
    inclination: 0.04 * DEG,
    size: 0.014,
    color: '#c0d0d4',
    fact: 'Bright Uranian moon with rift valleys and possible cryovolcanism.',
  },
  {
    id: 'umbriel',
    name: 'Umbriel',
    parentId: 'uranus',
    orbitRadius: 0.34,
    meanMotion: TWO_PI / 4.144,
    M0: 120 * DEG,
    inclination: 0.13 * DEG,
    size: 0.014,
    color: '#6a7074',
    fact: 'Darkest of Uranus’s major moons — ancient cratered terrain.',
  },
  {
    id: 'titania',
    name: 'Titania',
    parentId: 'uranus',
    orbitRadius: 0.42,
    meanMotion: TWO_PI / 8.706,
    M0: 200 * DEG,
    inclination: 0.08 * DEG,
    size: 0.018,
    color: '#a8b0b4',
    fact: 'Largest Uranian moon — canyons and frost mixed across its crust.',
  },
  {
    id: 'oberon',
    name: 'Oberon',
    parentId: 'uranus',
    orbitRadius: 0.5,
    meanMotion: TWO_PI / 13.46,
    M0: 300 * DEG,
    inclination: 0.07 * DEG,
    size: 0.017,
    color: '#909898',
    fact: 'Outer major moon of Uranus — cratered ice with a faint reddish tint.',
  },
  // Neptune
  {
    id: 'triton',
    name: 'Triton',
    parentId: 'neptune',
    orbitRadius: 0.42,
    meanMotion: -TWO_PI / 5.877, // retrograde
    M0: 150 * DEG,
    inclination: 157 * DEG,
    size: 0.026,
    color: '#c8d0d8',
    fact: 'Retrograde captured Kuiper object — nitrogen geysers and a thin atmosphere.',
  },
];

export function moonsForParent(parentId: string): MoonBody[] {
  return SOLAR_MOONS.filter((m) => m.parentId === parentId);
}

export function findMoon(id: string): MoonBody | undefined {
  return SOLAR_MOONS.find((m) => m.id === id);
}

export function isMoonId(id: string): boolean {
  return SOLAR_MOONS.some((m) => m.id === id);
}
