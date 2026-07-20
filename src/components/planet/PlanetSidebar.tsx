import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AssetStatus, CelestialBody, Mission } from '@/types';
import { useAppStore, ALL_STATUSES } from '@/store/useAppStore';
import { STATUS_COLORS, ORBITER_COLOR } from '@/three/constants';
import { computeTelemetry } from '@/data/telemetry';
import { getOrbitersByPlanet } from '@/data/orbiters';
import {
  formatMoonPeriod,
  moonsForPlanet,
  type PlanetMoonDef,
} from '@/data/planetMoons';
import { formatMass } from '@/utils/format';
import { countryFlag } from '@/utils/flags';
import { useLiveOrbiterStates } from '@/utils/useLiveOrbiterStates';
import { ChronologyToggle } from '@/components/ui/ChronologyToggle';
import { isRoverClassification } from '@/data/roverTraverses';
import { useRoverTraverses } from '@/utils/useRoverTraverses';
import { missionCameraAltitude, missionCameraTarget } from '@/utils/missionCamera';
import { orbiterAltitudeMultiplier } from '@/utils/orbiterCamera';

const STATUS_LABEL: Record<AssetStatus, string> = {
  active: 'Active',
  decommissioned: 'Retired',
  impact: 'Impacts',
  planned: 'Planned',
};

const MOON_ACCENT = '#a8b4c4';

type SidebarSection = 'moons' | 'orbiters' | 'missions';

interface PlanetSidebarProps {
  planet: CelestialBody;
  missions: Mission[];
}

