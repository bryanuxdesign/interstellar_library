/** Tracks which planet GLBs have been parsed and rendered at least once. */
const loaded: Record<string, boolean> = {};
const listeners = new Set<() => void>();

export function markGlobeLoaded(planetId: string) {
  loaded[planetId] = true;
  listeners.forEach((l) => l());
}

export function isGlobeLoaded(planetId: string) {
  return loaded[planetId] ?? false;
}

export function subscribeGlobeLoaded(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
