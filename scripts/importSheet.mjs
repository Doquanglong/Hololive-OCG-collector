// Imports the hololive OCG card database from the community Google Sheet
// (Master Sheet tab) and writes src/data/generated/database.json.
//
//   node scripts/importSheet.mjs
//
// Re-run any time to refresh. Images: the sheet's Image column is used when
// present; otherwise the app renders a themed placeholder.

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src', 'data', 'generated', 'database.json');

const SHEET_ID = '1IdaueY-Jw8JXjYLOhA9hUd2w0VRBao9Z1URJwmCWJ64';
const MASTER_GID = '118173957';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${MASTER_GID}`;

// Set display names (from the sheet's tab titles), applying the naming rules:
//  - "Booster hBPxx Name"  -> keep just "Name"     (drop the "Booster" word)
//  - "Start Deck ..."      -> keep the Start Deck naming
// Codes are derived from the setcode prefix (hBP01-001 -> hBP01).
// Overrides for the grouped pseudo-sets; every other set's name is derived
// from the sheet's Pack column (see cleanName).
const SET_META = {
  hY: { name: 'Cheer Cards', isCheer: true },
  hPR: { name: 'Promo Collection', isPromo: true },
  hBD: { name: 'Birthday / Promo', isPromo: true },
};

// Naming rules from the user:
//  - "Booster hBPxx / Set N <Name>" -> drop the word Booster, keep "<Name>"
//    (the hBPxx code is already shown separately in the UI).
//  - "Start Deck ..." -> keep the Start Deck naming.
function cleanName(code, pack) {
  const meta = SET_META[code];
  if (meta) return meta.name;
  let p = (pack || code).trim();
  p = p.replace(/\s*\((JP|EN)\)\s*$/i, '');
  p = p.replace(/^Set\s+\d+\s+/i, ''); // booster: "Set 1 Blooming Radiance" -> "Blooming Radiance"
  p = p.replace(/^Extra Booster\s+\d+\s+/i, 'Extra Booster · ');
  p = p.replace(/^Booster\s+h\w+\s+/i, ''); // "Booster hBP09 Volume Vortex" -> "Volume Vortex"
  return p || code;
}
function shortNameFor(name) {
  return name.replace(/^(Start Deck|Live Start Deck)\s+/i, '').slice(0, 24);
}

const ACCENTS = {
  White: '#e9e9f0', Red: '#e5484d', Green: '#3fb968', Blue: '#4b8ef0',
  Purple: '#9b5de5', Yellow: '#f0c14b', None: '#8a909e',
};
// deterministic accent per set code
function accentFor(code, sampleColor) {
  if (code === 'hPR' || code === 'hBD') return '#f0c14b';
  if (code === 'hY') return '#ff7ac6';
  const palette = ['#4b8ef0', '#e5484d', '#3fb968', '#9b5de5', '#f0c14b', '#ff7ac6', '#25b0c4'];
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

function get(url, depth = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (r) => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && depth < 5) {
          // Location may be relative — resolve it against the current url.
          const next = new URL(r.headers.location, url).toString();
          r.resume();
          return get(next, depth + 1).then(resolve, reject);
        }
        let d = '';
        r.setEncoding('utf8');
        r.on('data', (c) => (d += c));
        r.on('end', () => resolve(d));
      })
      .on('error', reject);
  });
}

function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function splitName(raw) {
  // "ときのそら\n(Tokino Sora)" -> { jp, en }
  const s = (raw || '').trim();
  const m = s.match(/^([\s\S]*?)\s*\(([^)]*)\)\s*$/);
  if (m && /[^\x00-\x7F]/.test(m[1])) return { jp: m[1].trim(), en: m[2].trim() };
  return { jp: s, en: s };
}

function setCodeFor(setcode, type) {
  const prefix = setcode.split('-')[0];
  const isPromo = /^hPR/i.test(prefix) || /^hBD/i.test(prefix);
  // Group every non-promo Cheer card into the single "hY" (Cheer) set.
  if (/cheer/i.test(type) && !isPromo) return 'hY';
  if (/^hY\d/i.test(prefix) && !isPromo) return 'hY';
  if (/^hBD/i.test(prefix)) return 'hBD';
  if (/^hPR/i.test(prefix)) return 'hPR';
  return prefix;
}

// Origin only — the crawled `path` already begins with /wp-content/images/…
const IMG_BASE = 'https://hololive-official-cardgame.com';

// Site expansions to crawl for authoritative base-art image URLs. The folder in
// each URL varies (hBP07, COMMON for cheer, hY01 for the cheer-oshi set, hPR for
// promos, and _re / _02 filename suffixes), so we read it from the site rather
// than guessing.
// Only the browsable card sets. Cheer & promo (which span many folders /
// collab products) come from the dedicated queries below.
const SITE_EXPANSIONS = [
  'hBP01', 'hBP02', 'hBP03', 'hBP04', 'hBP05', 'hBP06', 'hBP07', 'hBP08',
  'hSD01', 'hSD02', 'hSD03', 'hSD04', 'hSD05', 'hSD06', 'hSD07', 'hSD08', 'hSD09',
  'hSD10', 'hSD11', 'hSD12', 'hSD13', 'hSD14', 'hSD15', 'hSD16', 'hSD17', 'hSD18',
  'hSD19', 'hYS01',
];

// Expansion codes that are real browsable sets (reprints only shown in these).
const isRealSet = (code) => /^(hBP|hSD|hEB)\d/.test(code);

// Promo / collab expansions — all folded into the Promo section.
const PROMO_EXPANSIONS = ['hPR', 'hWF01', 'hCO01', 'hCS01', 'hPC01'];

const SEARCH = 'https://hololive-official-cardgame.com/cardlist/cardsearch_ex';
// Cheer cards (card_kind=エール) and every promo (rare=P) are scattered across
// folders; these queries list them all with their real image URLs + names.
const CHEER_QUERY = `${SEARCH}?keyword=&card_kind%5B%5D=%E3%82%A8%E3%83%BC%E3%83%AB&rare%5B%5D=all&bloom_level%5B%5D=all&parallel%5B%5D=all`;
const PROMO_QUERY = `${SEARCH}?keyword=&rare%5B%5D=P&bloom_level%5B%5D=all&parallel%5B%5D=all`;

// Rarity ordering so arts render base-first, then foils/secrets in the right
// sequence: RR -> SR -> UR, and OSR -> OUR -> SEC. HR (reprint high-rarity) last.
const RARITY_RANK = {
  C: 1, U: 2, R: 3, RR: 4, S: 5, SR: 6, UR: 7,
  OC: 9, P: 9, PR: 9, SY: 5,
  OSR: 20, OUR: 21, SEC: 22, HR: 30,
};
const rankOf = (r) => RARITY_RANK[(r || '').toUpperCase()] ?? 50;
const sortArts = (arts) => arts.slice().sort((a, b) => rankOf(a.rarity) - rankOf(b.rarity));

const CARD_IMG_RE =
  /<img[^>]+src="(\/wp-content\/images\/cardlist\/([^/"]+)\/([A-Za-z0-9]+-[0-9A-Za-z]+)_([A-Za-z0-9_]+)\.png)"[^>]*(?:alt|title)="([^"]*)"/g;

// The filename tail after the setcode can be RARITY, INDEX_RARITY (e.g. 02_C),
// RARITY_INDEX (P_02) or RARITY_re. The rarity is the all-uppercase token.
function rarityFromTail(tail) {
  const parts = (tail || '').split('_');
  return parts.find((p) => /^[A-Z]+$/.test(p)) || parts[0] || '';
}

/**
 * Page through a card-search url and return every card image it lists:
 * { url, folder, setcode, rarity, file, jpName }. The search lists ALL printings
 * (base + foils/secrets + reprints + HR), so no probing is needed.
 */
async function crawlList(baseUrl, label) {
  const rows = [];
  const seen = new Set();
  for (let page = 1; page <= 30; page++) {
    const html = await get(`${baseUrl}&page=${page}`);
    let newOnPage = 0;
    for (const m of html.matchAll(CARD_IMG_RE)) {
      const [, path, folder, setcode, tail, jpName] = m;
      const file = path.split('/').pop().replace('.png', '');
      if (seen.has(file)) continue;
      seen.add(file);
      newOnPage++;
      rows.push({ url: `${IMG_BASE}${path}`, folder, setcode, rarity: rarityFromTail(tail), file, jpName });
    }
    if (newOnPage === 0) break; // out of pages (site repeats page 1 when exhausted)
  }
  if (label) console.log(`  ${label}: ${rows.length} images`);
  return rows;
}

function addArt(map, setcode, row) {
  let e = map.get(setcode);
  if (!e) {
    e = { arts: [], jpName: row.jpName, folder: row.folder };
    map.set(setcode, e);
  }
  if (!e.arts.some((a) => a.artId === row.file)) {
    e.arts.push({ artId: row.file, rarity: row.rarity, image: row.url });
  }
}

function groupRows(rows) {
  const g = new Map();
  for (const r of rows) addArt(g, r.setcode, r);
  return g;
}

/**
 * Crawl the official site, keeping each expansion's printing SEPARATE so a card
 * printed in several sets (original / booster reprint / promo) keeps distinct
 * art per printing.
 *  - printings: expansion -> Map(setcode -> { arts, jpName })
 *  - promo:     Map(setcode -> { arts, jpName })  (the hPR promo product)
 *  - cheer:     Map(setcode -> { arts, jpName })
 */
async function crawlSite() {
  console.log('Crawling official card search…');
  const printings = {};
  for (const ex of SITE_EXPANSIONS) {
    printings[ex] = groupRows(await crawlList(`${SEARCH}?keyword=&expansion=${ex}`));
  }
  // The promo product spans several promo/collab expansions.
  const promo = new Map();
  for (const ex of PROMO_EXPANSIONS) {
    for (const r of await crawlList(`${SEARCH}?keyword=&expansion=${ex}`, ex)) addArt(promo, r.setcode, r);
  }
  const cheer = groupRows(await crawlList(CHEER_QUERY, 'cheer'));
  console.log(`  promo: ${promo.size}, cheer: ${cheer.size}`);
  return { printings, promo, cheer };
}

// A card is unlimited-per-copy if it's Cheer, or its text says you may include
// any number of it (e.g. "You may include any number of this holomem in the deck").
const UNLIMITED_TEXT = /(include any number|any number of (this|cards with the same))/i;
function maxCopies(type, text) {
  if (/cheer/i.test(type)) return 0; // 0 == unlimited-per-card (deck capped at 20 total)
  if (UNLIMITED_TEXT.test(text || '')) return 0;
  return 4;
}

async function main() {
  console.log('Fetching Master Sheet…');
  const csv = await get(CSV_URL);
  if (/^<!DOCTYPE/i.test(csv.trim())) {
    console.error('Got an HTML page instead of CSV — the sheet is not link-shared for export.');
    process.exit(1);
  }
  const rows = parseCSV(csv);
  const header = rows[0].map((h) => h.trim());
  const col = (n) => header.indexOf(n);
  const iSet = col('Setcode');
  const iName = col('Card Name "JP (EN)"');
  const iImg = col('Image');
  const iType = col('Type');
  const iRar = col('Rarity');
  const iColor = col('Color');
  const iLifeHp = col('LIFE/HP');
  const iTags = col('Tags');
  const iBaton = col('Baton Pass');
  const iText = col('Text');
  const iPack = col('Pack');

  const cardsByCode = new Map();
  const setSample = new Map(); // setCode -> { pack, color }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const setcode = (row[iSet] || '').trim();
    if (!/^h[A-Za-z]/.test(setcode) || !setcode.includes('-')) continue;

    const type = (row[iType] || '').trim();
    const rawColor = (row[iColor] || '').trim();
    const color = ACCENTS[rawColor] ? rawColor : 'None';
    const set = setCodeFor(setcode, type);
    const { jp, en } = splitName(row[iName]);
    const lifeHp = parseInt((row[iLifeHp] || '').trim(), 10);
    const tags = (row[iTags] || '')
      .split('#').map((t) => t.trim()).filter(Boolean);
    const image = (row[iImg] || '').trim();
    const rarity = (row[iRar] || '').trim() || '—';

    if (!setSample.has(set)) setSample.set(set, { pack: (row[iPack] || '').trim(), color });

    let card = cardsByCode.get(setcode);
    if (!card) {
      const isOshi = /oshi/i.test(type);
      card = {
        setcode,
        set,
        nameJp: jp,
        nameEn: en,
        type,
        color,
        tags: tags.length ? tags : undefined,
        text: (row[iText] || '').trim(),
        maxCopies: maxCopies(type, row[iText]),
        arts: [],
      };
      if (!isNaN(lifeHp)) { if (isOshi) card.life = lifeHp; else card.hp = lifeHp; }
      const baton = parseInt((row[iBaton] || '').trim(), 10);
      if (!isNaN(baton)) card.batonPass = baton;
      cardsByCode.set(setcode, card);
    }
    // Fallback single art (sheet rarity, no image) until the crawl fills it in.
    if (card.arts.length === 0) {
      card.arts.push({ artId: `${setcode}_${rarity}`, rarity });
    }
  }

  let cards = [...cardsByCode.values()];

  // JP -> EN name map (for promo/cheer cards that only give a JP name).
  const jpToEn = new Map();
  for (const c of cards) if (c.nameJp && c.nameEn && c.nameJp !== c.nameEn) jpToEn.set(c.nameJp, c.nameEn);

  const cloneFrom = (src, overrides) => ({
    setcode: overrides.setcode,
    set: overrides.set,
    nameJp: src?.nameJp || overrides.jpName || overrides.setcode,
    nameEn: src?.nameEn || jpToEn.get(overrides.jpName) || overrides.jpName || overrides.setcode,
    type: overrides.type ?? src?.type ?? '',
    color: src?.color || 'None',
    life: src?.life,
    hp: src?.hp,
    tags: src?.tags,
    text: src?.text || '',
    maxCopies: overrides.maxCopies ?? src?.maxCopies ?? 4,
    ...(overrides.extra || {}),
    arts: sortArts(overrides.arts),
  });

  if (!process.argv.includes('--no-images')) {
    const { printings, promo, cheer } = await crawlSite();

    // Home art for each known card, from its own printing.
    const homeArtsFor = (c) => {
      if (c.set === 'hY') return cheer.get(c.setcode)?.arts;
      if (c.set === 'hBD' || c.set === 'hPR') return promo.get(c.setcode)?.arts;
      const ex = c.setcode.split('-')[0];
      return printings[ex]?.get(c.setcode)?.arts;
    };

    // 1. Real arts for known cards.
    for (const c of cards) {
      const a = homeArtsFor(c);
      if (a?.length) c.arts = sortArts(a);
    }

    // 2. Reprints — a set card re-printed in a LATER booster/start-deck with new
    //    art (+ HR). Kept as its own printing in that set.
    for (const ex of SITE_EXPANSIONS) {
      if (!isRealSet(ex)) continue;
      for (const [setcode, e] of printings[ex]) {
        const prefix = setcode.split('-')[0];
        if (prefix === ex || !isRealSet(prefix)) continue;
        cards.push(
          cloneFrom(cardsByCode.get(setcode), {
            setcode,
            set: ex,
            jpName: e.jpName,
            arts: e.arts,
            extra: { isReprint: true, reprintOf: prefix },
          }),
        );
      }
    }

    // 3. Promo product (hPR expansion): birthday cards -> hBD; everything else
    //    (booster promo prints, PR-only cards) -> the Promo section (hPR).
    for (const [setcode, e] of promo) {
      const prefix = setcode.split('-')[0];
      const isBirthday = /^hBD/.test(prefix);
      const set = isBirthday ? 'hBD' : 'hPR';
      // Birthday/PR cards already in the sheet get their arts in step 1.
      if (cardsByCode.get(setcode)?.set === set) continue;
      cards.push(
        cloneFrom(cardsByCode.get(setcode), {
          setcode,
          set,
          jpName: e.jpName,
          arts: e.arts,
          // A booster card that also has a promo print -> flag as reprint-in-promo.
          extra: !isBirthday && isRealSet(prefix) ? { isReprint: true, reprintOf: prefix } : {},
        }),
      );
    }

    // 4. Cheer cards on the site but missing from the sheet.
    for (const [setcode, e] of cheer) {
      if (cardsByCode.has(setcode)) continue;
      cards.push(
        cloneFrom(null, {
          setcode,
          set: 'hY',
          jpName: e.jpName,
          type: 'Cheer',
          maxCopies: 0,
          arts: e.arts,
        }),
      );
    }
  }

  // Cheer cards with no artwork aren't worth showing — drop them.
  cards = cards.filter((c) => !(c.set === 'hY' && !c.arts.some((a) => a.image)));

  // Stable unique id per printing (reprints share a setcode with the original).
  const uidSeen = new Set();
  for (const c of cards) {
    let uid = c.isReprint ? `${c.set}:${c.setcode}` : c.setcode;
    while (uidSeen.has(uid)) uid += '_';
    uidSeen.add(uid);
    c.uid = uid;
  }

  // Build set list in a sensible order.
  const order = (c) => {
    if (c.startsWith('hSD')) return 1000 + parseInt(c.slice(3), 10);
    if (c.startsWith('hBP')) return 2000 + parseInt(c.slice(3), 10);
    if (c.startsWith('hEB')) return 3000 + parseInt(c.slice(3), 10);
    if (c === 'hYS01') return 4000;
    if (c === 'hY') return 5000;
    if (c === 'hBD') return 8000;
    if (c === 'hPR') return 9000;
    return 6000;
  };
  const setCodes = [...setSample.keys()].sort((a, b) => order(a) - order(b));
  const sets = setCodes.map((code) => {
    const meta = SET_META[code] || {};
    const sample = setSample.get(code);
    const setCards = cards.filter((c) => c.set === code);
    const count = setCards.length;
    const name = cleanName(code, sample?.pack);
    // Openable set with cards but no artwork yet = not officially released.
    const comingSoon =
      /^(hBP|hSD|hEB)\d/.test(code) && count > 0 && !setCards.some((c) => c.arts.some((a) => a.image));
    return {
      code,
      name,
      shortName: shortNameFor(name),
      accent: accentFor(code, sample?.color),
      isPromo: meta.isPromo || undefined,
      isCheer: meta.isCheer || undefined,
      comingSoon: comingSoon || undefined,
      _count: count,
    };
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ sets: sets.map(({ _count, ...s }) => s), cards }, null, 0));

  console.log(`\nWrote ${cards.length} cards across ${sets.length} sets -> ${path.relative(process.cwd(), OUT)}\n`);
  console.log('SETS:');
  for (const s of sets) {
    console.log(
      `  ${s.code.padEnd(6)} ${String(s._count).padStart(4)} cards  ${s.isPromo ? '[PROMO] ' : ''}${s.isCheer ? '[CHEER] ' : ''}${s.name}  (pack: ${setSample.get(s.code)?.pack || ''})`,
    );
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
