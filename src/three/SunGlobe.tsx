/**
 * Sun archive globe — photosphere + museum-scale flare animation.
 *
 * Flare choreography follows the observed CSHKP / tether-cutting sequence
 * from NASA SDO/AIA (SVS) and flare literature, compressed for archive viewing:
 *   1) Preflare — filament / flux rope slowly rises
 *   2) Impulsive — conjugate ribbons flash & separate; arcade forms beneath
 *   3) CME rise — plasmoid lifts off above the arcade
 *   4) Decay — ribbons dim, arcade persists, CME expands & fades
 *
 * Visual references:
 * - https://svs.gsfc.nasa.gov/5287  (M5.9 flare AR 13664 — AIA 131/171/304)
 * - https://svs.gsfc.nasa.gov/5398  (X9.0 flare AR 13842)
 * - https://svs.gsfc.nasa.gov/5268  (double filament eruptions)
 * - NSO flare-ribbon notes: conjugate ribbons separate as reconnection climbs
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  Quaternion,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { GLOBE_RADIUS } from './constants';
import { latLngToVector3 } from './coordinateUtils';

export const SUN_TEXTURE_URL = '/images/planets/sun.jpg?v=sdo1';

const CYCLE = 10.0;
const T_PRE = 2.2;
const T_IMP = 3.6;
const T_CME = 6.8;

const Y_UP = new Vector3(0, 1, 0);
const _q = new Quaternion();
const _v = new Vector3();

const PHOTO_VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vObjN; varying vec3 vViewN; varying vec3 vViewDir;
  void main() {
    vUv = uv; vObjN = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewN = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const PHOTO_FRAG = /* glsl */ `
  uniform sampler2D uMap; uniform float uTime; uniform float uContrast;
  uniform vec3 uSpotCenters[8]; uniform float uSpotRadii[8];
  varying vec2 vUv; varying vec3 vObjN; varying vec3 vViewN; varying vec3 vViewDir;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.15+11.;a*=.5;}return v;}
  void main(){
    vec3 tex=texture2D(uMap,vUv).rgb;
    tex=clamp((tex-.5)*uContrast+.52,0.,1.25);
    tex*=.9+fbm(vUv*140.+uTime*.02)*.16;
    tex*=vec3(1.12,.98,.78);
    vec3 n=normalize(vObjN); float umbra=0.,pen=0.,plage=0.;
    for(int i=0;i<8;i++){
      vec3 c=normalize(uSpotCenters[i]); float d=length(n-c); float R=uSpotRadii[i];
      vec3 up=abs(c.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.);
      vec3 t=normalize(cross(c,up)); vec3 b=normalize(cross(c,t));
      float tx=dot(n-c,t), ty=dot(n-c,b);
      float filament=.5+.5*sin(atan(ty,tx)*14.+fbm(vec2(tx,ty)*55.)*4.);
      float irreg=.88+.2*fbm(vec2(tx,ty)*30.+float(i)*2.);
      float ru=R*.42*irreg, rp=R*irreg;
      float u=1.-smoothstep(ru*.55,ru,d);
      u=max(u,(1.-smoothstep(ru*.35,ru*.7,length(vec2(tx-R*.35,ty+R*.2))))*.9);
      float p=(1.-smoothstep(ru,rp,d))*(1.-u)*filament;
      float pl=(1.-smoothstep(rp,rp*1.45,d))*smoothstep(ru*.9,rp*.95,d);
      umbra=max(umbra,u); pen=max(pen,p); plage=max(plage,pl);
    }
    tex=mix(tex,vec3(.22,.12,.05)*(.7+.3*tex),clamp(pen*.95,0.,1.));
    tex=mix(tex,vec3(.015,.01,.008),clamp(umbra,0.,1.));
    tex+=vec3(1.2,.9,.45)*plage*.7;
    tex+=vec3(1.,.6,.2)*umbra*(1.-umbra)*1.1;
    float ndv=max(.001,abs(dot(normalize(vViewN),normalize(vViewDir))));
    tex*=.7+.3*pow(ndv,.5);
    tex+=vec3(1.,.55,.2)*pow(1.-ndv,2.5)*.15;
    gl_FragColor=vec4(tex,1.);
  }
`;

