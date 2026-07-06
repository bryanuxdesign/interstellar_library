import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Mesh, Quaternion, Vector3 } from 'three';
import type { Mission } from '@/types';
import { latLngToVector3 } from '@/three/coordinateUtils';
import { GLOBE_RADIUS, STATUS_COLORS } from '@/three/constants';
import { useAppStore } from '@/store/useAppStore';
import { PinHoverCard } from './PinHoverCard';

const UP = new Vector3(0, 0, 1);
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface MissionPinProps {
  mission: Mission;
}

export function MissionPin({ mission }: MissionPinProps) {
  const hoveredMissionId = useAppStore((s) => s.hoveredMissionId);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const selectMission = useAppStore((s) => s.selectMission);

  const color = STATUS_COLORS[mission.status];
  const isHovered = hoveredMissionId === mission.id;
  const isSelected = selectedMissionId === mission.id;
  const emphasized = isHovered || isSelected;

  const { position, quaternion } = useMemo(() => {
    const pos = latLngToVector3(mission.coordinates, GLOBE_RADIUS);
    const normal = pos.clone().normalize();
    const quat = new Quaternion().setFromUnitVectors(UP, normal);
    return { position: pos, quaternion: quat };
  }, [mission.coordinates]);

  const pulseRef = useRef<Mesh>(null);
  const markerRef = useRef<Group>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7403/ingest/51e22340-49a1-417f-ac09-93823f4e0ff3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c00e78'},body:JSON.stringify({sessionId:'c00e78',runId:'baseline',hypothesisId:'H4',location:'MissionPin.tsx:isHovered',message:'html-visibility-change',data:{id:mission.id,isHovered,t:Math.round(performance.now())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [isHovered, mission.id]);

  useFrame((state) => {
    if (pulseRef.current && mission.status === 'active' && !prefersReducedMotion) {
      const t = (state.clock.elapsedTime * 0.9) % 1;
      const scale = 1 + t * 2.4;
      pulseRef.current.scale.setScalar(scale);
      const mat = pulseRef.current.material as { opacity: number };
      mat.opacity = 0.5 * (1 - t);
    }
    if (markerRef.current) {
      const target = emphasized ? 1.55 : 1;
      markerRef.current.scale.lerp(new Vector3(target, target, target), 0.2);
    }
  });

  const handleOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    // #region agent log
    fetch('http://127.0.0.1:7403/ingest/51e22340-49a1-417f-ac09-93823f4e0ff3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c00e78'},body:JSON.stringify({sessionId:'c00e78',runId:'baseline',hypothesisId:'H1',location:'MissionPin.tsx:handleOver',message:'pointerOver',data:{id:mission.id,t:Math.round(performance.now())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setHoveredMission(mission.id);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = () => {
    // #region agent log
    fetch('http://127.0.0.1:7403/ingest/51e22340-49a1-417f-ac09-93823f4e0ff3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c00e78'},body:JSON.stringify({sessionId:'c00e78',runId:'baseline',hypothesisId:'H2',location:'MissionPin.tsx:handleOut',message:'pointerOut',data:{id:mission.id,t:Math.round(performance.now())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setHoveredMission(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectMission(mission.id);
  };

  return (
    <group position={position} quaternion={quaternion}>
      {/* Enlarged invisible hit target for pointer + touch */}
      <mesh
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
        position={[0, 0, 0.05]}
      >
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={markerRef}>
        {mission.status === 'impact' ? (
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <octahedronGeometry args={[0.045]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emphasized ? 1.4 : 0.7}
            />
          </mesh>
        ) : (
          <mesh position={[0, 0, 0.03]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emphasized ? 1.4 : 0.6}
            />
          </mesh>
        )}

        {/* Base ring flush with the surface */}
        <mesh position={[0, 0, 0.012]}>
          <ringGeometry args={[0.05, 0.062, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>

        {mission.status === 'active' && (
          <mesh ref={pulseRef} position={[0, 0, 0.012]}>
            <ringGeometry args={[0.05, 0.07, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        )}
      </group>

      {isHovered && (
        <Html position={[0, 0, 0.06]} center distanceFactor={6} zIndexRange={[40, 0]}>
          <PinHoverCard mission={mission} />
        </Html>
      )}
    </group>
  );
}
