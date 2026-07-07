/** Maps a mission's country of origin to a flag emoji. */
const FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  USSR: '🇷🇺',
  Russia: '🇷🇺',
  China: '🇨🇳',
  India: '🇮🇳',
  'South Korea': '🇰🇷',
  Japan: '🇯🇵',
  Israel: '🇮🇱',
};

export const countryFlag = (country: string): string => FLAGS[country] ?? '🛰️';
