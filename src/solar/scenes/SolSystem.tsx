import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars, useTexture } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  BELT_INNER,
  BELT_OUTER,
  SOLAR_BODIES,
  type PlanetRingConfig,
  type SolarBody,
} from '@/solar/data/bodies';
import { SOLAR_MOONS, findMoon, type MoonBody } from '@/solar/data/moons';
import {
  daysSinceJ2000,
  sampleKeplerOrbitScene,
  softElementsFor,
  writeEphemerisScenePosition,
} from '@/solar/ephemeris';
import { NBodySim } from '@/solar/nbody';
import {
  fillOrbitRing,
  fillOutboundTrajectory,
  writeOutboundPosition,
} from '@/solar/helicalMotion';
import {
  BODY_TEX,
  PRELOAD_TEX_URLS,
  getDwarfTexture,
  getFaintRingTexture,
  getMoonTexture,
  loadSaturnRingTexture,
  preparePlanetMap,
  surfaceKindFor,
  texturedMaterialProps,
} from '@/solar/planetTextures';

export type SolTimeMode = 'live' | 'simulate';

const OUTBOUND_DRIFT = 0.004;
const ORBIT_SEGMENTS = 96;
const PROBE_ORBIT_SEGMENTS = 96;
const TRAIL_SEGMENTS = 64;
const BELT_COUNT = 420;
const BELT_SPIN = 0.018;
/** Cyan probe paths — thinner/quieter than planet gold rings. */
const PROBE_ORBIT_COLOR = '#5ec8d8';
const PROBE_ORBIT_SELECTED = '#f0d78c';
/** Dwarf heliocentric rings — cooler/fainter so they don't compete with planets. */
const DWARF_ORBIT_COLOR = '#8a9aaa';
const DWARF_ORBIT_SELECTED = '#c8d4e0';
const PLANET_ORBIT_COLOR = '#6b7c93';
const PLANET_ORBIT_SELECTED = '#f0d78c';

/** Elevated ecliptic overview — NASA Eyes–style default framing. */
const SOL_CAM_POS = new THREE.Vector3(0, 9.5, 22);
const SOL_CAM_TARGET = new THREE.Vector3(0, 0, 0);

// Shared geometries — one allocation each, reused across bodies.
const GEO_SUN = new THREE.SphereGeometry(1, 64, 64);
const GEO_LARGE = new THREE.SphereGeometry(1, 40, 40);
const GEO_MED = new THREE.SphereGeometry(1, 28, 28);
const GEO_SMALL = new THREE.SphereGeometry(1, 18, 18);
const GEO_TINY = new THREE.SphereGeometry(1, 12, 12);
const GEO_HIT = new THREE.SphereGeometry(1, 8, 8);
const GEO_ATM = new THREE.SphereGeometry(1, 32, 32);
/** Distinct craft marker — octahedron reads differently from planet spheres. */
const GEO_PROBE = new THREE.OctahedronGeometry(1, 0);

