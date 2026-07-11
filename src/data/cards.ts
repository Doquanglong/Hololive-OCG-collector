import { Card } from '../types';
import db from './generated/database.json';

/**
 * The full card database, generated from the community Master Sheet via
 * `node scripts/importSheet.mjs`. Re-run that script to refresh.
 *
 * Notes on the game's structure, preserved by the importer:
 *  - a single `setcode` can carry several `arts` (alternate illustrations /
 *    secret rares) that share the card id;
 *  - reprints keep their own setcode but appear in each set they were printed in;
 *  - every non-promo Cheer card is grouped into the single `hY` set;
 *  - `maxCopies` is the deck copy limit (0 = unlimited-per-card).
 *
 * Card art renders as a themed placeholder unless an art has a real `image`
 * url from the sheet.
 */
export const CARDS: Card[] = db.cards as unknown as Card[];

/** Look up a specific printing (originals and reprints have distinct uids). */
export const CARD_BY_UID: Record<string, Card> = Object.fromEntries(
  CARDS.map((c) => [c.uid, c]),
);

/**
 * Look up a card by its number. When a number has both an original and a
 * reprint, the original (home) printing wins — used for deck identity.
 */
export const CARD_BY_CODE: Record<string, Card> = {};
for (const c of CARDS) {
  const cur = CARD_BY_CODE[c.setcode];
  if (!cur || (cur.isReprint && !c.isReprint)) CARD_BY_CODE[c.setcode] = c;
}

export const ALL_ART_IDS: string[] = CARDS.flatMap((c) => c.arts.map((a) => a.artId));

const CARDS_BY_SET: Record<string, Card[]> = {};
for (const c of CARDS) (CARDS_BY_SET[c.set] ??= []).push(c);

export function cardsInSet(setCode: string): Card[] {
  return CARDS_BY_SET[setCode] ?? [];
}

/** Total number of distinct arts printed in a set (variants counted). */
export function artCountInSet(setCode: string): number {
  return cardsInSet(setCode).reduce((sum, c) => sum + c.arts.length, 0);
}
