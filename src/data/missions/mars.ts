import type { Mission } from '@/types';

/** Convert NASA/Wikipedia 0–360°E longitude to signed degrees used by the mapping engine. */
const lng = (east: number): number => (east > 180 ? east - 360 : east);

/**
 * Mars mission catalogue — flybys, landers, rovers, impacts, and planned missions.
 * Surface coordinates from NASA NSSDCA, USGS Gazetteer, and mission landing reports.
 */
export const marsMissions: Mission[] = [
  // ── Flybys ──────────────────────────────────────────────────────────────
  {
    id: 'mariner-4',
    name: 'Mariner 4',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -25.0, lng: lng(228) },
    launchDate: '1964-11-28',
    landingDate: '1965-07-15',
    closestApproachKm: 9846,
    plannedLifespanDays: 228,
    actualLifespanDays: 228,
    massKg: 261,
    healthStatus: 'Flyby complete — first close-range Mars images',
    summary:
      'Mariner 4 returned the first close-up photographs of Mars, revealing a cratered desert world and passing within 9,846 km — ending romantic visions of canal networks and dense vegetation.',
    sources: [
      {
        title: 'Mariner 4',
        url: 'https://science.nasa.gov/mission/mariner-4/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Mariner 4 flew past Mars on 14–15 July 1965, returning 22 images that showed a heavily cratered surface.',
      },
    ],
  },
  {
    id: 'mariner-6',
    name: 'Mariner 6',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -5.0, lng: lng(196) },
    launchDate: '1969-02-25',
    landingDate: '1969-07-31',
    closestApproachKm: 3431,
    plannedLifespanDays: 156,
    actualLifespanDays: 156,
    massKg: 413,
    healthStatus: 'Flyby complete — southern hemisphere imaging',
    summary:
      'Mariner 6 skimmed the Martian equator at 3,431 km, returning 75 images of the southern hemisphere and refining atmospheric pressure estimates ahead of the Viking landings.',
    sources: [
      {
        title: 'Mariner 6 and 7',
        url: 'https://science.nasa.gov/mission/mariner-6-7/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Mariner 6 flew by Mars on 31 July 1969, returning images of the equatorial and southern regions.',
      },
    ],
  },
  {
    id: 'mariner-7',
    name: 'Mariner 7',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Flyby',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -35.0, lng: lng(260) },
    launchDate: '1969-03-27',
    landingDate: '1969-08-05',
    closestApproachKm: 3430,
    plannedLifespanDays: 131,
    actualLifespanDays: 131,
    massKg: 413,
    healthStatus: 'Flyby complete — south polar cap imaging',
    summary:
      'Mariner 7 imaged the south polar cap and terminator regions during a 3,430 km flyby, pairing with Mariner 6 to map nearly one-third of the Martian surface at moderate resolution.',
    sources: [
      {
        title: 'Mariner 6 and 7',
        url: 'https://science.nasa.gov/mission/mariner-6-7/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Mariner 7 flew by Mars on 5 August 1969, imaging the south polar region and terminator.',
      },
    ],
  },

  // ── Impactors & failed landings ─────────────────────────────────────────
  {
    id: 'mars-2',
    name: 'Mars 2',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Impactor',
    status: 'impact',
    planetId: 'mars',
    coordinates: { lat: -4.0, lng: lng(313) },
    launchDate: '1971-05-19',
    landingDate: '1971-11-27',
    plannedLifespanDays: 0,
    actualLifespanDays: 0,
    massKg: 1210,
    healthStatus: 'Descent stage crashed — first object to reach Mars surface',
    summary:
      'Mars 2 delivered the first human-made object to the Martian surface when its descent module crashed during a planet-wide dust storm, though its orbiter continued relaying data from orbit.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA04591/PIA04591~medium.jpg',
    sources: [
      {
        title: 'Mars 2',
        url: 'https://en.wikipedia.org/wiki/Mars_2',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'The Mars 2 lander crashed on 27 November 1971, becoming the first human-made object to reach the surface of Mars.',
      },
    ],
  },
  {
    id: 'mars-polar-lander',
    name: 'Mars Polar Lander',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Lander',
    status: 'impact',
    planetId: 'mars',
    coordinates: { lat: -76.9, lng: lng(195.3) },
    launchDate: '1999-01-03',
    landingDate: '1999-12-03',
    plannedLifespanDays: 90,
    actualLifespanDays: 0,
    massKg: 576,
    healthStatus: 'Contact lost during EDL — probable hard landing',
    summary:
      'Mars Polar Lander was lost during entry, descent, and landing near the south polar layered terrain. Subsequent reviews pointed to premature engine shutdown as the likely cause.',
    sources: [
      {
        title: 'Mars Polar Lander',
        url: 'https://science.nasa.gov/mission/mars-polar-lander/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Contact was lost with Mars Polar Lander during landing on 3 December 1999 near the Martian south pole.',
      },
    ],
  },
  {
    id: 'schiaparelli-edm',
    name: 'Schiaparelli EDM',
    agency: 'ESA / Roscosmos',
    country: 'Europe',
    classification: 'Lander',
    status: 'impact',
    planetId: 'mars',
    coordinates: { lat: -2.07, lng: lng(353.57) },
    launchDate: '2016-03-14',
    landingDate: '2016-10-19',
    plannedLifespanDays: 4,
    actualLifespanDays: 0,
    massKg: 577,
    healthStatus: 'Hard landing — parachute jettison anomaly',
    summary:
      'The ExoMars Schiaparelli entry, descent, and landing demonstrator crashed in Meridiani Planum after its radar altimeter data was misinterpreted, creating a fresh impact scar imaged from orbit.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA21132/PIA21132~medium.jpg',
    sources: [
      {
        title: 'Schiaparelli EDM',
        url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars/Schiaparelli_crash_site_in_context',
        type: 'press',
        publisher: 'ESA',
        excerpt:
          'Schiaparelli impacted Mars on 19 October 2016; orbital imagery confirmed a new crater at the predicted landing site.',
      },
    ],
  },

  // ── Historic landers ────────────────────────────────────────────────────
  {
    id: 'mars-3',
    name: 'Mars 3',
    agency: 'Lavochkin',
    country: 'USSR',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -45.0, lng: lng(202) },
    launchDate: '1971-05-28',
    landingDate: '1971-12-02',
    plannedLifespanDays: 1,
    actualLifespanDays: 0,
    massKg: 1210,
    healthStatus: 'First soft landing — telemetry lost after ~20 seconds',
    summary:
      'Mars 3 achieved the first survivable soft landing on Mars in Ptolemaeus Crater, transmitting a partial panoramic image before contact ceased — likely due to the ongoing global dust storm.',
    sources: [
      {
        title: 'Mars 3',
        url: 'https://en.wikipedia.org/wiki/Mars_3',
        type: 'paper',
        publisher: 'Wikipedia',
        excerpt:
          'Mars 3 soft-landed on 2 December 1971 and transmitted data for roughly 20 seconds before falling silent.',
      },
    ],
  },
  {
    id: 'viking-1',
    name: 'Viking 1',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 22.48, lng: lng(311.52) },
    launchDate: '1975-08-20',
    landingDate: '1976-07-20',
    plannedLifespanDays: 90,
    actualLifespanDays: 2306,
    massKg: 572,
    healthStatus: 'Final transmission 1982 — battery depleted',
    summary:
      'Viking 1 returned the first colour panoramas from Chryse Planitia and conducted the first in-situ search for Martian life, operating for over six years until its relay link failed.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA00354/PIA00354~medium.jpg',
    sources: [
      {
        title: 'Viking 1 Lander',
        url: 'https://science.nasa.gov/mission/viking-1/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Viking 1 landed in Chryse Planitia on 20 July 1976 and operated until November 1982.',
      },
    ],
  },
  {
    id: 'viking-2',
    name: 'Viking 2',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 47.97, lng: lng(225.74) },
    launchDate: '1975-09-09',
    landingDate: '1976-09-03',
    plannedLifespanDays: 90,
    actualLifespanDays: 1281,
    massKg: 572,
    healthStatus: 'Final transmission 1980 — battery depleted',
    summary:
      'Viking 2 touched down in Utopia Planitia and documented frost, drifted soil, and seasonal changes over nearly four Earth years, complementing its twin\'s biology experiments in a colder, rockier plain.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA00502/PIA00502~medium.jpg',
    sources: [
      {
        title: 'Viking 2 Lander',
        url: 'https://science.nasa.gov/mission/viking-2/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Viking 2 landed in Utopia Planitia on 3 September 1976 and operated until April 1980.',
      },
    ],
  },
  {
    id: 'mars-pathfinder',
    name: 'Mars Pathfinder · Sojourner',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Lander / Rover',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 19.13, lng: lng(326.78) },
    launchDate: '1996-12-04',
    landingDate: '1997-07-04',
    plannedLifespanDays: 30,
    actualLifespanDays: 83,
    massKg: 264,
    healthStatus: 'Last contact 1997 — battery cycle exhaustion',
    summary:
      'Mars Pathfinder pioneered airbag landing and deployed the Sojourner microrover, the first wheeled vehicle on another planet, demonstrating low-cost surface exploration at Ares Vallis.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA00756/PIA00756~medium.jpg',
    sources: [
      {
        title: 'Mars Pathfinder',
        url: 'https://science.nasa.gov/mission/mars-pathfinder-sojourner/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Pathfinder landed on 4 July 1997 and deployed Sojourner, which operated for 83 sols.',
      },
    ],
  },
  {
    id: 'beagle-2',
    name: 'Beagle 2',
    agency: 'Open University / ESA',
    country: 'UK',
    classification: 'Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 11.52, lng: lng(90.43) },
    launchDate: '2003-06-02',
    landingDate: '2003-12-25',
    plannedLifespanDays: 180,
    actualLifespanDays: 0,
    massKg: 33,
    healthStatus: 'Landed intact — solar panels failed to deploy',
    summary:
      'Beagle 2 reached Isidis Planitia but never transmitted; Mars Reconnaissance Orbiter later imaged the lander intact on the surface with only two of four solar petals deployed, silencing its astrobiology payload.',
    sources: [
      {
        title: 'Beagle 2',
        url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/Beagle_2_lander_found_on_Mars',
        type: 'press',
        publisher: 'ESA',
        excerpt:
          'Beagle 2 was located in 2015 by MRO, showing it landed successfully but failed to fully deploy its solar panels.',
      },
    ],
  },

  // ── MER rovers ──────────────────────────────────────────────────────────
  {
    id: 'spirit',
    name: 'Spirit · MER-A',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Rover',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -14.57, lng: lng(175.47) },
    launchDate: '2003-06-10',
    landingDate: '2004-01-04',
    plannedLifespanDays: 90,
    actualLifespanDays: 2208,
    massKg: 185,
    healthStatus: 'Mobility lost 2009 — final contact 2010',
    summary:
      'Spirit climbed Husband Hill in Gusev Crater, discovered hydrothermal silica deposits, and ultimately became a stationary platform after embedding in soft sand — outliving its warranty twenty-fold.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA10214/PIA10214~medium.jpg',
    sources: [
      {
        title: 'Spirit Rover',
        url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Spirit landed in Gusev Crater on 4 January 2004 and operated until March 2010.',
      },
    ],
  },
  {
    id: 'opportunity',
    name: 'Opportunity · MER-B',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Rover',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: -1.95, lng: lng(354.47) },
    launchDate: '2003-07-07',
    landingDate: '2004-01-25',
    plannedLifespanDays: 90,
    actualLifespanDays: 5352,
    massKg: 185,
    healthStatus: 'Lost in global dust storm 2018',
    summary:
      'Opportunity traversed 45 km across Meridiani Planum, confirming ancient aqueous environments at Eagle and Endurance craters, before succumbing to a planet-encircling dust storm in June 2018.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA25347/PIA25347~medium.jpg',
    sources: [
      {
        title: 'Opportunity Rover',
        url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Opportunity landed on 25 January 2004 and drove farther than any off-Earth vehicle until its final contact in 2018.',
      },
    ],
  },

  // ── Phoenix & InSight ───────────────────────────────────────────────────
  {
    id: 'phoenix',
    name: 'Phoenix',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Polar Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 68.22, lng: lng(234.25) },
    launchDate: '2007-08-04',
    landingDate: '2008-05-25',
    plannedLifespanDays: 90,
    actualLifespanDays: 157,
    massKg: 350,
    healthStatus: 'Solar power lost — polar winter 2008',
    summary:
      'Phoenix excavated water-ice at Green Valley in the north polar plain, tasted perchlorate salts, and documented frost cycles before carbon-dioxide snow buried its solar panels.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA10762/PIA10762~medium.jpg',
    sources: [
      {
        title: 'Phoenix Mars Lander',
        url: 'https://science.nasa.gov/mission/phoenix-mars-lander/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Phoenix confirmed water ice below the surface near Mars\' north pole and operated for 157 sols.',
      },
    ],
  },
  {
    id: 'insight',
    name: 'InSight',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Geophysical Lander',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 4.52, lng: lng(135.62) },
    launchDate: '2018-05-05',
    landingDate: '2018-11-26',
    plannedLifespanDays: 709,
    actualLifespanDays: 1440,
    massKg: 358,
    healthStatus: 'Power lost 2022 — dust accumulation on panels',
    summary:
      'InSight measured marsquakes with its SEIS seismometer and tracked interior heat flow via the HP³ mole at Elysium Planitia, revealing a thinner crust and geologically active interior.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA23764/PIA23764~medium.jpg',
    sources: [
      {
        title: 'InSight Mars Lander',
        url: 'https://science.nasa.gov/mission/insight/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'InSight detected more than 1,300 marsquakes and operated until December 2022 when dust covered its solar panels.',
      },
    ],
  },

  // ── Active assets ───────────────────────────────────────────────────────
  {
    id: 'curiosity',
    name: 'Curiosity · MSL',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Rover',
    status: 'active',
    planetId: 'mars',
    coordinates: { lat: -4.59, lng: lng(137.44) },
    launchDate: '2011-11-26',
    landingDate: '2012-08-06',
    plannedLifespanDays: 668,
    actualLifespanDays: null,
    massKg: 899,
    healthStatus: 'Climbing Gediz Vallis — nuclear powered',
    summary:
      'Curiosity has drilled into Gale Crater\'s Mount Sharp strata for over a decade, confirming ancient lakebed chemistry and organic molecules while climbing through billions of years of Martian geology.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA24432/PIA24432~medium.jpg',
    sources: [
      {
        title: 'Curiosity Rover',
        url: 'https://science.nasa.gov/mission/msl-curiosity/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Curiosity landed in Gale Crater on 6 August 2012 and continues to explore Mount Sharp.',
      },
    ],
  },
  {
    id: 'perseverance',
    name: 'Perseverance · Ingenuity',
    agency: 'NASA / JPL',
    country: 'USA',
    classification: 'Rover / Sample Cache',
    status: 'active',
    planetId: 'mars',
    coordinates: { lat: 18.444, lng: lng(77.45) },
    launchDate: '2020-07-30',
    landingDate: '2021-02-18',
    plannedLifespanDays: 668,
    actualLifespanDays: null,
    massKg: 1025,
    healthStatus: 'Caching samples at Jezero — Ingenuity retired after 72 flights',
    summary:
      'Perseverance explores Jezero Crater\'s ancient delta, caching sample tubes for Mars Sample Return while its companion helicopter Ingenuity proved powered flight in thin Martian air across 72 sorties.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA24428/PIA24428~medium.jpg',
    sources: [
      {
        title: 'Perseverance Rover',
        url: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
        type: 'paper',
        publisher: 'NASA',
        excerpt:
          'Perseverance landed in Jezero Crater on 18 February 2021 and is collecting samples for eventual return to Earth.',
      },
    ],
  },

  // ── China ───────────────────────────────────────────────────────────────
  {
    id: 'zhurong',
    name: 'Tianwen-1 · Zhurong',
    agency: 'CNSA',
    country: 'China',
    classification: 'Lander / Rover',
    status: 'decommissioned',
    planetId: 'mars',
    coordinates: { lat: 25.066, lng: lng(109.925) },
    launchDate: '2020-07-23',
    landingDate: '2021-05-14',
    plannedLifespanDays: 90,
    actualLifespanDays: 358,
    massKg: 240,
    healthStatus: 'Hibernation wake-up failed — mission declared complete 2023',
    summary:
      'Zhurong became the first non-American rover on Mars, surveying Utopia Planitia\'s subsurface with radar before entering hibernation; CNSA declared the mission complete after it failed to wake for a third Martian spring.',
    forensicImageUrl:
      'https://images-assets.nasa.gov/image/PIA24761/PIA24761~medium.jpg',
    sources: [
      {
        title: 'Zhurong rover',
        url: 'https://en.wikipedia.org/wiki/Zhurong_(rover)',
        type: 'press',
        publisher: 'Wikipedia',
        excerpt:
          'Zhurong landed in Utopia Planitia in May 2021 and drove 1,921 metres before entering extended hibernation in 2022.',
      },
    ],
  },

  // ── Planned missions ────────────────────────────────────────────────────
  {
    id: 'mars-sample-return',
    name: 'Mars Sample Return',
    agency: 'NASA / ESA',
    country: 'USA / Europe',
    classification: 'Sample Return',
    status: 'planned',
    planetId: 'mars',
    coordinates: { lat: 18.444, lng: lng(77.45) },
    launchDate: '2028-07-01',
    landingDate: '2031-08-01',
    plannedLifespanDays: 90,
    actualLifespanDays: null,
    massKg: 4200,
    healthStatus: 'Architecture under revision — Jezero cache pickup',
    summary:
      'Mars Sample Return aims to retrieve Perseverance\'s cached tubes from Jezero Crater and launch them into Mars orbit for handoff to an Earth-return vehicle — the first round-trip sample mission from another planet.',
    sources: [
      {
        title: 'Mars Sample Return',
        url: 'https://science.nasa.gov/mission/mars-sample-return/',
        type: 'press',
        publisher: 'NASA',
        excerpt:
          'NASA and ESA are developing a multi-launch campaign to return cached Perseverance samples to Earth in the 2030s.',
      },
    ],
  },
  {
    id: 'tianwen-3',
    name: 'Tianwen-3',
    agency: 'CNSA',
    country: 'China',
    classification: 'Sample Return',
    status: 'planned',
    planetId: 'mars',
    coordinates: { lat: -43.0, lng: lng(136.0) },
    launchDate: '2028-10-01',
    landingDate: '2031-09-01',
    plannedLifespanDays: 30,
    actualLifespanDays: null,
    massKg: 5200,
    healthStatus: 'Planned launch ~2028 — Chryse region target',
    summary:
      'Tianwen-3 is China\'s Mars sample-return architecture: a lander will collect up to 600 grams of material and launch an ascent vehicle to rendezvous with an Earth-return orbiter in the early 2030s.',
    sources: [
      {
        title: 'Tianwen-3',
        url: 'https://en.wikipedia.org/wiki/Tianwen-3',
        type: 'press',
        publisher: 'Wikipedia',
        excerpt:
          'Tianwen-3 is a planned Chinese Mars sample-return mission targeting launch in 2028.',
      },
    ],
  },
  {
    id: 'exomars-rosalind-franklin',
    name: 'ExoMars · Rosalind Franklin',
    agency: 'ESA / Roscosmos',
    country: 'Europe',
    classification: 'Drill Rover',
    status: 'planned',
    planetId: 'mars',
    coordinates: { lat: 3.8, lng: lng(25.1) },
    launchDate: '2028-09-01',
    landingDate: '2030-06-01',
    plannedLifespanDays: 218,
    actualLifespanDays: null,
    massKg: 310,
    healthStatus: 'Relaunch planned — Oxia Planum drill site',
    summary:
      'The Rosalind Franklin rover will drill two metres beneath Oxia Planum\'s surface, searching for biosignatures preserved below radiation-damaged topsoil — ESA\'s flagship astrobiology mission after Schiaparelli.',
    sources: [
      {
        title: 'ExoMars Rosalind Franklin',
        url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars',
        type: 'press',
        publisher: 'ESA',
        excerpt:
          'The Rosalind Franklin rover is planned to launch in 2028 and land at Oxia Planum to drill for signs of past life.',
      },
    ],
  },
  {
    id: 'escapade',
    name: 'ESCAPADE',
    agency: 'NASA / UC Berkeley',
    country: 'USA',
    classification: 'Orbiter Pair',
    status: 'planned',
    planetId: 'mars',
    coordinates: { lat: 0.0, lng: 0.0 },
    launchDate: '2025-09-01',
    landingDate: '2026-03-01',
    plannedLifespanDays: 365,
    actualLifespanDays: null,
    massKg: 180,
    healthStatus: 'Awaiting launch — solar wind magnetosphere study',
    summary:
      'ESCAPADE\'s twin small satellites will bracket Mars in orbit, tracing how the solar wind strips the atmosphere and how the induced magnetosphere responds — a pathfinder for low-cost multi-spacecraft science.',
    sources: [
      {
        title: 'ESCAPADE Mission',
        url: 'https://escapade.lasp.colorado.edu/',
        type: 'press',
        publisher: 'NASA / UC Berkeley',
        excerpt:
          'ESCAPADE will place two spacecraft in Mars orbit to study atmospheric escape driven by the solar wind.',
      },
    ],
  },
];
