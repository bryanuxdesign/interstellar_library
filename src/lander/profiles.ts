export type LanderProfileId = 'apollo' | 'im1' | 'blue-ghost';

export interface LanderProfile {
  id: LanderProfileId;
  name: string;
  agency: string;
  /** Inertial mass — higher = slower acceleration for same thrust. */
  mass: number;
  /**
   * Minimum main-engine force when engine is on at throttle 0.
   * Force = minThrust + (maxThrust - minThrust) * throttle.
   */
  minThrust: number;
  /** Maximum main-engine force at throttle 1. */
  maxThrust: number;
  /** Rotation rate in degrees per second while holding left/right. */
  rcsSpeed: number;
  /** Starting fuel units. */
  fuel: number;
  /** Fuel burned per second at full throttle (scales with thrust fraction). */
  fuelBurnRate: number;
  description: string;
}

/**
 * Thrust/mass tuned so every craft can hover with margin under GRAVITY=1.62:
 * Apollo ~2.9× hover at max, IM-1 ~2.2×, Blue Ghost ~1.7×.
 * Min thrust sits below hover so low throttle still allows descent.
 */
export const LANDER_PROFILES: Record<LanderProfileId, LanderProfile> = {
  apollo: {
    id: 'apollo',
    name: 'Apollo Lunar Module',
    agency: 'NASA',
    mass: 7.2,
    minThrust: 8,
    maxThrust: 34,
    rcsSpeed: 40,
    fuel: 1000,
    fuelBurnRate: 14,
    description: 'Heavy descent stage — powerful engine, slow to turn.',
  },
  im1: {
    id: 'im1',
    name: 'IM-1 Odysseus',
    agency: 'Intuitive Machines',
    mass: 4.0,
    minThrust: 3,
    maxThrust: 14.5,
    rcsSpeed: 70,
    fuel: 600,
    fuelBurnRate: 9,
    description: 'Medium mass with precise, measured thrust.',
  },
  'blue-ghost': {
    id: 'blue-ghost',
    name: 'Firefly Blue Ghost',
    agency: 'Firefly Aerospace',
    mass: 2.2,
    minThrust: 1.5,
    maxThrust: 6.2,
    rcsSpeed: 100,
    fuel: 300,
    fuelBurnRate: 6,
    description: 'Light and snappy — lower thrust, fast RCS.',
  },
};

export const LANDER_PROFILE_LIST = Object.values(LANDER_PROFILES);

/** Current engine force for a profile at throttle 0..1 (engine must be on separately). */
export function thrustForceAt(profile: LanderProfile, throttle: number): number {
  const t = Math.max(0, Math.min(1, throttle));
  return profile.minThrust + (profile.maxThrust - profile.minThrust) * t;
}
