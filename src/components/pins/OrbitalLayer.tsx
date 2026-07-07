import { getOrbitersByPlanet } from '@/data/orbiters';
import { useAppStore } from '@/store/useAppStore';
import { OrbiterPin } from '@/components/pins/OrbiterPin';

interface OrbitalLayerProps {
  planetId: string;
}

export function OrbitalLayer({ planetId }: OrbitalLayerProps) {
  const showOrbiters = useAppStore((s) => s.showOrbiters);
  const orbiters = getOrbitersByPlanet(planetId);

  if (!showOrbiters || orbiters.length === 0) return null;

  return (
    <group>
      {orbiters.map((orbiter) => (
        <OrbiterPin key={orbiter.id} orbiter={orbiter} />
      ))}
    </group>
  );
}
