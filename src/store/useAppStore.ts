import { create } from 'zustand';
import type { AssetStatus, Coordinates } from '@/types';
import type { Artemis2CameraMode, Artemis2TimelineSpeed } from '@/data/demos/artemis2';
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
  /** One-shot Artemis II free-return demo on the Earth archive. */
  artemis2DemoPlaying: boolean;
  artemis2DemoPhase: string | null;
  artemis2CameraMode: Artemis2CameraMode;
  artemis2TimelineSpeed: Artemis2TimelineSpeed;
  /** Archive Earth atmosphere FX: drifting clouds + 3D polar auroras. */
  earthAtmosphereEnabled: boolean;

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
  startArtemis2Demo: () => void;
  stopArtemis2Demo: () => void;
  setArtemis2DemoPhase: (phase: string | null) => void;
  setArtemis2CameraMode: (mode: Artemis2CameraMode) => void;
  setArtemis2TimelineSpeed: (speed: Artemis2TimelineSpeed) => void;
  setEarthAtmosphereEnabled: (enabled: boolean) => void;
  toggleEarthAtmosphere: () => void;
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
  artemis2DemoPlaying: false,
  artemis2DemoPhase: null,
  artemis2CameraMode: 'capsule',
  artemis2TimelineSpeed: '2min',
  earthAtmosphereEnabled: true,

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
      artemis2DemoPlaying: false,
      artemis2DemoPhase: null,
    });
  },

  setHoveredMission: (missionId) => set({ hoveredMissionId: missionId }),

  selectMission: (missionId) => {
    const mission = missionId ? getMissionById(missionId) : undefined;
    // Earth+Moon shared scene: keep camera on orbiting Luna while opening lunar dossiers.
    const keepLuna =
      get().focusedMoonId === 'luna' && mission?.planetId === 'moon';
    set({
      selectedMissionId: missionId,
      selectedOrbiterId: null,
      focusedMoonId: keepLuna ? 'luna' : null,
    });
  },

  setHoveredOrbiter: (orbiterId) => set({ hoveredOrbiterId: orbiterId }),

  selectOrbiter: (orbiterId) => {
    const orbiter = orbiterId ? getOrbiterById(orbiterId) : undefined;
    const keepLuna =
      get().focusedMoonId === 'luna' && orbiter?.planetId === 'moon';
    set({
      selectedOrbiterId: orbiterId,
      selectedMissionId: null,
      focusedMoonId: keepLuna ? 'luna' : null,
    });
  },

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

  flyTo: (coordinates, altitude = 1.35) => {
    // Preserve Luna camera focus on the shared Earth+Moon scene.
    const keepLuna = get().focusedMoonId === 'luna';
    set({
      cameraTarget: { coordinates, altitude, token: Date.now() },
      lastFocus: { coordinates, altitude },
      focusedMoonId: keepLuna ? 'luna' : null,
    });
  },

  focusMoon: (moonId) =>
    set({
      focusedMoonId: moonId,
      selectedMissionId: null,
      selectedOrbiterId: null,
      // Cancel any pending lat/lng fly-to when framing a moon.
      cameraTarget: moonId ? null : get().cameraTarget,
      // Moon focus interrupts the demo.
      artemis2DemoPlaying: moonId ? false : get().artemis2DemoPlaying,
      artemis2DemoPhase: moonId ? null : get().artemis2DemoPhase,
    }),

  startArtemis2Demo: () =>
    set({
      artemis2DemoPlaying: true,
      artemis2DemoPhase: 'Liftoff · Kennedy Space Center',
      focusedMoonId: null,
      selectedMissionId: null,
      selectedOrbiterId: null,
      hoveredMissionId: null,
      hoveredOrbiterId: null,
      cameraTarget: null,
      mobileDossierExpanded: false,
    }),

  stopArtemis2Demo: () =>
    set({
      artemis2DemoPlaying: false,
      artemis2DemoPhase: null,
    }),

  setArtemis2DemoPhase: (phase) => set({ artemis2DemoPhase: phase }),

  setArtemis2CameraMode: (mode) => set({ artemis2CameraMode: mode }),

  setArtemis2TimelineSpeed: (speed) => set({ artemis2TimelineSpeed: speed }),

  setEarthAtmosphereEnabled: (enabled) => set({ earthAtmosphereEnabled: enabled }),

  toggleEarthAtmosphere: () =>
    set((s) => {
      const next = !s.earthAtmosphereEnabled;
      // #region agent log
      fetch('http://127.0.0.1:7748/ingest/92ebdb4b-815e-448e-88c6-e9201bea4257', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '70c770' },
        body: JSON.stringify({
          sessionId: '70c770',
          runId: 'atm-1',
          hypothesisId: 'H1-ATM-TOGGLE',
          location: 'useAppStore.ts:toggleEarthAtmosphere',
          message: 'User toggled atmosphere',
          data: { from: s.earthAtmosphereEnabled, to: next },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return { earthAtmosphereEnabled: next };
    }),

  setActiveEvent: (eventId) => set({ activeEventId: eventId }),

  toggleChronologyReversed: () =>
    set((s) => ({ chronologyReversed: !s.chronologyReversed })),
}));
