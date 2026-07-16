# Hololive OCG Collector
https://hololive-ocg-collector.longdodev.workers.dev/
An unofficial, fan-made companion app for the **hololive OFFICIAL CARD GAME** — browse every card, build decks, and track your collection. Runs on iOS, Android, and the web from a single codebase.

> Not affiliated with or endorsed by COVER Corp. / hololive production or Bushiroad. All card data and images belong to their respective owners. This is a non-commercial fan project.

## Features

- **Database** — every set browsable in a responsive card grid, with search, colour/type filters, sorting, and a switchable grid size. Tap a card for full details and all of its alternate arts.
- **Deck builder** — build to the game's rules (1 Oshi · 20 Cheer · 50 main deck), with live legality checks, per-card copy limits, a rules panel, and quantity editing. Rename / duplicate / delete decks.
- **Deck sharing & import** — export any deck as a share link, or import a deck straight from a [Deck Log](https://decklog.bushiroad.com) code (verifies it's a hololive deck first).
- **Collector** — a personal album per set plus a **Master Collection** view, with completion %, search, and sorting.
- **Dashboard** — collection stats and per-category progress at a glance.

Decks and collection are saved locally on the device/browser — no account, no server.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | **React Native** + **Expo (SDK 54)** — one codebase for iOS, Android & web |
| Language | **TypeScript** (strict) |
| Navigation | **React Navigation** (bottom tabs + native stacks) |
| Web target | **react-native-web** (exported as a static site) |
| Local storage | **AsyncStorage** (localStorage on web) |
| UI | Custom component library + `expo-linear-gradient`, `@expo/vector-icons` |

### Card data pipeline

The card database (`src/data/generated/database.json`, ~1,900 cards) is **generated**, not hand-written. [`scripts/importSheet.mjs`](scripts/importSheet.mjs) crawls the official card-list site and a community master sheet to assemble every card's data, arts, rarities, reprints, and images, then the app bundles the result. Re-running the script refreshes the data when new sets release.

## Getting started

```bash
npm install
npx expo start        # scan the QR with Expo Go (iOS/Android)
npm run web           # run in a browser
node scripts/importSheet.mjs   # regenerate the card database
```

## Project structure

```
src/
  components/   reusable UI (card tiles, badges, filters…)
  screens/      Database · Decks · Collector · Dashboard
  data/         card + set data (generated/) and loaders
  utils/        deck rules, sharing, sorting helpers
  context/      app-wide state + persistence
scripts/        card-database importer
```

## License

Code is released under the [MIT License](LICENSE). Card names, text, and images are the property of COVER Corp. and Bushiroad and are used here for a non-commercial fan tool only.
