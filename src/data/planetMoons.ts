/**
 * Natural satellites for planet archive pages.
 * Orbital elements from NASA / JPL fact sheets; mean anomalies aligned with
 * `src/solar/data/moons.ts` where IDs overlap (J2000 epoch).
 * Scene scale maps km → globe units via parent equatorial radius.
 */

export interface PlanetMoonDef {
  id: string;
  name: string;
  parentPlanetId: string;
  modelUrl: string;
  /** Semi-major axis from parent centre (km). */
  semiMajorKm: number;
  /**
   * Sidereal orbital period (hours). Negative = retrograde mean motion
   * (e.g. Triton); high inclination alone also appears retrograde vs spin.
   */
  periodHours: number;
  /** Inclination to parent equator (degrees). */
  inclinationDeg: number;
  /** Longitude of ascending node Ω (degrees, equator frame). Approximate. */
  longitudeOfAscendingNodeDeg: number;
  /** Argument of periapsis ω (degrees). Approximate for near-circular orbits. */
  argPeriapsisDeg: number;
  /** Mean anomaly at J2000 (degrees). */
  meanAnomalyAtJ2000Deg: number;
  /** Mean volumetric radius (km). */
  meanRadiusKm: number;
}

/**
 * Parent axial obliquity (degrees) — tips moon orbital planes in the archive
 * scene the same way SolSystem tips moons relative to the ecliptic.
 * Mars value is spin-axis obliquity; gas/ice giants match ring/equator tilts.
 */
export const PLANET_OBLIQUITY_DEG: Record<string, number> = {
  earth: 23.44,
  mars: 25.19,
  jupiter: 3.13,
  saturn: 26.73,
  uranus: 97.77,
  neptune: 28.32,
};

