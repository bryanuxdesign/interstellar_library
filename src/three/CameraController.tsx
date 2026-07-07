import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '@/store/useAppStore';
import { latLngToVector3 } from './coordinateUtils';
import { DEFAULT_CAMERA_DISTANCE, GLOBE_RADIUS } from './constants';
import { maxCameraDistanceForPlanet } from './orbitPropagation';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface CameraControllerProps {
  planetId: string;
}

export function CameraController({ planetId }: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const cameraTarget = useAppStore((s) => s.cameraTarget);

  const maxDistance = useMemo(
    () => Math.max(DEFAULT_CAMERA_DISTANCE + 2, maxCameraDistanceForPlanet(planetId)),
    [planetId],
  );

  const desired = useRef<Vector3 | null>(null);
  const userControlling = useRef(false);

  useEffect(() => {
    if (!cameraTarget || userControlling.current) return;
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
    if (!desired.current || userControlling.current) return;

    camera.position.lerp(desired.current, 0.06);
    controlsRef.current?.update();

    if (camera.position.distanceTo(desired.current) < 0.02) {
      desired.current = null;
      controlsRef.current?.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      domElement={gl.domElement}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.7}
      minDistance={GLOBE_RADIUS + 0.35}
      maxDistance={maxDistance}
      onStart={() => {
        userControlling.current = true;
        desired.current = null;
      }}
      onEnd={() => {
        // Brief cooldown so a finishing fly-to lerp cannot snap the camera back.
        window.setTimeout(() => {
          userControlling.current = false;
          controlsRef.current?.update();
        }, 120);
      }}
    />
  );
}
