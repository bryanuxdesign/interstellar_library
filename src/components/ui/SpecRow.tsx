interface SpecRowProps {
  label: string;
  value: string;
  accent?: string;
}

export function SpecRow({ label, value, accent }: SpecRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-sharp py-3 last:border-b-0">
      <span className="eyebrow">{label}</span>
      <span
        className="tabular text-sm text-ink"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