const CORONA_VERT = /* glsl */ `
  varying vec3 vNormal; varying vec3 vView;
  void main(){
    vec4 world=modelMatrix*vec4(position,1.);
    vNormal=normalize(mat3(modelMatrix)*normal);
    vView=normalize(cameraPosition-world.xyz);
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

const CORONA_FRAG = /* glsl */ `
  uniform float uTime; varying vec3 vNormal; varying vec3 vView;
  void main(){
    float fres=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.8);
    float rays=.7+.3*sin(atan(vNormal.y,vNormal.x)*18.+uTime*.5);
    vec3 col=mix(vec3(1.,.45,.08),vec3(1.,.95,.7),fres*.5)*fres*rays;
    gl_FragColor=vec4(col,fres*.16);
  }
`;

const FLARE_VERT = /* glsl */ `
  attribute float aSeed; attribute float aLife;
  varying float vLife; varying float vSeed; uniform float uSize;
  void main(){
    vLife=aLife; vSeed=aSeed;
    vec4 mv=modelViewMatrix*vec4(position,1.);
    gl_Position=projectionMatrix*mv;
    // Soft round sparks only — no jet stretch (avoids radial laser beam)
    gl_PointSize=uSize*(.35+aLife*1.4)*(220./max(1.,-mv.z));
  }
`;

const FLARE_FRAG = /* glsl */ `
  varying float vLife; varying float vSeed;
  void main(){
    vec2 uv=gl_PointCoord-.5;
    float d=length(uv)*2.; if(d>1.) discard;
    float core=exp(-d*d*5.5);
    float halo=exp(-d*2.4)*.35;
    float a=(core+halo)*vLife*.55;
    vec3 col=mix(vec3(1.,.45,.12),vec3(1.,.95,.75),core);
    gl_FragColor=vec4(col,a);
  }
`;

const CME_FRAG = /* glsl */ `
  uniform float uLife; varying vec3 vNormal; varying vec3 vView;
  void main(){
    float fres=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),1.25);
    gl_FragColor=vec4(mix(vec3(1.,.55,.15),vec3(.7,.88,1.),fres),fres*uLife*.75);
  }