export function PlanetSidebar({ planet, missions }: PlanetSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const fromPath =
    (location.state as { from?: unknown } | null)?.from === '/solar-system'
      ? '/solar-system'
      : '/';
  const backLabel = fromPath === '/solar-system' ? '← Solar System' : '← Gateway';

  const visibleStatuses = useAppStore((s) => s.visibleStatuses);
  const toggleStatus = useAppStore((s) => s.toggleStatus);
  const selectMission = useAppStore((s) => s.selectMission);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const flyTo = useAppStore((s) => s.flyTo);
  const chronologyReversed = useAppStore((s) => s.chronologyReversed);
  const showOrbiters = useAppStore((s) => s.showOrbiters);
  const toggleShowOrbiters = useAppStore((s) => s.toggleShowOrbiters);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const setHoveredOrbiter = useAppStore((s) => s.setHoveredOrbiter);
  const selectOrbiter = useAppStore((s) => s.selectOrbiter);
  const focusedMoonId = useAppStore((s) => s.focusedMoonId);
  const focusMoon = useAppStore((s) => s.focusMoon);
  const lastFocus = useAppStore((s) => s.lastFocus);

  const orbiters = useMemo(() => getOrbitersByPlanet(planet.id), [planet.id]);
  const orbiterStates = useLiveOrbiterStates(orbiters);
  const moons = useMemo(() => moonsForPlanet(planet.id), [planet.id]);
  const hasOrbiters = orbiters.length > 0;
  const hasMoons = moons.length > 0;
  const hasAccordion = hasOrbiters || hasMoons;

  const [expandedSection, setExpandedSection] = useState<SidebarSection>(() =>
    moons.length > 0 && missions.length === 0 ? 'moons' : 'missions',
  );

  // Reset accordion when switching archive worlds.
  useEffect(() => {
    setExpandedSection(hasMoons && missions.length === 0 ? 'moons' : 'missions');
  }, [planet.id, hasMoons, missions.length]);

  /** Accordion: one open section among moons / orbiters / missions. */
  const handleSectionClick = (section: SidebarSection) => {
    if (!hasAccordion) return;
    setExpandedSection((current) => {
      if (current === section) {
        if (section === 'missions') return hasMoons ? 'moons' : hasOrbiters ? 'orbiters' : 'missions';
        return 'missions';
      }
      return section;
    });
  };

  const moonsExpanded = hasMoons && expandedSection === 'moons';
  const orbitersExpanded = hasOrbiters && expandedSection === 'orbiters';
  const missionsExpanded = !hasAccordion || expandedSection === 'missions';

  const telemetry = useMemo(() => computeTelemetry(planet.id), [planet.id]);

  const visibleMissions = useMemo(
    () =>
      missions
        .filter((m) => visibleStatuses.includes(m.status))
        .sort((a, b) => {
          const cmp = a.landingDate.localeCompare(b.landingDate);
          return chronologyReversed ? -cmp : cmp;
        }),
    [missions, visibleStatuses, chronologyReversed],
  );

  const roverMissionIds = useMemo(
    () =>
      planet.id === 'mars'
        ? visibleMissions
            .filter((m) => isRoverClassification(m.classification))
            .map((m) => m.id)
        : [],
    [visibleMissions, planet.id],
  );
  const roverTraverses = useRoverTraverses(roverMissionIds);

  const handleSelect = (mission: Mission) => {
    const traverse = roverTraverses.get(mission.id) ?? null;
    selectMission(mission.id);
    flyTo(
      missionCameraTarget(mission, traverse),
      missionCameraAltitude(mission, traverse),
    );
    setOpen(false);
  };

  const handleSelectOrbiter = (orbiterId: string) => {
    const state = orbiterStates.get(orbiterId);
    const orbiter = orbiters.find((o) => o.id === orbiterId);
    if (!state || !orbiter) return;
    selectOrbiter(orbiterId);
    flyTo(
      { lat: state.lat, lng: state.lng },
      orbiterAltitudeMultiplier(state, planet.id),
    );
    setOpen(false);
  };

  const handleSelectMoon = (moon: PlanetMoonDef) => {
    focusMoon(moon.id);
    setOpen(false);
  };

  const handleFocusPlanet = () => {
    focusMoon(null);
    flyTo(
      lastFocus?.coordinates ?? { lat: 0, lng: 0 },
      lastFocus?.altitude ?? 2.4,
    );
    setOpen(false);
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close mission registry' : 'Open mission registry'}
        aria-expanded={open}
        className="absolute left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-strong bg-panel text-ink backdrop-blur transition hover:border-active lg:hidden"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <motion.aside
        initial={{ x: -32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`absolute left-0 top-0 z-20 flex h-full w-[280px] flex-col border-r border-sharp bg-panel backdrop-blur-xl transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-sharp p-5 pt-14 lg:pt-5">
          <button
            type="button"
            onClick={() => navigate(fromPath)}
            className="eyebrow mb-4 transition hover:text-active"
          >
            {backLabel}
          </button>
          <h2 className="text-2xl font-bold text-ink">{planet.name}</h2>
          <p className="mt-1 text-[11px] text-ink-faint">{planet.subtitle}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Landings" value={telemetry.successfulLandings} />
            <MiniStat label="Active" value={telemetry.activeAssets} accent="#22e06b" />
            <MiniStat label="Impacts" value={telemetry.impactSites} accent="#ff453a" />
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
            {telemetry.agencies} agencies · {formatMass(telemetry.totalMassKg)} on the surface
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 border-b border-sharp p-4">
          {ALL_STATUSES.map((status) => {
            const active = visibleStatuses.includes(status);
            const color = STATUS_COLORS[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className="rounded-full border px-3 py-1 text-[11px] font-medium transition"
                style={{
                  borderColor: active ? `${color}66` : 'rgba(255,255,255,0.1)',
                  color: active ? color : '#6b7280',
                  backgroundColor: active ? `${color}14` : 'transparent',
                }}
              >
                {STATUS_LABEL[status]}
              </button>
            );
          })}
        </div>

        {/* Collapsible registry sections */}
        <div className="flex min-h-0 flex-1 flex-col">
          {hasMoons && (
            <section
              className={`flex flex-col border-b border-sharp ${
                moonsExpanded ? 'min-h-0 flex-1' : 'shrink-0'
              }`}
            >
              <div className="flex shrink-0 items-center justify-between px-4 py-2">
                <button
                  type="button"
                  onClick={() => handleSectionClick('moons')}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-80"
                >
                  <Chevron open={moonsExpanded} />
                  <span className="eyebrow">Moons</span>
                  <span className="font-mono text-[9px] text-ink-faint">{moons.length}</span>
                </button>
                {focusedMoonId && (
                  <button
                    type="button"
                    onClick={handleFocusPlanet}
                    className="ml-2 shrink-0 rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-ink-faint transition hover:border-white/30 hover:text-ink"
                  >
                    Focus {planet.name}
                  </button>
                )}
              </div>
              {moonsExpanded && (
                <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-28 lg:pb-2">
                  {moons.map((moon) => {
                    const selected = focusedMoonId === moon.id;
                    return (
                      <button
                        key={moon.id}
                        type="button"
                        onClick={() => handleSelectMoon(moon)}
                        className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
                          selected ? 'bg-raised' : 'hover:bg-white/5'
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: MOON_ACCENT }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink">
                            {moon.name}
                          </span>
                          <span className="block truncate text-[10px] text-ink-faint">
                            {Math.round(moon.semiMajorKm).toLocaleString()} km
                            {moon.inclinationDeg >= 90 ? ' · retrograde' : ''}
                          </span>
                        </span>
                        <span className="tabular text-right text-[9px] leading-tight text-ink-faint">
                          {formatMoonPeriod(moon.periodHours)}
                        </span>
                      </button>
                    );
                  })}
                  <p className="px-3 py-2 text-[9px] leading-relaxed text-ink-faint">
                    Real-time sidereal orbits from J2000 elements — motion is archive-accurate (nearly still over short views).
                  </p>
                </div>
              )}
            </section>
          )}

          {hasOrbiters && (
            <section
              className={`flex flex-col border-b border-sharp ${
                orbitersExpanded ? 'min-h-0 flex-1' : 'shrink-0'
              }`}
            >
              <div className="flex shrink-0 items-center justify-between px-4 py-2">
                <button
                  type="button"
                  onClick={() => handleSectionClick('orbiters')}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-80"
                >
                  <Chevron open={orbitersExpanded} />
                  <span className="eyebrow">In Orbit</span>
                  <span className="font-mono text-[9px] text-ink-faint">{orbiters.length}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleShowOrbiters}
                  className="ml-2 shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition"
                  style={{
                    borderColor: showOrbiters ? `${ORBITER_COLOR}66` : 'rgba(255,255,255,0.1)',
                    color: showOrbiters ? ORBITER_COLOR : '#6b7280',
                    backgroundColor: showOrbiters ? `${ORBITER_COLOR}14` : 'transparent',
                  }}
                >
                  {showOrbiters ? 'Live' : 'Hidden'}
                </button>
              </div>
              {orbitersExpanded && (
                <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-28 lg:pb-2">
                  {orbiters.map((orbiter) => {
                    const state = orbiterStates.get(orbiter.id);
                    const selected = selectedOrbiterId === orbiter.id;
                    return (
                      <button
                        key={orbiter.id}
                        type="button"
                        onClick={() => handleSelectOrbiter(orbiter.id)}
                        onMouseEnter={() => setHoveredOrbiter(orbiter.id)}
                        onMouseLeave={() => setHoveredOrbiter(null)}
                        className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
                          selected ? 'bg-raised' : 'hover:bg-white/5'
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ORBITER_COLOR }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink">
                            {orbiter.name}
                          </span>
                          <span className="block truncate text-[10px] text-ink-faint">
                            {countryFlag(orbiter.country)} {orbiter.agency}
                          </span>
                        </span>
                        {state && (
                          <span className="tabular text-right text-[9px] leading-tight text-ink-faint">
                            {Math.round(state.altKm)} km
                            <br />
                            {state.periodMinutes.toFixed(0)} min
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <p className="px-3 py-2 text-[9px] leading-relaxed text-ink-faint">
                    Positions computed from published orbital elements — approximate.
                  </p>
                </div>
              )}
            </section>
          )}

          <section
            className={`flex flex-col ${
              missionsExpanded ? 'min-h-0 flex-1' : 'shrink-0 border-t border-sharp'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-sharp px-4 py-2">
              <button
                type="button"
                onClick={() => handleSectionClick('missions')}
                className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
                  hasAccordion ? 'transition hover:opacity-80' : 'cursor-default'
                }`}
              >
                {hasAccordion && <Chevron open={missionsExpanded} />}
                <span className="eyebrow">Mission Registry</span>
                <span className="font-mono text-[9px] text-ink-faint">{visibleMissions.length}</span>
              </button>
              {missionsExpanded && <ChronologyToggle compact />}
            </div>
            {missionsExpanded && (
              <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-28 lg:pb-2">
                {visibleMissions.map((mission) => {
                  const color = STATUS_COLORS[mission.status];
                  const selected = selectedMissionId === mission.id;
                  const traverse = roverTraverses.get(mission.id);
                  return (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => handleSelect(mission)}
                      onMouseEnter={() => setHoveredMission(mission.id)}
                      onMouseLeave={() => setHoveredMission(null)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
                        selected ? 'bg-raised' : 'hover:bg-white/5'
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">
                          {mission.name}
                        </span>
                        <span className="block truncate text-[10px] text-ink-faint">
                          {countryFlag(mission.country)} {mission.country} · {mission.classification}
                        </span>
                        {traverse && (
                          <span className="block truncate text-[9px] text-ink-faint">
                            {traverse.totalDistanceKm.toFixed(1)} km
                            {traverse.lastDriveSol != null ? ` · Sol ${traverse.lastDriveSol}` : ''}
                          </span>
                        )}
                      </span>
                      <span className="tabular text-[10px] text-ink-faint">
                        {mission.landingDate.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
                {visibleMissions.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-ink-faint">
                    {missions.length === 0
                      ? 'Globe view live — surface catalogue coming later.'
                      : 'No hardware matches the active filters.'}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </motion.aside>
    </>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={`shrink-0 text-ink-faint transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden
    >
      <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 overflow-hidden rounded-md border border-sharp bg-black/20 px-2.5 py-2.5">
      <span
        className="tabular text-xl font-bold leading-none text-ink"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      <span className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-ink-faint">
        {label}
      </span>
    </div>
  );
}
