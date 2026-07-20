import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '@/store/useAppStore';
import { latLngToVector3 } from './coordinateUtils';
import { DEFAULT_CAMERA_DISTANCE, GLOBE_RADIUS } from './constants';
import { maxCameraDistanceForPlanet } from './orbitPropagation';
import { getMoonWorldPosition } from './moonFocus';
import { moonFocusDistance } from './PlanetMoons';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLANET_TARGET = new Vector3(0, 0, 0);

interface CameraControllerProps {
  planetId: string;
}

export function CameraController({ planetId }: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const cameraTarget = useAppStore((s) => s.cameraTarget);
  const focusedMoonId = useAppStore((s) => s.focusedMoonId);

  const maxDistance = useMemo(
    () => Math.max(DEFAULT_CAMERA_DISTANCE + 2, maxCameraDistanceForPlanet(planetId)),
    [planetId],
  );

  const desired = useRef<Vector3 | null>(null);
  const userControlling = useRef(false);
  const smoothedTarget = useRef(new Vector3());
  const followOffset = useRef(new Vector3(0, 0.35, 1.1));
  const offsetDir = useRef(new Vector3(0.25, 0.4, 0.85).normalize());
  const flyToMoon = useRef(false);
  const lastFocusedMoon = useRef<string | null>(null);
  const moonPosScratch = useRef(new Vector3());
  const goalScratch = useRef(new Vector3());

  // Lat/lng fly-to (missions / overview) — only when not moon-focused.
  useEffect(() => {
    if (focusedMoonId || !cameraTarget || userControlling.current) return;
    const normal = latLngToVector3(cameraTarget.coordinates, 1).normalize();
    const distance = GLOBE_RADIUS + cameraTarget.altitude * GLOBE_RADIUS;
    const dest = normal.multiplyScalar(distance);

    if (prefersReducedMotion) {
      camera.position.copy(dest);
      if (controlsRef.current) {
        controlsRef.current.target.copy(PLANET_TARGET);
        controlsRef.current.update();
      }
      smoothedTarget.current.copy(PLANET_TARGET);
    } else {
      desired.current = dest;
      if (controlsRef.current) {
        controlsRef.current.target.copy(PLANET_TARGET);
      }
      smoothedTarget.current.copy(PLANET_TARGET);
    }
  }, [cameraTarget, camera, focusedMoonId]);

  // Start moon fly-to when focusedMoonId changes.
  useEffect(() => {
    if (focusedMoonId === lastFocusedMoon.current) return;
    lastFocusedMoon.current = focusedMoonId;
    desired.current = null;
    userControlling.current = false;

    const controls = controlsRef.current;
    if (focusedMoonId) {
      flyToMoon.current = true;
      const fromCam = camera.position.clone().sub(smoothedTarget.current);
      if (fromCam.lengthSq() > 0.01) {
        offsetDir.current.copy(fromCam).normalize();
      } else {
        offsetDir.current.set(0.25, 0.4, 0.85).normalize();
      }
      if (controls) controls.enabled = false;
    } else {
      flyToMoon.current = false;
      const last = useAppStore.getState().lastFocus;
      if (last) {
        const normal = latLngToVector3(last.coordinates, 1).normalize();
        const distance = GLOBE_RADIUS + last.altitude * GLOBE_RADIUS;
        desired.current = normal.multiplyScalar(distance);
      }
      if (controls) {
        controls.enabled = true;
        controls.target.copy(PLANET_TARGET);
      }
      smoothedTarget.current.copy(PLANET_TARGET);
    }
  }, [focusedMoonId, camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (focusedMoonId) {
      const moonPos = getMoonWorldPosition(focusedMoonId);
      if (!moonPos) return;

      moonPosScratch.current.copy(moonPos);
      smoothedTarget.current.lerp(moonPosScratch.current, flyToMoon.current ? 0.18 : 0.28);
      controls.target.copy(smoothedTarget.current);

      const dist = moonFocusDistance(focusedMoonId, planetId);
      controls.minDistance = Math.max(0.35, dist * 0.45);
      controls.maxDistance = Math.max(maxDistance, dist * 10);

      goalScratch.current
        .copy(moonPosScratch.current)
        .addScaledVector(offsetDir.current, dist);

      if (flyToMoon.current && !userControlling.current) {
        controls.enabled = false;
        if (prefersReducedMotion) {
          camera.position.copy(goalScratch.current);
          flyToMoon.current = false;
          followOffset.current.copy(camera.position).sub(smoothedTarget.current);
          controls.enabled = true;
        } else {
          camera.position.lerp(goalScratch.current, 0.12);
          camera.lookAt(smoothedTarget.current);
          if (camera.position.distanceTo(goalScratch.current) < 0.15) {
            flyToMoon.current = false;
            followOffset.current.copy(camera.position).sub(smoothedTarget.current);
            controls.enabled = true;
          }
        }
      } else if (userControlling.current) {
        controls.enabled = true;
        controls.update();
        followOffset.current.copy(camera.position).sub(smoothedTarget.current);
      } else {
        // Rigid follow while the moon orbits.
        controls.enabled = true;
        camera.position.copy(smoothedTarget.current).add(followOffset.current);
        camera.lookAt(smoothedTarget.current);
        controls.object.position.copy(camera.position);
        controls.target.copy(smoothedTarget.current);
      }
      return;
    }

    // Planet-centred mode.
    controls.minDistance = GLOBE_RADIUS + 0.35;
    controls.maxDistance = maxDistance;
    controls.target.lerp(PLANET_TARGET, 0.2);
    smoothedTarget.current.copy(controls.target);

    if (!desired.current || userControlling.current) {
      controls.enabled = true;
      controls.update();
      return;
    }

    controls.enabled = false;
    camera.position.lerp(desired.current, 0.06);
    camera.lookAt(PLANET_TARGET);
    if (camera.position.distanceTo(desired.current) < 0.02) {
      desired.current = null;
      controls.enabled = true;
      controls.update();
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
        if (focusedMoonId) flyToMoon.current = false;
      }}
      onEnd={() => {
        window.setTimeout(() => {
          userControlling.current = false;
          if (focusedMoonId) {
            followOffset.current.copy(camera.position).sub(smoothedTarget.current);
          }
          controlsRef.current?.update();
        }, 120);
      }}
    />
  );
}
