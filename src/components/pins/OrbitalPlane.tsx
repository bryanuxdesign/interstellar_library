import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitalAsset } from '@/types';
import { sampleOrbitPath } from '@/three/orbitPropagation';
import { ORBITER_COLOR } from '@/three/constants';

interface OrbitalPlaneProps {
  orbiter: OrbitalAsset;
  emphasized?: boolean;
}

export function OrbitalPlane({ orbiter, emphasized = false }: OrbitalPlaneProps) {
  const points = useMemo(() => {
    const path = sampleOrbitPath(orbiter, 128);
    return path.map((p) => new Vector3(p.x, p.y, p.z));
  }, [orbiter]);

  return (
    <Line
      points={points}
      color={ORBITER_COLOR}
      lineWidth={emphasized ? 1.8 : 1.0}
      transparent
      opacity={emphasized ? 0.55 : 0.28}
      raycast={() => {}}
    />
  );
}
