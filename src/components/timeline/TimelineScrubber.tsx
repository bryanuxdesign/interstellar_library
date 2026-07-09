import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TimelineEvent } from '@/types';
import { buildTimeline } from '@/data/timeline';
import { STATUS_COLORS } from '@/three/constants';
import { useAppStore } from '@/store/useAppStore';
import { ChronologyToggle } from '@/components/ui/ChronologyToggle';
import { getMissionById } from '@/data/missions';
import { isRoverClassification } from '@/data/roverTraverses';
import { useRoverTraverses } from '@/utils/useRoverTraverses';
import { missionCameraAltitude, missionCameraTarget } from '@/utils/missionCamera';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { mobileTimelineVisible } from '@/utils/mobileSheetLayout';

const MOBILE_EVENT_GAP_PX = 56;

interface TimelineScrubberProps {
  planetId: string;
}

export function TimelineScrubber({ planetId }: TimelineScrubberProps) {
  const events = useMemo(() => buildTimeline(planetId), [planetId]);
  const activeEventId = useAppStore((s) => s.activeEventId);
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const setActiveEvent = useAppStore((s) => s.setActiveEvent);
  const selectMission = useAppStore((s) => s.selectMission);
  const setHoveredMission = useAppStore((s) => s.setHoveredMission);
  const flyTo = useAppStore((s) => s.flyTo);
  const chronologyReversed = useAppStore((s) => s.chronologyReversed);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [hoverId, setHoverId] = useState<string | null>(null);

  const orderedEvents = useMemo(
    () => (chronologyReversed ? [...events].reverse() : events),
    [events, chronologyReversed],
  );

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

  const fraction = (e: TimelineEvent) => {
    const pct = ((new Date(e.date).getTime() - minTime) / span) * 100;
    return chronologyReversed ? 100 - pct : pct;
  };

  const decadePosition = (year: number) => {
    const pct = ((new Date(Date.UTC(year, 0, 1)).getTime() - minTime) / span) * 100;
    return chronologyReversed ? 100 - pct : pct;
  };

  const decades = useMemo(() => {
    const marks: number[] = [];
    const start = Math.ceil(minYear / 10) * 10;
    for (let y = start; y <= maxYear; y += 10) marks.push(y);
    return marks;
  }, [minYear, maxYear]);

  const roverMissionIds = useMemo(
    () =>
      planetId === 'mars'
        ? events
            .map((e) => getMissionById(e.missionId))
            .filter((m) => m && isRoverClassification(m.classification))
            .map((m) => m!.id)
        : [],
    [events, planetId],
  );
  const roverTraverses = useRoverTraverses(roverMissionIds);

  const currentIndex = useMemo(
    () => orderedEvents.findIndex((e) => e.missionId === selectedMissionId),
    [orderedEvents, selectedMissionId],
  );

  const handleSelect = (event: TimelineEvent) => {
    setActiveEvent(event.id);
    selectMission(event.missionId);
    const mission = getMissionById(event.missionId);
    const traverse = roverTraverses.get(event.missionId) ?? null;
    flyTo(
      mission ? missionCameraTarget(mission, traverse) : event.coordinates,
      mission ? missionCameraAltitude(mission, traverse) : 1.35,
    );
  };

  const step = (dir: -1 | 1) => {
    if (orderedEvents.length === 0) return;
    let next: number;
    if (currentIndex === -1) {
      next = dir === 1 ? 0 : orderedEvents.length - 1;
    } else {
      next = Math.min(Math.max(currentIndex + dir, 0), orderedEvents.length - 1);
    }
    handleSelect(orderedEvents[next]);
  };

  const prevDisabled = currentIndex <= 0;
  const nextDisabled =
    currentIndex === -1 ? false : currentIndex >= orderedEvents.length - 1;

  const trackMinWidth = useMemo(() => {
    if (!isMobile) return undefined;
    return Math.max(events.length * MOBILE_EVENT_GAP_PX, 360);
  }, [isMobile, events.length]);

  const mobileDossierOpen = isMobile && Boolean(selectedMissionId || selectedOrbiterId);
  const timelineVisible = mobileTimelineVisible(isMobile, mobileDossierOpen);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{
        y: 0,
        opacity: timelineVisible ? 1 : 0,
        bottom: 0,
      }}
      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut', opacity: { duration: 0.25 } }}
      className={`absolute left-0 right-0 z-20 border-t border-sharp bg-panel/90 backdrop-blur-xl lg:left-[280px] ${
        selectedMissionId || selectedOrbiterId ? 'max-md:right-0 md:right-[400px]' : 'right-0'
      } ${timelineVisible ? '' : 'max-md:hidden max-md:pointer-events-none'}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3 max-md:px-3 max-md:pt-2 max-md:pb-0 lg:px-6">
        <span className="eyebrow max-md:text-[9px]">Chronological Scrubber</span>
        <div className="flex items-center gap-3">
          <ChronologyToggle compact />
          <span className="tabular text-[11px] text-ink-faint">
            {chronologyReversed ? `${maxYear} — ${minYear}` : `${minYear} — ${maxYear}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-5 pt-4 max-md:px-2 max-md:pb-3 max-md:pt-2 lg:px-5">
        <ArrowButton dir="prev" disabled={prevDisabled} onClick={() => step(-1)} />

        <div
          className={`relative mx-1 min-w-0 flex-1 ${isMobile ? 'overflow-x-auto overscroll-x-contain pb-1' : ''}`}
          style={isMobile ? { WebkitOverflowScrolling: 'touch' } : undefined}
        >
          <div
            className="relative h-14 max-md:h-11"
            style={trackMinWidth ? { minWidth: trackMinWidth, width: '100%' } : { width: '100%' }}
          >
          {/* Base rail */}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-strong" />

          {/* Decade ticks */}
          {decades.map((year) => {
            const left = decadePosition(year);
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
                className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center max-md:h-11 max-md:w-11"
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
