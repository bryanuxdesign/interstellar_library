import { Stars } from '@react-three/drei';
import { MilkyWayGlobe, solDiskLocal } from '@/three/MilkyWayGlobe';

const INTRO_MW_R = 3.6;

/** Slow-spinning galactic plane — half visible via camera framing. */
export function IntroMilkyWayScene() {
  const solPos = solDiskLocal(INTRO_MW_R, 0.03);

  return (
    <>
      <color attach="background" args={['#030308']} />
      <ambientLight intensity={0.16} />
      <pointLight position={[0, 2.2, 3]} intensity={1.1} distance={18} color="#ffd9a0" />
      <Stars radius={80} depth={40} count={2500} factor={3} saturation={0} fade speed={0.2} />
      <group position={[0, -0.35, 0]} rotation={[1.05, 0.15, 0.08]}>
        <MilkyWayGlobe radius={INTRO_MW_R} autoRotate rotationSpeed={0.032}>
          {/* Point location only */}
          <mesh position={solPos}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
          </mesh>
        </MilkyWayGlobe>
      </group>
    </>
  );
}
