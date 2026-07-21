import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import { Mesh, Vector3, DoubleSide } from 'three';
import { MilkyWayGlobe, solDiskLocal } from '@/three/MilkyWayGlobe';

export const GALAXY_MW_R = 11;
/** Visible Sol pin — a point on the disk, not a planet glyph. */
const SOL_DOT_R = 0.045;
const SOL_DOT_R_HI = 0.07;
/** Invisible pick radius so the tiny dot stays clickable. */
const SOL_HIT_R = 0.28;
const SOL_HIT_R_TOUCH = 0.55;

/** Latest Sol world position — updated each frame for camera focus. */
const solWorldScratch = new Vector3();
let solWorldLatest: [number, number, number] = [0, 0, 0];

export function getSolWorldApprox(): [number, number, number] {
  return solWorldLatest;
}

export function GalaxyExploreScene({
  onSelectSol,
  touchFriendly = false,
  alwaysShowSolLabel = false,
  highlightSol = false,
}: {
  onSelectSol: () => void;
  /** Larger hit target + lighter star field. */
  touchFriendly?: boolean;
  /** Keep the Sol nameplate visible (mobile / guided tour). */
  alwaysShowSolLabel?: boolean;
  /** Larger beacon + pulse ring so Sol is findable. */
  highlightSol?: boolean;
}) {
  const solRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const solAnchorRef = useRef<Mesh>(null);
  const solPos = solDiskLocal(GALAXY_MW_R, 0.04);
  const [hovered, setHovered] = useState(false);
  const hitR = touchFriendly || highlightSol ? SOL_HIT_R_TOUCH : SOL_HIT_R;
  const dotR = highlightSol || touchFriendly ? SOL_DOT_R_HI : SOL_DOT_R;
  const showLabel = alwaysShowSolLabel || hovered;

  useFrame((state) => {
    if (solRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
      solRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      const pulse = 1.15 + Math.sin(state.clock.elapsedTime * 1.8) * 0.2;
      ringRef.current.scale.setScalar(pulse);
      const mat = ringRef.current.material as { opacity?: number };
      if (mat && 'opacity' in mat) {
        mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 1.8) * 0.15;
      }
    }
    if (solAnchorRef.current) {
      solAnchorRef.current.getWorldPosition(solWorldScratch);
      solWorldLatest = [solWorldScratch.x, solWorldScratch.y, solWorldScratch.z];
    }
  });

  return (
    <>
      <color attach="background" args={['#020208']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 6, 2]} intensity={1.6} distance={40} color="#ffcc88" />
      <hemisphereLight args={['#12182a', '#050508', 0.28]} />
      <Stars
        radius={120}
        depth={60}
        count={touchFriendly ? 1400 : 2200}
        factor={2.5}
        saturation={0}
        fade
        speed={0.15}
      />

      <group rotation={[-Math.PI / 2, 0, 0.18]}>
        <MilkyWayGlobe radius={GALAXY_MW_R} autoRotate rotationSpeed={0.01}>
          <group position={solPos}>
            {/* Invisible anchor for world-position sampling */}
            <mesh ref={solAnchorRef} visible={false}>
              <sphereGeometry args={[0.01, 4, 4]} />
            </mesh>
            <mesh ref={solRef} renderOrder={10}>
              <sphereGeometry args={[dotR, 12, 12]} />
              <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
            </mesh>
            <mesh renderOrder={9}>
              <sphereGeometry args={[dotR * 2.2, 10, 10]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.4}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            {highlightSol ? (
              <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={8}>
                <ringGeometry args={[0.22, 0.32, 48]} />
                <meshBasicMaterial
                  color="#7dd3fc"
                  transparent
                  opacity={0.4}
                  depthWrite={false}
                  toneMapped={false}
                  side={DoubleSide}
                />
              </mesh>
            ) : null}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectSol();
              }}
              onPointerOver={() => {
                setHovered(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[hitR, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {showLabel ? (
              <Html distanceFactor={touchFriendly ? 18 : 14} position={[0, 0.35, 0]} center>
                <button
                  type="button"
                  onClick={onSelectSol}
                  className="whitespace-nowrap rounded-md border border-sky-400/60 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100 shadow-lg backdrop-blur"
                >
                  Sol · tap to enter
                </button>
              </Html>
            ) : null}
          </group>
        </MilkyWayGlobe>
      </group>
    </>
  );
}
