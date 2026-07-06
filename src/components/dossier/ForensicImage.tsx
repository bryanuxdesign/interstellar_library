import { useState } from 'react';
import { formatCoordinates } from '@/utils/format';
import type { Coordinates } from '@/types';

interface ForensicImageProps {
  src: string;
  caption: string;
  coordinates: Coordinates;
}

export function ForensicImage({ src, caption, coordinates }: ForensicImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-md border border-alert/30">
      <div className="relative aspect-video w-full bg-black">
        {failed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,rgba(255,69,58,0.12),transparent_70%)]">
            <span className="eyebrow text-alert">Reconnaissance Pending</span>
            <span className="tabular text-[11px] text-ink-faint">
              {formatCoordinates(coordinates)}
            </span>
          </div>
        ) : (
          <img
            src={src}
            alt={caption}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-wider text-alert">
          ● Orbital Recon
        </span>
      </div>
      <p className="bg-black/40 px-3 py-2 text-[10px] leading-relaxed text-ink-faint">
        {caption}
      </p>
    </div>
  );
}
