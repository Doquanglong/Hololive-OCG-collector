import { Card, Deck } from '../types';
import { CARD_BY_CODE } from '../data/cards';
import { typeGroup } from './cardType';

// A legal deck = 1 Oshi + 20 Cheer + 60 (holomem + support).
export const DECK_RULES = { oshi: 1, cheer: 20, main: 60 };
export const DEFAULT_MAX_COPIES = 4;

/** Per-card copy limit. 0 (unlimited) is returned as Infinity. */
export function copyLimit(card: Card): number {
  const g = typeGroup(card.type);
  if (g === 'Oshi') return 1;
  if (g === 'Cheer') return Infinity; // capped by the 20-cheer deck rule, not per card
  if (card.maxCopies === 0) return Infinity; // "any number"
  return card.maxCopies ?? DEFAULT_MAX_COPIES;
}

export interface DeckAnalysis {
  oshi: number;
  cheer: number;
  main: number; // holomem + support
  total: number;
  valid: boolean;
  issues: string[];
}

export function analyzeDeck(deck: Deck | undefined): DeckAnalysis {
  let oshi = 0;
  let cheer = 0;
  let main = 0;
  const issues: string[] = [];

  if (deck) {
    for (const dc of deck.cards) {
      const card = CARD_BY_CODE[dc.setcode];
      if (!card) continue;
      const g = typeGroup(card.type);
      if (g === 'Oshi') oshi += dc.count;
      else if (g === 'Cheer') cheer += dc.count;
      else main += dc.count;

      const limit = copyLimit(card);
      if (dc.count > limit) issues.push(`${card.nameEn} over ${limit}-copy limit`);
    }
  }

  if (oshi !== DECK_RULES.oshi) issues.push(`Need exactly 1 Oshi (have ${oshi})`);
  if (cheer !== DECK_RULES.cheer) issues.push(`Need 20 Cheer (have ${cheer})`);
  if (main !== DECK_RULES.main) issues.push(`Need 60 main-deck cards (have ${main})`);

  return { oshi, cheer, main, total: oshi + cheer + main, valid: issues.length === 0, issues };
}

/** Whether one more copy of `card` may be added to `deck` under the rules. */
export function canAddCard(deck: Deck | undefined, card: Card, current: number): boolean {
  return current < maxCountFor(deck, card);
}

/**
 * The highest number of copies of `card` allowed in `deck` right now — bounded
 * by both the per-card copy limit and the remaining room in its section
 * (1 Oshi / 20 Cheer / 60 main).
 */
export function maxCountFor(deck: Deck | undefined, card: Card): number {
  const a = analyzeDeck(deck);
  const g = typeGroup(card.type);
  const cap = g === 'Oshi' ? DECK_RULES.oshi : g === 'Cheer' ? DECK_RULES.cheer : DECK_RULES.main;
  const groupTotal = g === 'Oshi' ? a.oshi : g === 'Cheer' ? a.cheer : a.main;
  const current = deck?.cards.find((c) => c.setcode === card.setcode)?.count ?? 0;
  const roomInSection = current + (cap - groupTotal);
  return Math.max(0, Math.min(copyLimit(card), roomInSection));
}
