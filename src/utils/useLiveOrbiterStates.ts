import { useEffect, useState } from 'react';
import type { OrbitalAsset, OrbitalState } from '@/types';
import { propagateOrbiter } from '@/three/orbitPropagation';

const UPDATE_INTERVAL_MS = 30_000;

/** Keeps propagated orbiter states fresh for sidebar / HUD labels. */
export function useLiveOrbiterStates(orbiters: OrbitalAsset[]): Map<string, OrbitalState> {
  const [states, setStates] = useState<Map<string, OrbitalState>>(() => {
    const map = new Map<string, OrbitalState>();
    for (const o of orbiters) map.set(o.id, propagateOrbiter(o));
    return map;
  });

  useEffect(() => {
    const tick = () => {
      setStates(() => {
        const next = new Map<string, OrbitalState>();
        for (const o of orbiters) next.set(o.id, propagateOrbiter(o));
        return next;
      });
    };
    tick();
    const id = window.setInterval(tick, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [orbiters]);

  return states;
}
