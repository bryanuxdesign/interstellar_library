import { useEffect, useState } from 'react';

/**
 * True on wide layouts suitable for the lander (keyboard + room to play).
 * Uses width only — pointer/hover queries hide the game in Cursor preview
 * and some laptop browsers even on real desktops.
 */
export function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}
