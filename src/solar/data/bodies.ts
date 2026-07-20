export type SolarBodyKind = 'star' | 'planet' | 'dwarf' | 'asteroid' | 'probe';

/** Planetary ring mesh — Saturn bright; ice/gas giants faint. */
export interface PlanetRingConfig {
  /** Inner radius as multiple of body.size. */
  inner: number;
  /** Outer radius as multiple of body.size. */
  outer: number;
  /** Base opacity (Saturn ≫ others). */
  opacity: number;
  /** Axial obliquity / ring-plane tilt from ecliptic (radians). */
  obliquity: number;
  /** Use saturn_ring.png alpha strip when true. */
  textured?: boolean;
  color?: string;
}

export interface SolarBody {
  id: string;
  name: string;
  kind: SolarBodyKind;
  /** Compressed orbital radius (scene units), not true AU. */
  radius: number;
  /** Relative orbital angular speed. */
  speed: number;
  /** Visual sphere radius. */
  size: number;
  color: string;
  fact: string;
  /** Optional planetary rings. */
  ring?: PlanetRingConfig;
  /** Probe: outbound drift past the system rather than a closed orbit. */
  outbound?: boolean;
  /**
   * Fixed ecliptic direction for outbound probes (unit-ish XYZ; Y = north).
   * Position = normalize(dir) * (radius + drift).
   */
  outboundDir?: [number, number, number];
  /** Approximate heliocentric distance in AU (dossier / labels). */
  auDistance?: number;
  /** Gentle orbital inclination in radians (NASA Eyes–style disk with subtle tilt). */
  inclination?: number;
  /** Deep-link into the Archive 3D globe (Earth deferred). */
  archivePlanetId?:
    | 'mercury'
    | 'venus'
    | 'moon'
    | 'mars'
    | 'jupiter'
    | 'saturn'
    | 'uranus'
    | 'neptune';
}

const DEG = Math.PI / 180;

/**
 * Compressed AU scale (Eyes-like): sceneRadius ≈ 2.93 × AU^0.48
 * Keeps Mercury…Neptune proportional with mild power compression;
 * Neptune ≈ 15 world units so the outer system stays on-screen.
 *
 * | Body    | AU     | radius |
 * |---------|--------|--------|
 * | Mercury | 0.39   | 1.86   |
 * | Venus   | 0.72   | 2.51   |
 * | Earth   | 1.00   | 2.93   |
 * | Mars    | 1.52   | 3.59   |
 * | Jupiter | 5.20   | 6.47   |
 * | Saturn  | 9.54   | 8.65   |
 * | Uranus  | 19.2   | 12.10  |
 * | Neptune | 30.1   | 15.01  |
 * | V1      | ~163   | 22.5*  |
 * | V2      | ~136   | 20.8*  |
 *
 * *Voyagers use further mild compression beyond Eris so they remain reachable
 * in the default OrbitControls range while still reading as interstellar.
 */

