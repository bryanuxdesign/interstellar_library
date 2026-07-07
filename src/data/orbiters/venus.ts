import type { OrbitalAsset } from '@/types';
import { elementsFromPeriApo } from '@/three/orbitElements';

/** Standard gravitational parameter for Venus (km³/s²). */
export const VENUS_MU = 324858.592;

const VENUS_R = 6051.8;

/**
 * Venus orbiters catalog.
 *
 * Akatsuki was the last operational Venus orbiter; JAXA formally ended the mission
 * on 18 September 2025 after contact was lost in April 2024. No active Venus
 * orbiters remain as of late 2025.
 *
 * Orbital parameters after the PC1 manoeuvre (4 Apr 2016, JAXA):
 * - Near-equatorial, prograde (matches atmospheric super-rotation)
 * - Periapsis altitude 1,000–10,000 km (varies with solar perturbations)
 * - Apoapsis altitude ~370,000 km
 * - Period ~10.8 days, e ≈ 0.97
 */
export const venusOrbiters: OrbitalAsset[] = [
  {
    id: 'akatsuki',
    name: 'Akatsuki',
    agency: 'JAXA',
    country: 'Japan',
    planetId: 'venus',
    status: 'decommissioned',
    mu: VENUS_MU,
    summary:
      'Japan\'s Venus Climate Orbiter studied cloud dynamics and super-rotation until JAXA ended the mission in September 2025 following loss of contact in April 2024.',
    elements: elementsFromPeriApo(
      VENUS_R + 1000,
      VENUS_R + 370000,
      {
        i: 3.0,
        raan: 0,
        argPeriapsis: 0,
        meanAnomalyAtEpoch: 0,
        epoch: '2016-04-04T00:00:00Z',
      },
    ),
  },
];
