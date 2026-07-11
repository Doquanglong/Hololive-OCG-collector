import React, { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectorStackParams } from '../../navigation/types';
import { SET_BY_CODE } from '../../data/sets';
import { CARDS, cardsInSet } from '../../data/cards';
import { Card, CardArt } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { colors, radius, spacing } from '../../theme';
import CardImage from '../../components/CardImage';
import { ProgressBar } from '../../components/ui';
import { useGrid } from '../../hooks/useColumns';

export const MASTER_CODE = '__master__';
type Props = NativeStackScreenProps<CollectorStackParams, 'CollectorAlbum'>;
type Entry = { card: Card; art: CardArt };

type SortKey = 'number' | 'name' | 'rarity' | 'collected';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'number', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'collected', label: 'Collected' },
];
const RARITY_RANK: Record<string, number> = {
  C: 1, U: 2, R: 3, RR: 4, S: 5, SR: 6, UR: 7, OC: 9, P: 9, PR: 9, SY: 5,
  OSR: 20, OUR: 21, SEC: 22, HR: 30,
};
const rarityRank = (r?: string) => RARITY_RANK[(r || '').toUpperCase()] ?? 10;

export default function CollectorAlbumScreen({ route, navigation }: Props) {
  const { setCode } = route.params;
  const isMaster = setCode === MASTER_CODE;
  const set = SET_BY_CODE[setCode];
  const { collection, ownedCount, toggleOwned, setOwned } = useAppData();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('number');

  const entries = useMemo<Entry[]>(() => {
    // Master Collection = every card except promos, in one album.
    const source = isMaster
      ? CARDS.filter((c) => !SET_BY_CODE[c.set]?.isPromo)
      : cardsInSet(setCode);
    return source.flatMap((card) => card.arts.map((art) => ({ card, art })));
  }, [setCode, isMaster]);

  const owned = entries.filter((e) => (collection[e.art.artId] ?? 0) > 0).length;
  const pct = entries.length ? Math.round((owned / entries.length) * 100) : 0;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = entries;
    if (q) {
      arr = arr.filter(
        (e) =>
          e.card.nameEn.toLowerCase().includes(q) ||
          e.card.nameJp.includes(query.trim()) ||
          e.card.setcode.toLowerCase().includes(q),
      );
    }
    const byCode = (a: Entry, b: Entry) =>
      a.card.setcode.localeCompare(b.card.setcode, undefined, { numeric: true });
    const has = (e: Entry) => ((collection[e.art.artId] ?? 0) > 0 ? 1 : 0);
    const out = [...arr];
    if (sort === 'name') out.sort((a, b) => a.card.nameEn.localeCompare(b.card.nameEn) || byCode(a, b));
    else if (sort === 'rarity')
      out.sort((a, b) => rarityRank(b.art.rarity) - rarityRank(a.art.rarity) || byCode(a, b));
    else if (sort === 'collected') out.sort((a, b) => has(b) - has(a) || byCode(a, b));
    else out.sort(byCode);
    return out;
  }, [entries, query, sort, collection]);

  const { columns, cellWidth } = useGrid('small');
  const title = isMaster ? 'Master Collection' : set?.name ?? setCode;
  const accent = isMaster ? '#f0c14b' : set?.accent ?? colors.good;

  useLayoutEffect(() => {
    navigation.setOptions({ title: isMaster ? 'Master' : set?.shortName ?? setCode });
  }, [navigation, set, setCode, isMaster]);

  if (set?.comingSoon) {
    return (
      <View style={[styles.screen, styles.soonWrap]}>
        <Ionicons name="time-outline" size={56} color={colors.accent} />
        <Text style={styles.soonTitle}>Coming soon</Text>
        <Text style={styles.soonText}>
          {set.name} isn't out yet — check back once it's released.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Fixed header: progress + search + sort */}
      <View style={styles.top}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.count}>
            {owned}/{entries.length} · {pct}%
          </Text>
        </View>
        <ProgressBar value={entries.length ? owned / entries.length : 0} color={accent} height={9} />

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            placeholder="Search this album…"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort</Text>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, sort === s.key && styles.sortChipOn]}
            >
              <Text style={[styles.sortChipText, sort === s.key && styles.sortChipTextOn]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        key={`cols-${columns}`}
        data={shown}
        keyExtractor={(e) => e.art.artId}
        numColumns={columns}
        columnWrapperStyle={styles.col}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.empty}>No cards match your search.</Text>}
        renderItem={({ item }) => {
          const n = ownedCount(item.art.artId);
          const has = n > 0;
          return (
            <View style={[styles.cell, { width: cellWidth }]}>
              <Pressable
                onPress={() => toggleOwned(item.art.artId)}
                onLongPress={() => setOwned(item.art.artId, n + 1)}
              >
                <View style={[styles.imgWrap, !has && styles.dim]}>
                  <CardImage card={item.card} art={item.art} rounded={radius.md} />
                  {has ? (
                    <View style={styles.owned}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.good} />
                      {n > 1 ? <Text style={styles.ownedCount}>{n}×</Text> : null}
                    </View>
                  ) : (
                    <View style={styles.missing}>
                      <Ionicons name="add-circle-outline" size={26} color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.card.nameEn}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.card.setcode} · {item.art.rarity}
                {item.card.isReprint ? ' · RP' : ''}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  soonWrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 },
  soonTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  soonText: { color: colors.textDim, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  grid: { padding: spacing.lg, paddingTop: spacing.md, rowGap: spacing.lg, flexGrow: 1 },
  col: { gap: spacing.md, justifyContent: 'flex-start', alignItems: 'flex-start' },
  top: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', flexShrink: 1 },
  count: { color: colors.textDim, fontSize: 15, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sortLabel: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipOn: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  sortChipText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  sortChipTextOn: { color: '#fff' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
  cell: { gap: 4 },
  imgWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dim: { opacity: 0.28 },
  owned: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ownedCount: { color: '#fff', fontWeight: '900', fontSize: 12 },
  missing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  cardMeta: { color: colors.textFaint, fontSize: 11 },
});
