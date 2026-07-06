import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Gateway } from '@/pages/Gateway';
import { PlanetView } from '@/pages/PlanetView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gateway />} />
        <Route path="/:planetId" element={<PlanetView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
