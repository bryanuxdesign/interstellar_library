import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  Group,
  Mesh,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { GLOBE_RADIUS } from './constants';
import { useAppStore } from '@/store/useAppStore';
import { earthSunDirectionBodyFrame } from '@/solar/sunLighting';

const DAY_URL = '/images/earth/day.jpg';
const NIGHT_URL = '/images/earth/night.jpg';
const CLOUDS_URL = '/images/earth/clouds.jpg?v=4k2';
const SPEC_URL = '/images/earth/specular.jpg';

const GEO = new SphereGeometry(1, 128, 96);
const CLOUD_GEO = new SphereGeometry(1, 128, 96);
const AURORA_GEO = new SphereGeometry(1, 128, 96);
/** Fallback until the first realtime tick. */
const SUN_DIR = new Vector3(5, 3, 5).normalize();
const _liveSun = new Vector3();
const _yAxis = new Vector3(0, 1, 0);

const DAY_NIGHT_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const DAY_NIGHT_FRAG = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specularMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float nightBoost;
  uniform float cloudShadow;
  uniform float cloudSpin;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(sunDirection);
    float ndotl = dot(N, L);
    float day = smoothstep(-0.05, 0.35, ndotl);
    float twilight = smoothstep(-0.15, 0.2, ndotl) * (1.0 - smoothstep(0.15, 0.55, ndotl));

    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    vec3 nightCol = texture2D(nightMap, vUv).rgb * nightBoost;

    // Soft cloud shadows on the surface (H6)
    float spin = cloudSpin / 6.2831853;
    vec2 cloudUv = vec2(fract(vUv.x + spin), vUv.y);
    float cover = texture2D(cloudMap, cloudUv).r;
    cover = smoothstep(0.08, 0.7, cover);
    dayCol *= mix(1.0, 0.62, cover * cloudShadow * day);

    vec3 color = mix(nightCol, dayCol, day);
    color = mix(color, color * vec3(1.18, 0.82, 0.62), twilight * 0.6);

    vec3 V = normalize(cameraPosition - vPosW);
    vec3 R = reflect(-L, N);
    float specMask = texture2D(specularMap, vUv).r;
    float spec = pow(max(dot(V, R), 0.0), 28.0) * specMask * day * (1.0 - cover * 0.7);
    color += vec3(0.85, 0.92, 1.0) * spec * 0.65;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float opacity;
  uniform float uvShift;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vec2 uv = vec2(fract(vUv.x + uvShift), vUv.y);
    vec4 tex = texture2D(cloudMap, uv);
    float cover = max(tex.r, max(tex.g, tex.b));
    cover = smoothstep(0.03, 0.72, cover);
    cover = pow(cover, 0.8);
    float day = smoothstep(-0.25, 0.5, dot(normalize(vNormalW), normalize(sunDirection)));
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 2.2);
    float a = cover * opacity * mix(0.5, 1.0, day);
    a *= 1.0 - fres * 0.15; // thin at grazing so limb stays blue
    if (a < 0.012) discard;
    vec3 lit = mix(vec3(0.42, 0.48, 0.6), vec3(1.0, 1.0, 1.0), day);
    float rim = pow(max(dot(normalize(vNormalW), normalize(sunDirection)), 0.0), 3.5);
    lit = mix(lit, vec3(1.0, 0.97, 0.92), rim * cover * 0.45);
    lit += vec3(0.55, 0.7, 1.0) * fres * cover * 0.12;
    gl_FragColor = vec4(lit, a);
  }
