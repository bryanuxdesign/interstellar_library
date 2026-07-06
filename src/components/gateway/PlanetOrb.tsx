import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import type { CelestialBody } from '@/types';
import { CelestialGlobe, GlobeFallback } from '@/three/CelestialGlobe';

interface PlanetOrbProps {
  planet: CelestialBody;
  focused: boolean;
  onSelect: () => void;
  /** Cinematic hero cluster — larger center body, flanking worlds, no card chrome */
  hero?: boolean;
}

const PLANET_GLOW: Record<string, string> = {
  moon: 'rgba(34, 224, 107, 0.35)',
  mars: 'rgba(255, 69, 58, 0.28)',
  venus: 'rgba(255, 196, 92, 0.32)',
};

const PLANET_IMAGES: Record<string, string> = {
  moon: '/images/planets/moon.jpg',
  mars: '/images/planets/mars.jpg',
  venus: '/images/planets/venus.jpg',
};

const GLOBE_3D_PLANETS = new Set(['moon', 'venus']);

export function PlanetOrb({ planet, focused, onSelect, hero = false }: PlanetOrbProps) {
  const glow = PLANET_GLOW[planet.id] ?? 'rgba(255,255,255,0.2)';
  const [globeCanvasReady, setGlobeCanvasReady] = useState(false);
  const has3dGlobe = GLOBE_3D_PLANETS.has(planet.id);

  return (
    <motion.button
      type="button"
      layout
      onClick={onSelect}
      aria-pressed={focused}
      aria-label={`${planet.name}${focused ? ' — selected' : ''}`}
      className={
        hero
          ? 'group flex min-w-0 flex-col items-center justify-center bg-transparent p-0 text-center'
          : `group flex min-w-0 flex-col items-center gap-2 rounded-xl border bg-transparent p-2 text-center transition-colors sm:gap-3 sm:p-3 ${
              focused
                ? 'border-active/30 bg-panel/40'
                : 'border-transparent hover:border-sharp hover:bg-panel/25'
            }`
      }
      animate={
        hero
          ? {
              flexGrow: focused ? 4 : 0.45,
              flexShrink: focused ? 0 : 1,
              flexBasis: focused ? '64%' : '11%',
              opacity: focused ? 1 : 0.55,
              scale: focused ? 1 : 0.62,
              y: focused ? 0 : 12,
            }
          : {
              flexGrow: focused ? 1.55 : 0.65,
              flexShrink: 1,
              flexBasis: focused ? '38%' : '18%',
              opacity: focused ? 1 : 0.58,
              scale: focused ? 1 : 0.82,
            }
      }
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        maxWidth: hero
          ? focused
            ? 'min(72vmin, 760px)'
            : 'min(17vmin, 168px)'
          : focused
            ? 420
            : 148,
      }}
      onAnimationComplete={() => {
        if (has3dGlobe) {
          window.dispatchEvent(new Event('resize'));
        }
      }}
    >
      <div
        className={`relative aspect-square w-full ${
          hero ? 'max-w-[min(100%,72vmin)]' : 'max-w-[min(100%,420px)]'
        }`}
        style={{
          filter: focused ? `drop-shadow(0 0 28px ${glow})` : 'none',
        }}
      >
        {has3dGlobe && (
          <GlobeOrbCanvas
            planetId={planet.id}
            visible={focused}
            onReadyChange={setGlobeCanvasReady}
          />
        )}

        <PlanetSphere
          planet={planet}
          dimmed={!focused}
          hidden={has3dGlobe && focused && globeCanvasReady}
        />

        {!planet.available && (
          <span className="absolute bottom-[8%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-sharp bg-deep/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-ink-soft sm:text-[9px]">
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

/** Keeps the WebGL context alive so refocusing does not clip to a partial slice. */
function GlobeOrbCanvas({
  planetId,
  visible,
  onReadyChange,
}: {
  planetId: string;
  visible: boolean;
  onReadyChange: (ready: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;

    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const square =
        Math.abs(rect.width - rect.height) < 6 && rect.width >= 100;
      setCanvasReady(square);
      onReadyChange(square);
      if (square) window.dispatchEvent(new Event('resize'));
    };

    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    update();
    return () => ro.disconnect();
  }, [onReadyChange]);

  useEffect(() => {
    if (!visible) {
      setCanvasReady(false);
      onReadyChange(false);
    }
  }, [visible, onReadyChange]);

  const showCanvas = visible && canvasReady;

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden rounded-full border border-strong bg-deep"
      style={{
        visibility: visible ? 'visible' : 'hidden',
        opacity: showCanvas ? 1 : 0,
        pointerEvents: showCanvas ? 'auto' : 'none',
        zIndex: showCanvas ? 2 : 0,
        transition: 'opacity 0.2s ease',
      }}
      aria-hidden={!showCanvas}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={showCanvas ? 'always' : 'never'}
        resize={{ debounce: 0, scroll: false }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 2, 5]} intensity={2.2} color="#fff6ec" />
        <Suspense fallback={<GlobeFallback radius={2} />}>
          <CelestialGlobe
            planetId={planetId}
            autoRotate
            rotationSpeed={0.04}
            radius={2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

function PlanetSphere({
  planet,
  dimmed,
  hidden,
}: {
  planet: CelestialBody;
  dimmed: boolean;
  hidden?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = PLANET_IMAGES[planet.id];

  useEffect(() => {
    setImgFailed(false);
  }, [planet.id]);

  const fallback = PLANET_FALLBACKS[planet.id] ?? PLANET_FALLBACKS.moon;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-full border border-strong"
      style={{
        opacity: hidden ? 0 : dimmed ? 0.82 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
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
