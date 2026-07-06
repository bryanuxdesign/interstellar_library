import { formatLifespan } from '@/utils/format';

interface LifespanBarProps {
  planned: number;
  actual: number | null;
}

export function LifespanBar({ planned, actual }: LifespanBarProps) {
  const actualDays = actual ?? planned;
  const max = Math.max(planned, actualDays, 1);
  const plannedPct = (planned / max) * 100;
  const actualPct = (actualDays / max) * 100;
  const outlived = actual !== null && actual > planned;
  const cutShort = actual !== null && actual < planned;

  const actualColor = outlived ? '#22e06b' : cutShort ? '#ff453a' : '#9aa0aa';

  return (
    <div className="flex flex-col gap-3 py-3">
      <span className="eyebrow">Operational Lifespan</span>

      <div className="flex flex-col gap-2">
        <Row label="Planned" pct={plannedPct} color="#6b7280" value={formatLifespan(planned)} />
        <Row
          label="Actual"
          pct={actualPct}
          color={actualColor}
          value={formatLifespan(actual)}
        />
      </div>

      {outlived && planned > 0 && (
        <span className="tabular text-[10px] text-active">
          Outlived its planned mission by {Math.round((actualDays / planned - 1) * 100)}%
        </span>
      )}
      {cutShort && planned > 0 && (
        <span className="tabular text-[10px] text-alert">
          Ended before reaching {Math.round((1 - actualDays / planned) * 100)}% of plan
        </span>
      )}
    </div>
  );
}

function Row({
  label,
  pct,
  color,
  value,
}: {
  label: string;
  pct: number;
  color: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
        />
      </div>
      <span className="tabular w-20 text-right text-[11px] text-ink-soft">{value}</span>
    </div>
  );
}
