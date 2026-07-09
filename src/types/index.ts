export type AssetStatus = 'active' | 'decommissioned' | 'impact' | 'planned';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  subtitle: string;
  radiusKm: number;
  textureUrl: string;
  bumpMapUrl?: string;
  available: boolean;
}

export interface MissionSource {
  title: string;
  url: string;
  type: 'paper' | 'press';
  publisher: string;
  excerpt: string;
}

export interface MissionImage {
  url: string;
  caption: string;
  credit?: string;
}

export interface Mission {
  id: string;
  name: string;
  agency: string;
  country: string;
  classification: string; // e.g. "Lander", "Rover", "Impactor", "Sample Return"
  status: AssetStatus;
  planetId: string;
  coordinates: Coordinates;
  launchDate: string; // ISO date
  landingDate: string; // ISO date (or impact date)
  /** Closest approach altitude in km — flyby missions only. */
  closestApproachKm?: number;
  plannedLifespanDays: number;
  actualLifespanDays: number | null;
  massKg: number;
  healthStatus: string;
  summary: string;
  forensicImageUrl?: string;
  vehicleImages?: MissionImage[];
  sources: MissionSource[];
}

export type RoverTraverseDataSource = 'nasa-mmgis' | 'pds-mer' | 'static';

/** Mars rover traverse — landing site, path, and last-known position. */
export interface RoverTraverseRecord {
  missionId: string;
  landingSite: Coordinates;
  lastKnown: Coordinates;
  path: Coordinates[];
  totalDistanceKm: number;
  lastDriveSol: number | null;
  lastDriveDate: string | null;
  dataSource: RoverTraverseDataSource;
  dataUpdatedAt: string;
  approximate?: boolean;
}

export interface TimelineEvent {
  id: string;
  missionId: string;
  date: string; // ISO date
  label: string;
  status: AssetStatus;
  coordinates: Coordinates;
}

export interface Telemetry {
  successfulLandings: number;
  activeAssets: number;
  impactSites: number;
  totalMassKg: number;
  agencies: number;
  firstEventYear: number;
  latestEventYear: number;
}

/** Keplerian osculating elements referenced to the body's equatorial frame. */
export interface OrbitalElements {
  /** Semi-major axis in km (centre-to-centre). */
  a: number;
  /** Eccentricity (0 = circular). */
  e: number;
  /** Inclination in degrees. */
  i: number;
  /** Right ascension of ascending node in degrees. */
  raan: number;
  /** Argument of periapsis in degrees. */
  argPeriapsis: number;
  /** Mean anomaly at epoch in degrees. */
  meanAnomalyAtEpoch: number;
  /** ISO instant the elements were valid. */
  epoch: string;
}

export interface OrbitalAsset {
  id: string;
  name: string;
  agency: string;
  country: string;
  planetId: string;
  status: 'active' | 'decommissioned';
  elements: OrbitalElements;
  /** Standard gravitational parameter μ (km³/s²) for the central body. */
  mu: number;
  summary: string;
  /** Optional NASA JPL Horizons target ID for future ephemeris upgrades. */
  horizonsId?: string;
}

/** Live propagated state for rendering. */
export interface OrbitalState {
  positionKm: { x: number; y: number; z: number };
  lat: number;
  lng: number;
  altKm: number;
  periodMinutes: number;
}
