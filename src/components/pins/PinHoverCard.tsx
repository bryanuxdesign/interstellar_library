import type { Mission } from '@/types';
import type { RoverTraverseRecord } from '@/types';
import { isRoverClassification } from '@/data/roverTraverses';
import { STATUS_COLORS, VISUAL_FLYBY_ALT_KM } from '@/three/constants';
import { countryFlag } from '@/utils/flags';

const STATUS_LABEL: Record<Mission['status'], string> = {
  active: 'Transmitting',
  decommissioned: 'Dormant',
  impact: 'Impact Site',
  planned: 'Planned Landing',
};

const FLYBY_STATUS_LABEL: Record<Mission['status'], string> = {
  active: 'In Transit',
  decommissioned: 'Flyby Complete',
  impact: 'Flyby Complete',
  planned: 'Planned Flyby',
};

interface PinHoverCardProps {
  mission: Mission;
  traverse?: RoverTraverseRecord | null;
}

export function PinHoverCard({ mission, traverse = null }: PinHoverCardProps) {
  const color = STATUS_COLORS[mission.status];
  const isFlyby = mission.classification === 'Flyby';
  const isRover = isRoverClassification(mission.classification);
  const statusLabel = isFlyby ? FLYBY_STATUS_LABEL[mission.status] : STATUS_LABEL[mission.status];

  return (
    <div className="pointer-events-none w-44 -translate-x-1/2 -translate-y-[calc(100%+14px)] overflow-hidden rounded-md border border-strong bg-[#0d0d10]/95 shadow-2xl backdrop-blur">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5"
        style={{ borderBottom: `1px solid ${color}33` }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="truncate text-[12px] font-semibold leading-tight text-ink">
          {mission.name}
        </span>
      </div>

      <div className="px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-ink-soft">
            {countryFlag(mission.country)} {mission.classification}
          </span>
          <span
            className="shrink-0 font-mono text-[9px] uppercase tracking-wider"
            style={{ color }}
          >
            {statusLabel}
          </span>
        </div>
        {isFlyby && mission.closestApproachKm != null && (
          <div className="mt-1 text-[9px] leading-snug text-ink-faint">
            Closest approach:{' '}
            <span className="text-ink-soft">
              {mission.closestApproachKm.toLocaleString()} km
            </span>
            <span className="text-ink-faint"> · track at {VISUAL_FLYBY_ALT_KM} km alt.</span>
          </div>
        )}
        {isRover && traverse && (
          <div className="mt-1 text-[9px] leading-snug text-ink-faint">
            {mission.status === 'active' ? 'Last known' : 'Retired at'} · Sol{' '}
            {traverse.lastDriveSol ?? '—'}
            <br />
            <span className="text-ink-soft">{traverse.totalDistanceKm.toFixed(1)} km driven</span>
          </div>
        )}
        <div className="mt-1 flex items-baseline gap-1 text-[9px] leading-snug">
          <span className="shrink-0 text-ink-faint">
            {mission.status === 'active' ? 'Status' : 'Cause'}:
          </span>
          <span className="text-ink-soft">{mission.healthStatus}</span>
        </div>
      </div>
    </div>
  );
}
