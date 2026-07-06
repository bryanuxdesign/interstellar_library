import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '@/store/useAppStore';
import { latLngToVector3 } from './coordinateUtils';
import { DEFAULT_CAMERA_DISTANCE, GLOBE_RADIUS } from './constants';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const cameraTarget = useAppStore((s) => s.cameraTarget);

  const desired = useRef<Vector3 | null>(null);

  useEffect(() => {
    if (!cameraTarget) return;
    const normal = latLngToVector3(cameraTarget.coordinates, 1).normalize();
    const distance = GLOBE_RADIUS + cameraTarget.altitude * GLOBE_RADIUS;
    const dest = normal.multiplyScalar(distance);

    if (prefersReducedMotion) {
      camera.position.copy(dest);
      controlsRef.current?.update();
    } else {
      desired.current = dest;
    }
  }, [cameraTarget, camera]);

  useFrame(() => {
    if (desired.current) {
      camera.position.lerp(desired.current, 0.06);
      controlsRef.current?.update();
      if (camera.position.distanceTo(desired.current) < 0.02) {
        desired.current = null;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.7}
      minDistance={GLOBE_RADIUS + 0.35}
      maxDistance={DEFAULT_CAMERA_DISTANCE + 2}
    />
  );
}
