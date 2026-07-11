import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collection, Deck, DeckCard } from '../types';

const COLLECTION_KEY = '@holotcg/collection/v1';
const DECKS_KEY = '@holotcg/decks/v1';

const DECK_ACCENTS = [
  '#e5484d',
  '#4b8ef0',
  '#3fb968',
  '#9b5de5',
  '#f0c14b',
  '#ff7ac6',
];

interface AppData {
  ready: boolean;
  collection: Collection;
  decks: Deck[];

  // collection
  ownedCount: (artId: string) => number;
  setOwned: (artId: string, count: number) => void;
  toggleOwned: (artId: string) => void;

  // decks
  createDeck: (name: string) => Deck;
  createDeckFrom: (name: string, cards: DeckCard[]) => Deck;
  renameDeck: (id: string, name: string) => void;
  deleteDeck: (id: string) => void;
  duplicateDeck: (id: string) => Deck | undefined;
  addCardToDeck: (deckId: string, setcode: string, delta?: number) => void;
  setCardInDeck: (deckId: string, setcode: string, count: number) => void;
  removeCardFromDeck: (deckId: string, setcode: string) => void;
  deckCardCount: (deckId: string, setcode: string) => number;
  deckSize: (deckId: string) => number;
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [collection, setCollection] = useState<Collection>({});
  const [decks, setDecks] = useState<Deck[]>([]);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      try {
        const [c, d] = await Promise.all([
          AsyncStorage.getItem(COLLECTION_KEY),
          AsyncStorage.getItem(DECKS_KEY),
        ]);
        // Guard the shapes — corrupted storage should never crash the app.
        if (c) {
          const parsed = JSON.parse(c);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) setCollection(parsed);
        }
        if (d) {
          const parsed = JSON.parse(d);
          if (Array.isArray(parsed)) setDecks(parsed.filter((x) => x && Array.isArray(x.cards)));
        }
      } catch (e) {
        console.warn('Failed to load app data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (ready) AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  }, [collection, ready]);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }, [decks, ready]);

  const ownedCount = useCallback(
    (artId: string) => collection[artId] ?? 0,
    [collection],
  );

  const setOwned = useCallback((artId: string, count: number) => {
    setCollection((prev) => {
      const next = { ...prev };
      if (count <= 0) delete next[artId];
      else next[artId] = count;
      return next;
    });
  }, []);

  const toggleOwned = useCallback((artId: string) => {
    setCollection((prev) => {
      const next = { ...prev };
      if (next[artId]) delete next[artId];
      else next[artId] = 1;
      return next;
    });
  }, []);

  const newDeck = (name: string, cards: DeckCard[]): Deck => ({
    id: `deck_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim() || 'New Deck',
    accent: DECK_ACCENTS[Math.floor(Math.random() * DECK_ACCENTS.length)],
    cards,
  });

  const createDeck = useCallback((name: string) => {
    const deck = newDeck(name, []);
    setDecks((prev) => [...prev, deck]);
    return deck;
  }, []);

  const createDeckFrom = useCallback((name: string, cards: DeckCard[]) => {
    // Merge duplicate setcodes just in case.
    const merged = new Map<string, number>();
    for (const c of cards) merged.set(c.setcode, (merged.get(c.setcode) ?? 0) + c.count);
    const deck = newDeck(
      name,
      [...merged.entries()].map(([setcode, count]) => ({ setcode, count })),
    );
    setDecks((prev) => [...prev, deck]);
    return deck;
  }, []);

  const renameDeck = useCallback((id: string, name: string) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name } : d)),
    );
  }, []);

  const deleteDeck = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const duplicateDeck = useCallback((id: string) => {
    let copy: Deck | undefined;
    setDecks((prev) => {
      const src = prev.find((d) => d.id === id);
      if (!src) return prev;
      copy = {
        ...src,
        id: `deck_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `${src.name} copy`,
        cards: src.cards.map((c) => ({ ...c })),
      };
      return [...prev, copy];
    });
    return copy;
  }, []);

  const addCardToDeck = useCallback(
    (deckId: string, setcode: string, delta = 1) => {
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== deckId) return d;
          const cards: DeckCard[] = [...d.cards];
          const idx = cards.findIndex((c) => c.setcode === setcode);
          if (idx === -1) {
            if (delta > 0) cards.push({ setcode, count: delta });
          } else {
            const count = cards[idx].count + delta;
            if (count <= 0) cards.splice(idx, 1);
            else cards[idx] = { ...cards[idx], count };
          }
          return { ...d, cards };
        }),
      );
    },
    [],
  );

  const setCardInDeck = useCallback((deckId: string, setcode: string, count: number) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== deckId) return d;
        const cards = d.cards.filter((c) => c.setcode !== setcode);
        if (count > 0) cards.push({ setcode, count });
        return { ...d, cards };
      }),
    );
  }, []);

  const removeCardFromDeck = useCallback((deckId: string, setcode: string) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.setcode !== setcode) }
          : d,
      ),
    );
  }, []);

  const deckCardCount = useCallback(
    (deckId: string, setcode: string) => {
      const deck = decks.find((d) => d.id === deckId);
      return deck?.cards.find((c) => c.setcode === setcode)?.count ?? 0;
    },
    [decks],
  );

  const deckSize = useCallback(
    (deckId: string) => {
      const deck = decks.find((d) => d.id === deckId);
      return deck?.cards.reduce((s, c) => s + c.count, 0) ?? 0;
    },
    [decks],
  );

  const value = useMemo<AppData>(
    () => ({
      ready,
      collection,
      decks,
      ownedCount,
      setOwned,
      toggleOwned,
      createDeck,
      createDeckFrom,
      renameDeck,
      deleteDeck,
      duplicateDeck,
      addCardToDeck,
      setCardInDeck,
      removeCardFromDeck,
      deckCardCount,
      deckSize,
    }),
    [
      ready,
      collection,
      decks,
      ownedCount,
      setOwned,
      toggleOwned,
      createDeck,
      createDeckFrom,
      renameDeck,
      deleteDeck,
      duplicateDeck,
      addCardToDeck,
      setCardInDeck,
      removeCardFromDeck,
      deckCardCount,
      deckSize,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
