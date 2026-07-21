import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useAppStore } from '@/store/useAppStore';
import { useTouchPrimary } from '@/utils/useTouchPrimary';
import { latLngToVector3 } from './coordinateUtils';
import { DEFAULT_CAMERA_DISTANCE, GLOBE_RADIUS } from './constants';
import { maxCameraDistanceForPlanet } from './orbitPropagation';
import { getMoonWorldPosition, getMoonWorldQuaternion, moonFocusDistance, moonVisualRadiusFor } from './moonFocus';

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
  const artemis2DemoPlaying = useAppStore((s) => s.artemis2DemoPlaying);
  const touchPrimary = useTouchPrimary();

  const maxDistance = useMemo(
    () => Math.max(DEFAULT_CAMERA_DISTANCE + 2, maxCameraDistanceForPlanet(planetId)),
    [planetId],
  );

  const desired = useRef<Vector3 | null>(null);
  const userControlling = useRef(false);
  const smoothedTarget = useRef(new Vector3());
  /** Unit direction from moon centre → camera, in moon-local space. */
  const moonLocalDir = useRef(new Vector3(0.25, 0.4, 0.85).normalize());
  const moonViewDist = useRef(1.2);
  const flyToMoon = useRef(false);
  const lastFocusedMoon = useRef<string | null>(null);
  const lastSurfaceToken = useRef<number | null>(null);
  const moonPosScratch = useRef(new Vector3());
  const goalScratch = useRef(new Vector3());
  const worldDirScratch = useRef(new Vector3());
  const invQuatScratch = useRef(new Quaternion());

  const trackingMoon = Boolean(focusedMoonId);

  // Disable orbit while the Artemis II cinematic owns the camera.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (artemis2DemoPlaying) {
      controls.enabled = false;
      desired.current = null;
      userControlling.current = false;
    } else {
      controls.enabled = true;
    }
  }, [artemis2DemoPlaying]);

  // Lat/lng fly-to on the primary globe — only when not tracking an orbiting moon.
  useEffect(() => {
    if (artemis2DemoPlaying || trackingMoon || !cameraTarget) return;
    // Programmatic flyTo always wins over a stuck OrbitControls drag lock
    // (common after moon follow enables controls without an onEnd).
    userControlling.current = false;
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
  }, [cameraTarget, camera, trackingMoon, artemis2DemoPlaying]);

  // Start moon fly-to when tracking an orbiting moon.
  useEffect(() => {
    const trackId = trackingMoon ? focusedMoonId : null;
    if (trackId === lastFocusedMoon.current) return;
    lastFocusedMoon.current = trackId;
    userControlling.current = false;
    lastSurfaceToken.current = null;

    const controls = controlsRef.current;
    if (trackId) {
      // Entering moon — cancel any planet fly-to.
      desired.current = null;
      flyToMoon.current = true;
      moonLocalDir.current.set(0.25, 0.4, 0.85).normalize();
      moonViewDist.current = moonFocusDistance(trackId, planetId);
      if (controls) controls.enabled = false;
    } else {
      flyToMoon.current = false;
      // Leaving moon — do NOT clear desired. PlanetView's leave flyTo may have
      // already written the Earth overview target in the same commit.
      userControlling.current = false;
      if (controls) {
        controls.enabled = true;
        controls.target.copy(PLANET_TARGET);
      }
      smoothedTarget.current.copy(PLANET_TARGET);
    }
  }, [trackingMoon, focusedMoonId, camera, planetId]);

  // Mission / orbiter fly-to while focused on an orbiting moon (e.g. Luna archive).
  useEffect(() => {
    if (!trackingMoon || !focusedMoonId || !cameraTarget) return;
    if (cameraTarget.token === lastSurfaceToken.current) return;
    lastSurfaceToken.current = cameraTarget.token;

    const quat = getMoonWorldQuaternion(focusedMoonId);
    if (!quat) return;

    const local = latLngToVector3(cameraTarget.coordinates, 1).normalize();
    moonLocalDir.current.copy(local);
    const r = moonVisualRadiusFor(focusedMoonId, planetId);
    moonViewDist.current = Math.max(r * 1.2, r * (1 + cameraTarget.altitude));
    flyToMoon.current = true;
    userControlling.current = false;
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [cameraTarget, trackingMoon, focusedMoonId, planetId]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (artemis2DemoPlaying) return;

    if (trackingMoon && focusedMoonId) {
      const moonPos = getMoonWorldPosition(focusedMoonId);
      const moonQuat = getMoonWorldQuaternion(focusedMoonId);
      if (!moonPos || !moonQuat) return;

      moonPosScratch.current.copy(moonPos);
      smoothedTarget.current.lerp(moonPosScratch.current, flyToMoon.current ? 0.18 : 0.28);
      controls.target.copy(smoothedTarget.current);

      const dist = moonViewDist.current;
      controls.minDistance = Math.max(0.35, dist * 0.45);
      controls.maxDistance = Math.max(maxDistance, dist * 10);

      worldDirScratch.current.copy(moonLocalDir.current).applyQuaternion(moonQuat);
      goalScratch.current
        .copy(moonPosScratch.current)
        .addScaledVector(worldDirScratch.current, dist);

      if (flyToMoon.current && !userControlling.current) {
        controls.enabled = false;
        if (prefersReducedMotion) {
          camera.position.copy(goalScratch.current);
          flyToMoon.current = false;
          controls.enabled = true;
        } else {
          camera.position.lerp(goalScratch.current, 0.12);
          camera.lookAt(smoothedTarget.current);
          if (camera.position.distanceTo(goalScratch.current) < 0.15) {
            flyToMoon.current = false;
            controls.enabled = true;
          }
        }
      } else if (userControlling.current) {
        controls.enabled = true;
        controls.update();
        // Bake orbit drag back into moon-local follow state.
        worldDirScratch.current.copy(camera.position).sub(smoothedTarget.current);
        const len = worldDirScratch.current.length();
        if (len > 1e-4) {
          moonViewDist.current = len;
          invQuatScratch.current.copy(moonQuat).invert();
          moonLocalDir.current
            .copy(worldDirScratch.current)
            .multiplyScalar(1 / len)
            .applyQuaternion(invQuatScratch.current)
            .normalize();
        }
      } else {
        // Rigid follow in moon-local space while the moon orbits / librates.
        controls.enabled = true;
        camera.position.copy(goalScratch.current);
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
    // Faster catch-up when returning from a distant moon (Luna ~28 R⊕).
    const catchUp = camera.position.distanceTo(desired.current) > 8 ? 0.14 : 0.06;
    camera.position.lerp(desired.current, catchUp);
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
      rotateSpeed={touchPrimary ? 0.6 : 0.45}
      zoomSpeed={touchPrimary ? 0.95 : 0.7}
      minDistance={GLOBE_RADIUS + 0.35}
      maxDistance={maxDistance}
      onStart={() => {
        userControlling.current = true;
        desired.current = null;
        if (trackingMoon) flyToMoon.current = false;
      }}
      onEnd={() => {
        window.setTimeout(() => {
          userControlling.current = false;
          controlsRef.current?.update();
        }, 120);
      }}
    />
  );
}
