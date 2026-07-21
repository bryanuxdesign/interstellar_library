import { useEffect, useState } from 'react';
import {
  isLocalDaytime,
  observerCoordsFromTimezone,
  subsolarPointEarth,
} from '@/solar/sunLighting';

function formatUtc(d: Date): string {
  return d.toISOString().slice(11, 19) + 'Z';
}

/**
 * Live day/night readout for Earth (timezone observer) or generic UTC clock
 * for other archives.
 */
export function SolarIlluminationBadge({ planetId }: { planetId: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (planetId === 'sun') return null;

  if (planetId === 'earth') {
    const obs = observerCoordsFromTimezone(now);
    const day = isLocalDaytime(obs.lat, obs.lng, now);
    const sub = subsolarPointEarth(now);
    return (
      <div
        className="pointer-events-none rounded-sm border border-white/12 bg-black/55 px-2.5 py-1.5 text-[11px] tracking-wide text-ink-soft backdrop-blur-sm"
        title={`Timezone ≈ ${obs.lng.toFixed(1)}°E, ${obs.lat.toFixed(0)}°N · Subsolar ${sub.lat.toFixed(1)}°, ${sub.lng.toFixed(1)}°E`}
      >
        <span className={day ? 'text-amber-200' : 'text-sky-200'}>
          Local · {day ? 'day' : 'night'}
        </span>
        <span className="mx-1.5 text-ink-faint">·</span>
        <span className="font-mono text-ink-faint">{formatUtc(now)}</span>
      </div>
    );
  }

  return (
    <div className="pointer-events-none rounded-sm border border-white/12 bg-black/55 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-ink-faint backdrop-blur-sm">
      Sun · live · {formatUtc(now)}
    </div>
  );
}
