import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import type { CelestialBody } from '@/types';
import { CelestialGlobe, preloadPlanetModel } from '@/three/CelestialGlobe';
import { markGlobeLoaded } from '@/components/gateway/globeLoadedCache';

export type HeroSlot = 'left' | 'center' | 'right';

interface PlanetOrbProps {
  planet: CelestialBody;
  focused: boolean;
  onSelect: () => void;
  /** Cinematic hero cluster — larger center body, flanking worlds, no card chrome */
  hero?: boolean;
  /** Carousel slot (hero mode only) — keeps the focused body centered. */
  slot?: HeroSlot;
  /** When set, the centered orb may hide its static image (live globe has painted). */
  paintedId?: string | null;
  /** Outgoing center body during a swap — static reveals instantly on the orb for exit motion. */
  departingCenterId?: string | null;
  /** Whether the carousel is idle (not mid-swap). */
  carouselIdle?: boolean;
  /** Fires when this orb finishes its carousel motion while centered. */
  onCarouselSettled?: (planetId: string, swapEpoch: number) => void;
  /** Bumped on each carousel swap — ignores stale animation-complete callbacks. */
  swapEpoch?: number;
}

const PLANET_IMAGES: Record<string, string> = {
  moon: '/images/planets/moon.jpg',
  mars: '/images/planets/mars.jpg',
  venus: '/images/planets/venus.jpg',
};

const GLOBE_3D_PLANETS = new Set(['moon', 'venus', 'mars']);

/** Fixed orb footprint; only transform (x/scale) animates so the width never reflows. */
export const HERO_ORB_SIZE = 'min(72vmin, 720px)';
export const HERO_CAROUSEL_DURATION_S = 1.05;
export const HERO_GLOBE_FADE_IN_S = 0.5;
export const HERO_GLOBE_FADE_OUT_S = 0.28;

export const HERO_CAROUSEL_TRANSITION = {
  type: 'tween' as const,
  duration: HERO_CAROUSEL_DURATION_S,
  ease: [0.45, 0.05, 0.25, 1] as const,
};

const HERO_SLOT_MOTION: Record<
  HeroSlot,
  { x: string; scale: number; opacity: number; zIndex: number }
> = {
  center: { x: '-50%', scale: 1, opacity: 1, zIndex: 3 },
  left: { x: 'calc(-50% - 42vw)', scale: 0.26, opacity: 0.85, zIndex: 1 },
  right: { x: 'calc(-50% + 42vw)', scale: 0.26, opacity: 0.85, zIndex: 1 },
};

function GlobeLoadedMarker({
  planetId,
  onPainted,
}: {
  planetId: string;
  onPainted: (planetId: string) => void;
}) {
  useEffect(() => {
    markGlobeLoaded(planetId);
    onPainted(planetId);
  }, [planetId, onPainted]);
  return null;
}

function HeroGlobeScene({
  focusedId,
  onPainted,
}: {
  focusedId: string;
  onPainted: (planetId: string) => void;
}) {
  return (
    <>
      <CelestialGlobe
        planetId={focusedId}
        autoRotate
        rotationSpeed={0.08}
        radius={2}
      />
      <GlobeLoadedMarker planetId={focusedId} onPainted={onPainted} />
    </>
  );
}

/**
 * One persistent WebGL context for the focused planet's live globe.
 * All three models stay mounted; switching only toggles visibility so there
 * is no remount/Suspense delay between carousel swaps.
 */
export function HeroCenterGlobeLayer({
  displayGlobeId,
  visible,
  onPainted,
}: {
  /** Planet model shown in the fixed center overlay — only changes after carousel settles. */
  displayGlobeId: string;
  /** Fades the live globe in only after the carousel motion settles. */
  visible: boolean;
  onPainted?: (planetId: string) => void;
}) {
  const handlePainted = useCallback(
    (planetId: string) => onPainted?.(planetId),
    [onPainted],
  );

  useEffect(() => {
    preloadPlanetModel(displayGlobeId);
  }, [displayGlobeId]);

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
      style={{ width: HERO_ORB_SIZE, height: HERO_ORB_SIZE }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{
        duration: visible ? HERO_GLOBE_FADE_IN_S : HERO_GLOBE_FADE_OUT_S,
        ease: 'easeInOut',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true }}
        resize={{ debounce: 0, scroll: false }}
        style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 2, 5]} intensity={2.2} color="#fff6ec" />
        <Suspense fallback={null}>
          <HeroGlobeScene focusedId={displayGlobeId} onPainted={handlePainted} />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}

