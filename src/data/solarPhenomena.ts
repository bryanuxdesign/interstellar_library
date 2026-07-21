/**
 * Notable solar surface / atmosphere phenomena shown in the Sun archive.
 * Positions are approximate heliographic lat/lng for museum framing.
 */
export interface SolarPhenomenon {
  id: string;
  name: string;
  kind: 'sunspot' | 'flare' | 'prominence' | 'cme';
  /** Rough heliographic latitude (-90..90). */
  lat: number;
  /** Rough heliographic longitude (-180..180). */
  lng: number;
  summary: string;
}

export const SOLAR_PHENOMENA: SolarPhenomenon[] = [
  {
    id: 'ar3664',
    name: 'Active Region 3664',
    kind: 'sunspot',
    lat: -18,
    lng: 45,
    summary:
      'A sprawling May 2024 sunspot complex — one of the largest of Solar Cycle 25 — that unleashed multiple X-class flares and a geomagnetic storm visible as aurora at mid-latitudes.',
  },
  {
    id: 'ar2192',
    name: 'Active Region 2192',
    kind: 'sunspot',
    lat: -12,
    lng: -80,
    summary:
      'October 2014 monster group — among the largest of Cycle 24 — producing a cascade of M- and X-class flares while rotating across the Earth-facing disk.',
  },
  {
    id: 'x5-flare',
    name: 'X-class flare ribbon',
    kind: 'flare',
    lat: 15,
    lng: 20,
    summary:
      'Stylized X-class flare: magnetic reconnection above a bipole suddenly releases energy, brightening the chromosphere in ribbon-like footpoints.',
  },
  {
    id: 'prominence-n',
    name: 'Northern prominence',
    kind: 'prominence',
    lat: 55,
    lng: -30,
    summary:
      'Cooler plasma suspended in magnetic loops along the limb — when seen against the disk it appears as a dark filament.',
  },
  {
    id: 'cme-limb',
    name: 'Limb CME launch',
    kind: 'cme',
    lat: -8,
    lng: 110,
    summary:
      'Coronal mass ejection archetype: a magnetic flux rope lifts off, dragging coronal plasma into interplanetary space at hundreds to thousands of km/s.',
  },
];
