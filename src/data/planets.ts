import type { CelestialBody } from '@/types';

export const MOON_TEXTURE_URL = '/images/planets/moon.jpg';

export const MARS_TEXTURE_URL = '/images/planets/mars.jpg';

export const VENUS_TEXTURE_URL = '/images/planets/venus.jpg';

export const MERCURY_TEXTURE_URL = '/images/planets/mercury.jpg';

export const JUPITER_TEXTURE_URL = '/images/planets/jupiter.jpg';

export const SATURN_TEXTURE_URL = '/images/planets/saturn.jpg';

export const URANUS_TEXTURE_URL = '/images/planets/uranus.jpg';

export const NEPTUNE_TEXTURE_URL = '/images/planets/neptune.jpg';

export const EARTH_TEXTURE_URL = '/images/planets/earth.jpg';

export const SUN_TEXTURE_URL = '/images/planets/sun.jpg';

/** Left-to-right order on the Gateway home screen. */
export const GATEWAY_PLANET_ORDER = ['venus', 'moon', 'mars'] as const;

/** Bottom destination cards — Moon first, matching the original layout. */
export const GATEWAY_CARD_ORDER = ['moon', 'mars', 'venus'] as const;

/**
 * Bodies with a full 3D archive globe.
 * Mission catalogues exist for moon / mars / venus; other worlds are globe-first.
 * Moon surface archive is reached via `/earth?focus=luna` (unified Earth+Moon page).
 */
export const planets: CelestialBody[] = [
  {
    id: 'sun',
    name: 'The Sun',
    subtitle: 'Sol · Our Star',
    radiusKm: 695700,
    textureUrl: SUN_TEXTURE_URL,
    available: true,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    subtitle: 'Sol I · Innermost',
    radiusKm: 2439.7,
    textureUrl: MERCURY_TEXTURE_URL,
    available: true,
  },
  {
    id: 'venus',
    name: 'Venus',
    subtitle: 'Sol II · The Morning Star',
    radiusKm: 6051.8,
    textureUrl: VENUS_TEXTURE_URL,
    available: true,
  },
  {
    id: 'earth',
    name: 'Earth',
    subtitle: 'Sol III · Home',
    radiusKm: 6371,
    textureUrl: EARTH_TEXTURE_URL,
    available: true,
  },
  {
    id: 'moon',
    name: 'The Moon',
    subtitle: 'Earth I · Luna',
    radiusKm: 1737.4,
    textureUrl: MOON_TEXTURE_URL,
    /** Gateway still features the Moon; archive opens inside `/earth?focus=luna`. */
    available: true,
  },
  {
    id: 'mars',
    name: 'Mars',
    subtitle: 'Sol IV · The Red Planet',
    radiusKm: 3389.5,
    textureUrl: MARS_TEXTURE_URL,
    available: true,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    subtitle: 'Sol V · Gas Giant',
    radiusKm: 71492,
    textureUrl: JUPITER_TEXTURE_URL,
    available: true,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    subtitle: 'Sol VI · Ringed Giant',
    radiusKm: 60268,
    textureUrl: SATURN_TEXTURE_URL,
    available: true,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    subtitle: 'Sol VII · Ice Giant',
    radiusKm: 25559,
    textureUrl: URANUS_TEXTURE_URL,
    available: true,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    subtitle: 'Sol VIII · Ice Giant',
    radiusKm: 24764,
    textureUrl: NEPTUNE_TEXTURE_URL,
    available: true,
  },
];

export const getPlanet = (id: string): CelestialBody | undefined =>
  planets.find((p) => p.id === id);