/** Ring with radial UVs so an alpha strip maps inner→outer. */
function makeRingGeometry(inner: number, outer: number, thetaSegments = 64, phiSegments = 5) {
  const geo = new THREE.RingGeometry(inner, outer, thetaSegments, phiSegments);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.y);
    const u = (r - inner) / Math.max(1e-6, outer - inner);
    uv.setXY(i, THREE.MathUtils.clamp(u, 0, 1), 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

const RING_GEO_CACHE = new Map<string, THREE.RingGeometry>();
function ringGeometryFor(cfg: PlanetRingConfig) {
  const theta = cfg.textured ? 96 : 48;
  const phi = cfg.textured ? 12 : 4;
  const key = `${cfg.inner}:${cfg.outer}:${theta}:${phi}`;
  let geo = RING_GEO_CACHE.get(key);
  if (!geo) {
    geo = makeRingGeometry(cfg.inner, cfg.outer, theta, phi);
    RING_GEO_CACHE.set(key, geo);
  }
  return geo;
}

function bodyGeometry(body: SolarBody) {
  if (body.kind === 'star') return GEO_SUN;
  if (body.size >= 0.16) return GEO_LARGE;
  if (body.size >= 0.07) return GEO_MED;
  return GEO_SMALL;
}

function showLabel(body: SolarBody, selected: boolean) {
  if (selected) return true;
  if (body.kind === 'probe') return true;
  return body.kind === 'star' || body.kind === 'planet' || body.kind === 'dwarf';
}

function focusDistanceFor(body: SolarBody | MoonBody) {
  if ('kind' in body) {
    if (body.kind === 'star') return 14;
    if (body.kind === 'probe') return Math.max(3.8, body.size * 18 + 2.8);
    return Math.max(2.2, body.size * 9 + 1.6);
  }
  return Math.max(1.4, body.size * 14 + 0.9);
}

function materialPropsFor(body: SolarBody, selected: boolean) {
  if (body.kind === 'star') {
    return {
      color: body.color,
      emissive: body.color,
      emissiveIntensity: 1.55,
      roughness: 0.28,
      metalness: 0.05,
    };
  }
  const gas = body.id === 'jupiter' || body.id === 'saturn';
  const ice = body.id === 'uranus' || body.id === 'neptune';
  return {
    color: body.color,
    emissive: selected ? body.color : gas || ice ? body.color : '#000000',
    emissiveIntensity: selected ? 0.45 : gas ? 0.12 : ice ? 0.08 : 0,
    roughness: gas ? 0.48 : ice ? 0.32 : 0.78,
    metalness: gas ? 0.12 : ice ? 0.18 : 0.04,
  };
}

function parentObliquity(parentId: string): number {
  const parent = SOLAR_BODIES.find((b) => b.id === parentId);
  return parent?.ring?.obliquity ?? 0;
}

/** Moon offset in parent-local frame (equator tipped by parent obliquity). */
function writeMoonOffset(moon: MoonBody, days: number, out: THREE.Vector3) {
  const angle = moon.M0 + moon.meanMotion * days;
  const r = moon.orbitRadius;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosI = Math.cos(moon.inclination);
  const sinI = Math.sin(moon.inclination);
  // Equatorial plane ≈ XZ; small inclination lifts Y.
  const x = cosA * r;
  const y = sinA * r * sinI;
  const z = sinA * r * cosI;
  const obl = parentObliquity(moon.parentId);
  if (Math.abs(obl) < 1e-6) {
    out.set(x, y, z);
    return out;
  }
  const cosO = Math.cos(obl);
  const sinO = Math.sin(obl);
  out.set(x, y * cosO - z * sinO, y * sinO + z * cosO);
  return out;
}

type TimeContext = {
  mode: SolTimeMode;
  /** Wall-clock epoch when sim started (or “now” for live). */
  epochMs: number;
  /** Years ahead of epoch in simulate mode (0…10). */
  simYears: number;
  nbody: NBodySim | null;
};

function dateForContext(ctx: TimeContext): Date {
  if (ctx.mode === 'live') return new Date();
  return new Date(ctx.epochMs + ctx.simYears * 365.25 * 86400000);
}

function daysForMoons(ctx: TimeContext): number {
  return daysSinceJ2000(dateForContext(ctx));
}

/** Resolve live / sim body position into `out`. */
function resolveBodyPosition(
  id: string,
  positionsRef: MutableRefObject<Map<string, THREE.Vector3>>,
  ctx: TimeContext,
  out: THREE.Vector3,
): THREE.Vector3 | null {
  const cached = positionsRef.current.get(id);
  if (cached) return out.copy(cached);

  if (id === 'sun') return out.set(0, 0, 0);

  const moon = findMoon(id);
  if (moon) {
    const parentPos = resolveBodyPosition(moon.parentId, positionsRef, ctx, out);
    if (!parentPos) return null;
    const rel = new THREE.Vector3();
    writeMoonOffset(moon, daysForMoons(ctx), rel);
    return out.copy(parentPos).add(rel);
  }

  const body = SOLAR_BODIES.find((b) => b.id === id);
  if (!body) return null;

  if (body.outbound) {
    const t = (Date.now() - ctx.epochMs) / 1000;
    writeOutboundPosition(
      out,
      Math.max(0, t),
      body.radius,
      body.speed,
      0,
      OUTBOUND_DRIFT,
      body.outboundDir,
    );
    return out;
  }

  if (ctx.mode === 'simulate' && ctx.nbody?.writeScenePosition(id, out)) {
    return out;
  }

  if (writeEphemerisScenePosition(id, dateForContext(ctx), out)) {
    return out;
  }

  // Fallback: place on catalog circle
  out.set(body.radius, 0, 0);
  return out;
}

function OrbitRing({
  body,
  selected,
}: {
  body: SolarBody;
  selected: boolean;
}) {
  const isDwarf = body.kind === 'dwarf';
  const positions = useMemo(() => {
    const el = softElementsFor(body.id);
    if (el) return sampleKeplerOrbitScene(el, ORBIT_SEGMENTS);
    const arr = new Float32Array(ORBIT_SEGMENTS * 3);
    fillOrbitRing(arr, body.radius, ORBIT_SEGMENTS, body.inclination ?? 0);
    return arr;
  }, [body.id, body.radius, body.inclination]);

  const color = selected
    ? isDwarf
      ? DWARF_ORBIT_SELECTED
      : PLANET_ORBIT_SELECTED
    : isDwarf
      ? DWARF_ORBIT_COLOR
      : PLANET_ORBIT_COLOR;
  const opacity = selected ? (isDwarf ? 0.62 : 0.7) : isDwarf ? 0.22 : 0.28;

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  );
}

