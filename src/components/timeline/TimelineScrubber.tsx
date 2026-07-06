import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TimelineEvent } from '@/types';
import { buildTimeline } from '@/data/timeline';
import { STATUS_COLORS } from '@/three/constants';
import { useAppStore } from '@/store/useAppStore';

interface TimelineScrubberProps {
  planetId: string;
}

export function TimelineScrubber({ planetId }: TimelineScrubberProps) {
  const events = useMemo(() => buildTimeline(planetId), [planetId]);
  const activeEventId = useAppStore((s) => s.activeEventId);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const setActiveEvent = useAppStore((s) => s.setActiveEvent);
  const selectMission = useAppStore((s) => s.selectMission);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const flyTo = useAppStore((s) => s.flyTo);

  const [hoverId, setHoverId] = useState<string | null>(null);

  const { minTime, span, minYear, maxYear } = useMemo(() => {
    const times = events.map((e) => new Date(e.date).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    return {
      minTime: min,
      span: max - min || 1,
      minYear: new Date(min).getUTCFullYear(),
      maxYear: new Date(max).getUTCFullYear(),
    };
  }, [events]);

  const fraction = (e: TimelineEvent) =>
    ((new Date(e.date).getTime() - minTime) / span) * 100;

  const decades = useMemo(() => {
    const marks: number[] = [];
    const start = Math.ceil(minYear / 10) * 10;
    for (let y = start; y <= maxYear; y += 10) marks.push(y);
    return marks;
  }, [minYear, maxYear]);

  const currentIndex = useMemo(
    () => events.findIndex((e) => e.missionId === selectedMissionId),
    [events, selectedMissionId],
  );

  const handleSelect = (event: TimelineEvent) => {
    setActiveEvent(event.id);
    selectMission(event.missionId);
    flyTo(event.coordinates);
  };

  const step = (dir: -1 | 1) => {
    if (events.length === 0) return;
    let next: number;
    if (currentIndex === -1) next = dir === 1 ? 0 : events.length - 1;
    else next = Math.min(Math.max(currentIndex + dir, 0), events.length - 1);
    handleSelect(events[next]);
  };

  const prevDisabled = currentIndex === 0;
  const nextDisabled = currentIndex === events.length - 1;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
      className={`absolute bottom-0 left-0 right-0 z-20 border-t border-sharp bg-panel/90 backdrop-blur-xl lg:left-[280px] ${
        selectedMissionId ? 'md:right-[400px]' : 'right-0'
      }`}
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3 lg:px-6">
        <span className="eyebrow">Chronological Scrubber</span>
        <span className="tabular text-[11px] text-ink-faint">
          {minYear} — {maxYear}
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 pb-5 pt-4 lg:px-5">
        <ArrowButton dir="prev" disabled={prevDisabled} onClick={() => step(-1)} />

        <div className="relative mx-1 h-12 flex-1">
          {/* Base rail */}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-strong" />

          {/* Decade ticks */}
          {decades.map((year) => {
            const left =
              ((new Date(Date.UTC(year, 0, 1)).getTime() - minTime) / span) * 100;
            if (left < 0 || left > 100) return null;
            return (
              <div
                key={year}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
              >
                <div className="h-2 w-px -translate-x-1/2 bg-strong" />
                <span className="tabular absolute left-1/2 top-3 -translate-x-1/2 text-[9px] text-ink-faint">
                  {year}
                </span>
              </div>
            );
          })}

          {/* Event nodes */}
          {events.map((event) => {
            const color = STATUS_COLORS[event.status];
            const active = activeEventId === event.id;
            const hovered = hoverId === event.id;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => handleSelect(event)}
                onMouseEnter={() => {
                  setHoverId(event.id);
                  setHoveredMission(event.missionId);
                }}
                onMouseLeave={() => {
                  setHoverId(null);
                  setHoveredMission(null);
                }}
                className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${fraction(event)}%` }}
                aria-label={`${event.label} (${event.date.slice(0, 4)})`}
              >
                <span
                  className="rounded-full transition-all"
                  style={{
                    width: active ? 14 : hovered ? 12 : 9,
                    height: active ? 14 : hovered ? 12 : 9,
                    backgroundColor: color,
                    boxShadow: active || hovered ? `0 0 10px ${color}` : 'none',
                    border: active ? '2px solid #f4f5f7' : 'none',
                  }}
                />
                {(hovered || active) && (
                  <span className="pointer-events-none absolute bottom-8 left-1/2 w-max max-w-[180px] -translate-x-1/2 rounded border border-strong bg-[#0d0d10] px-2 py-1 text-[10px] text-ink shadow-lg">
                    {event.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ArrowButton dir="next" disabled={nextDisabled} onClick={() => step(1)} />
      </div>
    </motion.div>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous event' : 'Next event'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm transition ${
        disabled
          ? 'cursor-not-allowed border-sharp text-ink-faint/40'
          : 'border-strong text-ink-soft hover:border-active hover:text-active'
      }`}
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  );
}
