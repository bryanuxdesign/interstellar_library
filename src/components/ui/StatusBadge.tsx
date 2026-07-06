import type { AssetStatus } from '@/types';
import { STATUS_COLORS } from '@/three/constants';

const STATUS_META: Record<AssetStatus, { label: string }> = {
  active: { label: 'Active Link' },
  decommissioned: { label: 'Decommissioned' },
  impact: { label: 'Impact Site' },
  planned: { label: 'Planned' },
};

export function StatusBadge({
  status,
  pulse = false,
}: {
  status: AssetStatus;
  pulse?: boolean;
}) {
  const color = STATUS_COLORS[status];
  const { label } = STATUS_META[status];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
      style={{ borderColor: `${color}55`, color, backgroundColor: `${color}12` }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && status === 'active' && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </span>
      {label}
    </span>
  );
}
