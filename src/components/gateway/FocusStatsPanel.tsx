import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CelestialBody } from '@/types';
import { computeTelemetry } from '@/data/telemetry';
import { getMissionsByPlanet } from '@/data/missions';
import { TelemetryCounter } from './TelemetryCounter';
import { formatMass } from '@/utils/format';

interface FocusStatsPanelProps {
  planet: CelestialBody;
  onEnter: () => void;
  departing: boolean;
}

export function FocusStatsPanel({ planet, onEnter, departing }: FocusStatsPanelProps) {
  const telemetry = useMemo(() => computeTelemetry(planet.id), [planet.id]);
  const missions = useMemo(() => getMissionsByPlanet(planet.id), [planet.id]);
  const planned = useMemo(
    () => missions.filter((m) => m.status === 'planned').length,
    [missions],
  );
  const catalogued = missions.length;

  return (
    <motion.div
      layout
      className="w-full max-w-3xl rounded-xl border border-sharp bg-deep/60 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: departing ? 0 : 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="eyebrow text-active">Surface Telemetry</span>
          <h2 className="mt-1 truncate text-lg font-bold text-ink sm:text-xl">
            {planet.name}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            {planet.available
              ? `${catalogued} missions catalogued · ${telemetry.agencies} agencies · ${telemetry.firstEventYear}–${telemetry.latestEventYear}`
              : 'Exploration archive in development — surface hardware mapping begins in a future release.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onEnter}
          disabled={!planet.available || departing}
          className={`shrink-0 self-start rounded-md border px-4 py-2 text-xs font-medium transition ${
            planet.available
              ? 'border-active/50 bg-active/10 text-active hover:bg-active/20'
              : 'cursor-not-allowed border-sharp text-ink-faint'
          }`}
        >
          {planet.available ? 'Enter Archive →' : 'Coming Soon'}
        </button>
      </div>

      {planet.available ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <TelemetryCounter
            label="Landed"
            value={telemetry.successfulLandings}
            accent="#22e06b"
            compact
          />
          <TelemetryCounter
            label="Active"
            value={telemetry.activeAssets}
            accent="#22e06b"
            compact
          />
          <TelemetryCounter
            label="Planned"
            value={planned}
            accent="#6b9fff"
            compact
          />
          <TelemetryCounter
            label="Impacts"
            value={telemetry.impactSites}
            accent="#ff453a"
            compact
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <TelemetryCounter label="Landed" value={0} compact />
          <TelemetryCounter label="Active" value={0} compact />
          <TelemetryCounter label="Planned" value={0} compact />
          <TelemetryCounter label="Impacts" value={0} compact />
        </div>
      )}

      {planet.available && (
        <p className="mt-4 border-t border-sharp pt-3 text-[10px] text-ink-faint">
          {formatMass(telemetry.totalMassKg)} of hardware on the surface ·{' '}
          {planned > 0
            ? `${planned} future landing${planned === 1 ? '' : 's'} charted`
            : 'No planned landers in catalogue'}
          <span className="text-ink-soft">
            {' '}
            · Click {planet.name} again to open the mission globe
          </span>
        </p>
      )}
    </motion.div>
  );
}