`;

function buildFlareGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const lives = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random();
    lives[i] = 0;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  geo.setAttribute('aLife', new BufferAttribute(lives, 1));
  return geo;
}

/** Local +Y = radial out from photosphere. Dark AIA-304 filament along PIL (±X). */
function makeLocalFilament(radius: number, rise: number): CatmullRomCurve3 {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const ang = u * Math.PI;
    const h = Math.sin(ang) * radius * (0.18 + rise * 0.55);
    const along = (u - 0.5) * radius * 0.62;
    pts.push(new Vector3(along, radius * 1.008 + h, Math.sin(ang * 2) * radius * 0.03));
  }
  return new CatmullRomCurve3(pts);
}

/** Post-flare arcade loop spanning between conjugate ribbon feet (local ±X). */
function makeLocalArcade(
  radius: number,
  height: number,
  span: number,
  zOff = 0,
): CatmullRomCurve3 {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const along = (u - 0.5) * radius * span;
    const h = Math.sin(u * Math.PI) * radius * height;
    pts.push(new Vector3(along, radius * 1.014 + h, zOff * radius));
  }
  return new CatmullRomCurve3(pts);
}

function buildSpotField(): { centers: Vector3[]; radii: number[] } {
  const seeds = [
    { lat: 12, lng: 25 },
    { lat: 10, lng: 30 },
    { lat: 15, lng: 22 },
    { lat: -14, lng: -40 },
    { lat: -11, lng: -35 },
    { lat: -16, lng: -45 },
    { lat: 8, lng: 110 },
    { lat: -6, lng: -120 },
  ];
  return {
    centers: seeds.map((s) => latLngToVector3({ lat: s.lat, lng: s.lng }, 1)),
    radii: [0.085, 0.04, 0.035, 0.078, 0.038, 0.032, 0.055, 0.042],
  };
}

interface SunGlobeProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
  radius?: number;
}

export function SunGlobe({
  autoRotate = true,
  rotationSpeed = 0.006,
  radius = GLOBE_RADIUS,
}: SunGlobeProps) {
  const groupRef = useRef<Group>(null);
  const flareRig = useRef<Group>(null);
  const cmeRef = useRef<Mesh>(null);
  const ribbonA = useRef<Mesh>(null);
  const ribbonB = useRef<Mesh>(null);
  const filamentMat = useRef<MeshBasicMaterial>(null);
  const arcadeMats = useRef<Array<MeshBasicMaterial | null>>([]);
  const map = useTexture(SUN_TEXTURE_URL);
  const phaseLog = useRef('');
  const { camera } = useThree();

  useMemo(() => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 16;
    map.generateMipmaps = true;
    map.minFilter = LinearMipmapLinearFilter;
    map.magFilter = LinearFilter;
    map.needsUpdate = true;
  }, [map]);

  const { centers: spotCenters, radii: spotRadii } = useMemo(() => buildSpotField(), []);
  const sites = useMemo(
    () =>
      [
        { lat: 12, lng: 25 },
        { lat: -14, lng: -40 },
        { lat: 8, lng: 32 },
      ].map((s) => latLngToVector3({ lat: s.lat, lng: s.lng }, 1)),
    [],
  );

  // #region agent log
  useEffect(() => {
    const img = map.image as { width?: number; height?: number } | undefined;
    fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
      body: JSON.stringify({
        sessionId: '70c770',
        runId: 'sun-sdo-1',
        hypothesisId: 'H-SDO-SEQ',
        location: 'SunGlobe.tsx:mount',
        message: 'SDO-referenced flare sequence armed',
        data: {
          texW: img?.width ?? null,
          texH: img?.height ?? null,
          cycleSec: CYCLE,
          phases: ['preflare-filament', 'impulsive-dual-ribbons', 'arcade', 'cme-liftoff', 'decay'],
          refs: ['svs.gsfc.nasa.gov/5287', 'svs.gsfc.nasa.gov/5398', 'svs.gsfc.nasa.gov/5268'],
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [map]);
  // #endregion

  const photoMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: map },
          uTime: { value: 0 },
          uContrast: { value: 1.45 },
          uSpotCenters: { value: spotCenters },
          uSpotRadii: { value: spotRadii },
        },
        vertexShader: PHOTO_VERT,
        fragmentShader: PHOTO_FRAG,
        toneMapped: false,
      }),
    [map, spotCenters, spotRadii],
  );

  const coronaMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: CORONA_VERT,
        fragmentShader: CORONA_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
        toneMapped: false,
      }),
    [],
  );

  const flareGeo = useMemo(() => buildFlareGeometry(140), []);
  const flareMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uSize: { value: 10 } },
        vertexShader: FLARE_VERT,
        fragmentShader: FLARE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  const cmeMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uLife: { value: 0 } },
        vertexShader: CORONA_VERT,
        fragmentShader: CME_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  );

  const filamentCurve = useMemo(() => makeLocalFilament(radius, 0.45), [radius]);
  // 6–7 AIA-171-style arches spanning ribbon feet; staggered height / Z lean
  const arcadeCurves = useMemo(
    () => [
      makeLocalArcade(radius, 0.22, 0.38, -0.06),
      makeLocalArcade(radius, 0.28, 0.46, -0.03),
      makeLocalArcade(radius, 0.34, 0.52, 0.0),
      makeLocalArcade(radius, 0.4, 0.58, 0.025),
      makeLocalArcade(radius, 0.48, 0.64, 0.04),
      makeLocalArcade(radius, 0.56, 0.7, -0.02),
      makeLocalArcade(radius, 0.32, 0.42, 0.055),
    ],
    [radius],
  );

  const flareState = useRef({ t: 0, siteIdx: 0 });

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
    photoMat.uniforms.uTime.value += delta;
    coronaMat.uniforms.uTime.value += delta;

    const st = flareState.current;
    st.t += delta;
    if (st.t > CYCLE) {
      st.t = 0;
      st.siteIdx = (st.siteIdx + 1) % sites.length;
      phaseLog.current = '';
    }

    const radial = (sites[st.siteIdx] ?? sites[0]).clone().normalize();
    // Orient local +Y to site radial so all FX sit on that active region
    if (flareRig.current) {
      _q.setFromUnitVectors(Y_UP, radial);
      flareRig.current.quaternion.copy(_q);
    }

    const t = st.t;
    const pre = Math.min(1, t / T_PRE);
    const preActive = t < T_PRE ? pre : Math.max(0, 1 - (t - T_PRE) / 0.9);
    const impFlash = t < T_PRE ? 0 : Math.max(0, 1 - (t - T_PRE) / 0.5);
    const ribbonSep = t < T_PRE ? 0 : Math.min(1, (t - T_PRE) / (T_IMP - T_PRE));
    const impActive =
      t < T_PRE ? 0 : t < T_CME ? Math.min(1, (t - T_PRE) / (T_IMP - T_PRE)) : Math.max(0, 1 - (t - T_CME) / 2.2);
    const arcadeLife =
      t < T_PRE
        ? 0
        : t < T_IMP
          ? (t - T_PRE) / (T_IMP - T_PRE)
          : Math.max(0.2, 1 - (t - T_IMP) / (CYCLE - T_IMP) * 0.75);
    const cmeLife =
      t < T_IMP ? 0 : t < T_CME ? (t - T_IMP) / (T_CME - T_IMP) : Math.max(0, 1 - (t - T_CME) / (CYCLE - T_CME));
    const cmeExpand = t < T_IMP ? 1.02 : 1.02 + Math.min(0.6, (t - T_IMP) * 0.11);

    let phaseName = 'decay';
    if (t < T_PRE) phaseName = 'preflare-filament';
    else if (t < T_IMP) phaseName = 'impulsive-dual-ribbons';
    else if (t < T_CME) phaseName = 'cme-liftoff';

    const phaseChanged = phaseLog.current !== phaseName;
    // #region agent log
    if (phaseChanged) {
      phaseLog.current = phaseName;
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-1',
          hypothesisId: 'H-SDO-SEQ',
          location: 'SunGlobe.tsx:phase',
          message: 'Flare phase transition',
          data: { phase: phaseName, t: +t.toFixed(2), siteIdx: st.siteIdx, ribbonSep: +ribbonSep.toFixed(2), cmeLife: +cmeLife.toFixed(2) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion

    // Conjugate ribbons at arcade feet (±X), elongated along ±Z (across arcade plane).
    // BoxGeometry (not Plane): zero-thickness planes read as a limb laser when edge-on.
    // Hard-cap length/thickness aspect ≤ 2.2 — even a short fat box lasers when viewed along local X.
    const sep = 0.05 + ribbonSep * 0.22;
    const ribbonOp = Math.min(0.82, impFlash * 1.1 + impActive * 0.7 + arcadeLife * 0.12);
    const ribbonAcross = (0.16 + impFlash * 0.05 + impActive * 0.04) * radius; // fat in X
    const ribbonH = (0.14 + impFlash * 0.05) * radius; // fat radial — silhouette never a line
    const ribbonLenRaw = (0.26 + impFlash * 0.1 + impActive * 0.06) * radius;
    const minThick = Math.min(ribbonAcross, ribbonH);
    const ribbonLen = Math.min(ribbonLenRaw, minThick * 2.2); // aspect hard-cap
    const ribbonAspect = ribbonLen / minThick;
    const placeRibbon = (mesh: Mesh | null, sign: number) => {
      if (!mesh) return;
      mesh.position.set(sign * sep * radius, radius + ribbonH * 0.45, 0);
      // Stronger yaw + pitch so faces aren't knife-edge aligned with a limb camera
      mesh.rotation.set(sign * 0.22, sign * 0.38, 0);
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = ribbonOp;
      mesh.scale.set(ribbonAcross, ribbonH, ribbonLen);
    };
    placeRibbon(ribbonA.current, -1);
    placeRibbon(ribbonB.current, 1);

    // AIA-304 filament: cool/dark preflare → bright on erupt
    let filamentOp = 0;
    if (filamentMat.current) {
      const erupt = Math.max(0, Math.min(1, (t - T_PRE * 0.65) / 0.9));
      if (t < T_PRE * 0.85) {
        filamentMat.current.color.setRGB(0.42, 0.1, 0.12);
        filamentOp = 0.55 + preActive * 0.35;
        filamentMat.current.opacity = filamentOp;
        filamentMat.current.blending = NormalBlending; // dark structure must read
      } else {
        filamentMat.current.color.setRGB(1, 0.35 + erupt * 0.5, 0.18 + erupt * 0.45);
        filamentOp = Math.max(preActive * 0.5, erupt * (0.55 + impActive * 0.4));
        filamentMat.current.opacity = filamentOp;
        filamentMat.current.blending = AdditiveBlending;
      }
    }
    let filamentRiseY = 1;
    if (flareRig.current) {
      const fil = flareRig.current.children.find((c) => c.name === 'filament');
      if (fil) {
        // Lift via translation only — uniform Y-scale turns the tube into a radial limb spike
        filamentRiseY = 1 + pre * 0.12 + Math.min(0.22, Math.max(0, t - T_PRE) * 0.04);
        fil.scale.set(1, 1, 1);
        fil.position.set(0, (filamentRiseY - 1) * radius * 0.35, 0);
      }
    }

    // AIA-171 arcade: opacity peaks after impulsive; gold/teal glow
    let arcadeOpSample = 0;
    for (let i = 0; i < arcadeMats.current.length; i++) {
      const mat = arcadeMats.current[i];
      if (!mat) continue;
      const peak = t >= T_IMP ? Math.min(1, arcadeLife * 1.15) : arcadeLife * 0.7;
      mat.opacity = 0.08 + peak * 0.82;
      const teal = 0.22 + peak * 0.55;
      mat.color.setRGB(1, 0.55 + peak * 0.35, teal);
      if (i === 2) arcadeOpSample = mat.opacity;
    }

    let cmePosLen = 0;
    if (cmeRef.current) {
      // Soft expanding CME shell along active-region radial
      const lift = 1.08 + Math.max(0, t - T_IMP) * 0.14;
      cmeRef.current.position.copy(radial).multiplyScalar(radius * lift);
      cmeRef.current.scale.setScalar(cmeExpand * (0.22 + cmeLife * 0.35));
      cmeMat.uniforms.uLife.value = cmeLife * 0.95;
      cmePosLen = cmeRef.current.position.length();
    }

    // Soft spark spray — subordinate to ribbons/arcade (no radial jets)
    const origin = _v.copy(radial).multiplyScalar(radius * 1.02);
    const up = Math.abs(radial.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
    const tangent = new Vector3().crossVectors(radial, up).normalize();
    const bitangent = new Vector3().crossVectors(radial, tangent).normalize();
    // Cap spray: impulsive + early CME only — hard-off in decay (no residual glow)
    const sprayWindow =
      t < T_PRE || t >= T_CME
        ? 0
        : Math.min(1, (t - T_PRE) / 0.4) * Math.max(0, 1 - ((t - T_IMP) / (T_CME - T_IMP)) * 0.85);
    const sprayOn =
      t >= T_CME ? 0 : Math.min(0.42, Math.max(impActive * 0.38, sprayWindow * 0.4));
    const pos = flareGeo.getAttribute('position') as BufferAttribute;
    const seeds = flareGeo.getAttribute('aSeed') as BufferAttribute;
    const lives = flareGeo.getAttribute('aLife') as BufferAttribute;
    let maxParticleLife = 0;
    for (let i = 0; i < pos.count; i++) {
      const seed = seeds.getX(i);
      const ang = seed * Math.PI * 2;
      // Wide hemispheric scatter — no collimated jet branch
      const elev = (0.25 + seed * 0.55) * Math.PI * 0.5;
      const lifeT = ((t - T_PRE) * (0.9 + seed * 0.35) + seed * 1.6 + CYCLE) % CYCLE;
      const speed = 0.35 + seed * 0.55;
      const fade = lifeT < 0.06 ? lifeT / 0.06 : Math.max(0, 1 - (lifeT - 0.06) / (CYCLE * 0.28));
      const dist = Math.max(0, lifeT) * speed * (0.4 + sprayOn * 0.5);
      const spread = 1.15;
      const dir = radial
        .clone()
        .multiplyScalar(Math.cos(elev))
        .addScaledVector(tangent, Math.sin(elev) * Math.cos(ang) * spread)
        .addScaledVector(bitangent, Math.sin(elev) * Math.sin(ang) * spread)
        .normalize();
      const p = origin.clone().addScaledVector(dir, dist);
      pos.setXYZ(i, p.x, p.y, p.z);
      const life = t < T_PRE ? 0 : fade * sprayOn;
      lives.setX(i, life);
      if (life > maxParticleLife) maxParticleLife = life;
    }
    pos.needsUpdate = true;
    lives.needsUpdate = true;

    // #region agent log
    if (phaseChanged) {
      const sepDist = sep * 2 * radius;
      const camN = camera.position.clone().normalize();
      const worldRadial = radial.clone();
      if (groupRef.current) worldRadial.applyQuaternion(groupRef.current.quaternion);
      const faceDot = Math.abs(worldRadial.dot(camN)); // ~1 disk-center, ~0 limb
      const rA = ribbonA.current;
      const sample = {
        phase: phaseName,
        t: +t.toFixed(2),
        ribbonOp: +ribbonOp.toFixed(3),
        ribbonSepDist: +sepDist.toFixed(3),
        maxParticleLife: +maxParticleLife.toFixed(3),
        sprayOn: +sprayOn.toFixed(3),
        arcadeOp: +arcadeOpSample.toFixed(3),
        filamentOp: +filamentOp.toFixed(3),
        cmeLife: +cmeLife.toFixed(3),
        cmePosLen: +cmePosLen.toFixed(3),
      };
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-2',
          hypothesisId: 'H-BEAM',
          location: 'SunGlobe.tsx:sdo2-beam',
          message: 'Particle spray capped (no jet stretch)',
          data: { phase: sample.phase, maxParticleLife: sample.maxParticleLife, sprayOn: sample.sprayOn },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-2',
          hypothesisId: 'H-RIBBON-WEAK',
          location: 'SunGlobe.tsx:sdo2-ribbons',
          message: 'Dual ribbon opacity + separation',
          data: { phase: sample.phase, ribbonOp: sample.ribbonOp, ribbonSepDist: sample.ribbonSepDist },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-2',
          hypothesisId: 'H-ARCADE-WEAK',
          location: 'SunGlobe.tsx:sdo2-arcade-filament',
          message: 'Arcade + filament + CME metrics',
          data: {
            phase: sample.phase,
            arcadeOp: sample.arcadeOp,
            filamentOp: sample.filamentOp,
            cmeLife: sample.cmeLife,
            cmePosLen: sample.cmePosLen,
            hypothesisIds: ['H-ARCADE-WEAK', 'H-FILAMENT-MISS'],
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // sun-sdo-3: limb knife-edge / filament stretch / decay spray
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-3',
          hypothesisId: 'H-RIBBON-EDGEON',
          location: 'SunGlobe.tsx:sdo3-ribbon-box',
          message: 'Ribbon box extents + limb facing',
          data: {
            phase: phaseName,
            faceDot: +faceDot.toFixed(3),
            nearLimb: faceDot < 0.45,
            geo: 'box',
            scaleX: rA ? +rA.scale.x.toFixed(3) : null,
            scaleY: rA ? +rA.scale.y.toFixed(3) : null,
            scaleZ: rA ? +rA.scale.z.toFixed(3) : null,
            ribbonH: +ribbonH.toFixed(3),
            ribbonLen: +ribbonLen.toFixed(3),
            ribbonAcross: +ribbonAcross.toFixed(3),
            sepDist: +sepDist.toFixed(3),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-3',
          hypothesisId: 'H-FILAMENT-STRETCH',
          location: 'SunGlobe.tsx:sdo3-filament',
          message: 'Filament radial scale capped',
          data: { phase: phaseName, filamentRiseY: +filamentRiseY.toFixed(3), filamentOp: +filamentOp.toFixed(3) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-3',
          hypothesisId: 'H-SPRAY-DECAY',
          location: 'SunGlobe.tsx:sdo3-spray',
          message: 'Spray hard-off in decay',
          data: {
            phase: phaseName,
            sprayOn: +sprayOn.toFixed(3),
            maxParticleLife: +maxParticleLife.toFixed(3),
            decayHardOff: t >= T_CME && sprayOn === 0,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-3',
          hypothesisId: 'H-LIMB-SITE',
          location: 'SunGlobe.tsx:sdo3-limb',
          message: 'Active-region facing vs limb',
          data: {
            phase: phaseName,
            siteIdx: st.siteIdx,
            faceDot: +faceDot.toFixed(3),
            radial: { x: +radial.x.toFixed(3), y: +radial.y.toFixed(3), z: +radial.z.toFixed(3) },
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // sun-sdo-4: flat-box aspect / filament Y-scale / CME rim / depthTest
      const filMesh = flareRig.current?.children.find((c) => c.name === 'filament');
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-4',
          hypothesisId: 'H-RIBBON-ASPECT',
          location: 'SunGlobe.tsx:sdo4-aspect',
          message: 'Ribbon length/thickness aspect (limb silhouette)',
          data: {
            phase: phaseName,
            faceDot: +faceDot.toFixed(3),
            nearLimb: faceDot < 0.45,
            ribbonAspect: +ribbonAspect.toFixed(3),
            ribbonLen: +ribbonLen.toFixed(3),
            ribbonAcross: +ribbonAcross.toFixed(3),
            ribbonH: +ribbonH.toFixed(3),
            ribbonOp: +ribbonOp.toFixed(3),
            depthTest: !!(rA?.material as MeshBasicMaterial | undefined)?.depthTest,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-4',
          hypothesisId: 'H-FILAMENT-YSCALE',
          location: 'SunGlobe.tsx:sdo4-filament',
          message: 'Filament lift via translation (no Y-scale spike)',
          data: {
            phase: phaseName,
            filamentRiseY: +filamentRiseY.toFixed(3),
            scaleY: filMesh ? +filMesh.scale.y.toFixed(3) : null,
            posY: filMesh ? +filMesh.position.y.toFixed(3) : null,
            filamentOp: +filamentOp.toFixed(3),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-4',
          hypothesisId: 'H-CME-RIM',
          location: 'SunGlobe.tsx:sdo4-cme',
          message: 'CME shell life vs limb facing',
          data: {
            phase: phaseName,
            cmeLife: +cmeLife.toFixed(3),
            cmePosLen: +cmePosLen.toFixed(3),
            faceDot: +faceDot.toFixed(3),
            nearLimb: faceDot < 0.45,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'sun-sdo-4',
          hypothesisId: 'H-RIBBON-YAW',
          location: 'SunGlobe.tsx:sdo4-yaw',
          message: 'Ribbon yaw break edge-alignment',
          data: {
            phase: phaseName,
            yawA: ribbonA.current ? +ribbonA.current.rotation.y.toFixed(3) : null,
            yawB: ribbonB.current ? +ribbonB.current.rotation.y.toFixed(3) : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 160, 112]} />
        <primitive object={photoMat} attach="material" />
      </mesh>

      <mesh scale={1.15}>
        <sphereGeometry args={[radius, 64, 48]} />
        <primitive object={coronaMat} attach="material" />
      </mesh>

      <mesh scale={1.38}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshBasicMaterial
          color="#ff6810"
          transparent
          opacity={0.035}
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
          side={BackSide}
        />
      </mesh>

      {/* Local +Y = outward; quaternion aims at active region each frame */}
      <group ref={flareRig}>
        <mesh name="filament" renderOrder={15}>
          <tubeGeometry args={[filamentCurve, 64, 0.038, 8, false]} />
          <meshBasicMaterial
            ref={filamentMat}
            color={new Color('#6a1820')}
            transparent
            opacity={0}
            depthWrite={false}
            blending={NormalBlending}
            toneMapped={false}
          />
        </mesh>

        <mesh ref={ribbonA} renderOrder={20}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#fff4c8"
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            toneMapped={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
        <mesh ref={ribbonB} renderOrder={20}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#ffe8a0"
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            toneMapped={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>

        {arcadeCurves.map((curve, i) => (
          <mesh
            key={i}
            ref={(node: Mesh | null) => {
              if (node?.material) arcadeMats.current[i] = node.material as MeshBasicMaterial;
            }}
          >
            <tubeGeometry args={[curve, 64, 0.028 + i * 0.005, 8, false]} />
            <meshBasicMaterial
              color={new Color('#ffc878')}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={cmeRef} renderOrder={6}>
        <sphereGeometry args={[radius, 48, 32]} />
        <primitive object={cmeMat} attach="material" />
      </mesh>

      <points renderOrder={22}>
        <primitive object={flareGeo} attach="geometry" />
        <primitive object={flareMat} attach="material" />
      </points>

      <pointLight color="#ffc078" intensity={3.4} distance={24} decay={2} />
    </group>
  );
}

useTexture.preload(SUN_TEXTURE_URL);
