import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line, useGLTF } from '@react-three/drei';
import {
  Box3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import {
  ARTEMIS2_WALL_CLOCK_SEC,
  smSeparatedAt,
} from '@/data/demos/artemis2';
import {
  loadArtemis2Trajectory,
  type Artemis2Trajectory,
} from '@/data/demos/artemis2Trajectory';
import { useAppStore } from '@/store/useAppStore';
import { setArtemisLunaOverride } from './moonFocus';
import { earthOverviewAltitude } from '@/utils/missionCamera';

const ORION_URL = '/models/orion.glb';
const TRAIL_COLOR = '#5ec8ff';
/**
 * Visual craft height. True Orion (~5 m) is invisible at globe scale;
 * this is a readability exaggeration (~1/50 Earth radius), not 1:1.
 */
const CRAFT_TARGET_HEIGHT = 0.048;

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

useGLTF.preload(ORION_URL);

function paintOrionMaterials(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;
    const mesh = obj as Mesh;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    // Untextured NASA STL ships as chalk-white — retint to Orion CM/SM read.
    const mat = new MeshStandardMaterial({
      color: new Color('#c8ccd4'),
      metalness: 0.55,
      roughness: 0.38,
      emissive: new Color('#1a2230'),
      emissiveIntensity: 0.12,
    });
    // Slight darker band for SM / aft feel via vertex y in local space is hard;
    // use a cooler titanium for the whole craft + gold foil accent via emissive.
    mat.color.set('#9aa3b0');
    mat.emissive.set('#3a2a14');
    mat.emissiveIntensity = 0.08;
    mesh.material = mat;
  });
}

function prepareOrionClone(scene: Object3D): Group {
  const root = new Group();
  const clone = scene.clone(true);
  paintOrionMaterials(clone);

  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = CRAFT_TARGET_HEIGHT / maxDim;
  clone.scale.setScalar(scale);
  clone.position.copy(center.multiplyScalar(-scale));
  clone.rotation.x = Math.PI / 2;
  root.add(clone);
  return root;
}

/**
 * Artemis II free-return cinematic driven by NASA/JPL Horizons state vectors.
 */
