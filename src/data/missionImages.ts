import type { MissionImage } from '@/types';

/** Self-hosted, verified mission imagery (served from /public/images/missions). */
const local = (file: string) => `/images/missions/${file}`;

const nasa = (id: string) =>
  `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg`;

/**
 * Vehicle and surface imagery keyed by mission id.
 * Every mission has at least one public-domain or agency-licensed spacecraft photo.
 */
export const missionVehicleImages: Record<string, MissionImage[]> = {
  'luna-2': [
    {
      url: nasa('PIA00405'),
      caption:
        'Mare Serenitatis — the region where Luna 2 became the first human-made object to reach another world in 1959.',
      credit: 'NASA',
    },
    {
      url: local('lunar-lander-models.jpg'),
      caption:
        'Soviet Luna impactor program hardware, shown alongside early lunar lander models at NASA Marshall.',
      credit: 'NASA / MSFC',
    },
  ],
  'ranger-7': [
    {
      url: local('ranger-7.jpg'),
      caption: 'Final Ranger 7 photograph transmitted before deliberate impact in Mare Cognitum.',
      credit: 'NASA / JPL',
    },
  ],
  'luna-9': [
    {
      url: local('luna-9-model.jpg'),
      caption:
        'Luna 9 descent capsule — the first spacecraft to achieve a survivable soft landing on the Moon (February 1966).',
      credit: 'NASA / Wikimedia Commons',
    },
  ],
  'surveyor-1': [
    {
      url: local('surveyor-1.jpg'),
      caption: 'Surveyor 1 footpad resting on the lunar regolith in Oceanus Procellarum.',
      credit: 'NASA / JPL',
    },
  ],
  'surveyor-3': [
    {
      url: local('surveyor-3.jpg'),
      caption: 'Apollo 12 astronaut Pete Conrad beside the Surveyor 3 lander on the Moon.',
      credit: 'NASA',
    },
    {
      url: local('surveyor-3-crater.jpg'),
      caption: 'Surveyor 3 spacecraft inside its crater landing site, photographed from lunar orbit.',
      credit: 'NASA',
    },
  ],
  'apollo-11': [
    {
      url: local('apollo-11.jpg'),
      caption: 'Buzz Aldrin beside the Lunar Module Eagle at Tranquility Base.',
      credit: 'NASA',
    },
    {
      url: local('lunar-module-eagle.jpg'),
      caption: 'Lunar Module Eagle in lunar orbit before the first crewed landing.',
      credit: 'NASA',
    },
    {
      url: local('apollo-11-lro.jpg'),
      caption: 'Eagle descent stage at Tranquility Base, imaged by LRO from orbit.',
      credit: 'NASA LRO',
    },
  ],
  'apollo-12': [
    {
      url: local('apollo-12-lm.jpg'),
      caption: 'Apollo 12 Lunar Module Intrepid in landing configuration, photographed from orbit.',
      credit: 'NASA',
    },
    {
      url: local('surveyor-3.jpg'),
      caption: 'Surveyor 3 at the Apollo 12 pinpoint landing site in the Ocean of Storms.',
      credit: 'NASA',
    },
  ],
  'apollo-15': [
    {
      url: local('apollo-15-lm.jpg'),
      caption: 'Lunar Module Falcon and Lunar Roving Vehicle at the Hadley–Apennine landing site.',
      credit: 'NASA',
    },
    {
      url: local('apollo-15-lro.jpg'),
      caption: 'LM Falcon descent stage at Hadley Rille, imaged by LRO.',
      credit: 'NASA LRO',
    },
  ],
  'apollo-17': [
    {
      url: local('apollo-17.jpg'),
      caption: 'Lunar Module Challenger in the Taurus–Littrow valley.',
      credit: 'NASA',
    },
    {
      url: local('lunar-rover-apollo17.jpg'),
      caption: 'Apollo 17 Lunar Roving Vehicle at its final parking position on the Moon.',
      credit: 'NASA',
    },
  ],
  'luna-16': [
    {
      url: local('luna-16.jpg'),
      caption:
        'Luna 16 sample-return spacecraft — the first robotic mission to drill and return lunar soil to Earth.',
      credit: 'NASA',
    },
  ],
  'luna-17-lunokhod-1': [
    {
      url: local('lunokhod-rovers.jpg'),
      caption: 'Lunokhod 1 — the first robotic rover to operate on another celestial body (1970).',
      credit: 'NASA',
    },
  ],
  'luna-21-lunokhod-2': [
    {
      url: local('luna-21-lander.jpg'),
      caption: 'Luna 21 lander that delivered Lunokhod 2 to Le Monnier crater in 1973.',
      credit: 'NASA',
    },
    {
      url: local('lunokhod-rovers.jpg'),
      caption: 'Soviet Lunokhod rovers — Lunokhod 2 still holds the lunar distance record at ~39 km.',
      credit: 'NASA',
    },
  ],
  'change-3-yutu': [
    {
      url: local('yutu-rover.jpg'),
      caption: 'Yutu rover on the lunar surface in Mare Imbrium.',
      credit: 'CNSA / Wikimedia Commons',
    },
    {
      url: local('change-3-lro.png'),
      caption: "Chang'e 3 lander and Yutu rover imaged from orbit by LRO.",
      credit: 'NASA LRO / CNSA',
    },
  ],
  'change-4-yutu2': [
    {
      url: local('change-4-lro.jpg'),
      caption: "Chang'e 4 lander on the lunar far side in Von Kármán crater.",
      credit: 'NASA LRO',
    },
    {
      url: nasa('01_m1303619844lr_closC5A1C'),
      caption: "Close-up LRO view of the Chang'e 4 lander on the far side.",
      credit: 'NASA LRO',
    },
  ],
  'change-5': [
    {
      url: local('change-5-lro.png'),
      caption: "Chang'e 5 lander and ascent vehicle at the Oceanus Procellarum sample-return site.",
      credit: 'NASA LRO / CNSA',
    },
    {
      url: local('yutu-rover.jpg'),
      caption:
        "Chang'e program lander/rover hardware — Chang'e 5 returned the first fresh lunar samples since 1976.",
      credit: 'CNSA',
    },
  ],
  'change-6': [
    {
      url: local('change-6-lro.jpg'),
      caption: "Chang'e 6 far-side lander in the South Pole–Aitken basin, imaged by LRO.",
      credit: 'NASA LRO / CNSA',
    },
  ],
  'beresheet': [
    {
      url: local('beresheet-spacecraft.jpg'),
      caption: 'Beresheet lunar lander — SpaceIL\'s privately funded Israeli mission to the Moon.',
      credit: 'SpaceIL',
    },
    {
      url: local('beresheet-lro.jpg'),
      caption: 'Beresheet impact site in Mare Serenitatis, imaged by LRO after the failed landing.',
      credit: 'NASA LRO',
    },
  ],
  'chandrayaan-2-vikram': [
    {
      url: local('chandrayaan-2-vikram-model.jpg'),
      caption: 'Chandrayaan-2 Vikram lander and Pragyan rover — engineering model of the mission stack.',
      credit: 'ISRO / NASA',
    },
    {
      url: local('vikram-impact.jpg'),
      caption: 'Vikram lander debris field near the lunar south pole, imaged by LRO.',
      credit: 'NASA LRO',
    },
  ],
  'chandrayaan-3-vikram': [
    {
      url: local('chandrayaan-3-vikram-lander.png'),
      caption: 'Chandrayaan-3 Vikram lander with Pragyan rover on the deployment ramp.',
      credit: 'ISRO',
    },
    {
      url: local('pragyan-rover.png'),
      caption: 'Pragyan rover — India\'s first lunar rover, deployed near the south pole in 2023.',
      credit: 'ISRO',
    },
    {
      url: local('chandrayaan-3-lro.png'),
      caption: 'Vikram lander at the south polar region, with rocket-plume halo visible in LRO imagery.',
      credit: 'NASA LRO / ISRO',
    },
  ],
  'slim': [
    {
      url: local('slim-spacecraft.jpg'),
      caption: 'SLIM (Smart Lander for Investigating Moon) spacecraft before launch.',
      credit: 'JAXA',
    },
    {
      url: local('slim-lro.png'),
      caption: 'SLIM lander on the lunar surface in Mare Nectaris, imaged by LRO after touchdown.',
      credit: 'NASA LRO / JAXA',
    },
  ],
  'im-1-odysseus': [
    {
      url: local('im-1-nova-c.jpg'),
      caption: 'Nova-C lander Odysseus — Intuitive Machines\' first CLPS lunar lander before launch.',
      credit: 'NASA / Intuitive Machines',
    },
    {
      url: local('im-1-odysseus-lro.jpg'),
      caption: 'Odysseus Nova-C lander near Malapert A, imaged by LRO after the February 2024 touchdown.',
      credit: 'NASA LRO',
    },
  ],
  'blue-ghost-1': [
    {
      url: local('blue-ghost-1.jpg'),
      caption: 'Firefly Blue Ghost lander in the clean room before its fully successful Mare Crisium landing.',
      credit: 'NASA / Firefly Aerospace',
    },
  ],
  'im-2-athena': [
    {
      url: local('im-2-athena-render.jpg'),
      caption: 'Nova-C lander Athena — Intuitive Machines\' second CLPS mission to Mons Mouton.',
      credit: 'NASA / Intuitive Machines',
    },
    {
      url: local('im-2-athena-lro.jpg'),
      caption: 'Athena lander resting on its side inside a crater on Mons Mouton, imaged by LRO.',
      credit: 'NASA LRO',
    },
  ],
  'resilience-hakuto-r2': [
    {
      url: local('resilience-spacecraft.jpg'),
      caption: 'RESILIENCE lander encapsulation before launch aboard the Blue Ghost rideshare mission.',
      credit: 'NASA / ispace',
    },
    {
      url: local('resilience-impact-lro.jpg'),
      caption: 'RESILIENCE hard-landing scar in Mare Frigoris, imaged by LRO on 11 June 2025.',
      credit: 'NASA LRO',
    },
  ],
  'change-7': [
    {
      url: local('change-7-render.jpg'),
      caption:
        "Chang'e 7 mission stack — lander, rover, and hopping probe targeting the Shackleton crater rim (2026).",
      credit: 'The Planetary Society / CNSA',
    },
  ],
  'im-3-vertex': [
    {
      url: local('im-3-nova-c.jpg'),
      caption: 'Nova-C lander for IM-3 — will deliver NASA\'s Lunar Vertex payload to Reiner Gamma.',
      credit: 'NASA / Intuitive Machines',
    },
  ],
  'griffin-1': [
    {
      url: local('griffin-1-cleanroom.jpg'),
      caption: 'Griffin-1 lunar lander (Moon Base II) in Astrobotic\'s clean room before environmental testing.',
      credit: 'NASA / Astrobotic',
    },
    {
      url: local('griffin-1-render.jpg'),
      caption: 'Artist rendering of Griffin-1 delivering payloads to the lunar south pole near Nobile crater.',
      credit: 'NASA / Astrobotic',
    },
  ],
  'blue-ghost-2': [
    {
      url: local('blue-ghost-2-render.jpg'),
      caption: 'Blue Ghost lander — Mission 2 will deliver NASA and ESA payloads to the lunar far side.',
      credit: 'NASA / Firefly Aerospace',
    },
    {
      url: local('blue-ghost-1.jpg'),
      caption: 'Blue Ghost lander flight hardware — same vehicle class that achieved the first fully successful commercial lunar landing.',
      credit: 'NASA / Firefly Aerospace',
    },
  ],
  'blue-moon-mk1': [
    {
      url: local('blue-moon-mk1.jpg'),
      caption: 'Blue Moon Mark 1 Endurance cargo lander — NASA\'s Moon Base I pathfinder (2027).',
      credit: 'NASA / Blue Origin',
    },
  ],
  'viper-blue-moon': [
    {
      url: local('viper-rover.jpg'),
      caption: 'VIPER rover during mobility testing — will map subsurface water ice at the lunar south pole.',
      credit: 'NASA',
    },
    {
      url: local('viper-blue-moon-render.jpg'),
      caption: 'VIPER rover deployed from a Blue Moon Mark 1 lander near Nobile crater (planned 2027).',
      credit: 'NASA / Blue Origin',
    },
  ],
  'shukrayaan-1': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Venus_-_December_23_2016.png/800px-Venus_-_December_23_2016.png',
      caption: 'Venus as seen from Earth orbit — Shukrayaan-1 will map the surface and atmosphere in unprecedented detail for ISRO.',
      credit: 'NASA / Wikimedia Commons',
    },
  ],
  'davinci-probe': [
    {
      url: 'https://assets.science.nasa.gov/dynamic/image/upload/w_1024,h_576,fit_pad/2023-04-13-1200-DAVINCI_Artist_Concept.jpg',
      caption: 'DAVINCI descent probe artist concept — the sphere will plunge through Venus\' clouds to Alpha Regio.',
      credit: 'NASA / GSFC',
    },
  ],
  veritas: [
    {
      url: 'https://assets.science.nasa.gov/dynamic/image/upload/w_1024,h_576,fit_pad/2021-06-02-1200-VERITAS_Artist_Concept.jpg',
      caption: 'VERITAS orbiter artist concept — radar and infrared instruments will map Venus\' surface and search for active volcanism.',
      credit: 'NASA / JPL',
    },
  ],
  envision: [
    {
      url: 'https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2021/06/envision/22396456-1-eng-GB/Envision_pillars.jpg',
      caption: 'EnVision will study Venus from its inner core to the top of its atmosphere with ESA\'s holistic radar suite.',
      credit: 'ESA',
    },
  ],
  'venera-d-lander': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Venera-13_lander.jpg/440px-Venera-13_lander.jpg',
      caption: 'Soviet Venera lander heritage — Venera-D aims for multi-hour survival on the 460 °C surface.',
      credit: 'Roscosmos / Wikimedia Commons',
    },
  ],
  'venera-d-balloon': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Vega_1_balloon.jpg/440px-Vega_1_balloon.jpg',
      caption: 'Vega mission balloon probe heritage — Venera-D\'s aerostat will float in the Venusian cloud layer near 50 km.',
      credit: 'Roscosmos / Wikimedia Commons',
    },
  ],
  'mariner-5': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mariner_Venus_1967.jpg/800px-Mariner_Venus_1967.jpg',
      caption: 'Mariner 5 spacecraft — flew within 4,094 km of Venus in October 1967, probing the atmosphere by radio occultation.',
      credit: 'NASA / Wikimedia Commons',
    },
  ],
  'mariner-2': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mariner_2.jpg/440px-Mariner_2.jpg',
      caption: 'Mariner 2 — the first successful interplanetary flyby, past Venus in December 1962.',
      credit: 'NASA / Wikimedia Commons',
    },
  ],
  'venera-9': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Venera-9-image.jpg/440px-Venera-9-image.jpg',
      caption: 'The first photograph returned from the surface of another planet — Venera 9, October 1975.',
      credit: 'Soviet Academy of Sciences / Wikimedia Commons',
    },
  ],
  'venera-13': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Venera13.png/440px-Venera13.png',
      caption: 'Venera 13 colour panorama from the Venusian surface — Phoebe Regio, March 1982.',
      credit: 'Soviet Academy of Sciences / Wikimedia Commons',
    },
  ],
  'venera-14': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Venera14.png/440px-Venera14.png',
      caption: 'Venera 14 surface panorama — the drilling arm compressed a soil sample for X-ray analysis before shutdown.',
      credit: 'Soviet Academy of Sciences / Wikimedia Commons',
    },
  ],
  'vega-1-balloon': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Vega_1_balloon.jpg/440px-Vega_1_balloon.jpg',
      caption: 'Vega 1 balloon instrument pack — the first aerostat to operate in another planet\'s atmosphere (~54 km, ~46 hours).',
      credit: 'IKI / Wikimedia Commons',
    },
  ],
  'vega-1-lander': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Venera-13_lander.jpg/440px-Venera-13_lander.jpg',
      caption: 'Vega lander descent module — identical bus to the late Venera landers, delivered by the Vega 1 flyby craft.',
      credit: 'Lavochkin / Wikimedia Commons',
    },
  ],
  'vega-2-balloon': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Vega_1_balloon.jpg/440px-Vega_1_balloon.jpg',
      caption: 'Vega 2 balloon probe — twin aerostat operating in the Venusian cloud deck for ~46 hours in June 1985.',
      credit: 'IKI / Wikimedia Commons',
    },
  ],
  'vega-2-lander': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Venera-13_lander.jpg/440px-Venera-13_lander.jpg',
      caption: 'Vega 2 lander at Rusalka Planitia — transmitted for 56 minutes before the bus continued to comet Halley.',
      credit: 'Lavochkin / Wikimedia Commons',
    },
  ],
  'pioneer-day-probe': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pioneer_Venus.jpg/440px-Pioneer_Venus.jpg',
      caption: 'Pioneer Venus multiprobe mission — the Day Probe survived surface impact and transmitted for 67 minutes.',
      credit: 'NASA / Wikimedia Commons',
    },
  ],
  'venera-7': [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Venera-13_lander.jpg/440px-Venera-13_lander.jpg',
      caption: 'Venera lander design heritage — Venera 7 achieved the first soft landing on another planet in December 1970.',
      credit: 'Lavochkin / Wikimedia Commons',
    },
  ],
};

export const getVehicleImages = (missionId: string): MissionImage[] =>
  missionVehicleImages[missionId] ?? [];
