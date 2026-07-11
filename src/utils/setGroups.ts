import { CardSet } from '../types';

export interface SetSection {
  key: string;
  title: string;
  /** Collapsible categories (Boosters, Start Decks…) vs. flat rows (Cheer, Promo…). */
  collapsible: boolean;
  sets: CardSet[];
}

function categoryOf(s: CardSet): string {
  if (s.code.startsWith('hBP')) return 'Boosters';
  if (s.code.startsWith('hEB')) return 'Extra Boosters';
  if (/^Live Start Deck/i.test(s.name)) return 'Live Start Decks';
  if (s.code.startsWith('hSD')) return 'Start Decks';
  if (s.isCheer || s.code === 'hYS01') return 'Cheer';
  if (s.code === 'hBD') return 'Birthday Promo';
  if (s.isPromo) return 'Promo';
  return 'Other';
}

const ORDER = [
  'Start Decks',
  'Live Start Decks',
  'Boosters',
  'Extra Boosters',
  'Cheer',
  'Promo',
  'Birthday Promo',
  'Other',
];
const FLAT = new Set(['Cheer', 'Promo', 'Birthday Promo']);

/** Group sets into ordered collapsible categories + flat rows. */
export function getSetSections(sets: CardSet[]): SetSection[] {
  const groups: Record<string, CardSet[]> = {};
  for (const s of sets) (groups[categoryOf(s)] ??= []).push(s);
  return ORDER.filter((k) => groups[k]?.length).map((k) => ({
    key: k,
    title: k,
    collapsible: !FLAT.has(k),
    sets: groups[k],
  }));
}
