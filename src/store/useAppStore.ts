import { create } from 'zustand';
import type { AssetStatus, Coordinates } from '@/types';

export const ALL_STATUSES: AssetStatus[] = ['active', 'decommissioned', 'impact', 'planned'];

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
  hoveredOrbiterId: string | null;
  selectedOrbiterId: string | null;
  activeEventId: string | null;
  visibleStatuses: AssetStatus[];
  showOrbiters: boolean;
  cameraTarget: CameraTarget | null;
  /** When true, missions and timeline run newest → oldest. */
  chronologyReversed: boolean;

  setActivePlanet: (planetId: string | null) => void;
  setHoveredMission: (missionId: string | null) => void;
  selectMission: (missionId: string | null) => void;
  setHoveredOrbiter: (orbiterId: string | null) => void;
  selectOrbiter: (orbiterId: string | null) => void;
  toggleShowOrbiters: () => void;
  closeDossier: () => void;
  toggleStatus: (status: AssetStatus) => void;
  resetFilters: () => void;
  flyTo: (coordinates: Coordinates, altitude?: number) => void;
  setActiveEvent: (eventId: string | null) => void;
  toggleChronologyReversed: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activePlanetId: null,
  hoveredMissionId: null,
  selectedMissionId: null,
  hoveredOrbiterId: null,
  selectedOrbiterId: null,
  activeEventId: null,
  visibleStatuses: [...ALL_STATUSES],
  showOrbiters: true,
  cameraTarget: null,
  chronologyReversed: false,

  setActivePlanet: (planetId) =>
    set({
      activePlanetId: planetId,
      selectedMissionId: null,
      hoveredMissionId: null,
      selectedOrbiterId: null,
      hoveredOrbiterId: null,
      activeEventId: null,
      cameraTarget: null,
      visibleStatuses: [...ALL_STATUSES],
      showOrbiters: true,
    }),

  setHoveredMission: (missionId) => set({ hoveredMissionId: missionId }),

  selectMission: (missionId) =>
    set({ selectedMissionId: missionId, selectedOrbiterId: null }),

  setHoveredOrbiter: (orbiterId) => set({ hoveredOrbiterId: orbiterId }),

  selectOrbiter: (orbiterId) =>
    set({ selectedOrbiterId: orbiterId, selectedMissionId: null }),

  toggleShowOrbiters: () => set((s) => ({ showOrbiters: !s.showOrbiters })),

  closeDossier: () =>
    set({ selectedMissionId: null, selectedOrbiterId: null }),

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

  toggleChronologyReversed: () =>
    set((s) => ({ chronologyReversed: !s.chronologyReversed })),
}));
