import { useEffect, useState } from 'react';
import type { RoverTraverseRecord } from '@/types';
import { loadRoverTraverse } from '@/data/roverTraverses';

/** Loads rover traverse bundles for the given mission IDs. */
export function useRoverTraverses(
  missionIds: string[],
): Map<string, RoverTraverseRecord | null> {
  const [traverses, setTraverses] = useState<Map<string, RoverTraverseRecord | null>>(
    () => new Map(),
  );

  const key = missionIds.slice().sort().join(',');

  useEffect(() => {
    if (missionIds.length === 0) {
      setTraverses(new Map());
      return;
    }

    let cancelled = false;

    Promise.all(
      missionIds.map(async (id) => {
        const record = await loadRoverTraverse(id);
        return [id, record] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setTraverses(new Map(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [key, missionIds]);

  return traverses;
}
