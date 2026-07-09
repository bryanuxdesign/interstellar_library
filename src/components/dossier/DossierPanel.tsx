import { useEffect, useRef, useState, type TouchEvent, type UIEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getMissionById } from '@/data/missions';
import { getOrbiterById } from '@/data/orbiters';
import { getVehicleImages } from '@/data/missionImages';
import {
  dataSourceLabel,
  isRoverClassification,
  loadRoverTraverse,
} from '@/data/roverTraverses';
import { useAppStore } from '@/store/useAppStore';
import { useMediaQuery } from '@/utils/useMediaQuery';
import { useViewportHeight } from '@/utils/useViewportHeight';
import { mobileDossierPeekHeight } from '@/utils/mobileSheetLayout';
import {
  formatCoordinates,
  formatDate,
  formatMass,
} from '@/utils/format';
import { countryFlag } from '@/utils/flags';
import type { RoverTraverseRecord } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SpecRow } from '@/components/ui/SpecRow';
import { LifespanBar } from './LifespanBar';
import { ForensicImage } from './ForensicImage';
import { VehicleGallery } from './VehicleGallery';
import { OrbiterDossierContent } from './OrbiterDossierContent';

const SHEET_SPRING = { type: 'spring' as const, stiffness: 260, damping: 32, mass: 0.9 };
const EXPAND_SCROLL_THRESHOLD = 64;
const PULL_SNAP_THRESHOLD = 48;

