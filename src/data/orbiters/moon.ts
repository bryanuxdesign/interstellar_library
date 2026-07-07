import type { OrbitalAsset } from '@/types';
import { elementsFromPeriApo } from '@/three/orbitElements';

/** Standard gravitational parameter for the Moon (km³/s²). */
export const MOON_MU = 4902.801056;

/** Moon equatorial radius (km) — for peri/apo construction. */
const MOON_R = 1737.4;

/**
 * Active lunar orbiters — elements from published mission fact sheets (approximate).
 * Epochs should be refreshed after major manoeuvres.
 */
export const moonOrbiters: OrbitalAsset[] = [
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter',
    agency: 'NASA / GSFC',
    country: 'USA',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    horizonsId: '-85',
    summary:
      'LRO maps the Moon in unprecedented detail from a near-polar orbit, supporting Artemis landing site selection and monitoring surface change.',
    elements: {
      a: 1787,
      e: 0.002,
      i: 89.8,
      raan: 270,
      argPeriapsis: 39,
      meanAnomalyAtEpoch: 0,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'capstone',
    name: 'CAPSTONE',
    agency: 'NASA / Advanced Space',
    country: 'USA',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'CAPSTONE flies a near-rectilinear halo orbit (NRHO) ahead of Gateway, testing navigation and communications for future Artemis missions.',
    elements: elementsFromPeriApo(
      MOON_R + 1500,
      MOON_R + 70000,
      {
        i: 34.2,
        raan: 45,
        argPeriapsis: 180,
        meanAnomalyAtEpoch: 90,
        epoch: '2024-06-01T00:00:00Z',
      },
    ),
  },
  {
    id: 'artemis-p1',
    name: 'ARTEMIS-P1',
    agency: 'NASA / UC Berkeley',
    country: 'USA',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'Former THEMIS-B probe repurposed in 2011 to study the lunar exosphere and magnetotail from a stable, high-eccentricity retrograde equatorial orbit.',
    elements: elementsFromPeriApo(
      MOON_R + 100,
      MOON_R + 19000,
      {
        i: 172,
        raan: 30,
        argPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: '2024-01-01T00:00:00Z',
      },
    ),
  },
  {
    id: 'artemis-p2',
    name: 'ARTEMIS-P2',
    agency: 'NASA / UC Berkeley',
    country: 'USA',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'Former THEMIS-C probe operating in a prograde equatorial counterpart orbit to P1, enabling two-point measurements of the Moon–solar-wind interaction.',
    elements: elementsFromPeriApo(
      MOON_R + 100,
      MOON_R + 19000,
      {
        i: 6,
        raan: 210,
        argPeriapsis: 90,
        meanAnomalyAtEpoch: 180,
        epoch: '2024-01-01T00:00:00Z',
      },
    ),
  },
  {
    id: 'queqiao-2',
    name: 'Queqiao-2',
    agency: 'CNSA',
    country: 'China',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'Magpie Bridge 2 relay satellite in a frozen elliptical lunar orbit, providing farside communications for Chang\'e-6 and future Chinese lunar missions.',
    elements: elementsFromPeriApo(
      MOON_R + 254,
      MOON_R + 16941,
      {
        i: 62.4,
        raan: 120,
        argPeriapsis: 0,
        meanAnomalyAtEpoch: 45,
        epoch: '2024-03-24T00:00:00Z',
      },
    ),
  },
  {
    id: 'tiandu-1',
    name: 'Tiandu-1',
    agency: 'CNSA / DSEL',
    country: 'China',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'Navigation and communications technology demonstrator launched with Queqiao-2, testing lunar orbit determination and inter-satellite ranging.',
    elements: elementsFromPeriApo(
      MOON_R + 200,
      MOON_R + 16000,
      {
        i: 55,
        raan: 125,
        argPeriapsis: 15,
        meanAnomalyAtEpoch: 60,
        epoch: '2024-04-03T00:00:00Z',
      },
    ),
  },
  {
    id: 'tiandu-2',
    name: 'Tiandu-2',
    agency: 'CNSA / DSEL',
    country: 'China',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'Companion demonstrator flying in formation with Tiandu-1, validating Ka-band links and navigation payloads for future cislunar infrastructure.',
    elements: elementsFromPeriApo(
      MOON_R + 200,
      MOON_R + 16000,
      {
        i: 55,
        raan: 125,
        argPeriapsis: 15,
        meanAnomalyAtEpoch: 240,
        epoch: '2024-04-03T00:00:00Z',
      },
    ),
  },
  {
    id: 'chandrayaan-2-orbiter',
    name: 'Chandrayaan-2 Orbiter',
    agency: 'ISRO',
    country: 'India',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'India\'s operational lunar orbiter mapping the surface from a 100 km polar orbit, continuing science after the Vikram lander mission phase.',
    elements: elementsFromPeriApo(
      MOON_R + 100,
      MOON_R + 100,
      {
        i: 90,
        raan: 0,
        argPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: '2019-09-01T00:00:00Z',
      },
    ),
  },
  {
    id: 'danuri',
    name: 'Danuri (KPLO)',
    agency: 'KARI',
    country: 'South Korea',
    planetId: 'moon',
    status: 'active',
    mu: MOON_MU,
    summary:
      'South Korea\'s first lunar orbiter, imaging the surface and demonstrating space internet from a 100 km near-polar orbit since December 2022.',
    elements: elementsFromPeriApo(
      MOON_R + 100,
      MOON_R + 100,
      {
        i: 90,
        raan: 180,
        argPeriapsis: 90,
        meanAnomalyAtEpoch: 120,
        epoch: '2022-12-16T00:00:00Z',
      },
    ),
  },
];
