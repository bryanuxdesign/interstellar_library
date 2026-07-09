import { useTouchPrimary } from '@/utils/useTouchPrimary';
import { useAppStore } from '@/store/useAppStore';

/** Two-tap flow on touch: first tap previews, second tap on same asset runs `onSelect`. */
export function useSurfaceMissionTouch(missionId: string, onSelect: () => void) {
  const isTouch = useTouchPrimary();
  const hoveredMissionId = useAppStore((s) => s.hoveredMissionId);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const setHoveredOrbiter = useAppStore((s) => s.setHoveredOrbiter);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isTouch) {
      if (hoveredMissionId === missionId) {
        onSelect();
      } else {
        setHoveredOrbiter(null);
        setHoveredMission(missionId);
      }
      return;
    }
    onSelect();
  };

  return { isTouch, handleClick };
}

/** Two-tap flow for orbital assets on touch devices. */
export function useSurfaceOrbiterTouch(orbiterId: string, onSelect: () => void) {
  const isTouch = useTouchPrimary();
  const hoveredOrbiterId = useAppStore((s) => s.hoveredOrbiterId);
  const setHoveredOrbiter = useAppStore((s) => s.setHoveredOrbiter);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isTouch) {
      if (hoveredOrbiterId === orbiterId) {
        onSelect();
      } else {
        setHoveredMission(null);
        setHoveredOrbiter(orbiterId);
      }
      return;
    }
    onSelect();
  };

  return { isTouch, handleClick };
}
