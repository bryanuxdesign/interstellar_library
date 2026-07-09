import { getMissionById } from '@/data/missions';
import { isRoverMission } from '@/data/roverTraverses';
import type { RoverTraverseRecord } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { RoverLandingMarker } from './RoverLandingMarker';
import { RoverLastKnownMarker } from './RoverLastKnownMarker';
import { RoverTraverseTrack } from './RoverTraverseTrack';

interface SelectedRoverLayerProps {
  traverses: Map<string, RoverTraverseRecord | null>;
}

/** Renders traverse path and landing marker only for the selected rover. */
export function SelectedRoverLayer({ traverses }: SelectedRoverLayerProps) {
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);

  if (!selectedMissionId || !isRoverMission(selectedMissionId)) return null;

  const mission = getMissionById(selectedMissionId);
  const traverse = traverses.get(selectedMissionId);
  if (!mission || !traverse) return null;

  return (
    <group>
      <RoverTraverseTrack mission={mission} traverse={traverse} />
      <RoverLandingMarker coordinates={traverse.landingSite} />
      <RoverLastKnownMarker
        coordinates={traverse.lastKnown}
        isActive={mission.status === 'active'}
      />
    </group>
  );
}
