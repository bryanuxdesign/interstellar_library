import type { MissionSource } from '@/types';

export interface OrbiterDossierMeta {
  launchDate: string;
  role: string;
  sources: MissionSource[];
}

/** Extended catalog fields for orbital asset dossiers. */
export const orbiterDossierMeta: Record<string, OrbiterDossierMeta> = {
  mro: {
    launchDate: '2005-08-12',
    role: 'Relay & Reconnaissance',
    sources: [
      {
        title: 'Mars Reconnaissance Orbiter — NASA',
        url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'Mission overview, instruments, and science objectives for MRO.',
      },
    ],
  },
  odyssey: {
    launchDate: '2001-04-07',
    role: 'Relay & Mineralogy',
    sources: [
      {
        title: 'Mars Odyssey — NASA',
        url: 'https://science.nasa.gov/mission/mars-odyssey/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'Longest-operating Mars spacecraft; relay and gamma-ray mapping.',
      },
    ],
  },
  maven: {
    launchDate: '2013-11-18',
    role: 'Atmospheric Science',
    sources: [
      {
        title: 'MAVEN — NASA',
        url: 'https://science.nasa.gov/mission/maven/',
        type: 'press',
        publisher: 'NASA',
        excerpt:
          'Studied upper-atmosphere escape and climate history at Mars until NASA declared the mission over in June 2026.',
      },
    ],
  },
  'mars-express': {
    launchDate: '2003-06-02',
    role: 'Radar & Atmosphere',
    sources: [
      {
        title: 'Mars Express — ESA',
        url: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express',
        type: 'press',
        publisher: 'ESA',
        excerpt: 'European Mars orbiter with subsurface radar and stereo imaging.',
      },
    ],
  },
  tgo: {
    launchDate: '2016-03-14',
    role: 'Trace Gas & Relay',
    sources: [
      {
        title: 'ExoMars Trace Gas Orbiter — ESA',
        url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars',
        type: 'press',
        publisher: 'ESA',
        excerpt: 'Methane detection and data relay for ExoMars surface assets.',
      },
    ],
  },
  hope: {
    launchDate: '2020-07-19',
    role: 'Atmospheric Monitoring',
    sources: [
      {
        title: 'Emirates Mars Mission (Hope)',
        url: 'https://www.emiratesmarsmission.ae/',
        type: 'press',
        publisher: 'MBRSC',
        excerpt: 'UAE\'s first interplanetary mission studying the Martian atmosphere.',
      },
    ],
  },
  'tianwen-1-orbiter': {
    launchDate: '2020-07-23',
    role: 'Remote Sensing & Relay',
    sources: [
      {
        title: 'Tianwen-1 — CNSA',
        url: 'https://www.cnsa.gov.cn/english/',
        type: 'press',
        publisher: 'CNSA',
        excerpt: 'China\'s Mars orbiter supporting Zhurong rover operations.',
      },
    ],
  },
  lro: {
    launchDate: '2009-06-18',
    role: 'Surface Mapping',
    sources: [
      {
        title: 'Lunar Reconnaissance Orbiter — NASA',
        url: 'https://science.nasa.gov/mission/lro/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'High-resolution lunar topography and resource scouting.',
      },
    ],
  },
  capstone: {
    launchDate: '2022-06-28',
    role: 'NRHO Demonstrator',
    sources: [
      {
        title: 'CAPSTONE — NASA',
        url: 'https://www.nasa.gov/capstone/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'Tests the near-rectilinear halo orbit planned for Gateway.',
      },
    ],
  },
  'artemis-p1': {
    launchDate: '2007-02-17',
    role: 'Magnetotail Science',
    sources: [
      {
        title: 'ARTEMIS Mission — NASA',
        url: 'https://science.nasa.gov/mission/artemis/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'Repurposed THEMIS probes studying lunar plasma environment.',
      },
    ],
  },
  'artemis-p2': {
    launchDate: '2007-02-17',
    role: 'Magnetotail Science',
    sources: [
      {
        title: 'ARTEMIS Mission — NASA',
        url: 'https://science.nasa.gov/mission/artemis/',
        type: 'press',
        publisher: 'NASA',
        excerpt: 'Prograde counterpart to ARTEMIS-P1 for two-point measurements.',
      },
    ],
  },
  'queqiao-2': {
    launchDate: '2024-03-20',
    role: 'Farside Relay',
    sources: [
      {
        title: 'Queqiao-2 relay satellite',
        url: 'https://www.cnsa.gov.cn/english/',
        type: 'press',
        publisher: 'CNSA',
        excerpt: 'Lunar relay for farside missions including Chang\'e-6.',
      },
    ],
  },
  'tiandu-1': {
    launchDate: '2024-03-20',
    role: 'Navigation Demo',
    sources: [
      {
        title: 'Tiandu lunar navigation experiment',
        url: 'https://www.cnsa.gov.cn/english/',
        type: 'press',
        publisher: 'CNSA',
        excerpt: 'Demonstrates cislunar navigation and communications technology.',
      },
    ],
  },
  'tiandu-2': {
    launchDate: '2024-03-20',
    role: 'Navigation Demo',
    sources: [
      {
        title: 'Tiandu lunar navigation experiment',
        url: 'https://www.cnsa.gov.cn/english/',
        type: 'press',
        publisher: 'CNSA',
        excerpt: 'Formation-flying companion validating Ka-band links.',
      },
    ],
  },
  'chandrayaan-2-orbiter': {
    launchDate: '2019-07-22',
    role: 'Polar Mapping',
    sources: [
      {
        title: 'Chandrayaan-2 — ISRO',
        url: 'https://www.isro.gov.in/Chandrayaan2_Details.html',
        type: 'press',
        publisher: 'ISRO',
        excerpt: 'Indian lunar orbiter continuing science from polar orbit.',
      },
    ],
  },
  danuri: {
    launchDate: '2022-08-05',
    role: 'Imaging & Demo',
    sources: [
      {
        title: 'Danuri (KPLO) — KARI',
        url: 'https://www.kari.re.kr/eng',
        type: 'press',
        publisher: 'KARI',
        excerpt: 'South Korea\'s first lunar orbiter imaging the surface from 100 km.',
      },
    ],
  },
  akatsuki: {
    launchDate: '2010-05-20',
    role: 'Climate Orbiter',
    sources: [
      {
        title: 'Akatsuki — JAXA',
        url: 'https://global.jaxa.jp/projects/sat/planet/index.html',
        type: 'press',
        publisher: 'JAXA',
        excerpt: 'Venus Climate Orbiter studying clouds and super-rotation.',
      },
    ],
  },
};

export function getOrbiterDossierMeta(orbiterId: string): OrbiterDossierMeta | undefined {
  return orbiterDossierMeta[orbiterId];
}
