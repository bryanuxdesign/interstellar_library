/** Radius of the rendered globe in scene units. */
export const GLOBE_RADIUS = 2;

/** Default orbital distance from the globe centre. */
export const DEFAULT_CAMERA_DISTANCE = GLOBE_RADIUS * 3;

/** Altitude (km) used to draw flyby arcs above the globe — skimming the atmosphere. */
export const VISUAL_FLYBY_ALT_KM = 100;

/** Minimum clearance above the surface for rendered orbit paths (km). */
export const MIN_ORBIT_ALTITUDE_KM = 120;

/** Camera zoom headroom beyond the highest apoapsis (scene units). */
export const CAMERA_ORBIT_MARGIN = 1.35;

/** Camera distance multiplier when framing a flyby track vs a surface pin. */
export const FLYBY_CAMERA_ALTITUDE = 2.1;

/** Colours for surface hardware, mirrored from the telemetry colorway. */
export const STATUS_COLORS = {
  active: '#22e06b',
  decommissioned: '#9aa0aa',
  impact: '#ff453a',
  planned: '#6b9fff',
} as const;

/** Orbiter marker colour — distinct from surface active pins. */
export const ORBITER_COLOR = '#38bdf8';

/** Rover traverse line colours on the Mars globe. */
export const ROVER_TRAVERSE_COLORS = {
  active: '#22e06b',
  decommissioned: '#6b7280',
} as const;

export const SURFACE_LIFT = 0.015;

/**
 * Longitude offset (degrees) applied when mapping body-fixed coordinates onto
 * each GLB globe mesh. Tune per planet so pins / orbit tracks align with terrain.
 *
 * To calibrate: pick a landmark with known coordinates, adjust until surface
 * pins and orbital tracks line up with the visible feature on the GLB model.
 * Apply the same value here and on CelestialGlobe.rotationOffset (radians).
 */
export const PLANET_ROTATION_OFFSET: Record<string, number> = {
  moon: 0,
  mars: 0,
  venus: 0,
};
