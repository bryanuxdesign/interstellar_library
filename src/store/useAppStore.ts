import { create } from 'zustand';
import type { AssetStatus, Coordinates } from '@/types';
import { getMissionById } from '@/data/missions';
import { getOrbiterById } from '@/data/orbiters';
import { getPlanet } from '@/data/planets';
import { propagateOrbiter } from '@/three/orbitPropagation';
import { missionCameraTarget, missionPeekAltitude } from '@/utils/missionCamera';
import { orbiterCameraCoords, orbiterPeekAltitude } from '@/utils/orbiterCamera';

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
  /** Last fly-to target — used to re-frame after closing mobile dossier. */
  lastFocus: { coordinates: Coordinates; altitude: number } | null;
  /** When true, mobile dossier sheet is scrolled to full-screen. */
  mobileDossierExpanded: boolean;
  /** When true, missions and timeline run newest → oldest. */
  chronologyReversed: boolean;
  /** Archive moon currently framing the camera (null = planet). */
  focusedMoonId: string | null;

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
  setMobileDossierExpanded: (expanded: boolean) => void;
  clearSurfacePreview: () => void;
  focusMoon: (moonId: string | null) => void;
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
  lastFocus: null,
  mobileDossierExpanded: false,
  chronologyReversed: false,
  focusedMoonId: null,

  setActivePlanet: (planetId) => {
    if (get().activePlanetId === planetId) return;
    set({
      activePlanetId: planetId,
      selectedMissionId: null,
      hoveredMissionId: null,
      selectedOrbiterId: null,
      hoveredOrbiterId: null,
      activeEventId: null,
      cameraTarget: null,
      lastFocus: null,
      mobileDossierExpanded: false,
      visibleStatuses: [...ALL_STATUSES],
      showOrbiters: true,
      focusedMoonId: null,
    });
  },

  setHoveredMission: (missionId) => set({ hoveredMissionId: missionId }),

  selectMission: (missionId) =>
    set({ selectedMissionId: missionId, selectedOrbiterId: null, focusedMoonId: null }),

  setHoveredOrbiter: (orbiterId) => set({ hoveredOrbiterId: orbiterId }),

  selectOrbiter: (orbiterId) =>
    set({ selectedOrbiterId: orbiterId, selectedMissionId: null, focusedMoonId: null }),

  toggleShowOrbiters: () => set((s) => ({ showOrbiters: !s.showOrbiters })),

  closeDossier: () => {
    const { selectedMissionId, selectedOrbiterId } = get();
    const mission = selectedMissionId ? getMissionById(selectedMissionId) : undefined;
    const orbiter = selectedOrbiterId ? getOrbiterById(selectedOrbiterId) : undefined;
    const orbiterState = orbiter ? propagateOrbiter(orbiter) : null;
    const planetRadiusKm = orbiter
      ? getPlanet(orbiter.planetId)?.radiusKm ?? 1737.4
      : 1737.4;

    const peekCoords = mission
      ? missionCameraTarget(mission)
      : orbiterState
        ? orbiterCameraCoords(orbiterState)
        : get().lastFocus?.coordinates;
    const peekAlt = mission
      ? missionPeekAltitude(mission)
      : orbiterState
        ? orbiterPeekAltitude(orbiterState, planetRadiusKm)
        : get().lastFocus?.altitude ?? 2.1;

    set({
      selectedMissionId: null,
      selectedOrbiterId: null,
      hoveredMissionId: selectedMissionId,
      hoveredOrbiterId: selectedOrbiterId,
      mobileDossierExpanded: false,
      cameraTarget: peekCoords
        ? { coordinates: peekCoords, altitude: peekAlt, token: Date.now() }
        : null,
      lastFocus: peekCoords ? { coordinates: peekCoords, altitude: peekAlt } : get().lastFocus,
    });
  },

  clearSurfacePreview: () =>
    set({ hoveredMissionId: null, hoveredOrbiterId: null }),

  setMobileDossierExpanded: (expanded) => set({ mobileDossierExpanded: expanded }),

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
      lastFocus: { coordinates, altitude },
      focusedMoonId: null,
    }),

  focusMoon: (moonId) =>
    set({
      focusedMoonId: moonId,
      selectedMissionId: null,
      selectedOrbiterId: null,
      // Cancel any pending lat/lng fly-to when framing a moon.
      cameraTarget: moonId ? null : get().cameraTarget,
    }),

  setActiveEvent: (eventId) => set({ activeEventId: eventId }),

  toggleChronologyReversed: () =>
    set((s) => ({ chronologyReversed: !s.chronologyReversed })),
}));
