import { CardSet } from '../types';
import db from './generated/database.json';

/**
 * Card sets, generated from the community Master Sheet via
 * `node scripts/importSheet.mjs`. Booster / Start Deck / Extra Booster sets are
 * openable products; every Cheer card is grouped into the single `hY` set, and
 * promos (`hPR`, `hBD`) into their own sets — none of which can be "opened".
 */
export const SETS: CardSet[] = db.sets as unknown as CardSet[];

export const SET_BY_CODE: Record<string, CardSet> = Object.fromEntries(
  SETS.map((s) => [s.code, s]),
);
