import type { CelestialBody } from '@/types';

export const MOON_TEXTURE_URL =
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';

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
    textureUrl: '',
    available: false,
  },
  {
    id: 'venus',
    name: 'Venus',
    subtitle: 'Sol II · The Morning Star',
    radiusKm: 6051.8,
    textureUrl: '',
    available: false,
  },
];

export const getPlanet = (id: string): CelestialBody | undefined =>
  planets.find((p) => p.id === id);
