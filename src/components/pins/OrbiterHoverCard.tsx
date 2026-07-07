import type { OrbitalAsset, OrbitalState } from '@/types';

interface OrbiterHoverCardProps {
  orbiter: OrbitalAsset;
  state: OrbitalState;
}

export function OrbiterHoverCard({ orbiter, state }: OrbiterHoverCardProps) {
  return (
    <div className="pointer-events-none w-52 rounded-lg border border-sharp bg-deep/90 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-semibold text-ink">{orbiter.name}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-faint">
        {orbiter.agency} · In orbit
      </p>
      <div className="mt-2 space-y-1 border-t border-sharp pt-2">
        <Row label="Altitude" value={`${Math.round(state.altKm)} km`} />
        <Row label="Period" value={`${state.periodMinutes.toFixed(0)} min`} />
        <Row label="Lat / Lng" value={`${state.lat.toFixed(1)}°, ${state.lng.toFixed(1)}°`} />
      </div>
      <p className="mt-2 text-[8px] leading-relaxed text-ink-faint">
        Position from published orbital elements — approximate.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-[10px]">
      <span className="text-ink-faint">{label}</span>
      <span className="tabular text-ink-soft">{value}</span>
    </div>
  );
}
