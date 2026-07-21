import { Link } from 'react-router-dom';

/** Shared dossier card for Milky Way / Sol System tours. */
export function TourSidePanel({
  title,
  eyebrow,
  body,
  archiveHref,
  compact,
}: {
  title: string;
  eyebrow: string;
  body: string;
  archiveHref?: string;
  /** Bottom sheet on narrow viewports instead of right dock. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <aside className="pointer-events-auto absolute inset-x-3 z-20 rounded-2xl border border-white/10 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-md max-md:bottom-[5.75rem] md:bottom-auto md:right-4 md:top-20 md:w-[min(100%,300px)] md:inset-x-auto sm:right-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {eyebrow}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-zinc-50 sm:text-lg">
            {title}
          </h2>
          {archiveHref ? (
            <Link
              to={archiveHref}
              state={{ from: '/solar-system' }}
              className="shrink-0 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300 transition hover:bg-emerald-500/25"
            >
              Archive →
            </Link>
          ) : null}
        </div>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-400 sm:line-clamp-none sm:text-sm">
          {body}
        </p>
      </aside>
    );
  }

  return (
    <aside className="pointer-events-auto absolute right-4 top-20 z-20 w-[min(100%,300px)] rounded-2xl border border-white/10 bg-zinc-950/75 p-4 backdrop-blur-md sm:right-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      {archiveHref ? (
        <Link
          to={archiveHref}
          state={{ from: '/solar-system' }}
          className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-400/90 transition hover:text-emerald-300"
        >
          Open in Archive →
        </Link>
      ) : null}
    </aside>
  );
}
