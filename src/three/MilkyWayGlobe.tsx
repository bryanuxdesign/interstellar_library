import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  LinearMipmapLinearFilter,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
} from 'three';

/** Face-on barred spiral reference (user-provided archive plate). */
export const MILKY_WAY_TEX_URL = '/images/galaxy/milky-way.jpg';

/**
 * Sol from the labeled face-on plate (yellow "Sun" arrow tip → Orion Spur).
 * Measured on public/images/galaxy/milky-way.jpg (squared/cleaned user reference):
 *   tip ≈ (523, 869) in 1024² → rNorm ≈ 0.70, θ ≈ -1.54 (~6:00 / slightly past).
 *
 * Plate UV convention (buildWarpedDiskGeometry):
 *   u = 0.5 + 0.5·rNorm·cos(θ),  v = 0.5 + 0.5·rNorm·sin(θ)
 *   θ=0 → +X / image right; θ=-π/2 → image bottom (with TextureLoader flipY).
 * Bar on this plate runs ~10:30→4:30; Sol sits below center between major arms.
 */
export const SOL_ORION_FRAC = 0.7;
export const SOL_ORION_ANGLE = -1.54; // radians — labeled Sun tip on reference plate

/** Relative warp amplitudes (× disk radius). */
const WARP_S = 0.12;
const WARP_SPIRAL = 0.085;
const WARP_RIPPLE = 0.04;

/** Soft haze disk scale vs textured disk (gradient only — not a second MW plate). */
const HAZE_SCALE = 1.12;

/** Vertical displacement of the midplane at (rNorm∈[0,1], θ). */
export function galacticWarpZ(rNorm: number, theta: number, radius: number): number {
  const rn = Math.min(Math.max(rNorm, 0), 1);
  const sWarp = Math.pow(rn, 2.15) * Math.sin(theta + 0.55) * WARP_S;
  const spiral = Math.sin(2 * theta - 5.8 * rn) * Math.pow(rn, 1.05) * WARP_SPIRAL;
  const ripple = Math.sin(4 * theta - 9.2 * rn + 1.1) * rn * WARP_RIPPLE;
  return (sWarp + spiral + ripple) * radius;
}

/** Local position on the warped galactic disk (XY plane + warped Z). */
export function solDiskLocal(radius: number, zLift = 0.02): [number, number, number] {
  const r = radius * SOL_ORION_FRAC;
  const x = Math.cos(SOL_ORION_ANGLE) * r;
  const y = Math.sin(SOL_ORION_ANGLE) * r;
  const z = galacticWarpZ(SOL_ORION_FRAC, SOL_ORION_ANGLE, radius) + zLift;
  return [x, y, z];
}

