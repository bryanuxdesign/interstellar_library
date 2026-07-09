/** Dossier peek height as a fraction of viewport — leaves ~70% for the globe. */
export const MOBILE_DOSSIER_PEEK_RATIO = 0.3;

export function mobileDossierPeekHeight(viewportH: number): number {
  return Math.round(viewportH * MOBILE_DOSSIER_PEEK_RATIO);
}

export function mobileCanvasHeight(
  viewportH: number,
  dossierOpen: boolean,
  dossierExpanded: boolean,
): number {
  if (dossierExpanded) return 0;
  if (dossierOpen) return viewportH - mobileDossierPeekHeight(viewportH);
  return viewportH;
}

/** Hide timeline while mobile dossier is in peek or full-screen mode. */
export function mobileTimelineVisible(
  isMobile: boolean,
  dossierOpen: boolean,
): boolean {
  return !isMobile || !dossierOpen;
}
