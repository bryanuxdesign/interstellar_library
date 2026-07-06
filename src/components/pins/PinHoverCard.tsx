import type { Mission } from '@/types';
import { STATUS_COLORS } from '@/three/constants';

const STATUS_LABEL: Record<Mission['status'], string> = {
  active: 'Transmitting',
  decommissioned: 'Dormant',
  impact: 'Impact Site',
};

export function PinHoverCard({ mission }: { mission: Mission }) {
  const color = STATUS_COLORS[mission.status];

  return (
    <div
      className="pointer-events-none w-52 -translate-x-1/2 -translate-y-[calc(100%+18px)] rounded-md border border-strong bg-[#0d0d10]/95 px-3 py-2.5 shadow-2xl backdrop-blur"
      style={{ borderColor: `${color}44` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span className="truncate text-[13px] font-semibold text-ink">
          {mission.name}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-soft">{mission.classification}</span>
        <span
          className="tabular text-[10px] uppercase tracking-wider"
          style={{ color }}
        >
          {STATUS_LABEL[mission.status]}
        </span>
      </div>
      <div className="mt-1 truncate text-[10px] text-ink-faint">
        {mission.healthStatus}
      </div>
    </div>
  );
}