/** Museum-pace orbital speeds (~18× slower than the original arcade tempo). */
export const SOLAR_BODIES: SolarBody[] = [
  {
    id: 'sun',
    name: 'Sun',
    kind: 'star',
    radius: 0,
    speed: 0,
    size: 0.48,
    color: '#ffb347',
    fact: 'The Sun carries the entire planetary system with it through the Milky Way at ~220 km/s relative to the galactic center.',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'planet',
    radius: 1.86,
    speed: 0.228,
    size: 0.045,
    color: '#b0a090',
    fact: 'Innermost planet — a scorched, airless world with extreme day–night swings.',
    archivePlanetId: 'mercury',
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planet',
    radius: 2.51,
    speed: 0.178,
    size: 0.07,
    color: '#e8c56b',
    fact: 'Earth’s twin in size, wrapped in a crushing CO₂ greenhouse — explored in the Archive.',
    archivePlanetId: 'venus',
  },
  {
    id: 'earth',
    name: 'Earth',
    kind: 'planet',
    radius: 2.93,
    speed: 0.15,
    size: 0.08,
    color: '#4a90d9',
    fact: 'Home world — oceans, life, and one large Moon in the Archive catalogue.',
    archivePlanetId: 'moon',
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'planet',
    radius: 3.59,
    speed: 0.122,
    size: 0.055,
    color: '#c45c3e',
    fact: 'The red planet — landers and rovers fill the Archive’s Mars catalogue.',
    archivePlanetId: 'mars',
  },
  {
    id: 'vesta',
    name: 'Vesta',
    kind: 'asteroid',
    radius: 4.42,
    speed: 0.094,
    size: 0.035,
    color: '#9a9590',
    fact: 'One of the largest asteroids; a differentiated protoplanet in the main belt.',
  },
  {
    id: 'pallas',
    name: 'Pallas',
    kind: 'asteroid',
    radius: 4.78,
    speed: 0.086,
    size: 0.032,
    color: '#8a8580',
    inclination: 0.34,
    fact: 'Highly inclined main-belt asteroid — among the first discovered.',
  },
  {
    id: 'hygiea',
    name: 'Hygiea',
    kind: 'asteroid',
    radius: 5.07,
    speed: 0.078,
    size: 0.032,
    color: '#7a7570',
    fact: 'C-type giant of the outer main belt; nearly spherical.',
  },
  {
    id: 'ceres',
    name: 'Ceres',
    kind: 'dwarf',
    radius: 4.78,
    speed: 0.083,
    size: 0.045,
    color: '#c8c4bc',
    fact: 'Dwarf planet and largest object in the asteroid belt — visited by Dawn.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'planet',
    radius: 6.47,
    speed: 0.064,
    size: 0.2,
    color: '#d4a574',
    // Dust rings — extremely faint vs Saturn.
    ring: {
      inner: 1.45,
      outer: 1.95,
      opacity: 0.06,
      obliquity: 3.13 * DEG,
      color: '#c4b090',
    },
    fact: 'King of the planets — a failed star’s worth of hydrogen and helium. Faint dust rings hug the equator.',
    archivePlanetId: 'jupiter',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'planet',
    radius: 8.65,
    speed: 0.047,
    size: 0.17,
    color: '#e6d5a8',
    ring: {
      inner: 1.35,
      outer: 2.15,
      opacity: 0.92,
      obliquity: 26.73 * DEG,
      textured: true,
      color: '#e8dcc0',
    },
    fact: 'Ringed gas giant; the rings are icy shards in delicate orbital dance.',
    archivePlanetId: 'saturn',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'planet',
    radius: 12.1,
    speed: 0.031,
    size: 0.11,
    color: '#9fd3e0',
    // Narrow dark rings; axis tipped ~98° so rings are near-vertical to ecliptic.
    ring: {
      inner: 1.55,
      outer: 2.05,
      opacity: 0.16,
      obliquity: 97.77 * DEG,
      color: '#b8d0d8',
    },
    fact: 'Ice giant tipped on its side — seasons last decades. Thin dark rings share the extreme tilt.',
    archivePlanetId: 'uranus',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'planet',
    radius: 15.01,
    speed: 0.023,
    size: 0.105,
    color: '#4169e1',
    ring: {
      inner: 1.5,
      outer: 1.95,
      opacity: 0.11,
      obliquity: 28.32 * DEG,
      color: '#8090c8',
    },
    fact: 'Windiest planet known; faint rings and Triton, a captured Kuiper object.',
    archivePlanetId: 'neptune',
  },
  {
    id: 'pluto',
    name: 'Pluto',
    kind: 'dwarf',
    radius: 17.11,
    speed: 0.018,
    size: 0.04,
    color: '#c4a882',
    inclination: 0.17,
    fact: 'Kuiper-belt dwarf planet; New Horizons revealed mountains of ice and haze.',
  },
  {
    id: 'haumea',
    name: 'Haumea',
    kind: 'dwarf',
    radius: 17.82,
    speed: 0.016,
    size: 0.038,
    color: '#ddd5c8',
    inclination: 0.12,
    fact: 'Fast-spinning elongated dwarf with a ring and two moons.',
  },
  {
    id: 'makemake',
    name: 'Makemake',
    kind: 'dwarf',
    radius: 18.37,
    speed: 0.014,
    size: 0.038,
    color: '#d4b896',
    inclination: 0.1,
    fact: 'Bright classical Kuiper-belt dwarf planet.',
  },
  {
    id: 'eris',
    name: 'Eris',
    kind: 'dwarf',
    radius: 19.6,
    speed: 0.011,
    size: 0.04,
    color: '#e8e4dc',
    inclination: 0.22,
    fact: 'Massive scattered-disk dwarf; its discovery helped redefine “planet.”',
  },
  {
    id: 'parker',
    name: 'Parker Solar Probe',
    kind: 'probe',
    radius: 1.15,
    speed: 0.306,
    size: 0.028,
    color: '#ff6b35',
    inclination: 0.08,
    auDistance: 0.55,
    fact: 'NASA · Sun · Orbiting. Fastest human-made object, skimming the solar corona. Launched 2018.',
  },
  {
    id: 'osiris-apex',
    name: 'OSIRIS-APEX',
    kind: 'probe',
    radius: 2.7,
    speed: 0.14,
    size: 0.026,
    color: '#a3e635',
    inclination: 0.06,
    // Near-Earth cruise toward Apophis (2029).
    outboundDir: [0.82, 0.08, 0.55],
    auDistance: 1.05,
    fact: 'NASA · Apophis · En route. OSIRIS-REx extended mission; Earth-return complete, cruise to 2029 Apophis encounter.',
  },
  {
    id: 'psyche',
    name: 'Psyche',
    kind: 'probe',
    radius: 3.7,
    speed: 0.11,
    size: 0.026,
    color: '#fbbf24',
    inclination: 0.05,
    // Mid-2026: near Mars-distance cruise after flyby toward metal asteroid.
    outboundDir: [0.35, 0.12, 0.92],
    auDistance: 1.6,
    fact: 'NASA · Asteroid Psyche · En route. Mars gravity assist 2026; arrival at the metal-rich asteroid ~2029.',
  },
  {
    id: 'europa-clipper',
    name: 'Europa Clipper',
    kind: 'probe',
    radius: 4.35,
    speed: 0.09,
    size: 0.028,
    color: '#38bdf8',
    inclination: 0.04,
    // Mid-2026: outbound toward Jupiter after Mars flyby (Earth flyby late 2026).
    outboundDir: [0.15, 0.05, 0.99],
    auDistance: 2.1,
    fact: 'NASA · Europa · En route. Ice-moon tour craft; Jupiter arrival ~2030 after Earth gravity assist.',
  },
  {
    id: 'juice',
    name: 'JUICE',
    kind: 'probe',
    radius: 4.9,
    speed: 0.08,
    size: 0.028,
    color: '#818cf8',
    inclination: 0.05,
    // Mid-2026: ESA Jupiter Icy Moons Explorer — cruise between Earth assists.
    outboundDir: [-0.25, 0.1, 0.96],
    auDistance: 2.6,
    fact: 'ESA · Jupiter icy moons · En route. Jupiter Icy Moons Explorer; arrives ~2031 to study Ganymede, Callisto, and Europa.',
  },
  {
    id: 'lucy',
    name: 'Lucy',
    kind: 'probe',
    radius: 6.2,
    speed: 0.055,
    size: 0.028,
    color: '#f472b6',
    inclination: 0.04,
    // Mid-2026: cruise toward Jupiter Trojan L4 swarm (~5.2 AU).
    outboundDir: [0.55, 0.06, 0.83],
    auDistance: 4.8,
    fact: 'NASA · Trojan asteroids · En route. Tour of Jupiter’s L4/L5 Trojan swarms; first Trojan encounters begin 2027.',
  },
  {
    id: 'voyager1',
    name: 'Voyager 1',
    kind: 'probe',
    radius: 22.5,
    speed: 0,
    size: 0.045,
    color: '#7dd3fc',
    outbound: true,
    // Northern ecliptic / toward Ophiuchus — high latitude outbound.
    outboundDir: [0.55, 0.58, 0.6],
    auDistance: 163,
    fact: 'NASA · Interstellar · Cruise. Launched 1977. Farthest spacecraft (~163 AU); crossed the heliopause in 2012. Still returning plasma and cosmic-ray data.',
  },
  {
    id: 'voyager2',
    name: 'Voyager 2',
    kind: 'probe',
    radius: 20.8,
    speed: 0,
    size: 0.045,
    color: '#67e8f9',
    outbound: true,
    // Southern ecliptic / toward Pavo — only probe to visit Uranus & Neptune.
    outboundDir: [0.35, -0.72, -0.6],
    auDistance: 136,
    fact: 'NASA · Interstellar · Cruise. Launched 1977. Only probe to fly by Uranus and Neptune; entered interstellar space in 2018 (~136 AU).',
  },
];

/** Main belt band between Mars (~3.59) and Jupiter (~6.47). */
export const BELT_INNER = 4.25;
export const BELT_OUTER = 5.85;