export function Artemis2Demo() {
  const playing = useAppStore((s) => s.artemis2DemoPlaying);
  const cameraMode = useAppStore((s) => s.artemis2CameraMode);
  const timelineSpeed = useAppStore((s) => s.artemis2TimelineSpeed);
  const setPhase = useAppStore((s) => s.setArtemis2DemoPhase);
  const stopDemo = useAppStore((s) => s.stopArtemis2Demo);
  const flyTo = useAppStore((s) => s.flyTo);
  const { camera } = useThree();
  const { scene: orionScene } = useGLTF(ORION_URL);

  const craftRef = useRef<Group>(null);
  const smRef = useRef<Group>(null);
  const progress = useRef(0);
  const trajRef = useRef<Artemis2Trajectory | null>(null);
  const posScratch = useRef(new Vector3());
  const moonScratch = useRef(new Vector3());
  const prevPos = useRef(new Vector3());
  const velScratch = useRef(new Vector3(0, 0, 1));
  const camScratch = useRef(new Vector3());
  const lookScratch = useRef(new Vector3());
  const aimScratch = useRef(new Vector3());
  const radialScratch = useRef(new Vector3());
  const upScratch = useRef(new Vector3(0, 1, 0));
  const sideScratch = useRef(new Vector3(0, 0, 1));
  const finished = useRef(false);
  const lastPhaseLabel = useRef<string | null>(null);
  const trailTick = useRef(0);

  const [traj, setTraj] = useState<Artemis2Trajectory | null>(null);
  const [trailEnd, setTrailEnd] = useState(2);
  const [loadError, setLoadError] = useState<string | null>(null);

  const orion = useMemo(() => prepareOrionClone(orionScene), [orionScene]);
  const orionSm = useMemo(() => prepareOrionClone(orionScene), [orionScene]);

  useEffect(() => {
    let cancelled = false;
    loadArtemis2Trajectory()
      .then((t) => {
        if (!cancelled) {
          setTraj(t);
          setLoadError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      progress.current = 0;
      finished.current = false;
      lastPhaseLabel.current = null;
      trajRef.current = null;
      setTrailEnd(2);
      setPhase(null);
      setArtemisLunaOverride(null);
      return;
    }
    if (!traj) return;
    progress.current = 0;
    finished.current = false;
    lastPhaseLabel.current = null;
    trajRef.current = traj;
    setTrailEnd(2);
    const phase = traj.phaseAt(0);
    lastPhaseLabel.current = phase.label;
    setPhase(phase.label);
    traj.sampleOrion(0, prevPos.current);
  }, [playing, traj, setPhase]);

  useFrame((_, delta) => {
    if (!playing || !trajRef.current || finished.current) return;

    const wallSec = ARTEMIS2_WALL_CLOCK_SEC[timelineSpeed];
    const speed = prefersReducedMotion ? 5 : 1;
    progress.current = Math.min(1, progress.current + (delta * speed) / wallSec);
    const t = progress.current;
    const path = trajRef.current;

    const phase = path.phaseAt(t);
    if (phase.label !== lastPhaseLabel.current) {
      lastPhaseLabel.current = phase.label;
      setPhase(phase.label);
    }

    const craft = path.sampleOrion(t, posScratch.current);
    const luna = path.sampleMoon(t, moonScratch.current);
    setArtemisLunaOverride(luna);

    velScratch.current.subVectors(craft, prevPos.current);
    if (velScratch.current.lengthSq() > 1e-10) velScratch.current.normalize();
    prevPos.current.copy(craft);

    if (craftRef.current) {
      craftRef.current.position.copy(craft);
      if (velScratch.current.lengthSq() > 1e-8) {
        aimScratch.current.copy(craft).add(velScratch.current);
        craftRef.current.lookAt(aimScratch.current);
      }
    }

    const sep = smSeparatedAt(t);
    if (smRef.current) {
      smRef.current.visible = sep;
      if (sep) {
        const sepT = Math.min(1, (t - 0.88) / 0.06);
        smRef.current.position
          .copy(craft)
          .addScaledVector(velScratch.current, -0.2 - sepT * 1.2)
          .addScaledVector(upScratch.current, sepT * 0.15);
      }
    }

    trailTick.current += 1;
    if (trailTick.current % 2 === 0) {
      const next = Math.max(2, Math.floor(1 + t * (path.smoothPath.length - 1)));
      if (next !== trailEnd) setTrailEnd(next);
    }

    if (craft.lengthSq() > 1e-6) radialScratch.current.copy(craft).normalize();
    else radialScratch.current.set(0, 0, 1);
    sideScratch.current.crossVectors(upScratch.current, radialScratch.current);
    if (sideScratch.current.lengthSq() < 1e-6) sideScratch.current.set(0, 0, 1);
    sideScratch.current.normalize();

    if (cameraMode === 'capsule') {
      const pull =
        phase.id === 'coast_out' || phase.id === 'lunar_flyby' || phase.id === 'coast_home'
          ? 2.4
          : 1.1;
      camScratch.current
        .copy(craft)
        .addScaledVector(velScratch.current, -pull)
        .addScaledVector(upScratch.current, pull * 0.32)
        .addScaledVector(sideScratch.current, pull * 0.12);
      lookScratch.current.copy(craft);
    } else if (cameraMode === 'moon') {
      const pull = Math.max(luna.length() * 0.2, 7);
      camScratch.current
        .copy(luna)
        .addScaledVector(upScratch.current, pull * 0.4)
        .addScaledVector(sideScratch.current, pull * 0.5);
      lookScratch.current.copy(luna);
    } else {
      const craftR = Math.max(craft.length(), 2);
      const pull = Math.max(craftR * 1.25, 5.5);
      camScratch.current
        .copy(radialScratch.current)
        .multiplyScalar(pull)
        .addScaledVector(upScratch.current, pull * 0.25)
        .addScaledVector(sideScratch.current, pull * 0.18);
      lookScratch.current.set(0, 0, 0);
    }

    if (prefersReducedMotion) camera.position.copy(camScratch.current);
    else camera.position.lerp(camScratch.current, 0.1);
    camera.lookAt(lookScratch.current);

    if (t >= 1) {
      finished.current = true;
      setArtemisLunaOverride(null);
      stopDemo();
      const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      queueMicrotask(() => flyTo({ lat: 18, lng: -45 }, earthOverviewAltitude(aspect)));
    }
  });

  const trail = useMemo(() => {
    if (!traj) return [] as Vector3[];
    return traj.smoothPath.slice(0, trailEnd);
  }, [traj, trailEnd]);

  if (!playing) return null;
  if (loadError) {
    return (
      <Html center>
        <div className="rounded border border-red-400/40 bg-black/80 px-3 py-2 text-[11px] text-red-200">
          Artemis II trajectory: {loadError}
        </div>
      </Html>
    );
  }
  if (!traj) return null;

  return (
    <group>
      {trail.length >= 2 && (
        <Line
          points={trail}
          color={TRAIL_COLOR}
          lineWidth={1.25}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      )}

      <group ref={craftRef}>
        <primitive object={orion} />
        <Html position={[0, 0.08, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded border border-amber-400/40 bg-black/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-200 backdrop-blur-sm">
            Orion · Artemis II
          </div>
        </Html>
      </group>

      <group ref={smRef} visible={false}>
        <primitive object={orionSm} />
      </group>
    </group>
  );
}
