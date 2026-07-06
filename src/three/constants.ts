/** Radius of the rendered globe in scene units. */
export const GLOBE_RADIUS = 2;

/** Default orbital distance from the globe centre. */
export const DEFAULT_CAMERA_DISTANCE = GLOBE_RADIUS * 3;

/** Colours for surface hardware, mirrored from the telemetry colorway. */
export const STATUS_COLORS = {
  active: '#22e06b',
  decommissioned: '#9aa0aa',
  impact: '#ff453a',
} as const;
