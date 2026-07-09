import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Gateway } from '@/pages/Gateway';

const PlanetView = lazy(() =>
  import('@/pages/PlanetView').then((m) => ({ default: m.PlanetView })),
);

function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-deep">
      <span className="eyebrow text-ink-faint">Loading archive…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Gateway />} />
          <Route path="/:planetId" element={<PlanetView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
