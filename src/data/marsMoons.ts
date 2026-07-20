/**
 * @deprecated Prefer `@/data/planetMoons`.
 * Kept so older imports of Mars moon constants keep working.
 */
import { moonsForPlanet, type PlanetMoonDef } from './planetMoons';

export type MarsMoonDef = PlanetMoonDef;
export const MARS_RADIUS_KM = 3389.5;
export const MARS_MOONS = moonsForPlanet('mars');
