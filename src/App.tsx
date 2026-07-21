import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Gateway } from '@/pages/Gateway';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const PlanetView = lazy(() =>
  import('@/pages/PlanetView').then((m) => ({ default: m.PlanetView })),
);

const LunarLander = lazy(() =>
  import('@/pages/LunarLander').then((m) => ({ default: m.LunarLander })),
);

const MilkyWay = lazy(() =>
  import('@/pages/MilkyWay').then((m) => ({ default: m.MilkyWay })),
);

const SolarSystem = lazy(() =>
  import('@/pages/SolarSystem').then((m) => ({ default: m.SolarSystem })),
);

function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-deep">
      <span className="eyebrow text-ink-faint">Loading archive…</span>
    </div>
  );
}

function DesktopOnlyMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-deep px-6 text-center">
      <p className="eyebrow text-active">{title}</p>
      <h1 className="font-display text-2xl text-ink">Desktop only</h1>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      <Link to="/" className="eyebrow text-ink-faint transition hover:text-active">
        ← Back to archive
      </Link>
    </div>
  );
}

function DesktopOnlyLander() {
  const isDesktop = useIsDesktop();
  if (isDesktop === null) return <RouteFallback />;
  if (!isDesktop) {
    return (
      <DesktopOnlyMessage
        title="Lunar Descent"
        description="This game needs a wider screen and keyboard controls. Open the archive on a laptop or desktop (window ≥ 900px), or go back home."
      />
    );
  }
  return <LunarLander />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Gateway />} />
          <Route path="/lander" element={<DesktopOnlyLander />} />
          {/* Static tour routes before /:planetId */}
          <Route path="/milky-way" element={<MilkyWay />} />
          <Route path="/solar-system" element={<SolarSystem />} />
          {/* Moon archive lives inside Earth — never a lone Moon globe. */}
          <Route path="/moon" element={<Navigate to="/earth?focus=luna" replace />} />
          <Route path="/:planetId" element={<PlanetView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
