/** Radius of the rendered globe in scene units. */
export const GLOBE_RADIUS = 2;

/** Default orbital distance from the globe centre. */
export const DEFAULT_CAMERA_DISTANCE = GLOBE_RADIUS * 3;

/** Altitude (km) used to draw flyby arcs above the globe — skimming the atmosphere. */
export const VISUAL_FLYBY_ALT_KM = 100;

/** Camera distance multiplier when framing a flyby track vs a surface pin. */
export const FLYBY_CAMERA_ALTITUDE = 2.1;

/** Colours for surface hardware, mirrored from the telemetry colorway. */
export const STATUS_COLORS = {
  active: '#22e06b',
  decommissioned: '#9aa0aa',
  impact: '#ff453a',
  planned: '#6b9fff',
} as const;
