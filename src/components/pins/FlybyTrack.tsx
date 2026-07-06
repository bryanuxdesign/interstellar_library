import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { Group, Quaternion, Vector3 } from 'three';
import type { Mission } from '@/types';
import { getPlanet } from '@/data/planets';
import { latLngToVector3 } from '@/three/coordinateUtils';
import { GLOBE_RADIUS, STATUS_COLORS, VISUAL_FLYBY_ALT_KM } from '@/three/constants';
import { useAppStore } from '@/store/useAppStore';
import { PinHoverCard } from './PinHoverCard';

const ARC_SPAN_DEG = 72;
const ARC_SEGMENTS = 40;

interface FlybyTrackProps {
  mission: Mission;
}

export function FlybyTrack({ mission }: FlybyTrackProps) {
  const hoveredMissionId = useAppStore((s) => s.hoveredMissionId);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const selectMission = useAppStore((s) => s.selectMission);

  const color = STATUS_COLORS[mission.status];
  const isHovered = hoveredMissionId === mission.id;
  const isSelected = selectedMissionId === mission.id;
  const emphasized = isHovered || isSelected;

  const planetRadiusKm = getPlanet(mission.planetId)?.radiusKm ?? 6051.8;
  const orbitRadius = GLOBE_RADIUS * (1 + VISUAL_FLYBY_ALT_KM / planetRadiusKm);

  const { arcPoints, closestApproach, tangentQuat } = useMemo(() => {
    const { lat, lng } = mission.coordinates;
    const points: Vector3[] = [];
    const half = ARC_SPAN_DEG / 2;

    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const t = i / ARC_SEGMENTS;
      const arcLng = lng - half + t * ARC_SPAN_DEG;
      points.push(latLngToVector3({ lat, lng: arcLng }, orbitRadius));
    }

    const ca = latLngToVector3({ lat, lng }, orbitRadius);
    const before = latLngToVector3({ lat, lng: lng - 4 }, orbitRadius);
    const after = latLngToVector3({ lat, lng: lng + 4 }, orbitRadius);
    const tangent = after.sub(before).normalize();
    const normal = ca.clone().normalize();
    const bitangent = new Vector3().crossVectors(normal, tangent).normalize();
    const correctedTangent = new Vector3().crossVectors(bitangent, normal).normalize();
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), correctedTangent);

    return { arcPoints: points, closestApproach: ca, tangentQuat: quat };
  }, [mission.coordinates, orbitRadius]);

  const markerRef = useRef<Group>(null);

  useFrame(() => {
    if (markerRef.current) {
      const target = emphasized ? 1.45 : 1;
      markerRef.current.scale.lerp(new Vector3(target, target, target), 0.2);
    }
  });

  const handleOver = () => {
    setHoveredMission(mission.id);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = () => {
    setHoveredMission(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectMission(mission.id);
  };

  return (
    <group>
      <Line
        points={arcPoints}
        color={color}
        lineWidth={emphasized ? 2.8 : 1.6}
        transparent
        opacity={emphasized ? 0.95 : 0.62}
        raycast={() => {}}
      />

      <group
        position={closestApproach}
        quaternion={tangentQuat}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <group ref={markerRef}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.028, 0.09, 4]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emphasized ? 1.5 : 0.75}
            />
          </mesh>
        </group>

        {isHovered && (
          <Html
            position={[0, 0.12, 0]}
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <PinHoverCard mission={mission} />
          </Html>
        )}
      </group>
    </group>
  );
}

export const isFlybyMission = (mission: Mission): boolean =>
  mission.classification === 'Flyby';
