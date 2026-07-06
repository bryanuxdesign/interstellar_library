import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { MissionImage } from '@/types';

interface ImageLightboxProps {
  images: MissionImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const image = images[index];
  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) goPrev();
      if (e.key === 'ArrowRight' && hasMultiple) goNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext, hasMultiple]);

  if (!image) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex flex-col bg-black/96 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen vehicle image"
        onClick={onClose}
      >
        {/* Top bar */}
        <div
          className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 sm:px-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0 flex-1 pr-4">
            <span className="eyebrow text-ink-soft">Vehicle Imagery — Fullscreen</span>
            {hasMultiple && (
              <span className="tabular ml-2 text-[11px] text-ink-faint">
                {index + 1} / {images.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-md border border-strong px-4 py-2 text-xs text-ink-soft transition hover:border-active hover:text-active"
            aria-label="Minimize fullscreen view"
          >
            <MinimizeIcon />
            Minimize
          </button>
        </div>

        {/* Image stage — generous padding for true fullscreen feel */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-8 py-8 sm:px-16 sm:py-12 md:px-24"
          onClick={(e) => e.stopPropagation()}
        >
          {hasMultiple && (
            <NavButton dir="prev" onClick={goPrev} ariaLabel="Previous image" />
          )}

          <motion.img
            key={image.url}
            src={image.url}
            alt={image.caption}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="max-h-[calc(100vh-12rem)] max-w-[min(92vw,1400px)] object-contain shadow-2xl"
            draggable={false}
          />

          {hasMultiple && (
            <NavButton dir="next" onClick={goNext} ariaLabel="Next image" />
          )}
        </div>

        {/* Caption */}
        <div
          className="shrink-0 border-t border-white/10 px-6 py-5 sm:px-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-ink">
            {image.caption}
          </p>
          {image.credit && (
            <p className="mx-auto mt-1.5 max-w-3xl text-[11px] text-ink-faint">
              Credit: {image.credit}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function NavButton({
  dir,
  onClick,
  ariaLabel,
}: {
  dir: 'prev' | 'next';
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-strong bg-black/70 text-xl text-ink backdrop-blur transition hover:border-active hover:text-active ${
        dir === 'prev' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'
      }`}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}

function MinimizeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
    </svg>
  );
}