export const PLANET_MOONS: PlanetMoonDef[] = [
  // —— Earth ——
  {
    id: 'luna',
    name: 'Moon',
    parentPlanetId: 'earth',
    modelUrl: '/models/moon.glb',
    semiMajorKm: 384400,
    periodHours: 655.72,
    inclinationDeg: 5.145,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 120,
    meanRadiusKm: 1737.4,
  },

  // —— Mars ——
  {
    id: 'phobos',
    name: 'Phobos',
    parentPlanetId: 'mars',
    modelUrl: '/models/phobos.glb',
    semiMajorKm: 9376,
    periodHours: 7.6536,
    inclinationDeg: 1.093,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 40,
    meanRadiusKm: 11.27,
  },
  {
    id: 'deimos',
    name: 'Deimos',
    parentPlanetId: 'mars',
    modelUrl: '/models/deimos.glb',
    semiMajorKm: 23463,
    periodHours: 30.312,
    inclinationDeg: 1.791,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 200,
    meanRadiusKm: 6.2,
  },

  // —— Jupiter (Galileans) ——
  {
    id: 'io',
    name: 'Io',
    parentPlanetId: 'jupiter',
    modelUrl: '/models/io.glb',
    semiMajorKm: 421700,
    periodHours: 42.456,
    inclinationDeg: 0.05,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 30,
    meanRadiusKm: 1821.6,
  },
  {
    id: 'europa',
    name: 'Europa',
    parentPlanetId: 'jupiter',
    modelUrl: '/models/europa.glb',
    semiMajorKm: 671034,
    periodHours: 85.228,
    inclinationDeg: 0.47,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 100,
    meanRadiusKm: 1560.8,
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    parentPlanetId: 'jupiter',
    modelUrl: '/models/ganymede.glb',
    semiMajorKm: 1070412,
    periodHours: 171.709,
    inclinationDeg: 0.2,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 180,
    meanRadiusKm: 2634.1,
  },
  {
    id: 'callisto',
    name: 'Callisto',
    parentPlanetId: 'jupiter',
    modelUrl: '/models/callisto.glb',
    semiMajorKm: 1882709,
    periodHours: 400.536,
    inclinationDeg: 0.19,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 260,
    meanRadiusKm: 2410.3,
  },

  // —— Saturn (major) ——
  {
    id: 'mimas',
    name: 'Mimas',
    parentPlanetId: 'saturn',
    modelUrl: '/models/mimas.glb',
    semiMajorKm: 185539,
    periodHours: 22.618,
    inclinationDeg: 1.574,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 50,
    meanRadiusKm: 198.2,
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    parentPlanetId: 'saturn',
    modelUrl: '/models/enceladus.glb',
    semiMajorKm: 237948,
    periodHours: 32.885,
    inclinationDeg: 0.009,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 90,
    meanRadiusKm: 252.1,
  },
  {
    id: 'tethys',
    name: 'Tethys',
    parentPlanetId: 'saturn',
    modelUrl: '/models/tethys.glb',
    semiMajorKm: 294619,
    periodHours: 45.307,
    inclinationDeg: 1.12,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 140,
    meanRadiusKm: 531.1,
  },
  {
    id: 'dione',
    name: 'Dione',
    parentPlanetId: 'saturn',
    modelUrl: '/models/dione.glb',
    semiMajorKm: 377396,
    periodHours: 65.685,
    inclinationDeg: 0.019,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 149,
    meanRadiusKm: 561.4,
  },
  {
    id: 'rhea',
    name: 'Rhea',
    parentPlanetId: 'saturn',
    modelUrl: '/models/rhea.glb',
    semiMajorKm: 527108,
    periodHours: 108.42,
    inclinationDeg: 0.345,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 200,
    meanRadiusKm: 763.8,
  },
  {
    id: 'titan',
    name: 'Titan',
    parentPlanetId: 'saturn',
    modelUrl: '/models/titan.glb',
    semiMajorKm: 1221870,
    periodHours: 382.69,
    inclinationDeg: 0.3485,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 280,
    meanRadiusKm: 2574.7,
  },
  {
    id: 'iapetus',
    name: 'Iapetus',
    parentPlanetId: 'saturn',
    modelUrl: '/models/iapetus.glb',
    semiMajorKm: 3560820,
    periodHours: 1903.91,
    inclinationDeg: 15.47,
    longitudeOfAscendingNodeDeg: 78,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 292,
    meanRadiusKm: 734.5,
  },

  // —— Uranus (major) ——
  {
    id: 'miranda',
    name: 'Miranda',
    parentPlanetId: 'uranus',
    modelUrl: '/models/miranda.glb',
    semiMajorKm: 129390,
    periodHours: 33.923,
    inclinationDeg: 4.338,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 34,
    meanRadiusKm: 235.8,
  },
  {
    id: 'ariel',
    name: 'Ariel',
    parentPlanetId: 'uranus',
    modelUrl: '/models/ariel.glb',
    semiMajorKm: 191020,
    periodHours: 60.489,
    inclinationDeg: 0.041,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 60,
    meanRadiusKm: 578.9,
  },
  {
    id: 'umbriel',
    name: 'Umbriel',
    parentPlanetId: 'uranus',
    modelUrl: '/models/umbriel.glb',
    semiMajorKm: 266300,
    periodHours: 99.459,
    inclinationDeg: 0.128,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 120,
    meanRadiusKm: 584.7,
  },
  {
    id: 'titania',
    name: 'Titania',
    parentPlanetId: 'uranus',
    modelUrl: '/models/titania.glb',
    semiMajorKm: 435910,
    periodHours: 208.94,
    inclinationDeg: 0.079,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 200,
    meanRadiusKm: 788.9,
  },
  {
    id: 'oberon',
    name: 'Oberon',
    parentPlanetId: 'uranus',
    modelUrl: '/models/oberon.glb',
    semiMajorKm: 583520,
    periodHours: 323.08,
    inclinationDeg: 0.068,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 300,
    meanRadiusKm: 761.4,
  },

  // —— Neptune ——
  {
    id: 'triton',
    name: 'Triton',
    parentPlanetId: 'neptune',
    modelUrl: '/models/triton.glb',
    semiMajorKm: 354759,
    periodHours: -141.044, // retrograde
    inclinationDeg: 156.865,
    longitudeOfAscendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtJ2000Deg: 150,
    meanRadiusKm: 1353.4,
  },
];

export function moonsForPlanet(planetId: string): PlanetMoonDef[] {
  return PLANET_MOONS.filter((m) => m.parentPlanetId === planetId);
}

export function findPlanetMoon(id: string): PlanetMoonDef | undefined {
  return PLANET_MOONS.find((m) => m.id === id);
}

export function outermostMoonSemiMajorKm(planetId: string): number | null {
  const moons = moonsForPlanet(planetId);
  if (!moons.length) return null;
  return Math.max(...moons.map((m) => Math.abs(m.semiMajorKm)));
}

export function planetObliquityDeg(planetId: string): number {
  return PLANET_OBLIQUITY_DEG[planetId] ?? 0;
}

/** Sidereal period label for side panel (realtime archive pacing). */
export function formatMoonPeriod(periodHours: number): string {
  const abs = Math.abs(periodHours);
  const retro = periodHours < 0 ? ' · ret.' : '';
  if (abs >= 48) return `${(abs / 24).toFixed(1)} d${retro}`;
  return `${abs.toFixed(1)} h${retro}`;
}

/**
 * Mean anomaly (rad) at wall-clock time from J2000 Keplerian elements.
 * Circular-orbit approximation (e ≈ 0).
 */
export function moonMeanAnomalyRad(def: PlanetMoonDef, daysFromJ2000: number): number {
  const periodDays = Math.abs(def.periodHours) / 24;
  const n = (Math.sign(def.periodHours) || 1) * ((Math.PI * 2) / periodDays);
  const M0 = (def.meanAnomalyAtJ2000Deg * Math.PI) / 180;
  return M0 + n * daysFromJ2000;
}
