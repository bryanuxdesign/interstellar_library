import { AnimatePresence, motion } from 'framer-motion';
import { getMissionById } from '@/data/missions';
import { getVehicleImages } from '@/data/missionImages';
import { useAppStore } from '@/store/useAppStore';
import { useMediaQuery } from '@/utils/useMediaQuery';
import {
  formatCoordinates,
  formatDate,
  formatMass,
} from '@/utils/format';
import { countryFlag } from '@/utils/flags';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SpecRow } from '@/components/ui/SpecRow';
import { LifespanBar } from './LifespanBar';
import { ForensicImage } from './ForensicImage';
import { VehicleGallery } from './VehicleGallery';

export function DossierPanel() {
  const selectedMissionId = useAppStore((s) => s.selectedMissionId);
  const closeDossier = useAppStore((s) => s.closeDossier);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const mission = selectedMissionId ? getMissionById(selectedMissionId) : undefined;

  const variants = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {mission && (
        <motion.section
          key={mission.id}
          {...variants}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="absolute z-30 flex flex-col border-sharp bg-raised backdrop-blur-xl
            md:right-0 md:top-0 md:h-full md:w-[400px] md:border-l
            max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[80vh] max-md:rounded-t-2xl max-md:border-t"
          role="dialog"
          aria-label={`${mission.name} mission dossier`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-sharp p-5">
            <div className="min-w-0">
              <span className="eyebrow">Mission Dossier</span>
              <h2 className="mt-1 truncate text-xl font-bold text-ink">
                {mission.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
                <span className="text-sm leading-none" aria-hidden>
                  {countryFlag(mission.country)}
                </span>
                {mission.agency} · {mission.country}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDossier}
              className="shrink-0 rounded-md border border-strong px-2.5 py-1 text-xs text-ink-soft transition hover:border-active hover:text-active"
              aria-label="Close dossier"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
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

            {/* Telemetry grid */}
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
              <SpecRow label="Landing Site" value={formatCoordinates(mission.coordinates)} />
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

            {/* Forensic imagery for crash sites */}
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

            {/* Primary sources */}
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
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
