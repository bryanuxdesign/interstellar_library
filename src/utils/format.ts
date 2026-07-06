import type { Coordinates } from '@/types';

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);

export const formatMass = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t`;
  return `${formatNumber(kg)} kg`;
};

export const formatCoordinates = ({ lat, lng }: Coordinates): string => {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lng).toFixed(2)}° ${ew}`;
};

export const formatLifespan = (days: number | null): string => {
  if (days === null) return 'Ongoing';
  if (days === 0) return 'Terminal descent';
  if (days === 1) return '1 day';
  if (days < 60) return `${days} days`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
};
