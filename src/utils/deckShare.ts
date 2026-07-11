import { Deck, DeckCard } from '../types';
import { CARD_BY_CODE } from '../data/cards';

const DECKLOG_HOCG_GAME_ID = 9; // hololive OFFICIAL CARD GAME on Deck Log
const DECKLOG_API = 'https://decklog.bushiroad.com/system/app/api/view/';
// Base for our own share links. The payload after #d= is self-contained, so the
// domain only matters once the web version is deployed.
const SHARE_BASE = 'https://holotcg.app/#d=';

// ----- our own export / import (works offline, no server) -------------------

export function encodeDeck(deck: Deck): string {
  const body = deck.cards.map((c) => `${c.setcode}:${c.count}`).join(',');
  return encodeURIComponent(`1|${deck.name}|${body}`);
}

export function shareUrlForDeck(deck: Deck): string {
  return SHARE_BASE + encodeDeck(deck);
}

// Imported data is untrusted (share links / Deck Log responses) — clamp it to
// sane bounds so a crafted link can't inject absurd counts or giant strings.
const MAX_IMPORT_COUNT = 60; // no legal deck holds more copies than this
const MAX_NAME_LEN = 60;
const MAX_IMPORT_ENTRIES = 200;

export function sanitizeCount(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n), 10);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(MAX_IMPORT_COUNT, Math.floor(v)));
}

export function sanitizeName(name: unknown, fallback: string): string {
  const s = typeof name === 'string' ? name.trim() : '';
  return (s || fallback).slice(0, MAX_NAME_LEN);
}

export function decodeDeckPayload(payload: string): { name: string; cards: DeckCard[] } | null {
  try {
    const [ver, name, body] = decodeURIComponent(payload).split('|');
    if (ver !== '1') return null;
    const cards: DeckCard[] = (body || '')
      .split(',')
      .filter(Boolean)
      .slice(0, MAX_IMPORT_ENTRIES)
      .map((p) => {
        const [setcode, count] = p.split(':');
        return { setcode, count: sanitizeCount(count) };
      })
      .filter((c) => CARD_BY_CODE[c.setcode]);
    return { name: sanitizeName(name, 'Imported deck'), cards };
  } catch {
    return null;
  }
}

// ----- input parsing --------------------------------------------------------

export type ImportInput =
  | { kind: 'payload'; payload: string }
  | { kind: 'decklog'; code: string }
  | null;

export function parseImportInput(input: string): ImportInput {
  const s = input.trim();
  if (!s) return null;
  // Our own share link / payload.
  const d = s.match(/[#?&]d=([^&\s]+)/);
  if (d) return { kind: 'payload', payload: d[1] };
  // A Deck Log URL.
  const url = s.match(/decklog\.bushiroad\.com\/view\/([A-Za-z0-9]+)/i);
  if (url) return { kind: 'decklog', code: url[1].toUpperCase() };
  // A bare Deck Log code (short, letters/numbers only).
  if (/^[A-Za-z0-9]{4,8}$/.test(s)) return { kind: 'decklog', code: s.toUpperCase() };
  // A raw payload (contains our delimiters).
  if (/%7C|\|/i.test(s)) return { kind: 'payload', payload: s };
  return null;
}

// ----- Deck Log import ------------------------------------------------------

export interface DecklogResult {
  name: string;
  cards: DeckCard[];
  skipped: number; // cards we don't have in our database
}

export async function fetchDecklogDeck(code: string): Promise<DecklogResult> {
  let res: Response;
  try {
    // Deck Log needs a browser User-Agent and a Referer pointing at the deck's
    // view page, otherwise it serves a WAF page / empty response. These headers
    // are settable on native; on web this call is blocked by CORS (needs a proxy).
    res = await fetch(DECKLOG_API + encodeURIComponent(code), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        Referer: `https://decklog.bushiroad.com/view/${code}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  } catch {
    throw new Error('Import failed — check your internet connection.');
  }
  if (!res.ok) throw new Error(`Couldn't find a deck for code "${code}".`);

  const d: any = await res.json();
  if (!d || Array.isArray(d) || d.game_title_id == null) {
    throw new Error(`Couldn't read deck "${code}".`);
  }
  if (d.game_title_id !== DECKLOG_HOCG_GAME_ID) {
    throw new Error("That deck isn't a hololive Card Game deck.");
  }

  // The response is external data — validate every card against our database
  // and clamp names/counts before it touches app state.
  const entries = [...(d.p_list || []), ...(d.list || []), ...(d.sub_list || [])].slice(0, 200);
  const cards: DeckCard[] = [];
  let skipped = 0;
  for (const e of entries) {
    const setcode = typeof e?.card_number === 'string' ? e.card_number : '';
    const count = sanitizeCount(e?.num ?? e?._num ?? 1);
    if (CARD_BY_CODE[setcode]) cards.push({ setcode, count });
    else skipped++;
  }
  if (!cards.length) throw new Error('None of that deck’s cards are in the database yet.');
  return { name: sanitizeName(d.title, `Deck ${code}`), cards, skipped };
}
