import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import type { Mesh } from 'three';
import { MilkyWayGlobe, solDiskLocal } from '@/three/MilkyWayGlobe';

const GALAXY_MW_R = 11;
/** Visible Sol pin — a point on the disk, not a planet glyph. */
const SOL_DOT_R = 0.045;
/** Invisible pick radius so the tiny dot stays clickable. */
const SOL_HIT_R = 0.28;

export function GalaxyExploreScene({
  onSelectSol,
}: {
  onSelectSol: () => void;
}) {
  const solRef = useRef<Mesh>(null);
  const solPos = solDiskLocal(GALAXY_MW_R, 0.04);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (solRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
      solRef.current.scale.setScalar(s);
    }
  });

  return (
    <>
      <color attach="background" args={['#020208']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 6, 2]} intensity={1.6} distance={40} color="#ffcc88" />
      <hemisphereLight args={['#12182a', '#050508', 0.28]} />
      <Stars radius={120} depth={60} count={2200} factor={2.5} saturation={0} fade speed={0.15} />

      <group rotation={[-Math.PI / 2, 0, 0.18]}>
        <MilkyWayGlobe radius={GALAXY_MW_R} autoRotate rotationSpeed={0.01}>
          <group position={solPos}>
            <mesh ref={solRef} renderOrder={10}>
              <sphereGeometry args={[SOL_DOT_R, 12, 12]} />
              <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
            </mesh>
            <mesh renderOrder={9}>
              <sphereGeometry args={[SOL_DOT_R * 1.8, 10, 10]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.35}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
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
              <sphereGeometry args={[SOL_HIT_R, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {hovered ? (
              <Html distanceFactor={14} position={[0, 0.22, 0]} center>
                <button
                  type="button"
                  onClick={onSelectSol}
                  className="whitespace-nowrap rounded border border-sky-400/50 bg-zinc-950/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200 backdrop-blur"
                >
                  Sol
                </button>
              </Html>
            ) : null}
          </group>
        </MilkyWayGlobe>
      </group>
    </>
  );
}
