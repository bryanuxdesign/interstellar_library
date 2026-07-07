import type { OrbitalAsset } from '@/types';
import { elementsFromPeriApo } from '@/three/orbitElements';

/** Standard gravitational parameter for Mars (km³/s²). */
export const MARS_MU = 42828.375214;

const MARS_R = 3389.5;

/**
 * Active Mars orbiters — elements approximate from mission fact sheets.
 */
export const marsOrbiters: OrbitalAsset[] = [
  {
    id: 'mro',
    name: 'Mars Reconnaissance Orbiter',
    agency: 'NASA / JPL',
    country: 'USA',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    horizonsId: '-74',
    summary:
      'MRO returns sub-metre imagery and acts as the primary relay for surface assets, operating from a near-polar sun-synchronous orbit since 2006.',
    elements: {
      a: 3670,
      e: 0.012,
      i: 92.65,
      raan: 120,
      argPeriapsis: 280,
      meanAnomalyAtEpoch: 45,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'odyssey',
    name: 'Mars Odyssey',
    agency: 'NASA / JPL',
    country: 'USA',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'Odyssey maps mineralogy and acts as a UHF relay for rovers from a sun-synchronous orbit — the longest-operating Mars spacecraft.',
    elements: {
      a: 3780,
      e: 0.011,
      i: 93.1,
      raan: 95,
      argPeriapsis: 310,
      meanAnomalyAtEpoch: 120,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'maven',
    name: 'MAVEN',
    agency: 'NASA / LASP',
    country: 'USA',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'MAVEN studies atmospheric escape and the Martian climate from an elliptical science orbit, dipping into the upper atmosphere each periapsis.',
    elements: {
      a: 4200,
      e: 0.18,
      i: 74.6,
      raan: 200,
      argPeriapsis: 150,
      meanAnomalyAtEpoch: 200,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'mars-express',
    name: 'Mars Express',
    agency: 'ESA',
    country: 'Europe',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'Mars Express carries radar to probe subsurface ice and maps the atmosphere from a polar elliptical orbit since 2003.',
    elements: elementsFromPeriApo(
      MARS_R + 250,
      MARS_R + 10000,
      {
        i: 86.3,
        raan: 160,
        argPeriapsis: 90,
        meanAnomalyAtEpoch: 60,
        epoch: '2024-01-01T00:00:00Z',
      },
    ),
  },
  {
    id: 'tgo',
    name: 'ExoMars Trace Gas Orbiter',
    agency: 'ESA / Roscosmos',
    country: 'Europe',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'TGO searches for trace gases including methane and relays data from the Rosalind Franklin rover when it arrives, from a circular 400 km orbit.',
    elements: {
      a: 3790,
      e: 0.008,
      i: 74.0,
      raan: 240,
      argPeriapsis: 20,
      meanAnomalyAtEpoch: 300,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'hope',
    name: 'Hope (EMM)',
    agency: 'MBRSC',
    country: 'UAE',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'The Emirates Mars Mission studies the Martian atmosphere diurnally from a high elliptical 20,000–43,000 km orbit, capturing full-disk views each ~55 hours.',
    elements: {
      a: 15000,
      e: 0.44,
      i: 25.0,
      raan: 80,
      argPeriapsis: 200,
      meanAnomalyAtEpoch: 15,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'tianwen-1-orbiter',
    name: 'Tianwen-1 Orbiter',
    agency: 'CNSA',
    country: 'China',
    planetId: 'mars',
    status: 'active',
    mu: MARS_MU,
    summary:
      'Tianwen-1 continues remote sensing and relay duties from a polar science orbit after deploying the Zhurong rover to the surface.',
    elements: {
      a: 3950,
      e: 0.05,
      i: 87.0,
      raan: 310,
      argPeriapsis: 250,
      meanAnomalyAtEpoch: 180,
      epoch: '2024-01-01T00:00:00Z',
    },
  },
];
