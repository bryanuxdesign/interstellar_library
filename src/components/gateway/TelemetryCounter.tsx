import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const progress = Math.min((t - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

interface TelemetryCounterProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accent?: string;
  compact?: boolean;
}

export function TelemetryCounter({
  label,
  value,
  suffix,
  decimals = 0,
  accent,
  compact = false,
}: TelemetryCounterProps) {
  const animated = useCountUp(value);
  const display = animated.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="eyebrow truncate">{label}</span>
      <span
        className={`tabular font-bold leading-none text-ink ${
          compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'
        }`}
        style={accent ? { color: accent } : undefined}
      >
        {display}
        {suffix && (
          <span className={`ml-1 text-ink-soft ${compact ? 'text-sm' : 'text-lg'}`}>
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