/** Interstellar / hyperbolic outbound ray (Voyagers). */
function OutboundTrail({
  body,
  selected,
}: {
  body: SolarBody;
  selected: boolean;
}) {
  const positions = useMemo(() => {
    const dir = body.outboundDir ?? ([1, 0.02, 0] as [number, number, number]);
    const arr = new Float32Array(TRAIL_SEGMENTS * 3);
    const start = 5.5;
    const end = body.radius * 1.18;
    fillOutboundTrajectory(arr, dir, start, end, TRAIL_SEGMENTS);
    return arr;
  }, [body.outboundDir, body.radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={selected ? body.color : PROBE_ORBIT_COLOR}
        transparent
        opacity={selected ? 0.9 : 0.48}
        depthWrite={false}
      />
    </line>
  );
}

/** Closed heliocentric Kepler ellipse from the same soft elements as ephemeris. */
function ProbeKeplerOrbit({
  bodyId,
  selected,
}: {
  bodyId: string;
  selected: boolean;
}) {
  const positions = useMemo(() => {
    const el = softElementsFor(bodyId);
    if (!el) return null;
    return sampleKeplerOrbitScene(el, PROBE_ORBIT_SEGMENTS);
  }, [bodyId]);

  if (!positions) return null;

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={selected ? PROBE_ORBIT_SELECTED : PROBE_ORBIT_COLOR}
        transparent
        opacity={selected ? 0.72 : 0.42}
        depthWrite={false}
      />
    </lineLoop>
  );
}

/** Probe path: closed Kepler ring or outbound ray. */
function ProbeOrbitPath({
  body,
  selected,
}: {
  body: SolarBody;
  selected: boolean;
}) {
  if (body.outbound) {
    return <OutboundTrail body={body} selected={selected} />;
  }
  return <ProbeKeplerOrbit bodyId={body.id} selected={selected} />;
}

