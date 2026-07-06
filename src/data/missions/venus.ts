import type { Mission } from '@/types';

/** Convert NASA/Wikipedia 0–360°E longitude to signed degrees used by the mapping engine. */
const lng = (east: number): number => (east > 180 ? east - 360 : east);

/**
 * Venus mission catalogue — historic touchpoints (1962–1985) and planned missions (2028–2036).
 * Surface coordinates from NSSDCA, NASA, and the Wikipedia list of extraterrestrial landings.
 */
export const venusMissions: Mission[] = [
  // ── Flybys ──────────────────────────────────────────────────────────────
  {
    id: 'mariner-2',
    name: 'Mariner 2',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -29.0, lng: 180.0 },
    launchDate: '1962-08-27',
    landingDate: '1962-12-14',
    closestApproachKm: 34833,
    plannedLifespanDays: 109,
    actualLifespanDays: 109,
    massKg: 203,
    healthStatus: 'Flyby complete — first successful planetary encounter',
    summary:
      'Mariner 2 became the first spacecraft to fly past another planet, passing Venus at 34,833 km on 14 December 1962. Its radiometers measured the cloud-top temperature and began overturning the notion of a swampy Venusian surface.',
    sources: [
      {
        title: 'Mariner 2',
        url: 'https://science.nasa.gov/mission/mariner-2/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Mariner 2 flew by Venus on 14 December 1962, becoming the first successful interplanetary spacecraft.',
      },
    ],
  },
  {
    id: 'mariner-5',
    name: 'Mariner 5',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: 19.0, lng: 38.0 },
    launchDate: '1967-06-14',
    landingDate: '1967-10-19',
    closestApproachKm: 4094,
    plannedLifespanDays: 127,
    actualLifespanDays: 127,
    massKg: 245,
    healthStatus: 'Flyby complete — occultation over Venera 4 region',
    summary:
      'Mariner 5 skimmed Venus at 4,094 km on 19 October 1967, probing the ionosphere and upper atmosphere via radio occultation near the same region Venera 4 had entered days earlier — the first dual-spacecraft study of Venus.',
    sources: [
      {
        title: 'Mariner 5',
        url: 'https://science.nasa.gov/mission/mariner-5/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Closest approach occurred at 17:34:56 UT at 4,094 km altitude, with occultation experiments probing the Venusian atmosphere.',
      },
    ],
  },
  {
    id: 'mariner-10',
    name: 'Mariner 10',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -25.0, lng: lng(180) },
    launchDate: '1973-11-03',
    landingDate: '1974-02-05',
    closestApproachKm: 5767,
    plannedLifespanDays: 94,
    actualLifespanDays: 94,
    massKg: 502,
    healthStatus: 'Venus gravity-assist complete — continued to Mercury',
    summary:
      'Mariner 10 used Venus for a gravity assist on 5 February 1974, imaging the planet in ultraviolet while refining the trajectory that made it the first spacecraft to visit Mercury.',
    sources: [
      {
        title: 'Mariner 10',
        url: 'https://science.nasa.gov/mission/mariner-10/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Mariner 10 flew by Venus in February 1974 for a gravity assist en route to Mercury.',
      },
    ],
  },

  // ── Venera programme ────────────────────────────────────────────────────
  {
    id: 'venera-3',
    name: 'Venera 3',
    agency: 'OKB-1',
    country: 'USSR',
    classification: 'Impactor',
    status: 'impact',
    planetId: 'venus',
    coordinates: { lat: 10.0, lng: 70.0 },
    launchDate: '1965-11-16',
    landingDate: '1966-03-01',
    plannedLifespanDays: 0,
    actualLifespanDays: 0,
    massKg: 960,
    healthStatus: 'Destroyed on impact — contact lost before entry',
    summary:
      'Venera 3 is believed to be the first human-made object to reach the surface of another planet, though contact was lost before atmospheric entry and no data were returned.',
    sources: [
      {
        title: 'Venera 3',
        url: 'https://en.wikipedia.org/wiki/Venera_3',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 3 impacted Venus on 1 March 1966; communications failed before atmospheric entry.',
      },
    ],
  },
  {
    id: 'venera-4',
    name: 'Venera 4',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Atmospheric Probe',
    status: 'impact',
    planetId: 'venus',
    coordinates: { lat: 19.0, lng: 38.0 },
    launchDate: '1967-06-12',
    landingDate: '1967-10-18',
    plannedLifespanDays: 0,
    actualLifespanDays: 0,
    massKg: 1106,
    healthStatus: 'Crushed by atmospheric pressure before surface',
    summary:
      'Venera 4 performed the first successful atmospheric entry at another world, transmitting for 94 minutes until crushed at roughly 25 km altitude — proving Venus\' atmosphere far denser than expected.',
    sources: [
      {
        title: 'Venera 4',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-058A',
        type: 'paper',
        publisher: 'NASA NSSDCA',
        excerpt:
          'Venera 4 entered the Venusian atmosphere on 18 October 1967 and returned data until it was crushed by pressure.',
      },
    ],
  },
  {
    id: 'venera-5',
    name: 'Venera 5',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Atmospheric Probe',
    status: 'impact',
    planetId: 'venus',
    coordinates: { lat: -3.0, lng: 18.0 },
    launchDate: '1969-01-05',
    landingDate: '1969-05-16',
    plannedLifespanDays: 0,
    actualLifespanDays: 0,
    massKg: 1130,
    healthStatus: 'Crushed by atmospheric pressure before surface',
    summary:
      'Venera 5 descended deeper than its predecessor, returning 53 minutes of atmospheric data before succumbing to the crushing pressure and heat of the lower atmosphere.',
    sources: [
      {
        title: 'Venera 5',
        url: 'https://en.wikipedia.org/wiki/Venera_5',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 5 entered the atmosphere on 16 May 1969 and operated for 53 minutes before being crushed.',
      },
    ],
  },
  {
    id: 'venera-6',
    name: 'Venera 6',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Atmospheric Probe',
    status: 'impact',
    planetId: 'venus',
    coordinates: { lat: -5.0, lng: 23.0 },
    launchDate: '1969-01-10',
    landingDate: '1969-05-17',
    plannedLifespanDays: 0,
    actualLifespanDays: 0,
    massKg: 1130,
    healthStatus: 'Crushed by atmospheric pressure before surface',
    summary:
      'Launched one day after Venera 5, Venera 6 provided a second atmospheric profile 24 hours later, operating for 51 minutes before destruction in the deep atmosphere.',
    sources: [
      {
        title: 'Venera 6',
        url: 'https://en.wikipedia.org/wiki/Venera_6',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 6 entered the atmosphere on 17 May 1969 and returned data for 51 minutes.',
      },
    ],
  },
  {
    id: 'venera-7',
    name: 'Venera 7',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -5.0, lng: lng(351) },
    launchDate: '1970-08-17',
    landingDate: '1970-12-15',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1180,
    healthStatus: 'Battery depleted — 23 min surface signal',
    summary:
      'Venera 7 achieved the first soft landing on another planet on 15 December 1970, transmitting a weak 23-minute signal from the 475 °C surface and confirming that Venus could not host liquid water.',
    sources: [
      {
        title: 'Venera 7',
        url: 'https://en.wikipedia.org/wiki/Venera_7',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 7 landed on 15 December 1970, becoming the first spacecraft to transmit data from the surface of another planet.',
      },
    ],
  },
  {
    id: 'venera-8',
    name: 'Venera 8',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -10.7, lng: lng(335.25) },
    launchDate: '1972-03-27',
    landingDate: '1972-07-22',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1180,
    healthStatus: 'Battery depleted — 50 min surface ops',
    summary:
      'Venera 8 was the first fully successful Venus landing, returning 50 minutes of gamma-ray spectrometer data that indicated basaltic rock in the illuminated highlands.',
    sources: [
      {
        title: 'Venera 8',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-021A',
        type: 'paper',
        publisher: 'NASA NSSDCA',
        excerpt:
          'Venera 8 landed on 22 July 1972 and transmitted from the surface for about 50 minutes.',
      },
    ],
  },
  {
    id: 'venera-9',
    name: 'Venera 9',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: 31.01, lng: lng(291.64) },
    launchDate: '1975-06-08',
    landingDate: '1975-10-22',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1560,
    healthStatus: 'Battery depleted — first surface images',
    summary:
      'Venera 9 returned the first photographs from the surface of another planet in October 1975, showing angular rocks and a horizon through the dense atmosphere of Beta Regio.',
    sources: [
      {
        title: 'Venera 9',
        url: 'https://en.wikipedia.org/wiki/Venera_9',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'The Venera 9 lander transmitted the first images from the surface of another planet on 22 October 1975.',
      },
    ],
  },
  {
    id: 'venera-10',
    name: 'Venera 10',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: 15.42, lng: lng(291.51) },
    launchDate: '1975-06-14',
    landingDate: '1975-10-25',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1560,
    healthStatus: 'Battery depleted — 65 min surface ops',
    summary:
      'Twin to Venera 9, Venera 10 landed three days later and transmitted a second panoramic scan of the Venusian plains before its batteries failed.',
    sources: [
      {
        title: 'Venera 10',
        url: 'https://en.wikipedia.org/wiki/Venera_10',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 10 landed on 25 October 1975 and operated on the surface for 65 minutes.',
      },
    ],
  },
  {
    id: 'venera-11',
    name: 'Venera 11',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -14.0, lng: lng(299) },
    launchDate: '1978-09-09',
    landingDate: '1978-12-25',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1640,
    healthStatus: 'Battery depleted — camera failed',
    summary:
      'Venera 11 carried a flyby bus and lander; the lander touched down on Christmas Day 1978 and returned 95 minutes of atmospheric and seismic data, though both cameras failed.',
    sources: [
      {
        title: 'Venera 11',
        url: 'https://en.wikipedia.org/wiki/Venera_11',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 11\'s lander touched down on 25 December 1978 and transmitted for 95 minutes.',
      },
    ],
  },
  {
    id: 'venera-12',
    name: 'Venera 12',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -7.0, lng: lng(294) },
    launchDate: '1978-09-14',
    landingDate: '1978-12-21',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1640,
    healthStatus: 'Battery depleted — 110 min surface ops',
    summary:
      'Venera 12 landed four days before its twin\'s Christmas touchdown, returning 110 minutes of data including lightning detections in the Venusian clouds from its flyby bus.',
    sources: [
      {
        title: 'Venera 12',
        url: 'https://en.wikipedia.org/wiki/Venera_12',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 12 landed on 21 December 1978 and transmitted from the surface for 110 minutes.',
      },
    ],
  },
  {
    id: 'venera-13',
    name: 'Venera 13',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -7.5, lng: lng(303) },
    launchDate: '1981-10-30',
    landingDate: '1982-03-01',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 760,
    healthStatus: 'Battery depleted — first color images & surface sounds',
    summary:
      'Venera 13 returned the first colour photographs from the Venusian surface and recorded the first sounds of another world — wind against the lander\'s microphone in Phoebe Regio.',
    sources: [
      {
        title: 'Venera 13',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1981-106A',
        type: 'paper',
        publisher: 'NASA NSSDCA',
        excerpt:
          'Venera 13 landed on 1 March 1982, returning colour images and recording sounds from the Venusian surface.',
      },
    ],
  },
  {
    id: 'venera-14',
    name: 'Venera 14',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -13.25, lng: lng(310) },
    launchDate: '1981-11-04',
    landingDate: '1982-03-05',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 760,
    healthStatus: 'Battery depleted — soil analysis complete',
    summary:
      'Venera 14 landed four days after its twin and used a drilling arm to compress soil samples for X-ray fluorescence analysis, confirming basaltic composition before shutting down after 57 minutes.',
    sources: [
      {
        title: 'Venera 14',
        url: 'https://en.wikipedia.org/wiki/Venera_14',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera 14 landed on 5 March 1982 and analysed surface material with an X-ray fluorescence spectrometer.',
      },
    ],
  },

  // ── Pioneer Venus ───────────────────────────────────────────────────────
  {
    id: 'pioneer-day-probe',
    name: 'Pioneer Venus · Day Probe',
    agency: 'NASA / ARC',
    country: 'USA',
    classification: 'Atmospheric Probe',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -31.3, lng: lng(317) },
    launchDate: '1978-05-20',
    landingDate: '1978-12-09',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 315,
    healthStatus: 'Battery depleted — 67 min after surface impact',
    summary:
      'The Day Probe was the first US spacecraft to transmit from the Venusian surface, surviving parachute descent and continuing to send data for 67 minutes after impact in the foothills of Aphrodite Terra.',
    sources: [
      {
        title: 'Pioneer Venus Multiprobe',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1978-051C',
        type: 'paper',
        publisher: 'NASA NSSDCA',
        excerpt:
          'The Day Probe impacted on 9 December 1978 and transmitted from the surface for 67 minutes.',
      },
    ],
  },

  // ── Vega programme (Halley/Venus) ───────────────────────────────────────
  {
    id: 'vega-1-balloon',
    name: 'Vega 1 · Balloon',
    agency: 'Lavochkin / IKI',
    country: 'USSR',
    classification: 'Atmospheric Probe',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: 7.5, lng: 177.7 },
    launchDate: '1984-12-15',
    landingDate: '1985-06-11',
    plannedLifespanDays: 2,
    actualLifespanDays: 2,
    massKg: 21.5,
    healthStatus: 'Mission complete — ~46 h at 54 km altitude',
    summary:
      'Vega 1 deployed the first balloon in another world\'s atmosphere, floating near 54 km in the Venusian cloud layer for roughly 46 hours while tracking winds and aerosols before the Vega bus continued to comet Halley.',
    sources: [
      {
        title: 'Vega program',
        url: 'https://en.wikipedia.org/wiki/Vega_program',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Each Vega spacecraft released a lander and a helium balloon probe; Vega 1\'s balloon operated for about 46 hours at mid-atmosphere altitudes.',
      },
    ],
  },
  {
    id: 'vega-1-lander',
    name: 'Vega 1 · Lander',
    agency: 'Lavochkin / IKI',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: 7.2, lng: 177.8 },
    launchDate: '1984-12-15',
    landingDate: '1985-06-11',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1500,
    healthStatus: 'Surface instruments activated early — limited data',
    summary:
      'Vega 1\'s descent module landed at 7.2°N, 177.8°E on 11 June 1985. A powerful surface wind prematurely triggered the soil experiment at altitude, but the lander still returned engineering data from the plains.',
    sources: [
      {
        title: 'Vega 1',
        url: 'https://en.wikipedia.org/wiki/Vega_1',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Vega 1 landed on Venus on 11 June 1985 before its bus continued to a flyby of comet 1P/Halley.',
      },
    ],
  },
  {
    id: 'vega-2-balloon',
    name: 'Vega 2 · Balloon',
    agency: 'Lavochkin / IKI',
    country: 'USSR',
    classification: 'Atmospheric Probe',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -8.5, lng: 164.5 },
    launchDate: '1984-12-21',
    landingDate: '1985-06-15',
    plannedLifespanDays: 2,
    actualLifespanDays: 2,
    massKg: 21.5,
    healthStatus: 'Mission complete — ~46 h at 54 km altitude',
    summary:
      'Vega 2\'s balloon probe similarly floated in the cloud deck near 54 km for about 46 hours, measuring vertical wind shear and lightning activity while its twin lander descended to the surface below.',
    sources: [
      {
        title: 'Vega 2',
        url: 'https://en.wikipedia.org/wiki/Vega_2',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Vega 2 released a balloon and lander at Venus on 15 June 1985; the balloon operated for roughly two days in the atmosphere.',
      },
    ],
  },
  {
    id: 'vega-2-lander',
    name: 'Vega 2 · Lander',
    agency: 'Lavochkin / IKI',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'venus',
    coordinates: { lat: -7.14, lng: 177.67 },
    launchDate: '1984-12-21',
    landingDate: '1985-06-15',
    plannedLifespanDays: 1,
    actualLifespanDays: 1,
    massKg: 1500,
    healthStatus: 'Battery depleted — 56 min surface ops',
    summary:
      'Vega 2\'s lander touched down in Rusalka Planitia at 7.14°S, 177.67°E — among the oldest terrain sampled by any Venera-class vehicle — transmitting for 56 minutes before the bus departed for Halley.',
    sources: [
      {
        title: 'Vega 2',
        url: 'https://en.wikipedia.org/wiki/Vega_2',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'The Vega 2 lander touched down on 15 June 1985 in Aphrodite Terra and transmitted for 56 minutes.',
      },
    ],
  },

  // ── Planned missions (2028–2036) ──────────────────────────────────────
  {
    id: 'shukrayaan-1',
    name: 'Shukrayaan-1 · VOM',
    agency: 'ISRO',
    country: 'India',
    classification: 'Orbiter',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: 65.1, lng: 3.1 },
    launchDate: '2028-03-29',
    landingDate: '2028-07-19',
    plannedLifespanDays: 1825,
    actualLifespanDays: null,
    massKg: 2500,
    healthStatus: 'Awaiting launch — LVM-3, March 2028 window',
    summary:
      'India\'s Venus Orbiter Mission (VOM) will carry 19 payloads to map surface topography, atmospheric chemistry, and solar-wind interaction. Orbit insertion is planned 112 days after launch, with aerobraking into a polar science orbit.',
    sources: [
      {
        title: 'Venus Orbiter Mission',
        url: 'https://en.wikipedia.org/wiki/Venus_Orbiter_Mission',
        type: 'press',
        publisher: 'Wikipedia / ISRO',
        excerpt:
          'ISRO announced a 29 March 2028 launch on LVM-3, with Venus orbit insertion on 19 July 2028 after a 112-day cruise.',
      },
    ],
  },
  {
    id: 'davinci-probe',
    name: 'DAVINCI · Descent Probe',
    agency: 'NASA / GSFC',
    country: 'USA',
    classification: 'Descent Probe',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: 4.72, lng: 6.54 },
    launchDate: '2030-12-01',
    landingDate: '2033-01-15',
    plannedLifespanDays: 1,
    actualLifespanDays: null,
    massKg: 350,
    healthStatus: 'Awaiting launch — Alpha Regio descent target',
    summary:
      'DAVINCI\'s descent sphere will sample Venus\' atmosphere from cloud-top to the mountainous highlands of Alpha Regio, measuring noble gases, chemistry, winds, and capturing the first high-resolution images of the surface from below the clouds.',
    sources: [
      {
        title: 'DAVINCI Mission',
        url: 'https://science.nasa.gov/mission/davinci/',
        type: 'press',
        publisher: 'NASA',
        excerpt:
          'DAVINCI will release a probe that descends through the atmosphere, sampling chemistry and imaging Alpha Regio.',
      },
    ],
  },
  {
    id: 'veritas',
    name: 'VERITAS',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Orbiter',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: 0.49, lng: 194.77 },
    launchDate: '2031-06-01',
    landingDate: '2032-05-01',
    plannedLifespanDays: 1095,
    actualLifespanDays: null,
    massKg: 500,
    healthStatus: 'Awaiting launch — Maat Mons volcano study region',
    summary:
      'VERITAS will map Venus\' surface topography, rock composition, and active volcanism with centimetre-scale radar and infrared spectroscopy, revealing how Earth\'s twin diverged into an uninhabitable world.',
    sources: [
      {
        title: 'VERITAS Mission',
        url: 'https://science.nasa.gov/mission/veritas/',
        type: 'press',
        publisher: 'NASA',
        excerpt:
          'VERITAS is targeting launch no earlier than 2031 to create high-resolution 3D maps of Venus.',
      },
    ],
  },
  {
    id: 'envision',
    name: 'EnVision',
    agency: 'ESA',
    country: 'Europe',
    classification: 'Orbiter',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: 64.2, lng: 25.0 },
    launchDate: '2031-12-01',
    landingDate: '2032-11-01',
    plannedLifespanDays: 1460,
    actualLifespanDays: null,
    massKg: 2600,
    healthStatus: 'Awaiting launch — tessera terrain mapping',
    summary:
      'EnVision will perform holistic radar and spectrometry surveys of Venus from core to atmosphere, targeting ancient tessera highlands to determine whether Venus ever hosted oceans or plate tectonics.',
    sources: [
      {
        title: 'EnVision Mission',
        url: 'https://www.esa.int/Science_Exploration/Space_Science/EnVision',
        type: 'press',
        publisher: 'ESA',
        excerpt:
          'EnVision is planned for launch in December 2031 on Ariane 64.',
      },
    ],
  },
  {
    id: 'venera-d-lander',
    name: 'Venera-D · Lander',
    agency: 'Lavochkin / Roscosmos',
    country: 'Russia',
    classification: 'Lander',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: -9.0, lng: 76.0 },
    launchDate: '2036-11-01',
    landingDate: '2037-04-01',
    plannedLifespanDays: 1,
    actualLifespanDays: null,
    massKg: 2100,
    healthStatus: 'Awaiting launch — long-duration surface lander (~3 h ops)',
    summary:
      'Venera-D\'s titanium-hulled lander aims to survive for hours on the 460 °C surface — far longer than Soviet Venera probes of the 1970s–80s — returning panoramic imaging and compositional data from the plains near Ovda Regio.',
    sources: [
      {
        title: 'Venera-D',
        url: 'https://en.wikipedia.org/wiki/Venera-D',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Venera-D is planned for launch no earlier than 2036 with an orbiter, lander, and balloon probes.',
      },
    ],
  },
  {
    id: 'venera-d-balloon',
    name: 'Venera-D · Aerostat',
    agency: 'Lavochkin / Roscosmos',
    country: 'Russia',
    classification: 'Atmospheric Probe',
    status: 'planned',
    planetId: 'venus',
    coordinates: { lat: 30.0, lng: 280.0 },
    launchDate: '2036-11-01',
    landingDate: '2037-04-05',
    plannedLifespanDays: 5,
    actualLifespanDays: null,
    massKg: 120,
    healthStatus: 'Awaiting launch — mid-atmosphere aerostat (~50 km)',
    summary:
      'Venera-D\'s aerostat balloon will float in the cloud layer near 50 km altitude, measuring wind fields, aerosols, and trace gases over multiple days — complementing the lander and orbiter in Russia\'s return to Venus.',
    sources: [
      {
        title: 'Venera-D',
        url: 'https://en.wikipedia.org/wiki/Venera-D',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'The mission will comprise a lander, an aerostatic probe, and an orbiter.',
      },
    ],
  },
];