export function DossierPanel() {
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const selectedOrbiterId = useAppStore((s) => s.selectedOrbiterId);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const mobileDossierExpanded = useAppStore((s) => s.mobileDossierExpanded);
  const setMobileDossierExpanded = useAppStore((s) => s.setMobileDossierExpanded);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const viewportH = useViewportHeight();

  const mission = selectedMissionId ? getMissionById(selectedMissionId) : undefined;
  const orbiter = !mission && selectedOrbiterId ? getOrbiterById(selectedOrbiterId) : undefined;
  const asset = mission ?? orbiter;

  const [traverse, setTraverse] = useState<RoverTraverseRecord | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number | null>(null);
  const expandPending = useRef(false);

  const peekHeight = mobileDossierPeekHeight(viewportH);
  const fullHeight = viewportH;
  const sheetHeight = isMobile ? (mobileDossierExpanded ? fullHeight : peekHeight) : fullHeight;

  const dossierLabel = mission ? 'Mission Dossier' : 'Orbital Dossier';

  useEffect(() => {
    if (!mission || !isRoverClassification(mission.classification)) {
      setTraverse(null);
      return;
    }
    let cancelled = false;
    loadRoverTraverse(mission.id).then((record) => {
      if (!cancelled) setTraverse(record);
    });
    return () => {
      cancelled = true;
    };
  }, [mission?.id, mission?.classification]);

  useEffect(() => {
    if (!isMobile) setMobileDossierExpanded(false);
  }, [isMobile, setMobileDossierExpanded]);

  useEffect(() => {
    if (!selectedMissionId && !selectedOrbiterId) {
      setMobileDossierExpanded(false);
      expandPending.current = false;
    }
  }, [selectedMissionId, selectedOrbiterId, setMobileDossierExpanded]);

  const expandToFull = () => {
    if (mobileDossierExpanded || expandPending.current) return;
    expandPending.current = true;
    setMobileDossierExpanded(true);
    window.setTimeout(() => {
      expandPending.current = false;
    }, 400);
  };

  const collapseToHalf = () => {
    if (!mobileDossierExpanded) return;
    setMobileDossierExpanded(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canPullSheet = () => !contentRef.current || contentRef.current.scrollTop <= 2;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!isMobile || mobileDossierExpanded || expandPending.current) return;
    if (e.currentTarget.scrollTop > EXPAND_SCROLL_THRESHOLD) {
      expandToFull();
    }
  };

  const handlePullStart = (e: TouchEvent) => {
    if (!isMobile) return;
    pullStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handlePullMove = (e: TouchEvent) => {
    if (!isMobile || pullStartY.current === null || !canPullSheet()) return;
    const currentY = e.touches[0]?.clientY;
    if (currentY == null) return;
    const delta = currentY - pullStartY.current;

    if (!mobileDossierExpanded && delta < -PULL_SNAP_THRESHOLD) {
      pullStartY.current = null;
      expandToFull();
      return;
    }

    if (mobileDossierExpanded && delta > PULL_SNAP_THRESHOLD) {
      pullStartY.current = null;
      collapseToHalf();
    }
  };

  const handlePullEnd = () => {
    pullStartY.current = null;
  };

  const pullHandlers = {
    onTouchStart: handlePullStart,
    onTouchMove: handlePullMove,
    onTouchEnd: handlePullEnd,
    onTouchCancel: handlePullEnd,
  };

  return (
    <AnimatePresence>
      {asset && (
        <motion.section
          key={asset.id}
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0, height: sheetHeight } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={SHEET_SPRING}
          className="absolute z-30 flex flex-col border-sharp bg-raised backdrop-blur-xl
            md:right-0 md:top-0 md:h-full md:w-[400px] md:border-l
            max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-2xl max-md:border-t"
          role="dialog"
          aria-label={`${asset.name} ${dossierLabel.toLowerCase()}`}
        >
          <DossierHeader
            eyebrow={dossierLabel}
            name={asset.name}
            agency={asset.agency}
            country={asset.country}
            onClose={closeDossier}
            pullHandlers={pullHandlers}
            mobile
          />

          <DossierHeader
            eyebrow={dossierLabel}
            name={asset.name}
            agency={asset.agency}
            country={asset.country}
            onClose={closeDossier}
            desktop
          />

          <div
            ref={contentRef}
            className="min-h-0 flex-1 overflow-y-auto p-5"
            onScroll={handleScroll}
            {...(isMobile && mobileDossierExpanded ? pullHandlers : {})}
          >
            {mission ? (
              <MissionDossierContent mission={mission} traverse={traverse} />
            ) : orbiter ? (
              <OrbiterDossierContent orbiter={orbiter} />
            ) : null}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function DossierHeader({
  eyebrow,
  name,
  agency,
  country,
  onClose,
  pullHandlers,
  mobile,
  desktop,
}: {
  eyebrow: string;
  name: string;
  agency: string;
  country: string;
  onClose: () => void;
  pullHandlers?: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
  mobile?: boolean;
  desktop?: boolean;
}) {
  if (mobile) {
    return (
      <div className="flex shrink-0 touch-pan-y flex-col md:hidden" {...pullHandlers}>
        <div className="flex items-center justify-center py-3">
          <span className="h-1 w-10 rounded-full bg-strong" aria-hidden />
        </div>
        <HeaderBody eyebrow={eyebrow} name={name} agency={agency} country={country} onClose={onClose} />
      </div>
    );
  }

  if (desktop) {
    return (
      <div className="hidden border-b border-sharp md:block">
        <HeaderBody eyebrow={eyebrow} name={name} agency={agency} country={country} onClose={onClose} className="p-5" />
      </div>
    );
  }

  return null;
}

function HeaderBody({
  eyebrow,
  name,
  agency,
  country,
  onClose,
  className = 'border-b border-sharp px-5 pb-5 pt-0',
}: {
  eyebrow: string;
  name: string;
  agency: string;
  country: string;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-1 truncate text-xl font-bold text-ink">{name}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
          <span className="text-sm leading-none" aria-hidden>
            {countryFlag(country)}
          </span>
          {agency} · {country}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md border border-strong px-2.5 py-1 text-xs text-ink-soft transition hover:border-active hover:text-active"
        aria-label="Close dossier"
      >
        ✕
      </button>
    </div>
  );
}

function MissionDossierContent({
  mission,
  traverse,
}: {
  mission: NonNullable<ReturnType<typeof getMissionById>>;
  traverse: RoverTraverseRecord | null;
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={mission.status} pulse />
        <span className="rounded-full border border-sharp px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-soft">
          {mission.classification}
        </span>
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
        {mission.summary}
      </p>

      <VehicleGallery
        images={getVehicleImages(mission.id)}
        missionName={mission.name}
      />

      <div className="grid grid-cols-2 gap-x-5">
        <SpecRow label="Launch" value={formatDate(mission.launchDate)} />
        <SpecRow
          label={
            mission.status === 'impact'
              ? 'Impact'
              : mission.status === 'planned'
                ? 'Target Landing'
                : 'Landing'
          }
          value={formatDate(mission.landingDate)}
        />
        {traverse ? (
          <>
            <SpecRow label="Landing Site" value={formatCoordinates(traverse.landingSite)} />
            <SpecRow
              label={mission.status === 'active' ? 'Last Known' : 'Retired At'}
              value={formatCoordinates(traverse.lastKnown)}
            />
            <SpecRow
              label="Distance Driven"
              value={`${traverse.totalDistanceKm.toFixed(2)} km`}
            />
            <SpecRow
              label="Last Drive"
              value={
                traverse.lastDriveSol != null
                  ? `Sol ${traverse.lastDriveSol}`
                  : '—'
              }
            />
            <SpecRow
              label="Data Source"
              value={dataSourceLabel(traverse.dataSource)}
            />
            <SpecRow label="Updated" value={traverse.dataUpdatedAt} />
            {traverse.approximate && (
              <SpecRow label="Note" value="Approximate traverse path" />
            )}
          </>
        ) : (
          <SpecRow label="Landing Site" value={formatCoordinates(mission.coordinates)} />
        )}
        <SpecRow label="Mass" value={formatMass(mission.massKg)} />
      </div>

      <div className="mt-1 border-t border-sharp">
        {mission.status !== 'planned' && (
          <LifespanBar
            planned={mission.plannedLifespanDays}
            actual={mission.actualLifespanDays}
          />
        )}
      </div>

      <div className="border-t border-sharp py-3">
        <SpecRow label="Status Report" value={mission.healthStatus} />
      </div>

      {mission.status === 'impact' && mission.forensicImageUrl && (
        <div className="mt-2">
          <span className="eyebrow mb-2 block text-alert">Forensic Imagery</span>
          <ForensicImage
            src={mission.forensicImageUrl}
            caption={`Orbital reconnaissance of the ${mission.name} impact zone and debris field.`}
            coordinates={mission.coordinates}
          />
        </div>
      )}

      <div className="mt-5">
        <span className="eyebrow mb-2 block">Primary Sources</span>
        <div className="flex flex-col gap-2">
          {mission.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-md border border-sharp bg-black/20 p-3 transition hover:border-active/50 hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-ink group-hover:text-active">
                  {source.title}
                </span>
                <span className="eyebrow shrink-0 text-[8px]">
                  {source.type}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink-faint">
                {source.excerpt}
              </p>
              <span className="mt-1.5 inline-block text-[10px] text-active opacity-0 transition group-hover:opacity-100">
                Open {source.publisher} source ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
