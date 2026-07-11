// Core domain models for the Hololive Official Card Game database.

export type CardColor =
  | 'White'
  | 'Red'
  | 'Green'
  | 'Yellow'
  | 'Blue'
  | 'Purple'
  | 'None';

// Card type strings come straight from the sheet (e.g. "Oshi holomem",
// "Debut holomem", "1st holomem", "1st Buzz holomem", "2nd holomem",
// "Support (Event)", "Cheer", …), so this stays open. Use `typeGroup()` to
// bucket them for filtering / deck sections.
export type CardType = string;

/** Broad grouping used for filters, sorting and deck sections. */
export type TypeGroup = 'Oshi' | 'Holomem' | 'Support' | 'Cheer';

/**
 * A single printed artwork of a card. One card (identified by `setcode`) can
 * have several arts that share the same id — e.g. an alternate illustration or
 * a full-art secret rare. Reprints from an earlier set are also modelled here.
 */
export interface CardArt {
  artId: string; // globally unique, e.g. "hSD01-001_a"
  rarity: string; // OSR, RR, R, U, C, SR, SEC, P ...
  illustrator?: string;
  image?: string; // optional remote image url; falls back to a placeholder
  gradient?: [string, string]; // placeholder art colors
}

export interface Card {
  uid: string; // unique per printing (reprints share a setcode)
  setcode: string; // e.g. "hSD01-001"
  set: string; // owning set code, e.g. "hSD01"
  isReprint?: boolean;
  reprintOf?: string; // original set code, e.g. "hBP01"
  nameJp: string;
  nameEn: string;
  type: CardType;
  color: CardColor;
  life?: number; // Oshi holomem
  hp?: number; // holomem
  bloomLevel?: string;
  batonPass?: number;
  tags?: string[];
  /** Deck copy limit for this card id. 0 means unlimited-per-card (cheer / "any number"). */
  maxCopies?: number;
  text: string; // translated skill / ability text
  arts: CardArt[]; // 1..n arts
}

export interface CardSet {
  code: string; // e.g. "hSD01"
  name: string;
  shortName: string;
  releaseDate?: string;
  accent: string;
  isPromo?: boolean;
  isCheer?: boolean;
  comingSoon?: boolean;
}

// ----- User data -----------------------------------------------------------

/** Map of artId -> number of copies the collector owns. */
export type Collection = Record<string, number>;

export interface DeckCard {
  setcode: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  accent: string;
  cards: DeckCard[];
}