function buildWarpedDiskGeometry(
  radius: number,
  radialSegs: number,
  thetaSegs: number,
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const radial = Math.max(16, radialSegs);
  const theta = Math.max(48, thetaSegs);

  for (let ri = 0; ri <= radial; ri++) {
    const rNorm = ri / radial;
    const r = rNorm * radius;
    for (let ti = 0; ti <= theta; ti++) {
      const tNorm = ti / theta;
      const ang = tNorm * Math.PI * 2;
      const z = galacticWarpZ(rNorm, ang, radius);
      positions.push(Math.cos(ang) * r, Math.sin(ang) * r, z);
      uvs.push(0.5 + 0.5 * rNorm * Math.cos(ang), 0.5 + 0.5 * rNorm * Math.sin(ang));
    }
  }

  const stride = theta + 1;
  for (let ri = 0; ri < radial; ri++) {
    for (let ti = 0; ti < theta; ti++) {
      const a = ri * stride + ti;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const DISK_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** Archive plate with soft rim, luminance alpha, core grade, mild edge-on lift. */
const DISK_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uCoreBoost;
  uniform float uEdgeStart;
  uniform float uContrast;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec4 tex = texture2D(map, vUv);
    float rNorm = length(vUv - vec2(0.5)) * 2.0;

    // Soft circular falloff — kill hard disk rim
    float edge = 1.0 - smoothstep(uEdgeStart, 1.0, rNorm);

    // Luminance-driven alpha so dark inter-arm space opens up
    float lum = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
    float body = smoothstep(0.02, 0.22, lum) * mix(0.35, 1.0, smoothstep(0.08, 0.55, lum));

    // Core lift + gentle midtone contrast
    float core = 1.0 + uCoreBoost * exp(-rNorm * rNorm * 5.2);
    vec3 graded = (tex.rgb - 0.5) * uContrast + 0.5;
    graded *= core;
    // Warm the bulge slightly; cool the outer arms
    graded *= mix(vec3(1.06, 0.98, 0.9), vec3(0.88, 0.92, 1.08), smoothstep(0.25, 0.85, rNorm));

    // Edge-on: keep the sheet readable without a second textured copy
    float ndv = abs(dot(normalize(vNormal), normalize(vView)));
    float edgeOn = mix(1.4, 1.0, smoothstep(0.02, 0.42, ndv));

    float alpha = uOpacity * edge * body * edgeOn;
    gl_FragColor = vec4(graded, alpha);
  }
`;

/** Soft radial dust veil — gradient only, no MW texture. */
const HAZE_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float rNorm = length(vUv - vec2(0.5)) * 2.0;
    float veil = exp(-rNorm * rNorm * 2.4);
    float rim = exp(-pow(max(rNorm - 0.55, 0.0) * 2.8, 2.0)) * 0.45;
    float a = (veil * 0.55 + rim * 0.35) * uOpacity;

    vec3 warm = vec3(1.0, 0.86, 0.62);
    vec3 cool = vec3(0.42, 0.52, 0.82);
    vec3 col = mix(warm, cool, smoothstep(0.12, 0.78, rNorm));

    float ndv = abs(dot(normalize(vNormal), normalize(vView)));
    float edgeOn = mix(1.55, 1.0, smoothstep(0.0, 0.5, ndv));
    a *= edgeOn;

    gl_FragColor = vec4(col, a);
  }
`;

let milkyWayPreloaded = false;

export function preloadMilkyWayModel() {
  if (milkyWayPreloaded) return;
  milkyWayPreloaded = true;
  useTexture.preload(MILKY_WAY_TEX_URL);
}

interface MilkyWayGlobeProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
  /** Target radius in scene units (disk half-width). */
  radius?: number;
  /** @deprecated Ignored — single warped sheet. */
  thickness?: number;
  /** Optional Sol / children locked to the rotating disk. */
  children?: ReactNode;
}

/**
 * Single warped galactic disk from the archive reference plate,
 * plus a soft gradient haze (not a second MW texture copy).
 */
export function MilkyWayGlobe({
  autoRotate = true,
  rotationSpeed = 0.04,
  radius = 6.5,
  children,
}: MilkyWayGlobeProps) {
  const ref = useRef<Group>(null);
  const map = useTexture(MILKY_WAY_TEX_URL);

  useEffect(() => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 16;
    map.generateMipmaps = true;
    map.minFilter = LinearMipmapLinearFilter;
    map.magFilter = LinearFilter;
    map.needsUpdate = true;
  }, [map]);

  const geo = useMemo(() => buildWarpedDiskGeometry(radius, 48, 120), [radius]);
  const hazeGeo = useMemo(
    () => buildWarpedDiskGeometry(radius * HAZE_SCALE, 32, 80),
    [radius],
  );

  const diskMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          map: { value: map },
          uOpacity: { value: 0.94 },
          uCoreBoost: { value: 0.55 },
          uEdgeStart: { value: 0.7 },
          uContrast: { value: 1.18 },
        },
        vertexShader: DISK_VERT,
        fragmentShader: DISK_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [map],
  );

  const hazeMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0.2 },
        },
        vertexShader: DISK_VERT,
        fragmentShader: HAZE_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      hazeGeo.dispose();
      diskMat.dispose();
      hazeMat.dispose();
    };
  }, [geo, hazeGeo, diskMat, hazeMat]);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group ref={ref}>
      {/* Soft dust veil — radial gradient only */}
      <mesh geometry={hazeGeo} material={hazeMat} renderOrder={0} />
      {/* Single archive-plate disk */}
      <mesh geometry={geo} material={diskMat} renderOrder={1} />
      {children}
    </group>
  );
}

useTexture.preload(MILKY_WAY_TEX_URL);
