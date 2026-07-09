/**
 * Fetches NASA MMGIS rover waypoints and writes simplified traverse bundles.
 * Refresh monthly: npm run fetch-traverses
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/data/traverses');

const toSignedLng = (east) => (east > 180 ? east - 360 : east);
const coord = (lon, lat) => ({ lat, lng: toSignedLng(lon) });

function simplifyPath(points, maxPoints) {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const out = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

async function fetchMmgis(missionId, url, maxPoints = 1000) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const geojson = await res.json();
  const features = geojson.features ?? [];
  const path = features.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return coord(lon, lat);
  });

  const first = features[0];
  const last = features[features.length - 1];
  const lastProps = last?.properties ?? {};

  return {
    missionId,
    landingSite: path[0],
    lastKnown: path[path.length - 1],
    path: simplifyPath(path, maxPoints),
    totalDistanceKm: Number(lastProps.dist_km ?? 0),
    lastDriveSol: lastProps.sol ?? null,
    lastDriveDate: null,
    dataSource: 'nasa-mmgis',
    dataUpdatedAt: new Date().toISOString().slice(0, 10),
  };
}

function staticBundle(record) {
  return {
    ...record,
    dataUpdatedAt: new Date().toISOString().slice(0, 10),
  };
}

const STATIC = {
  spirit: staticBundle({
    missionId: 'spirit',
    landingSite: coord(175.47295, -14.5684),
    lastKnown: coord(166.215, -34.646),
    path: [
      coord(175.47295, -14.5684),
      coord(175.2, -14.8),
      coord(170.5, -20.0),
      coord(168.0, -28.0),
      coord(166.5, -32.5),
      coord(166.215, -34.646),
    ],
    totalDistanceKm: 7.73,
    lastDriveSol: 2210,
    lastDriveDate: '2010-03-22',
    dataSource: 'pds-mer',
    approximate: false,
  }),
  opportunity: staticBundle({
    missionId: 'opportunity',
    landingSite: coord(354.47417, -1.9462),
    lastKnown: coord(204.885, -45.161),
    path: [
      coord(354.47417, -1.9462),
      coord(350.0, -5.0),
      coord(340.0, -10.0),
      coord(320.0, -20.0),
      coord(280.0, -30.0),
      coord(240.0, -38.0),
      coord(220.0, -42.0),
      coord(204.885, -45.161),
    ],
    totalDistanceKm: 45.16,
    lastDriveSol: 5111,
    lastDriveDate: '2018-06-10',
    dataSource: 'pds-mer',
    approximate: false,
  }),
  'mars-pathfinder': staticBundle({
    missionId: 'mars-pathfinder',
    landingSite: coord(326.78, 19.13),
    lastKnown: coord(326.79, 19.14),
    path: [
      coord(326.78, 19.13),
      coord(326.785, 19.135),
      coord(326.79, 19.14),
    ],
    totalDistanceKm: 0.1,
    lastDriveSol: 83,
    lastDriveDate: '1997-09-27',
    dataSource: 'static',
    approximate: true,
  }),
  zhurong: staticBundle({
    missionId: 'zhurong',
    landingSite: coord(109.925, 25.066),
    lastKnown: coord(109.94, 25.08),
    path: [
      coord(109.925, 25.066),
      coord(109.93, 25.072),
      coord(109.935, 25.076),
      coord(109.94, 25.08),
    ],
    totalDistanceKm: 1.921,
    lastDriveSol: 347,
    lastDriveDate: '2022-05-06',
    dataSource: 'static',
    approximate: true,
  }),
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const curiosity = await fetchMmgis(
    'curiosity',
    'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json',
  );
  const perseverance = await fetchMmgis(
    'perseverance',
    'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json',
  );

  const bundles = [curiosity, perseverance, ...Object.values(STATIC)];

  for (const bundle of bundles) {
    const file = join(OUT_DIR, `${bundle.missionId}.json`);
    await writeFile(file, JSON.stringify(bundle, null, 2));
    console.log(
      `Wrote ${bundle.missionId}: ${bundle.path.length} pts, ${bundle.totalDistanceKm} km, sol ${bundle.lastDriveSol}`,
    );
  }

  console.log('\nActive rover lastKnown (update mars.ts coordinates):');
  console.log('  curiosity:', curiosity.lastKnown);
  console.log('  perseverance:', perseverance.lastKnown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
