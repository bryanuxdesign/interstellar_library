import { useMediaQuery } from './useMediaQuery';

/** True when the primary input is touch (no hover). */
export function useTouchPrimary(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}
