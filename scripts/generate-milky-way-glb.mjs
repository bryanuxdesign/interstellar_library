/**
 * Regenerates public/models/milky-way.glb — a denser barred-spiral disk
 * for archive-style useGLTF loading (same path as moon/mars/venus).
 *
 * Run: node scripts/generate-milky-way-glb.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter (browser API) polyfills for Node
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.();
      });
    }
  };
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = (await import('node:buffer')).Blob;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'models', 'milky-way.glb');

const RADIAL = 96;
const ANGULAR = 256;
const DISK_R = 1;
const ARM_COUNT = 4;
const ARM_TIGHTNESS = 3.15;

function hash2(i, j) {
  const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function armBrightness(x, z) {
  const r = Math.hypot(x, z);
  if (r < 0.02) return 1;
  const theta = Math.atan2(z, x);
  let best = 0;
  for (let a = 0; a < ARM_COUNT; a++) {
    const armPhase = (a / ARM_COUNT) * Math.PI * 2;
    const spiral = theta - Math.log(Math.max(r, 0.05)) * ARM_TIGHTNESS - armPhase;
    const d = Math.abs(Math.atan2(Math.sin(spiral), Math.cos(spiral)));
    const width = 0.22 + 0.08 * (1 - r);
    const band = Math.exp(-(d * d) / (2 * width * width));
    best = Math.max(best, band);
  }
  // Central bar
  const bar = Math.exp(-(z * z) / (2 * 0.045 * 0.045)) * Math.exp(-(x * x) / (2 * 0.28 * 0.28));
  best = Math.max(best, bar * 0.85);
  // Soft radial falloff + dust lane dip near mid-disk
  const radial = Math.pow(1 - Math.min(r, 1), 0.55);
  const dust = 1 - 0.35 * Math.exp(-Math.pow((r - 0.42) / 0.12, 2));
  return THREE.MathUtils.clamp(best * radial * dust + radial * 0.12, 0, 1);
}

function diskHeight(x, z) {
  const r = Math.hypot(x, z);
  const bulge = 0.14 * Math.exp(-(r * r) / (2 * 0.12 * 0.12));
  const thin = 0.028 * Math.exp(-(r * r) / (2 * 0.55 * 0.55));
  const warp = 0.012 * Math.sin(Math.atan2(z, x) * 2 + r * 4) * r;
  const noise = (hash2(Math.floor(x * 40), Math.floor(z * 40)) - 0.5) * 0.01 * (1 - r);
  return bulge + thin + warp + noise;
}

function buildDisk() {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= RADIAL; j++) {
    const r = (j / RADIAL) * DISK_R;
    for (let i = 0; i <= ANGULAR; i++) {
      const u = i / ANGULAR;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = diskHeight(x, z);
      positions.push(x, y, z);

      // Approximate normal from height gradient
      const eps = 0.01;
      const dyx = diskHeight(x + eps, z) - diskHeight(x - eps, z);
      const dyz = diskHeight(x, z + eps) - diskHeight(x, z - eps);
      const n = new THREE.Vector3(-dyx, 2 * eps, -dyz).normalize();
      normals.push(n.x, n.y, n.z);

      const b = armBrightness(x, z);
      const core = Math.exp(-(r * r) / (2 * 0.1 * 0.1));
      // Warm core → blue-white arms → dusty violet outer
      const cr = 0.15 + b * 0.55 + core * 0.55;
      const cg = 0.08 + b * 0.32 + core * 0.35;
      const cb = 0.22 + b * 0.48 + core * 0.15;
      colors.push(cr, cg, cb);
      uvs.push(u, j / RADIAL);
    }
  }

  const stride = ANGULAR + 1;
  for (let j = 0; j < RADIAL; j++) {
    for (let i = 0; i < ANGULAR; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Underside (slightly flatter, darker)
  const topCount = positions.length / 3;
  for (let j = 0; j <= RADIAL; j++) {
    const r = (j / RADIAL) * DISK_R;
    for (let i = 0; i <= ANGULAR; i++) {
      const u = i / ANGULAR;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = -diskHeight(x, z) * 0.85;
      positions.push(x, y, z);
      const eps = 0.01;
      const dyx = diskHeight(x + eps, z) - diskHeight(x - eps, z);
      const dyz = diskHeight(x, z + eps) - diskHeight(x, z - eps);
      const n = new THREE.Vector3(dyx, 2 * eps, dyz).normalize();
      normals.push(n.x, n.y, n.z);
      const b = armBrightness(x, z) * 0.65;
      colors.push(0.08 + b * 0.35, 0.05 + b * 0.2, 0.14 + b * 0.35);
      uvs.push(u, j / RADIAL);
    }
  }
  for (let j = 0; j < RADIAL; j++) {
    for (let i = 0; i < ANGULAR; i++) {
      const a = topCount + j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function buildArmRibbon(armIndex) {
  const segments = 180;
  const radialSamples = 7;
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  const phase = (armIndex / ARM_COUNT) * Math.PI * 2;
  const hueShift = armIndex / ARM_COUNT;

  for (let s = 0; s <= segments; s++) {
    const t = s / segments;
    const r = 0.12 + t * 0.86;
    const theta = Math.log(r / 0.12) * ARM_TIGHTNESS + phase;
    const cx = Math.cos(theta) * r;
    const cz = Math.sin(theta) * r;
    const tangent = new THREE.Vector3(
      -Math.sin(theta) * r + Math.cos(theta) * (r * 0.02),
      0,
      Math.cos(theta) * r + Math.sin(theta) * (r * 0.02),
    ).normalize();
    const bitangent = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const width = 0.055 * (1.15 - t * 0.55);
    const thickness = 0.018 * (1.1 - t * 0.4);

    for (let k = 0; k <= radialSamples; k++) {
      const v = k / radialSamples;
      const lat = (v - 0.5) * 2;
      const x = cx + bitangent.x * lat * width;
      const z = cz + bitangent.z * lat * width;
      const y = diskHeight(x, z) * 0.7 + Math.cos(lat * Math.PI * 0.5) * thickness;
      positions.push(x, y, z);
      normals.push(0, 1, 0);
      const glow = (1 - Math.abs(lat)) * (1 - t * 0.35);
      const cr = 0.35 + glow * (0.55 - hueShift * 0.15);
      const cg = 0.22 + glow * (0.35 + hueShift * 0.1);
      const cb = 0.55 + glow * (0.4 - hueShift * 0.2);
      colors.push(cr, cg, cb);
      uvs.push(t, v);
    }
  }

  const stride = radialSamples + 1;
  for (let s = 0; s < segments; s++) {
    for (let k = 0; k < radialSamples; k++) {
      const a = s * stride + k;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildBulge() {
  const geo = new THREE.SphereGeometry(0.16, 48, 32);
  geo.scale(1.35, 0.72, 1.1);
  const colors = [];
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = Math.abs(pos.getY(i));
    const warm = 1 - y * 2.2;
    colors.push(1.0, 0.72 + warm * 0.15, 0.38 + warm * 0.1);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

function buildHalo() {
  const geo = new THREE.SphereGeometry(1.12, 64, 32);
  geo.scale(1, 0.18, 1);
  return geo;
}

function buildStarField() {
  const count = 1400;
  const positions = [];
  const colors = [];
  const sizes = [];
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 0.55) * 0.98;
    const theta = Math.random() * Math.PI * 2;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const arm = armBrightness(x, z);
    if (Math.random() > 0.35 + arm * 0.55) continue;
    const y = diskHeight(x, z) + (Math.random() - 0.5) * 0.04;
    positions.push(x, y, z);
    const hot = Math.random();
    if (hot > 0.85) colors.push(0.7, 0.85, 1);
    else if (hot > 0.55) colors.push(1, 0.95, 0.85);
    else colors.push(1, 0.78, 0.45);
    sizes.push(0.004 + Math.random() * 0.01 + arm * 0.006);
  }

  // Merge as small octahedra for reliable GLB (points materials are flaky in exporters)
  const merged = new THREE.BufferGeometry();
  const verts = [];
  const cols = [];
  const norms = [];
  const idx = [];
  let base = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const px = positions[i];
    const py = positions[i + 1];
    const pz = positions[i + 2];
    const s = sizes[i / 3];
    const cr = colors[i];
    const cg = colors[i + 1];
    const cb = colors[i + 2];
    // octahedron
    const local = [
      [0, s, 0],
      [s, 0, 0],
      [0, 0, s],
      [-s, 0, 0],
      [0, 0, -s],
      [0, -s, 0],
    ];
    for (const [lx, ly, lz] of local) {
      verts.push(px + lx, py + ly, pz + lz);
      cols.push(cr, cg, cb);
      const n = new THREE.Vector3(lx, ly, lz).normalize();
      norms.push(n.x, n.y, n.z);
    }
    const faces = [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 1],
      [5, 2, 1],
      [5, 3, 2],
      [5, 4, 3],
      [5, 1, 4],
    ];
    for (const [a, b, c] of faces) {
      idx.push(base + a, base + b, base + c);
    }
    base += 6;
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  merged.setIndex(idx);
  return merged;
}

function mat({ color, emissive, emissiveIntensity, opacity = 1, metalness = 0.05, roughness = 0.75, vertexColors = false }) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness,
    roughness,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.95,
    side: THREE.DoubleSide,
    vertexColors,
  });
}

async function main() {
  const root = new THREE.Group();
  root.name = 'MilkyWay';

  const disk = new THREE.Mesh(
    buildDisk(),
    mat({
      color: 0xffffff,
      emissive: 0x221133,
      emissiveIntensity: 0.55,
      opacity: 0.98,
      roughness: 0.85,
      vertexColors: true,
    }),
  );
  disk.name = 'Disk';
  root.add(disk);

  for (let a = 0; a < ARM_COUNT; a++) {
    const arm = new THREE.Mesh(
      buildArmRibbon(a),
      mat({
        color: 0xffffff,
        emissive: 0x8866cc,
        emissiveIntensity: 0.85,
        opacity: 0.78,
        roughness: 0.55,
        metalness: 0.02,
        vertexColors: true,
      }),
    );
    arm.name = `Arm_${a}`;
    root.add(arm);
  }

  const bulge = new THREE.Mesh(
    buildBulge(),
    mat({
      color: 0xffcc88,
      emissive: 0xffaa55,
      emissiveIntensity: 1.4,
      roughness: 0.35,
      metalness: 0,
      vertexColors: true,
    }),
  );
  bulge.name = 'Bulge';
  root.add(bulge);

  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.07, 0.12, 8, 2, 4),
    mat({
      color: 0xffe0a8,
      emissive: 0xffc878,
      emissiveIntensity: 0.9,
      opacity: 0.9,
      roughness: 0.5,
    }),
  );
  bar.name = 'Bar';
  root.add(bar);

  const halo = new THREE.Mesh(
    buildHalo(),
    mat({
      color: 0x1a1030,
      emissive: 0x120820,
      emissiveIntensity: 0.25,
      opacity: 0.22,
      roughness: 1,
      metalness: 0,
    }),
  );
  halo.name = 'Halo';
  root.add(halo);

  const stars = new THREE.Mesh(
    buildStarField(),
    mat({
      color: 0xffffff,
      emissive: 0xfff2d0,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0,
      vertexColors: true,
    }),
  );
  stars.name = 'Stars';
  root.add(stars);

  // Soft outer glow ring
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.08, 128),
    mat({
      color: 0x4a3080,
      emissive: 0x3a2060,
      emissiveIntensity: 0.4,
      opacity: 0.28,
      roughness: 1,
      metalness: 0,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.name = 'OuterGlow';
  root.add(glow);

  const exporter = new GLTFExporter();
  const ab = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: true,
  });

  writeFileSync(OUT, Buffer.from(ab));
  console.log(`Wrote ${OUT} (${Buffer.from(ab).length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
