import { create } from 'zustand';
import type { AssetStatus, Coordinates } from '@/types';

export const ALL_STATUSES: AssetStatus[] = ['active', 'decommissioned', 'impact'];

interface CameraTarget {
  coordinates: Coordinates;
  /** Distance from surface as a multiple of the globe radius. */
  altitude: number;
  /** Monotonic token so repeated selections of the same pin still fly. */
  token: number;
}

interface AppState {
  activePlanetId: string | null;
  hoveredMissionId: string | null;
  selectedMissionId: string | null;
  activeEventId: string | null;
  visibleStatuses: AssetStatus[];
  cameraTarget: CameraTarget | null;

  setActivePlanet: (planetId: string | null) => void;
  setHoveredMission: (missionId: string | null) => void;
  selectMission: (missionId: string | null) => void;
  closeDossier: () => void;
  toggleStatus: (status: AssetStatus) => void;
  resetFilters: () => void;
  flyTo: (coordinates: Coordinates, altitude?: number) => void;
  setActiveEvent: (eventId: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activePlanetId: null,
  hoveredMissionId: null,
  selectedMissionId: null,
  activeEventId: null,
  visibleStatuses: [...ALL_STATUSES],
  cameraTarget: null,

  setActivePlanet: (planetId) =>
    set({
      activePlanetId: planetId,
      selectedMissionId: null,
      hoveredMissionId: null,
      activeEventId: null,
      cameraTarget: null,
      visibleStatuses: [...ALL_STATUSES],
    }),

  setHoveredMission: (missionId) => set({ hoveredMissionId: missionId }),

  selectMission: (missionId) => set({ selectedMissionId: missionId }),

  closeDossier: () => set({ selectedMissionId: null }),

  toggleStatus: (status) => {
    const current = get().visibleStatuses;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    set({ visibleStatuses: next });
  },

  resetFilters: () => set({ visibleStatuses: [...ALL_STATUSES] }),

  flyTo: (coordinates, altitude = 1.35) =>
    set({
      cameraTarget: { coordinates, altitude, token: Date.now() },
    }),

  setActiveEvent: (eventId) => set({ activeEventId: eventId }),
}));