`;

const AURORA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float heightAmp;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vView;
  varying float vLift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec3 n = normalize(position);
    float lon = atan(n.z, n.x);
    float lat = n.y;
    // Curtain height displacement along radial (H7)
    float lift = noise(vec2(lon * 6.0 + uTime * 0.35, lat * 10.0)) * heightAmp;
    lift += noise(vec2(lon * 14.0 - uTime * 0.55, lat * 18.0)) * heightAmp * 0.45;
    vec3 displaced = n * (1.0 + lift);
    vLift = lift;
    vObj = n;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * n);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 sunDirection;
  uniform float intensity;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vView;
  varying float vLift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.15 + 13.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 n = normalize(vObj);
    vec3 northPole = normalize(vec3(0.08, 0.98, -0.12));
    vec3 southPole = normalize(vec3(-0.06, -0.98, 0.1));
    float nLat = abs(dot(n, northPole));
    float sLat = abs(dot(n, southPole));
    float polar = max(
      smoothstep(0.68, 0.84, nLat) * (1.0 - smoothstep(0.945, 0.998, nLat)),
      smoothstep(0.68, 0.84, sLat) * (1.0 - smoothstep(0.945, 0.998, sLat))
    );
    if (polar < 0.01) discard;

    float night = 1.0 - smoothstep(-0.05, 0.55, dot(normalize(vNormalW), normalize(sunDirection)));
    // Keep polar curtains readable on the day-side disk (equatorial archive camera)
    float visible = mix(0.58, 1.0, night);

    float lon = atan(n.z, n.x);
    float latBand = max(nLat, sLat);
    float sheets = fbm(vec2(lon * 2.4, latBand * 18.0 - uTime * 0.5));
    float ribbons = fbm(vec2(lon * 12.0 + uTime * 0.85, latBand * 28.0 + vLift * 40.0));
    float rays = abs(sin(lon * 26.0 + uTime * 2.6 + sheets * 6.0));
    float curtain = smoothstep(0.22, 0.85, sheets) * (0.35 + 0.65 * ribbons);
    curtain *= 0.5 + 0.5 * rays;
    curtain *= 0.7 + 0.3 * sin(uTime * 1.6 + lon * 5.0);

    float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 1.05);
    float heightGlow = 0.75 + abs(vLift) * 18.0;
    float glow = curtain * polar * visible * (0.4 + 0.95 * fresnel) * heightGlow;

    vec3 green = vec3(0.1, 1.0, 0.38);
    vec3 magenta = vec3(0.95, 0.2, 1.0);
    vec3 cyan = vec3(0.12, 0.9, 1.0);
    vec3 col = mix(green, cyan, ribbons);
    col = mix(col, magenta, smoothstep(0.75, 0.95, latBand) * 0.8);
    col *= 1.2 + 0.7 * rays;

    float alpha = glow * intensity;
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

const LIMB_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const LIMB_FRAG = /* glsl */ `
  uniform vec3 sunDirection;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
    float sunRim = pow(max(dot(N, normalize(sunDirection)), 0.0), 1.35);
    float limb = fresnel * (0.25 + 0.75 * sunRim);
    vec3 col = mix(vec3(0.4, 0.7, 1.0), vec3(1.0, 0.55, 0.25), pow(1.0 - sunRim, 2.2) * 0.55);
    gl_FragColor = vec4(col, limb * intensity);
  }
