import { useMemo, useState } from 'react';
import type { MissionImage } from '@/types';
import { ImageLightbox } from './ImageLightbox';

interface VehicleGalleryProps {
  images: MissionImage[];
  missionName: string;
}

export function VehicleGallery({ images, missionName }: VehicleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const available = useMemo(
    () => images.filter((img) => !failedUrls.has(img.url)),
    [images, failedUrls],
  );

  const markFailed = (url: string) =>
    setFailedUrls((prev) => new Set(prev).add(url));

  if (available.length === 0 && images.length > 0) return null;
  if (available.length === 0) return null;

  const primary = available[0];
  const lightboxImage =
    activeIndex !== null ? available[activeIndex] : null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Vehicle Imagery</span>
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="text-[10px] text-active transition hover:underline"
        >
          View fullscreen
        </button>
      </div>

      <button
        type="button"
        onClick={() => setActiveIndex(0)}
        className="group relative block w-full overflow-hidden rounded-md border border-sharp bg-black text-left transition hover:border-active/40"
        aria-label={`View fullscreen image of ${missionName}`}
      >
        <div className="relative aspect-[4/3] w-full">
          <img
            src={primary.url}
            alt={primary.caption}
            loading="lazy"
            onError={() => markFailed(primary.url)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[11px] text-ink opacity-0 backdrop-blur transition group-hover:opacity-100">
              <ExpandIcon />
              Expand
            </span>
          </div>
        </div>
        <p className="border-t border-sharp bg-black/30 px-3 py-2 text-[10px] leading-relaxed text-ink-faint line-clamp-2">
          {primary.caption}
        </p>
      </button>

      {available.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {available.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border transition ${
                i === 0
                  ? 'border-active ring-1 ring-active/50'
                  : 'border-sharp hover:border-strong'
              }`}
              aria-label={`View image ${i + 1} of ${available.length}`}
            >
              <img
                src={img.url}
                alt=""
                loading="lazy"
                onError={() => markFailed(img.url)}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {activeIndex !== null && lightboxImage && (
        <ImageLightbox
          images={available}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
    </svg>
  );
}