/** Thin limb glow — BackSide fresnel, no extra render passes. */
function AtmosphereShell({
  scale,
  color,
  coef = 0.55,
  power = 3.4,
  intensity = 1,
}: {
  scale: number;
  color: string;
  coef?: number;
  power?: number;
  intensity?: number;
}) {
  const mat = useMemo(() => {
    const c = new THREE.Color(color);
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        glowColor: { value: c },
        coef: { value: coef },
        power: { value: power },
        intensity: { value: intensity },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(mat3(modelMatrix) * normal);
          vView = normalize(cameraPosition - world.xyz);
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 glowColor;
        uniform float coef;
        uniform float power;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float fresnel = pow(clamp(coef - abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0), power);
          gl_FragColor = vec4(glowColor, fresnel * intensity);
        }
      `,
    });
  }, [color, coef, power, intensity]);

  return <mesh scale={scale} geometry={GEO_ATM} material={mat} />;
}

function TexturedSurface({
  url,
  bodyId,
  scale,
  geometry,
  selected,
  onSelect,
}: {
  url: string;
  bodyId: string;
  scale: number;
  geometry: THREE.SphereGeometry;
  selected: boolean;
  onSelect: () => void;
}) {
  const map = useTexture(url);
  useEffect(() => {
    preparePlanetMap(map);
  }, [map]);
  const mat = texturedMaterialProps(surfaceKindFor(bodyId), selected);
  const haze =
    bodyId === 'venus' ? (
      <AtmosphereShell
        scale={scale * 1.06}
        color="#e8c878"
        coef={0.62}
        power={2.6}
        intensity={selected ? 0.55 : 0.38}
      />
    ) : null;
  return (
    <group>
      <mesh
        scale={scale}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          map={map}
          roughness={mat.roughness}
          metalness={mat.metalness}
          emissive={mat.emissive}
          emissiveIntensity={mat.emissiveIntensity}
        />
      </mesh>
      {haze}
    </group>
  );
}

function SunSurface({
  scale,
  selected,
  onSelect,
}: {
  scale: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const map = useTexture(BODY_TEX.sun);
  useEffect(() => {
    preparePlanetMap(map, 4);
  }, [map]);
  return (
    <group>
      <mesh
        scale={scale}
        geometry={GEO_SUN}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          map={map}
          emissiveMap={map}
          emissive="#fff4d0"
          emissiveIntensity={selected ? 2.35 : 1.95}
          roughness={0.32}
          metalness={0.04}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={scale * 1.22} geometry={GEO_SUN}>
        <meshBasicMaterial
          color="#ffc070"
          transparent
          opacity={selected ? 0.22 : 0.15}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={scale * 1.42} geometry={GEO_ATM}>
        <meshBasicMaterial
          color="#ff9a44"
          transparent
          opacity={selected ? 0.1 : 0.07}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={scale * 1.72} geometry={GEO_HIT}>
        <meshBasicMaterial
          color="#ff8822"
          transparent
          opacity={0.04}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function EarthSurface({
  scale,
  geometry,
  selected,
  beacon,
  onSelect,
}: {
  scale: number;
  geometry: THREE.SphereGeometry;
  selected: boolean;
  beacon: boolean;
  onSelect: () => void;
}) {
  const map = useTexture(BODY_TEX.earth);
  useEffect(() => {
    preparePlanetMap(map);
  }, [map]);
  return (
    <group>
      <mesh
        scale={scale}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          map={map}
          roughness={0.62}
          metalness={0.08}
          emissive={selected || beacon ? '#1a4a7a' : '#000000'}
          emissiveIntensity={selected ? 0.28 : beacon ? 0.5 : 0}
        />
      </mesh>
      <AtmosphereShell
        scale={scale * 1.055}
        color="#6eb8ff"
        coef={0.58}
        power={3.2}
        intensity={selected || beacon ? 0.85 : 0.62}
      />
    </group>
  );
}

function DwarfSurface({
  body,
  scale,
  selected,
  onSelect,
}: {
  body: SolarBody;
  scale: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const map = useMemo(() => getDwarfTexture(body.id, body.color), [body.id, body.color]);
  return (
    <mesh
      scale={scale}
      geometry={bodyGeometry(body)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial
        map={map}
        roughness={0.86}
        metalness={0.04}
        emissive={selected ? body.color : '#000000'}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </mesh>
  );
}

function StandardSurface({
  body,
  scale,
  selected,
  onSelect,
}: {
  body: SolarBody;
  scale: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const mat = materialPropsFor(body, selected);
  return (
    <mesh
      scale={scale}
      geometry={bodyGeometry(body)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial
        color={mat.color}
        emissive={mat.emissive}
        emissiveIntensity={mat.emissiveIntensity}
        roughness={mat.roughness}
        metalness={mat.metalness}
      />
    </mesh>
  );
}

/** Small octahedron craft marker — probes only (not planet spheres). */
function ProbeSurface({
  body,
  scale,
  selected,
  onSelect,
}: {
  body: SolarBody;
  scale: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <group>
      <mesh
        scale={scale * 1.35}
        geometry={GEO_PROBE}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={body.color}
          emissive={body.color}
          emissiveIntensity={selected ? 0.95 : 0.5}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>
      <mesh scale={scale * 2.6} geometry={GEO_HIT}>
        <meshBasicMaterial
          color={body.color}
          transparent
          opacity={selected ? 0.3 : 0.14}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function TexturedPlanetRings({
  cfg,
  size,
  selected,
}: {
  cfg: PlanetRingConfig;
  size: number;
  selected: boolean;
}) {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSaturnRingTexture()
      .then((tex) => {
        if (!cancelled) setMap(tex);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!map) return null;

  return (
    <mesh
      scale={size}
      rotation={[Math.PI / 2 - cfg.obliquity, 0, 0]}
      geometry={ringGeometryFor(cfg)}
      renderOrder={2}
    >
      <meshBasicMaterial
        map={map}
        transparent
        opacity={selected ? Math.min(1, cfg.opacity + 0.04) : cfg.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        alphaTest={0.06}
      />
    </mesh>
  );
}

function FaintPlanetRings({
  cfg,
  size,
  selected,
}: {
  cfg: PlanetRingConfig;
  size: number;
  selected: boolean;
}) {
  const map = useMemo(() => getFaintRingTexture(), []);
  const opacity = selected ? Math.min(0.45, cfg.opacity * 1.8) : cfg.opacity;
  return (
    <mesh
      scale={size}
      rotation={[Math.PI / 2 - cfg.obliquity, 0, 0]}
      geometry={ringGeometryFor(cfg)}
      renderOrder={1}
    >
      <meshBasicMaterial
        map={map}
        color={cfg.color ?? '#cccccc'}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        alphaTest={0.02}
      />
    </mesh>
  );
}

function PlanetRings({
  cfg,
  size,
  selected,
}: {
  cfg: PlanetRingConfig;
  size: number;
  selected: boolean;
}) {
  if (cfg.textured) {
    return <TexturedPlanetRings cfg={cfg} size={size} selected={selected} />;
  }
  return <FaintPlanetRings cfg={cfg} size={size} selected={selected} />;
}

function BodySurface({
  body,
  scale,
  selected,
  earthBeacon,
  onSelect,
}: {
  body: SolarBody;
  scale: number;
  selected: boolean;
  earthBeacon: boolean;
  onSelect: () => void;
}) {
  if (body.id === 'sun') {
    return <SunSurface scale={scale} selected={selected} onSelect={onSelect} />;
  }
  if (body.id === 'earth') {
    return (
      <EarthSurface
        scale={scale}
        geometry={GEO_LARGE}
        selected={selected}
        beacon={earthBeacon}
        onSelect={onSelect}
      />
    );
  }
  const url = BODY_TEX[body.id];
  if (url) {
    return (
      <TexturedSurface
        url={url}
        bodyId={body.id}
        scale={scale}
        geometry={bodyGeometry(body)}
        selected={selected}
        onSelect={onSelect}
      />
    );
  }
  if (body.kind === 'probe') {
    return <ProbeSurface body={body} scale={scale} selected={selected} onSelect={onSelect} />;
  }
  if (body.kind === 'dwarf') {
    return <DwarfSurface body={body} scale={scale} selected={selected} onSelect={onSelect} />;
  }
  return <StandardSurface body={body} scale={scale} selected={selected} onSelect={onSelect} />;
}

function MoonMesh({
  moon,
  selected,
  onSelect,
  positionsRef,
  timeCtxRef,
}: {
  moon: MoonBody;
  selected: boolean;
  onSelect: (id: string) => void;
  positionsRef: MutableRefObject<Map<string, THREE.Vector3>>;
  timeCtxRef: MutableRefObject<TimeContext>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const scale = moon.size * (selected ? 1.35 : 1);
  const hitScale = Math.max(moon.size * 5, 0.08);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const ctx = timeCtxRef.current;
    writeMoonOffset(moon, daysForMoons(ctx), scratch);
    g.position.copy(scratch);

    let stored = positionsRef.current.get(moon.id);
    if (!stored) {
      stored = new THREE.Vector3();
      positionsRef.current.set(moon.id, stored);
    }
    // World position = parent world + local (parent group already placed).
    g.getWorldPosition(stored);
  });

  const select = () => onSelect(moon.id);
  const texUrl = moon.textured ? BODY_TEX.luna : undefined;
  const procedural = useMemo(
    () => (texUrl ? null : getMoonTexture(moon.id, moon.color)),
    [moon.id, moon.color, texUrl],
  );

  return (
    <group ref={groupRef}>
      <mesh
        scale={hitScale}
        geometry={GEO_HIT}
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Suspense fallback={null}>
        {texUrl ? (
          <TexturedSurface
            url={texUrl}
            bodyId="luna"
            scale={scale}
            geometry={GEO_TINY}
            selected={selected}
            onSelect={select}
          />
        ) : (
          <mesh
            scale={scale}
            geometry={GEO_TINY}
            onClick={(e) => {
              e.stopPropagation();
              select();
            }}
          >
            <meshStandardMaterial
              map={procedural ?? undefined}
              color={procedural ? '#ffffff' : moon.color}
              roughness={0.88}
              metalness={0.04}
              emissive={selected ? moon.color : '#000000'}
              emissiveIntensity={selected ? 0.25 : 0}
            />
          </mesh>
        )}
      </Suspense>
    </group>
  );
}

function BodyMesh({
  body,
  selected,
  earthBeacon,
  onSelect,
  positionsRef,
  timeCtxRef,
  selectedId,
}: {
  body: SolarBody;
  selected: boolean;
  earthBeacon: boolean;
  onSelect: (id: string) => void;
  positionsRef: MutableRefObject<Map<string, THREE.Vector3>>;
  timeCtxRef: MutableRefObject<TimeContext>;
  selectedId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const beaconBoost = body.id === 'earth' && earthBeacon ? 1.18 : 1;
  const scale = body.size * (selected ? 1.22 : 1) * beaconBoost;
  const hitScale =
    body.id === 'earth'
      ? Math.max(body.size * 6.5, 0.55)
      : body.kind === 'probe'
        ? Math.max(body.size * 8, 0.55)
        : Math.max(body.size * 4.5, 0.35);
  const labeled = showLabel(body, selected);
  const isEarth = body.id === 'earth';
  const childMoons = useMemo(
    () => SOLAR_MOONS.filter((m) => m.parentId === body.id),
    [body.id],
  );

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const ctx = timeCtxRef.current;

    if (body.id === 'sun') {
      g.position.set(0, 0, 0);
    } else if (body.outbound) {
      const t = (Date.now() - ctx.epochMs) / 1000;
      writeOutboundPosition(
        scratch,
        Math.max(0, t),
        body.radius,
        body.speed,
        0,
        OUTBOUND_DRIFT,
        body.outboundDir,
      );
      g.position.copy(scratch);
    } else if (ctx.mode === 'simulate' && ctx.nbody?.writeScenePosition(body.id, scratch)) {
      g.position.copy(scratch);
    } else if (writeEphemerisScenePosition(body.id, dateForContext(ctx), scratch)) {
      g.position.copy(scratch);
    } else {
      g.position.set(body.radius, 0, 0);
    }

    let stored = positionsRef.current.get(body.id);
    if (!stored) {
      stored = new THREE.Vector3();
      positionsRef.current.set(body.id, stored);
    }
    stored.copy(g.position);
    // No axial spin — freeze globes at live / sim orientation.
  });

  const select = () => onSelect(body.id);

  return (
    <group ref={groupRef}>
      {body.kind === 'star' ? (
        <>
          <pointLight intensity={4.4} distance={75} decay={2} color="#ffcc88" />
          <pointLight intensity={1.55} distance={30} decay={2} color="#fff4d6" />
        </>
      ) : null}
      {body.kind === 'probe' && body.outbound ? (
        <mesh scale={scale * 2.4} geometry={GEO_HIT}>
          <meshBasicMaterial
            color={body.color}
            transparent
            opacity={selected ? 0.35 : 0.18}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <mesh
        scale={hitScale}
        geometry={GEO_HIT}
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {isEarth && earthBeacon ? (
        <mesh scale={scale * 1.55} geometry={GEO_HIT}>
          <meshBasicMaterial
            color="#5eb0ff"
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <Suspense
        fallback={
          <StandardSurface body={body} scale={scale} selected={selected} onSelect={select} />
        }
      >
        <BodySurface
          body={body}
          scale={scale}
          selected={selected}
          earthBeacon={earthBeacon}
          onSelect={select}
        />
      </Suspense>
      {body.ring ? (
        <PlanetRings cfg={body.ring} size={body.size} selected={selected} />
      ) : null}
      {childMoons.map((moon) => (
        <MoonMesh
          key={moon.id}
          moon={moon}
          selected={selectedId === moon.id}
          onSelect={onSelect}
          positionsRef={positionsRef}
          timeCtxRef={timeCtxRef}
        />
      ))}
      {labeled ? (
        <Html
          position={[0, body.size * 1.85 + 0.16, 0]}
          center
          distanceFactor={10}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              select();
            }}
            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] transition ${
              selected
                ? body.kind === 'probe'
                  ? 'bg-cyan-400/20 text-cyan-50'
                  : 'bg-amber-400/15 text-amber-100'
                : isEarth && earthBeacon
                  ? 'bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/50'
                  : isEarth
                    ? 'bg-sky-950/60 text-sky-100 hover:text-white'
                    : body.kind === 'probe'
                      ? 'bg-cyan-950/55 text-cyan-100 hover:text-white'
                      : 'bg-zinc-950/50 text-zinc-100 hover:text-white'
            }`}
          >
            {body.name}
          </button>
        </Html>
      ) : null}
    </group>
  );
}

