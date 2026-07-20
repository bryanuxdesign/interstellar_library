import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { GLOBE_RADIUS } from './constants';
import {
  findPlanetMoon,
  moonMeanAnomalyRad,
  moonsForPlanet,
  planetObliquityDeg,
  type PlanetMoonDef,
} from '@/data/planetMoons';
import { getPlanet } from '@/data/planets';
import { daysSinceJ2000 } from '@/solar/ephemeris';
import { useAppStore } from '@/store/useAppStore';
import { clearMoonWorldPositions, setMoonWorldPosition } from './moonFocus';

const ORBIT_SEGMENTS = 160;
const MOON_MIN_RADIUS = 0.055;
const MOON_MAX_RADIUS = 0.28;
/** Boost tiny moons (Phobos/Deimos); gas-giant moons need less. */
const SIZE_EXAGGERATION = 10;
const DEG = Math.PI / 180;

const HIT_GEO = new SphereGeometry(1, 12, 12);

function moonVisualRadius(def: PlanetMoonDef, planetRadiusKm: number): number {
  const trueRadius = GLOBE_RADIUS * (def.meanRadiusKm / planetRadiusKm);
  return Math.min(MOON_MAX_RADIUS, Math.max(MOON_MIN_RADIUS, trueRadius * SIZE_EXAGGERATION));
}

function scaleMoonModel(scene: Group, radiusScene: number) {
  const clone = scene.clone(true);
  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = (radiusScene * 2) / maxDim;
  clone.scale.setScalar(scale);
  clone.position.copy(center.multiplyScalar(-scale));
  clone.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh;
      // Visual mesh doesn't need raycast — invisible hit sphere handles clicks.
      mesh.raycast = () => {};
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat instanceof MeshStandardMaterial) {
          mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.12);
          mat.emissive.set('#3a342c');
          mat.needsUpdate = true;
        }
      }
    }
  });
  return clone;
}

/**
 * Circular Keplerian position in planet-equator frame (Y = pole), then tip by
 * parent obliquity (SolSystem-compatible).
 */
function writeMoonOffset(
  def: PlanetMoonDef,
  days: number,
  orbitRadius: number,
  obliquityRad: number,
  out: Vector3,
): Vector3 {
  const M = moonMeanAnomalyRad(def, days);
  const w = def.argPeriapsisDeg * DEG;
  const Om = def.longitudeOfAscendingNodeDeg * DEG;
  const i = def.inclinationDeg * DEG;
  const theta = w + M;

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  // Equatorial plane ≈ XZ; inclination lifts toward +Y (pole).
  let x = cosT * orbitRadius;
  let y = sinT * orbitRadius * sinI;
  let z = sinT * orbitRadius * cosI;

  // Rotate by Ω about the pole (Y).
  if (Math.abs(Om) > 1e-12) {
    const cosO = Math.cos(Om);
    const sinO = Math.sin(Om);
    const x2 = x * cosO - z * sinO;
    const z2 = x * sinO + z * cosO;
    x = x2;
    z = z2;
  }

  // Tip by parent obliquity about X (ecliptic-style presentation).
  if (Math.abs(obliquityRad) > 1e-6) {
    const cosObl = Math.cos(obliquityRad);
    const sinObl = Math.sin(obliquityRad);
    const y2 = y * cosObl - z * sinObl;
    const z2 = y * sinObl + z * cosObl;
    out.set(x, y2, z2);
  } else {
    out.set(x, y, z);
  }
  return out;
}

function makeOrbitLoop(
  def: PlanetMoonDef,
  orbitRadius: number,
  obliquityRad: number,
) {
  const positions = new Float32Array((ORBIT_SEGMENTS + 1) * 3);
  const scratch = new Vector3();
  // Sample anomaly around the circular path (shape independent of epoch).
  const probe: PlanetMoonDef = {
    ...def,
    meanAnomalyAtJ2000Deg: 0,
    periodHours: Math.abs(def.periodHours) || 24,
  };

  for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
    probe.meanAnomalyAtJ2000Deg = (i / ORBIT_SEGMENTS) * 360;
    writeMoonOffset(probe, 0, orbitRadius, obliquityRad, scratch);
    positions[i * 3] = scratch.x;
    positions[i * 3 + 1] = scratch.y;
    positions[i * 3 + 2] = scratch.z;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new LineLoop(
    geo,
    new LineBasicMaterial({ color: '#a8b4c4', transparent: true, opacity: 0.45 }),
  );
}

