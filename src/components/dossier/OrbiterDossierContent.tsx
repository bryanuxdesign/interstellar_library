import { useMemo } from 'react';
import type { OrbitalAsset } from '@/types';
import { getPlanet } from '@/data/planets';
import { getOrbiterDossierMeta } from '@/data/orbiters/dossierMeta';
import { propagateOrbiter } from '@/three/orbitPropagation';
import { formatCoordinates, formatDate } from '@/utils/format';
import { formatOrbitalElements } from '@/utils/orbiterCamera';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SpecRow } from '@/components/ui/SpecRow';

interface OrbiterDossierContentProps {
  orbiter: OrbitalAsset;
}

export function OrbiterDossierContent({ orbiter }: OrbiterDossierContentProps) {
  const meta = getOrbiterDossierMeta(orbiter.id);
  const planetRadiusKm = getPlanet(orbiter.planetId)?.radiusKm ?? 1737.4;

  const state = useMemo(() => propagateOrbiter(orbiter), [orbiter]);
  const elements = useMemo(
    () => formatOrbitalElements(orbiter, planetRadiusKm),
    [orbiter, planetRadiusKm],
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={orbiter.status} pulse />
        <span className="rounded-full border border-sharp px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-soft">
          Orbital Asset
        </span>
        {meta?.role && (
          <span className="rounded-full border border-sharp px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-soft">
            {meta.role}
          </span>
        )}
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
        {orbiter.summary}
      </p>

      <div className="mb-4 rounded-md border border-sharp bg-black/20 p-4">
        <span className="eyebrow mb-3 block">Live Telemetry</span>
        <div className="grid grid-cols-2 gap-x-5">
          <SpecRow label="Altitude" value={`${Math.round(state.altKm)} km`} />
          <SpecRow label="Period" value={`${state.periodMinutes.toFixed(0)} min`} />
          <SpecRow
            label="Sub-satellite"
            value={formatCoordinates({ lat: state.lat, lng: state.lng })}
          />
        </div>
        <p className="mt-3 text-[9px] leading-relaxed text-ink-faint">
          Position computed from published orbital elements — approximate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-5">
        {meta?.launchDate && (
          <SpecRow label="Launch" value={formatDate(meta.launchDate)} />
        )}
        <SpecRow label="Agency" value={orbiter.agency} />
        <SpecRow label="Country" value={orbiter.country} />
        <SpecRow label="Central Body" value={getPlanet(orbiter.planetId)?.name ?? orbiter.planetId} />
        <SpecRow label="Semi-major Axis" value={elements.semiMajorAxis} />
        <SpecRow label="Eccentricity" value={elements.eccentricity} />
        <SpecRow label="Inclination" value={elements.inclination} />
        <SpecRow label="Periapsis Alt." value={elements.periapsisAlt} />
        <SpecRow label="Apoapsis Alt." value={elements.apoapsisAlt} />
        <SpecRow label="Elements Epoch" value={elements.epoch} />
        {orbiter.horizonsId && (
          <SpecRow label="Horizons ID" value={orbiter.horizonsId} />
        )}
      </div>

      {meta?.sources && meta.sources.length > 0 && (
        <div className="mt-5">
          <span className="eyebrow mb-2 block">Primary Sources</span>
          <div className="flex flex-col gap-2">
            {meta.sources.map((source) => (
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
      )}
    </>
  );
}
