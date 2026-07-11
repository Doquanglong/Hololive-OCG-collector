import { CardColor } from './types';

// Palette inspired by the official hololive OCG site: a light lavender-grey
// ground (#EDECF3), deep indigo primary (#534B88), gold accents, and soft
// card-color filters.
export const colors = {
  bg: '#edecf3',
  surface: '#ffffff',
  surface2: '#f1eff8',
  card: '#ffffff',
  cardText: '#2b2745',
  border: '#dcd8ea',
  text: '#2b2745',
  textDim: '#6e6790',
  textFaint: '#a29bbe',
  accent: '#534b88',
  accentDeep: '#453c72',
  header: '#534b88',
  headerText: '#ffffff',
  gold: '#e0a52f',
  good: '#3f9d63',
  warn: '#e0a52f',
};

/** Holographic rainbow used for foil/secret rarity indicators. */
export const rainbow: readonly [string, string, ...string[]] = [
  '#ff5f6d',
  '#ffc371',
  '#a8e063',
  '#56ccf2',
  '#7a5fff',
  '#ff5f9e',
];

export const cardColorSwatch: Record<CardColor, string> = {
  White: '#e4e2ee',
  Red: '#dd7d7d',
  Green: '#50a075',
  Blue: '#6a8fd5',
  Purple: '#6b629f',
  Yellow: '#e8af44',
  None: '#a29bbe',
};

export const cardColorGradient: Record<CardColor, [string, string]> = {
  White: ['#ffffff', '#ddd9ec'],
  Red: ['#e79a9a', '#cf5f5f'],
  Green: ['#7fbf9a', '#3f8b60'],
  Blue: ['#93b3e2', '#5a7fc4'],
  Purple: ['#a096c6', '#5f5691'],
  Yellow: ['#eece86', '#cf9c2f'],
  None: ['#cbc8db', '#9a95b3'],
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
