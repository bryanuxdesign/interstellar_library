import * as THREE from 'three';

/**
 * Self-hosted planet maps under /images/planets/.
 * Primary bodies: Solar System Scope 2k equirectangular maps (CC-BY 4.0).
 * Ceres: SSS fictional map downscaled to 1k. Other dwarfs: procedural canvases.
 */
export const BODY_TEX: Record<string, string> = {
  sun: '/images/planets/sun.jpg',
  mercury: '/images/planets/mercury.jpg',
  venus: '/images/planets/venus.jpg',
  earth: '/images/planets/earth.jpg',
  mars: '/images/planets/mars.jpg',
  jupiter: '/images/planets/jupiter.jpg',
  saturn: '/images/planets/saturn.jpg',
  uranus: '/images/planets/uranus.jpg',
  neptune: '/images/planets/neptune.jpg',
  ceres: '/images/planets/ceres.jpg',
  haumea: '/images/planets/haumea.jpg',
  makemake: '/images/planets/makemake.jpg',
  luna: '/images/planets/moon.jpg',
};

export const SATURN_RING_TEX = '/images/planets/saturn_ring.png';

export const PRELOAD_TEX_URLS = [...Object.values(BODY_TEX), SATURN_RING_TEX];

/** Max anisotropy for planet maps — keeps detail when glancing at the limb. */
export const PLANET_ANISOTROPY = 8;

const canvasCache = new Map<string, THREE.CanvasTexture>();

export function preparePlanetMap(tex: THREE.Texture, anisotropy = PLANET_ANISOTROPY) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function finishCanvas(tex: THREE.CanvasTexture) {
  preparePlanetMap(tex, 4);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Compact mottled surface for dwarfs without dedicated maps — 512×256 canvas.
 * Ceres uses BODY_TEX instead.
 */
export function getDwarfTexture(id: string, baseColor: string) {
  const key = `dwarf:${id}`;
  const hit = canvasCache.get(key);
  if (hit) return hit;

  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const empty = finishCanvas(new THREE.CanvasTexture(canvas));
    canvasCache.set(key, empty);
    return empty;
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  // Soft latitude shading (poles slightly brighter for icy KBOs)
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  const icy = id === 'pluto' || id === 'eris' || id === 'haumea' || id === 'makemake';
  shade.addColorStop(0, icy ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)');
  shade.addColorStop(0.42, 'rgba(0,0,0,0)');
  shade.addColorStop(1, icy ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.22)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  let seed = 0;
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i) * (i + 1);

  // Broad albedo patches
  for (let i = 0; i < 64; i++) {
    const x = hash(seed + i * 3.1) * W;
    const y = hash(seed + i * 7.7) * H;
    const r = 6 + hash(seed + i * 11.3) * 22;
    const a = 0.07 + hash(seed + i * 13.9) * 0.2;
    ctx.fillStyle = `rgba(40,35,30,${a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, hash(seed + i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bright frost / crater highlights
  for (let i = 0; i < 36; i++) {
    const x = hash(seed + 200 + i * 2.4) * W;
    const y = hash(seed + 300 + i * 5.1) * H;
    const r = 2 + hash(seed + 400 + i) * 8;
    ctx.fillStyle = `rgba(255,255,255,${0.05 + hash(seed + 500 + i) * (icy ? 0.2 : 0.12)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pluto-like heart / darker basin hint
  if (id === 'pluto') {
    ctx.fillStyle = 'rgba(180,140,100,0.35)';
    ctx.beginPath();
    ctx.ellipse(W * 0.55, H * 0.52, 70, 48, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230,210,190,0.28)';
    ctx.beginPath();
    ctx.ellipse(W * 0.52, H * 0.48, 38, 32, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = finishCanvas(new THREE.CanvasTexture(canvas));
  canvasCache.set(key, tex);
  return tex;
}

export type SurfaceKind = 'rocky' | 'gas' | 'ice' | 'sun' | 'cloud';

export function surfaceKindFor(id: string): SurfaceKind {
  if (id === 'sun') return 'sun';
  if (id === 'venus') return 'cloud';
  if (id === 'jupiter' || id === 'saturn') return 'gas';
  if (id === 'uranus' || id === 'neptune') return 'ice';
  return 'rocky';
}

let saturnRingLoad: Promise<THREE.CanvasTexture> | null = null;

/** Decode saturn_ring.png onto a canvas so RGBA alpha gaps render like faint rings. */
export function loadSaturnRingTexture() {
  if (!saturnRingLoad) {
    saturnRingLoad = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const W = img.width;
        const H = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('2d context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        canvasCache.set('ring:saturn', tex);
        resolve(tex);
      };
      img.onerror = () => reject(new Error('saturn ring image'));
      img.src = SATURN_RING_TEX;
    });
  }
  return saturnRingLoad;
}

/** Thin radial alpha strip for faint (non-Saturn) rings — shared canvas. */
export function getFaintRingTexture() {
  const key = 'ring:faint';
  const hit = canvasCache.get(key);
  if (hit) return hit;

  const W = 256;
  const H = 8;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const empty = finishCanvas(new THREE.CanvasTexture(canvas));
    canvasCache.set(key, empty);
    return empty;
  }

  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.08, 'rgba(255,255,255,0.15)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.78, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const tex = finishCanvas(new THREE.CanvasTexture(canvas));
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  canvasCache.set(key, tex);
  return tex;
}

/** Simple mottled moon surface when no dedicated map. */
export function getMoonTexture(id: string, baseColor: string) {
  const key = `moon:${id}`;
  const hit = canvasCache.get(key);
  if (hit) return hit;

  const W = 256;
  const H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const empty = finishCanvas(new THREE.CanvasTexture(canvas));
    canvasCache.set(key, empty);
    return empty;
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i) * (i + 1);
  for (let i = 0; i < 48; i++) {
    const x = hash(seed + i * 2.7) * W;
    const y = hash(seed + i * 5.3) * H;
    const r = 2 + hash(seed + i * 9.1) * 10;
    ctx.fillStyle = `rgba(20,18,16,${0.08 + hash(seed + i) * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 20; i++) {
    const x = hash(seed + 300 + i) * W;
    const y = hash(seed + 400 + i) * H;
    ctx.fillStyle = `rgba(255,255,255,${0.04 + hash(seed + 500 + i) * 0.12})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash(seed + i) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = finishCanvas(new THREE.CanvasTexture(canvas));
  canvasCache.set(key, tex);
  return tex;
}

export function texturedMaterialProps(kind: SurfaceKind, selected: boolean) {
  if (kind === 'gas') {
    return {
      roughness: 0.48,
      metalness: 0.08,
      emissive: selected ? '#665544' : '#1a120c',
      emissiveIntensity: selected ? 0.26 : 0.05,
    };
  }
  if (kind === 'ice') {
    return {
      roughness: 0.3,
      metalness: 0.14,
      emissive: selected ? '#335566' : '#081018',
      emissiveIntensity: selected ? 0.28 : 0.045,
    };
  }
  if (kind === 'cloud') {
    return {
      roughness: 0.55,
      metalness: 0.02,
      emissive: selected ? '#665533' : '#1a1408',
      emissiveIntensity: selected ? 0.22 : 0.04,
    };
  }
  return {
    roughness: 0.78,
    metalness: 0.04,
    emissive: selected ? '#334455' : '#000000',
    emissiveIntensity: selected ? 0.22 : 0,
  };
}