function OrbitingMoon({
  def,
  planetRadiusKm,
  obliquityRad,
}: {
  def: PlanetMoonDef;
  planetRadiusKm: number;
  obliquityRad: number;
}) {
  const bodyRef = useRef<Group>(null);
  const worldScratch = useMemo(() => new Vector3(), []);
  const localScratch = useMemo(() => new Vector3(), []);
  const [hovered, setHovered] = useState(false);

  const focusedMoonId = useAppStore((s) => s.focusedMoonId);
  const focusMoon = useAppStore((s) => s.focusMoon);
  const selected = focusedMoonId === def.id;

  const { scene } = useGLTF(def.modelUrl);

  const orbitRadius = GLOBE_RADIUS * (def.semiMajorKm / planetRadiusKm);
  const moonRadius = moonVisualRadius(def, planetRadiusKm);

  const model = useMemo(
    () => scaleMoonModel(scene as unknown as Group, moonRadius),
    [scene, moonRadius],
  );
  const orbitLine = useMemo(
    () => makeOrbitLoop(def, orbitRadius, obliquityRad),
    [def, orbitRadius, obliquityRad],
  );

  const hitScale = Math.max(moonRadius * 3.2, 0.12);

  useFrame(() => {
    // Realtime: wall-clock days since J2000 — no accelerated “zip” timescale.
    const days = daysSinceJ2000(new Date());
    writeMoonOffset(def, days, orbitRadius, obliquityRad, localScratch);
    if (bodyRef.current) {
      bodyRef.current.position.copy(localScratch);
      // Tidally locked: face parent (origin).
      bodyRef.current.lookAt(0, 0, 0);
      bodyRef.current.getWorldPosition(worldScratch);
      setMoonWorldPosition(def.id, worldScratch);
    }
  });

  const select = () => focusMoon(def.id);

  return (
    <group>
      <primitive object={orbitLine} />
      <group ref={bodyRef}>
        <primitive object={model} />
        <mesh
          geometry={HIT_GEO}
          scale={hitScale}
          onClick={(e) => {
            e.stopPropagation();
            select();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {(hovered || selected) && (
          <Html
            center
            position={[0, moonRadius * 1.6 + 0.08, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            zIndexRange={[20, 0]}
          >
            <div
              className="whitespace-nowrap rounded-sm px-2 py-0.5 text-[11px] tracking-wide text-ink"
              style={{
                background: 'rgba(8, 10, 14, 0.78)',
                border: selected
                  ? '1px solid rgba(200, 210, 230, 0.55)'
                  : '1px solid rgba(160, 170, 190, 0.28)',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              }}
            >
              {def.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/** Invisible globe hit — click parent to leave moon focus. */
function PlanetReturnHit() {
  const focusedMoonId = useAppStore((s) => s.focusedMoonId);
  const focusMoon = useAppStore((s) => s.focusMoon);
  const flyTo = useAppStore((s) => s.flyTo);
  const lastFocus = useAppStore((s) => s.lastFocus);

  // Only while moon-focused so surface pins stay clickable on the planet.
  if (!focusedMoonId) return null;

  return (
    <mesh
      geometry={HIT_GEO}
      scale={GLOBE_RADIUS * 1.05}
      onClick={(e) => {
        e.stopPropagation();
        focusMoon(null);
        const altitude = lastFocus?.altitude ?? 2.4;
        const coords = lastFocus?.coordinates ?? { lat: 0, lng: 0 };
        flyTo(coords, altitude);
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
  );
}

interface PlanetMoonsProps {
  planetId: string;
}

export function PlanetMoons({ planetId }: PlanetMoonsProps) {
  const moons = useMemo(() => moonsForPlanet(planetId), [planetId]);
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  const obliquityRad = planetObliquityDeg(planetId) * DEG;

  useEffect(() => {
    return () => {
      clearMoonWorldPositions();
      document.body.style.cursor = 'auto';
    };
  }, [planetId]);

  if (!moons.length) return null;

  return (
    <group>
      <PlanetReturnHit />
      {moons.map((moon) => (
        <OrbitingMoon
          key={moon.id}
          def={moon}
          planetRadiusKm={planetRadiusKm}
          obliquityRad={obliquityRad}
        />
      ))}
    </group>
  );
}

export function preloadPlanetMoonModels(planetId: string) {
  for (const moon of moonsForPlanet(planetId)) {
    useGLTF.preload(moon.modelUrl);
  }
}

/** Scene distance from moon centre for a comfortable close-up. */
export function moonFocusDistance(moonId: string, planetId: string): number {
  const def = findPlanetMoon(moonId);
  const planetRadiusKm = getPlanet(planetId)?.radiusKm ?? 1737.4;
  if (!def) return GLOBE_RADIUS * 1.2;
  const r = moonVisualRadius(def, planetRadiusKm);
  return Math.max(0.7, r * 4.2);
}

/** @deprecated Prefer PlanetMoons + preloadPlanetMoonModels */
export function MarsMoons() {
  return <PlanetMoons planetId="mars" />;
}

/** @deprecated Prefer preloadPlanetMoonModels('mars') */
export function preloadMarsMoonModels() {
  preloadPlanetMoonModels('mars');
}