/** Fixed particle cloud; rigid slow spin — no per-asteroid helical math. */
function AsteroidBelt() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(BELT_COUNT * 3);
    for (let i = 0; i < BELT_COUNT; i++) {
      const r = BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER);
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.1;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * BELT_SPIN;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a8a29e" sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

/**
 * Re-frames on Sol enter and smoothly flies OrbitControls toward the selected body.
 * After settle: rigid relative offset follow.
 */
function SolFocusControls({
  selectedId,
  positionsRef,
  viewReset,
  timeCtxRef,
}: {
  selectedId: string | null;
  positionsRef: MutableRefObject<Map<string, THREE.Vector3>>;
  viewReset: number;
  timeCtxRef: MutableRefObject<TimeContext>;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const smoothedTarget = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const resolveScratch = useRef(new THREE.Vector3());
  const offsetDir = useRef(new THREE.Vector3(0.15, 0.42, 0.9).normalize());
  const followOffset = useRef(new THREE.Vector3().copy(SOL_CAM_POS).sub(SOL_CAM_TARGET));
  const userControlling = useRef(false);
  const flyActive = useRef(true);
  const lastSelected = useRef<string | null>(null);
  const lastReset = useRef(0);

  const captureOffset = () => {
    followOffset.current.copy(camera.position).sub(smoothedTarget.current);
  };

  const lookupFocusBody = (id: string | null): SolarBody | MoonBody | null => {
    if (!id) return null;
    return SOLAR_BODIES.find((b) => b.id === id) ?? findMoon(id) ?? null;
  };

  useEffect(() => {
    camera.position.copy(SOL_CAM_POS);
    camera.lookAt(SOL_CAM_TARGET);
    smoothedTarget.current.copy(SOL_CAM_TARGET);
    desiredCam.current.copy(SOL_CAM_POS);
    offsetDir.current.set(0.15, 0.42, 0.9).normalize();
    followOffset.current.copy(SOL_CAM_POS).sub(SOL_CAM_TARGET);
    flyActive.current = true;
    const c = controlsRef.current;
    if (c) {
      c.enabled = false;
      c.target.copy(SOL_CAM_TARGET);
      c.update();
    }
  }, [camera]);

  useEffect(() => {
    if (viewReset === 0 || viewReset === lastReset.current) return;
    lastReset.current = viewReset;
    flyActive.current = true;
    userControlling.current = false;
    desiredCam.current.copy(SOL_CAM_POS);
    smoothedTarget.current.copy(SOL_CAM_TARGET);
    offsetDir.current.set(0.15, 0.42, 0.9).normalize();
    followOffset.current.copy(SOL_CAM_POS).sub(SOL_CAM_TARGET);
    const c = controlsRef.current;
    if (c) {
      c.enabled = false;
      c.target.copy(SOL_CAM_TARGET);
    }
  }, [viewReset, selectedId]);

  useEffect(() => {
    if (selectedId === lastSelected.current) return;
    lastSelected.current = selectedId;
    flyActive.current = true;
    userControlling.current = false;

    const body = lookupFocusBody(selectedId);
    const pos =
      selectedId != null
        ? resolveBodyPosition(selectedId, positionsRef, timeCtxRef.current, resolveScratch.current)
        : null;

    if (body && pos) {
      const dist = focusDistanceFor(body);
      const fromCam = camera.position.clone().sub(smoothedTarget.current);
      if (fromCam.lengthSq() > 0.01) {
        offsetDir.current.copy(fromCam).normalize();
      }
      desiredCam.current.copy(pos).addScaledVector(offsetDir.current, dist);
      smoothedTarget.current.lerp(pos, 0.35);
    } else if (!selectedId || selectedId === 'sun') {
      desiredCam.current.copy(SOL_CAM_POS);
      smoothedTarget.current.copy(SOL_CAM_TARGET);
    }

    const c = controlsRef.current;
    if (c) c.enabled = false;
  }, [selectedId, camera, positionsRef, timeCtxRef]);

  useFrame(() => {
    const c = controlsRef.current;
    if (!c) return;

    const body = lookupFocusBody(selectedId);
    const pos =
      selectedId != null
        ? resolveBodyPosition(selectedId, positionsRef, timeCtxRef.current, resolveScratch.current)
        : null;
    const goal = pos ?? SOL_CAM_TARGET;
    const followingPlanet = !!(selectedId && selectedId !== 'sun' && pos);

    smoothedTarget.current.lerp(goal, flyActive.current ? 0.14 : 0.22);
    c.target.copy(smoothedTarget.current);

    if (flyActive.current && !userControlling.current) {
      c.enabled = false;
      if (body && pos) {
        const dist = focusDistanceFor(body);
        desiredCam.current.copy(pos).addScaledVector(offsetDir.current, dist);
        camera.position.lerp(desiredCam.current, 0.08);
        if (camera.position.distanceTo(desiredCam.current) < 0.12) {
          flyActive.current = false;
          captureOffset();
          c.enabled = true;
        }
      } else if (!selectedId || selectedId === 'sun') {
        camera.position.lerp(SOL_CAM_POS, 0.08);
        if (camera.position.distanceTo(SOL_CAM_POS) < 0.12) {
          flyActive.current = false;
          captureOffset();
          c.enabled = true;
        }
      }
      camera.lookAt(smoothedTarget.current);
    } else if (userControlling.current) {
      c.enabled = true;
      c.update();
      captureOffset();
    } else if (followingPlanet) {
      c.enabled = true;
      camera.position.copy(smoothedTarget.current).add(followOffset.current);
      camera.lookAt(smoothedTarget.current);
      c.object.position.copy(camera.position);
      c.target.copy(smoothedTarget.current);
    } else {
      c.enabled = true;
      c.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.1}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI - 0.05}
      minDistance={1.4}
      maxDistance={55}
      rotateSpeed={0.4}
      zoomSpeed={0.7}
      onStart={() => {
        userControlling.current = true;
        flyActive.current = false;
      }}
      onEnd={() => {
        captureOffset();
        window.setTimeout(() => {
          userControlling.current = false;
        }, 120);
      }}
    />
  );
}

export function SolSystemScene({
  selectedId,
  onSelect,
  viewReset = 0,
  timeMode = 'live',
  simYears = 0,
  epochMs,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  viewReset?: number;
  timeMode?: SolTimeMode;
  /** Years ahead of epoch while simulating (0…10). */
  simYears?: number;
  /** Epoch ms when sim mode was entered; defaults to mount time. */
  epochMs?: number;
}) {
  const positionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const [earthBeacon, setEarthBeacon] = useState(true);
  const nbodyRef = useRef<NBodySim | null>(null);
  const mountEpoch = useMemo(() => epochMs ?? Date.now(), [epochMs]);
  const timeCtxRef = useRef<TimeContext>({
    mode: timeMode,
    epochMs: mountEpoch,
    simYears,
    nbody: null,
  });
  const lastSimEpoch = useRef(mountEpoch);
  const lastMode = useRef(timeMode);

  // Sync lightweight refs every render (no physics here).
  timeCtxRef.current.mode = timeMode;
  timeCtxRef.current.epochMs = mountEpoch;
  timeCtxRef.current.simYears = simYears;

  // Reset n-body when entering simulate or epoch changes.
  useEffect(() => {
    if (timeMode === 'simulate') {
      if (!nbodyRef.current) nbodyRef.current = new NBodySim();
      if (lastMode.current !== 'simulate' || lastSimEpoch.current !== mountEpoch) {
        nbodyRef.current.resetFromEpoch(new Date(mountEpoch));
      }
      timeCtxRef.current.nbody = nbodyRef.current;
    } else {
      timeCtxRef.current.nbody = null;
    }
    lastMode.current = timeMode;
    lastSimEpoch.current = mountEpoch;
  }, [timeMode, mountEpoch]);

  // Integrate toward scrubber target each frame (forward steps / rewind on scrub-back).
  useFrame(() => {
    const ctx = timeCtxRef.current;
    if (ctx.mode !== 'simulate') return;
    if (!nbodyRef.current) nbodyRef.current = new NBodySim();
    nbodyRef.current.advanceToYears(ctx.simYears, new Date(ctx.epochMs));
    ctx.nbody = nbodyRef.current;
  });

  useEffect(() => {
    for (const url of PRELOAD_TEX_URLS) useTexture.preload(url);
    const t = window.setTimeout(() => setEarthBeacon(false), 4800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <color attach="background" args={['#030308']} />
      <ambientLight intensity={0.34} />
      <hemisphereLight args={['#243044', '#020617', 0.48]} />
      <Stars radius={140} depth={60} count={2800} factor={2.4} saturation={0} fade speed={0.06} />

      <AsteroidBelt />

      {SOLAR_BODIES.map((body) => {
        // Planets + dwarfs only — skip star, asteroids, and probes (probes use ProbeOrbitPath).
        const showRing = body.kind === 'planet' || body.kind === 'dwarf';
        return (
          <group key={body.id}>
            {showRing ? <OrbitRing body={body} selected={selectedId === body.id} /> : null}
            {body.kind === 'probe' ? (
              <ProbeOrbitPath body={body} selected={selectedId === body.id} />
            ) : null}
            <BodyMesh
              body={body}
              selected={selectedId === body.id}
              earthBeacon={earthBeacon}
              onSelect={onSelect}
              positionsRef={positionsRef}
              timeCtxRef={timeCtxRef}
              selectedId={selectedId}
            />
          </group>
        );
      })}

      <SolFocusControls
        selectedId={selectedId}
        positionsRef={positionsRef}
        viewReset={viewReset}
        timeCtxRef={timeCtxRef}
      />
    </>
  );
}