`;

interface EarthGlobeProps {
  radius?: number;
  rotationOffset?: number;
}

/**
 * Archive Earth: day/night city lights + Atmosphere package
 * (cloud decks with surface shadows, displaced aurora curtains, Rayleigh limb).
 */
export function EarthGlobe({
  radius = GLOBE_RADIUS,
  rotationOffset = 0,
}: EarthGlobeProps) {
  const atmosphere = useAppStore((s) => s.earthAtmosphereEnabled);
  const groupRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);
  const cloudsHiRef = useRef<Mesh>(null);

  const [dayMap, nightMap, cloudMap, specMap] = useTexture([
    DAY_URL,
    NIGHT_URL,
    CLOUDS_URL,
    SPEC_URL,
  ]);

  useEffect(() => {
    dayMap.colorSpace = SRGBColorSpace;
    nightMap.colorSpace = SRGBColorSpace;
    cloudMap.colorSpace = SRGBColorSpace;
    specMap.colorSpace = SRGBColorSpace;
    for (const map of [dayMap, nightMap, cloudMap, specMap]) {
      map.anisotropy = 16;
      map.needsUpdate = true;
    }
    // #region agent log
    const img = cloudMap.image as { width?: number; height?: number } | undefined;
    fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
      body: JSON.stringify({
        sessionId: '70c770',
        runId: 'atm-5',
        hypothesisId: 'H13-DAY-POLAR',
        location: 'EarthGlobe.tsx:textures',
        message: 'Atmosphere atm-5 ready (day-side polar aurora readable)',
        data: {
          atmosphereEnabled: atmosphere,
          cloudW: img?.width ?? null,
          cloudH: img?.height ?? null,
          limbIntensity: 0.42,
          limbScale: 1.055,
          daySideAuroraMix: 0.58,
          auroraOval: 'polar-tight',
          auroraIntensityLo: 2.35,
          auroraIntensityMid: 1.65,
          auroraIntensityHi: 1.1,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [dayMap, nightMap, cloudMap, specMap, atmosphere]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
      body: JSON.stringify({
        sessionId: '70c770',
        runId: 'atm-5',
        hypothesisId: 'H13-DAY-POLAR',
        location: 'EarthGlobe.tsx:atmosphere',
        message: 'Atmosphere FX mount branch atm-5',
        data: {
          atmosphereEnabled: atmosphere,
          fxMounted: atmosphere,
          features: atmosphere
            ? ['cloudShadows', 'cloudParallax', 'auroraDisplacement', 'thinRayleighLimb', 'daySidePolarAurora']
            : [],
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [atmosphere]);
  // #endregion

  const surfaceMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          dayMap: { value: dayMap },
          nightMap: { value: nightMap },
          specularMap: { value: specMap },
          cloudMap: { value: cloudMap },
          sunDirection: { value: SUN_DIR.clone() },
          nightBoost: { value: 1.35 },
          cloudShadow: { value: atmosphere ? 1.0 : 0.0 },
          cloudSpin: { value: 0 },
        },
        vertexShader: DAY_NIGHT_VERT,
        fragmentShader: DAY_NIGHT_FRAG,
      }),
    [dayMap, nightMap, specMap, cloudMap, atmosphere],
  );

  const cloudMat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          cloudMap: { value: cloudMap },
          sunDirection: { value: SUN_DIR.clone() },
          opacity: { value: 0.92 },
          uvShift: { value: 0 },
        },
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
      }),
    [cloudMap],
  );

  const cloudHiMat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          cloudMap: { value: cloudMap },
          sunDirection: { value: SUN_DIR.clone() },
          opacity: { value: 0.42 },
          uvShift: { value: 0.018 },
        },
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
      }),
    [cloudMap],
  );

  const makeAurora = (intensity: number, heightAmp: number) =>
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        sunDirection: { value: SUN_DIR.clone() },
        intensity: { value: intensity },
        heightAmp: { value: heightAmp },
      },
      vertexShader: AURORA_VERT,
      fragmentShader: AURORA_FRAG,
    });

  const auroraMat = useMemo(() => makeAurora(2.35, 0.012), []);
  const auroraMidMat = useMemo(() => makeAurora(1.65, 0.016), []);
  const auroraHiMat = useMemo(() => makeAurora(1.1, 0.02), []);

  const limbMat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: BackSide,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          sunDirection: { value: SUN_DIR.clone() },
          intensity: { value: 0.42 },
        },
        vertexShader: LIMB_VERT,
        fragmentShader: LIMB_FRAG,
      }),
    [],
  );

  useFrame((_, delta) => {
    // Realtime terminator — body frame, then match EarthGlobe Y rotationOffset
    earthSunDirectionBodyFrame(new Date(), _liveSun);
    if (rotationOffset !== 0) {
      _liveSun.applyAxisAngle(_yAxis, rotationOffset);
    }
    surfaceMat.uniforms.sunDirection.value.copy(_liveSun);
    cloudMat.uniforms.sunDirection.value.copy(_liveSun);
    cloudHiMat.uniforms.sunDirection.value.copy(_liveSun);
    auroraMat.uniforms.sunDirection.value.copy(_liveSun);
    auroraMidMat.uniforms.sunDirection.value.copy(_liveSun);
    auroraHiMat.uniforms.sunDirection.value.copy(_liveSun);
    limbMat.uniforms.sunDirection.value.copy(_liveSun);

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.014;
      surfaceMat.uniforms.cloudSpin.value = cloudsRef.current.rotation.y;
    }
    if (cloudsHiRef.current) {
      cloudsHiRef.current.rotation.y += delta * 0.0085;
    }
    surfaceMat.uniforms.cloudShadow.value = atmosphere ? 1.0 : 0.0;

    if (atmosphere) {
      auroraMat.uniforms.uTime.value += delta;
      auroraMidMat.uniforms.uTime.value += delta * 1.12;
      auroraHiMat.uniforms.uTime.value += delta * 1.28;
    }

    // #region agent log
    const t = auroraMat.uniforms.uTime.value as number;
    if (
      atmosphere &&
      t > 0 &&
      Math.floor(t * 2) !== Math.floor((t - delta) * 2) &&
      Math.floor(t) % 4 === 0
    ) {
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'atm-5',
          hypothesisId: 'H13-DAY-POLAR',
          location: 'EarthGlobe.tsx:useFrame',
          message: 'atm-5 anim tick',
          data: {
            auroraTime: +t.toFixed(2),
            cloudSpin: +surfaceMat.uniforms.cloudSpin.value.toFixed(3),
            cloudShadow: surfaceMat.uniforms.cloudShadow.value,
            heightAmp: auroraMidMat.uniforms.heightAmp.value,
            auroraIntensity: auroraMat.uniforms.intensity.value,
            limbIntensity: limbMat.uniforms.intensity.value,
            sunDir: {
              x: +_liveSun.x.toFixed(3),
              y: +_liveSun.y.toFixed(3),
              z: +_liveSun.z.toFixed(3),
            },
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  });

  return (
    <group ref={groupRef} rotation={[0, rotationOffset, 0]}>
      <mesh geometry={GEO} scale={radius} material={surfaceMat} />

      {atmosphere ? (
        <>
          <mesh ref={cloudsRef} geometry={CLOUD_GEO} scale={radius * 1.016} material={cloudMat} />
          <mesh ref={cloudsHiRef} geometry={CLOUD_GEO} scale={radius * 1.03} material={cloudHiMat} />

          <mesh geometry={AURORA_GEO} scale={radius * 1.038} material={auroraMat} />
          <mesh geometry={AURORA_GEO} scale={radius * 1.055} material={auroraMidMat} />
          <mesh geometry={AURORA_GEO} scale={radius * 1.072} material={auroraHiMat} />

          <mesh geometry={AURORA_GEO} scale={radius * 1.055} material={limbMat} />
        </>
      ) : null}
    </group>
  );
}
