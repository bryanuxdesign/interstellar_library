import type { CelestialBody } from '@/types';

export const MOON_TEXTURE_URL = '/images/planets/moon.jpg';

export const MARS_TEXTURE_URL = '/images/planets/mars.jpg';

export const VENUS_TEXTURE_URL = '/images/planets/venus.jpg';

/** Left-to-right order on the Gateway home screen. */
export const GATEWAY_PLANET_ORDER = ['venus', 'moon', 'mars'] as const;

/** Bottom destination cards — Moon first, matching the original layout. */
export const GATEWAY_CARD_ORDER = ['moon', 'mars', 'venus'] as const;

export const planets: CelestialBody[] = [
  {
    id: 'moon',
    name: 'The Moon',
    subtitle: 'Earth I · Luna',
    radiusKm: 1737.4,
    textureUrl: MOON_TEXTURE_URL,
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
    id: 'venus',
    name: 'Venus',
    subtitle: 'Sol II · The Morning Star',
    radiusKm: 6051.8,
    textureUrl: VENUS_TEXTURE_URL,
    available: true,
  },
];

export const getPlanet = (id: string): CelestialBody | undefined =>
  planets.find((p) => p.id === id);
