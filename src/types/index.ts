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