export function PlanetOrb({
  planet,
  focused,
  onSelect,
  hero = false,
  slot = 'center',
  paintedId = null,
  departingCenterId = null,
  carouselIdle = true,
  onCarouselSettled,
  swapEpoch = 0,
}: PlanetOrbProps) {
  const has3dGlobe = GLOBE_3D_PLANETS.has(planet.id);
  const heroMotion = HERO_SLOT_MOTION[slot];
  const isDeparting = !carouselIdle && departingCenterId === planet.id;
  const hideStaticForGlobe =
    hero && has3dGlobe && focused && paintedId === planet.id;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => {
        if (hero && has3dGlobe && !focused) preloadPlanetModel(planet.id);
      }}
      aria-pressed={focused}
      aria-label={
        focused
          ? planet.available
            ? `${planet.name} — click to explore`
            : `${planet.name} — coming soon`
          : `${planet.name} — click to focus`
      }
      className={
        hero
          ? `group absolute left-1/2 top-1/2 flex min-w-0 flex-col items-center justify-center bg-transparent p-0 text-center ${
              focused && !planet.available ? 'cursor-default' : 'cursor-pointer'
            }`
          : `group flex min-w-0 flex-col items-center gap-2 rounded-xl border bg-transparent p-2 text-center transition-colors sm:gap-3 sm:p-3 ${
              focused
                ? 'border-active/30 bg-panel/40'
                : 'border-transparent hover:border-sharp hover:bg-panel/25'
            }`
      }
      animate={
        hero
          ? {
              x: heroMotion.x,
              y: '-50%',
              scale: heroMotion.scale,
              opacity: heroMotion.opacity,
              zIndex: heroMotion.zIndex,
            }
          : {
              flexGrow: focused ? 1.55 : 0.65,
              flexShrink: 1,
              flexBasis: focused ? '38%' : '18%',
              opacity: focused ? 1 : 0.58,
              scale: focused ? 1 : 0.82,
            }
      }
      transition={
        hero
          ? HERO_CAROUSEL_TRANSITION
          : { type: 'spring', stiffness: 280, damping: 28 }
      }
      style={{
        width: hero ? HERO_ORB_SIZE : undefined,
        maxWidth: hero ? HERO_ORB_SIZE : focused ? 420 : 148,
        willChange: hero ? 'transform' : undefined,
      }}
      onAnimationComplete={() => {
        if (hero && focused) onCarouselSettled?.(planet.id, swapEpoch);
      }}
    >
      <div className="relative aspect-square w-full">
        <PlanetSphere
          planet={planet}
          dimmed={!focused}
          hidden={hideStaticForGlobe}
          instantReveal={isDeparting}
          priority={hero && focused}
        />

        {!planet.available && focused && (
          <span className="absolute left-1/2 top-[5%] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-sharp bg-deep/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft sm:text-xs">
            Coming soon
          </span>
        )}
      </div>

      {!hero && (
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-semibold sm:text-base ${
              focused ? 'text-ink' : 'text-ink-soft'
            }`}
          >
            {planet.name}
          </p>
          <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-ink-faint sm:text-[10px]">
            {planet.subtitle}
          </p>
        </div>
      )}
    </motion.button>
  );
}

function PlanetSphere({
  planet,
  dimmed,
  hidden,
  instantReveal = false,
  priority = false,
}: {
  planet: CelestialBody;
  dimmed: boolean;
  hidden?: boolean;
  /** Skip opacity fade-in when handing off from live globe to static exit motion. */
  instantReveal?: boolean;
  priority?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = PLANET_IMAGES[planet.id];

  useEffect(() => {
    setImgFailed(false);
  }, [planet.id]);

  const fallback = PLANET_FALLBACKS[planet.id] ?? PLANET_FALLBACKS.moon;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-full"
      style={{
        opacity: hidden ? 0 : dimmed ? 0.82 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
        transition: instantReveal ? 'none' : 'opacity 0.5s ease-in-out',
        boxShadow: dimmed
          ? 'inset -8px -8px 24px rgba(0,0,0,0.55)'
          : 'inset -12px -12px 32px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: fallback.gradient }}
        aria-hidden
      />

      {src && !imgFailed && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onError={() => setImgFailed(true)}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: fallback.lighting }}
        aria-hidden
      />
    </div>
  );
}

const PLANET_FALLBACKS: Record<
  string,
  { gradient: string; lighting: string }
> = {
  moon: {
    gradient:
      'radial-gradient(circle at 32% 28%, #c8c8d0 0%, #8a8a94 38%, #4a4a52 72%, #1a1a1e 100%)',
    lighting:
      'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.22) 0%, transparent 42%), radial-gradient(circle at 78% 78%, rgba(0,0,0,0.55) 0%, transparent 48%)',
  },
  mars: {
    gradient:
      'radial-gradient(circle at 35% 30%, #e07a5a 0%, #c1440e 45%, #6b2d0e 78%, #2a1008 100%)',
    lighting:
      'radial-gradient(circle at 30% 24%, rgba(255,180,140,0.28) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.5) 0%, transparent 50%)',
  },
  venus: {
    gradient:
      'radial-gradient(circle at 32% 28%, #e8c87a 0%, #c9a227 38%, #8b6914 62%, #4a3810 100%)',
    lighting:
      'radial-gradient(circle at 28% 22%, rgba(255,230,160,0.35) 0%, transparent 38%), radial-gradient(circle at 78% 78%, rgba(0,0,0,0.45) 0%, transparent 48%)',
  },
};
