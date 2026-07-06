import { useAppStore } from '@/store/useAppStore';

interface ChronologyToggleProps {
  /** Compact style for tight header rows. */
  compact?: boolean;
}

export function ChronologyToggle({ compact = false }: ChronologyToggleProps) {
  const reversed = useAppStore((s) => s.chronologyReversed);
  const toggleChronologyReversed = useAppStore((s) => s.toggleChronologyReversed);

  return (
    <button
      type="button"
      onClick={toggleChronologyReversed}
      aria-pressed={reversed}
      aria-label={
        reversed
          ? 'Showing newest first. Switch to oldest first.'
          : 'Showing oldest first. Switch to newest first.'
      }
      title={reversed ? 'Newest first' : 'Oldest first'}
      className={`inline-flex items-center gap-1.5 rounded-md border transition ${
        compact
          ? 'border-sharp px-2 py-1 text-[10px]'
          : 'border-sharp px-2.5 py-1 text-[11px]'
      } ${
        reversed
          ? 'border-active/40 bg-active/10 text-active'
          : 'text-ink-faint hover:border-strong hover:text-ink-soft'
      }`}
    >
      <SortIcon reversed={reversed} />
      <span className="font-mono uppercase tracking-wider">
        {reversed ? 'Newest' : 'Oldest'}
      </span>
    </button>
  );
}

function SortIcon({ reversed }: { reversed: boolean }) {
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
      {reversed ? (
        <>
          <path d="M2 3h8M2 6h5M2 9h2" />
          <path d="M9 7l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M2 3h2M2 6h5M2 9h8" />
          <path d="M9 3l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
