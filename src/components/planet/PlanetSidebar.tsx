import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AssetStatus, CelestialBody, Mission } from '@/types';
import { useAppStore, ALL_STATUSES } from '@/store/useAppStore';
import { STATUS_COLORS } from '@/three/constants';
import { computeTelemetry } from '@/data/telemetry';
import { formatMass } from '@/utils/format';
import { countryFlag } from '@/utils/flags';

const STATUS_LABEL: Record<AssetStatus, string> = {
  active: 'Active',
  decommissioned: 'Retired',
  impact: 'Impacts',
};

interface PlanetSidebarProps {
  planet: CelestialBody;
  missions: Mission[];
}

export function PlanetSidebar({ planet, missions }: PlanetSidebarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visibleStatuses = useAppStore((s) => s.visibleStatuses);
  const toggleStatus = useAppStore((s) => s.toggleStatus);
  const selectMission = useAppStore((s) => s.selectMission);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const flyTo = useAppStore((s) => s.flyTo);

  const telemetry = useMemo(() => computeTelemetry(planet.id), [planet.id]);

  const visibleMissions = useMemo(
    () =>
      missions
        .filter((m) => visibleStatuses.includes(m.status))
        .sort((a, b) => a.landingDate.localeCompare(b.landingDate)),
    [missions, visibleStatuses],
  );

  const handleSelect = (mission: Mission) => {
    selectMission(mission.id);
    flyTo(mission.coordinates);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute left-4 top-4 z-30 rounded-md border border-strong bg-panel px-3 py-2 text-xs text-ink backdrop-blur lg:hidden"
      >
        {open ? 'Close' : 'Registry'}
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
            onClick={() => navigate('/')}
            className="eyebrow mb-4 transition hover:text-active"
          >
            ← Gateway
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

        {/* Mission registry */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-28 lg:pb-2">
          {visibleMissions.map((mission) => {
            const color = STATUS_COLORS[mission.status];
            const selected = selectedMissionId === mission.id;
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
                </span>
                <span className="tabular text-[10px] text-ink-faint">
                  {mission.landingDate.slice(0, 4)}
                </span>
              </button>
            );
          })}
          {visibleMissions.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-faint">
              No hardware matches the active filters.
            </p>
          )}
        </div>
      </motion.aside>
    </>
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
