/**
 * Realtime sun direction for PlanetView archives (museum-grade, not DE440).
 * Earth uses GMST + subsolar point; other bodies use Kepler heliocentric vectors.
 */

import { Vector3 } from 'three';
import { daysSinceJ2000, softElementsFor, keplerPositionAu } from '@/solar/ephemeris';
import { PLANET_OBLIQUITY_DEG } from '@/data/planetMoons';
import { PLANET_ROTATION_OFFSET } from '@/three/constants';
import { latLngToVector3 } from '@/three/coordinateUtils';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export interface SubsolarPoint {
  lat: number;
  lng: number;
}

function wrapLon(deg: number): number {
  let x = ((((deg + 180) % 360) + 360) % 360) - 180;
  if (x === -180) x = 180;
  return x;
}

/**
 * Approximate geographic longitude (°E) for the user's timezone midpoint.
 * `getTimezoneOffset` is minutes behind UTC → lon ≈ −offset/4.
 */
export function approxLongitudeFromTimezone(date: Date = new Date()): number {
  return wrapLon(-date.getTimezoneOffset() / 4);
}

/** Default “you are here” latitude when only timezone is known. */
export const TZ_OBSERVER_LAT_DEG = 30;

/**
 * Earth subsolar lat/lng (degrees) at `date`.
 * Simplified NOAA / USNO-style solar position — good enough for archive terminators.
 */
export function subsolarPointEarth(date: Date = new Date()): SubsolarPoint {
  const d = daysSinceJ2000(date);

  // Mean anomaly & ecliptic longitude of the Sun (degrees)
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;

  // Mean obliquity of the ecliptic
  const eps = (23.439 - 0.00000036 * d) * DEG;

  const sinL = Math.sin(L);
  const cosL = Math.cos(L);
  const sinEps = Math.sin(eps);
  const cosEps = Math.cos(eps);

  const decl = Math.asin(sinEps * sinL); // subsolar latitude
  const ra = Math.atan2(cosEps * sinL, cosL); // right ascension

  // Greenwich mean sidereal time (degrees)
  const gmst =
    (280.46061837 + 360.98564736629 * d + date.getUTCMilliseconds() * (360.98564736629 / 86400000)) %
    360;
  const gmstRad = ((gmst + 360) % 360) * DEG;

  // Subsolar geographic longitude (east positive)
  let lng = (ra - gmstRad) * RAD;
  lng = wrapLon(lng - (PLANET_ROTATION_OFFSET.earth ?? 0));

  return { lat: decl * RAD, lng };
}

/**
 * Unit sun direction in Earth body/texture frame (Y = north pole),
 * matching `latLngToVector3` so the day/night shader terminator aligns with maps.
 */
export function earthSunDirectionBodyFrame(
  date: Date = new Date(),
  out = new Vector3(),
): Vector3 {
  const { lat, lng } = subsolarPointEarth(date);
  return latLngToVector3({ lat, lng }, 1, out).normalize();
}

/**
 * Unit sun direction in PlanetView world space for a body at the origin.
 * Earth/Moon: body-frame subsolar vector. Others: −heliocentric with obliquity tip.
 */
export function planetSunDirectionWorld(
  planetId: string,
  date: Date = new Date(),
  out = new Vector3(),
): Vector3 {
  const id = planetId === 'moon' || planetId === 'luna' ? 'earth' : planetId;

  if (id === 'earth' || id === 'sun') {
    return earthSunDirectionBodyFrame(date, out);
  }

  const el = softElementsFor(id);
  if (!el) {
    return out.set(5, 3, 5).normalize();
  }

  const pos = keplerPositionAu(el, daysSinceJ2000(date));
  // From planet toward Sun
  out.copy(pos).negate().normalize();

  // Map ecliptic → planet equator (inverse of moon-orbit obliquity tip about X)
  const obl = (PLANET_OBLIQUITY_DEG[id] ?? 0) * DEG;
  if (Math.abs(obl) > 1e-6) {
    const c = Math.cos(-obl);
    const s = Math.sin(-obl);
    const y = out.y;
    const z = out.z;
    out.y = y * c - z * s;
    out.z = y * s + z * c;
  }

  return out;
}

/** True if local solar elevation is above the horizon at lat/lng. */
export function isLocalDaytime(
  lat: number,
  lng: number,
  date: Date = new Date(),
): boolean {
  const sun = earthSunDirectionBodyFrame(date);
  const n = latLngToVector3({ lat, lng }, 1);
  return n.dot(sun) > 0.02;
}

export function observerCoordsFromTimezone(date: Date = new Date()): {
  lat: number;
  lng: number;
} {
  return { lat: TZ_OBSERVER_LAT_DEG, lng: approxLongitudeFromTimezone(date) };
}
