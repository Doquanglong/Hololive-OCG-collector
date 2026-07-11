export type DatabaseStackParams = {
  Sets: undefined;
  SetCards: { setCode: string };
  CardDetail: { uid: string };
};

export type DeckStackParams = {
  Decks: undefined;
  DeckDetail: { deckId: string };
  CardDetail: { uid: string };
};

export type CollectorStackParams = {
  CollectorSets: undefined;
  CollectorAlbum: { setCode: string };
};

export type DashboardStackParams = {
  Dashboard: undefined;
};
