import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatabaseStackParams } from '../../navigation/types';
import { SET_BY_CODE } from '../../data/sets';
import { cardsInSet } from '../../data/cards';
import { CardColor, TypeGroup } from '../../types';
import { colors, radius, spacing } from '../../theme';
import CardTile from '../../components/CardTile';
import CardFilterModal from '../../components/CardFilterModal';
import { useGrid, GridSize } from '../../hooks/useColumns';
import { SortKey, sortCards, typeGroup } from '../../utils/cardType';

type Props = NativeStackScreenProps<DatabaseStackParams, 'SetCards'>;

export default function SetCardsScreen({ route, navigation }: Props) {
  const { setCode } = route.params;
  const set = SET_BY_CODE[setCode];
  const all = useMemo(() => cardsInSet(setCode), [setCode]);

  const [query, setQuery] = useState('');
  const [colorSel, setColorSel] = useState<CardColor[]>([]);
  const [groupSel, setGroupSel] = useState<TypeGroup[]>([]);
  const [sort, setSort] = useState<SortKey>('number');
  const [gridSize, setGridSize] = useState<GridSize>('large');
  const [filterOpen, setFilterOpen] = useState(false);

  const { columns, cellWidth } = useGrid(gridSize);
  const compact = gridSize === 'small';

  useLayoutEffect(() => {
    navigation.setOptions({ title: set?.shortName ?? setCode });
  }, [navigation, set, setCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((c) => {
      if (colorSel.length && !colorSel.includes(c.color)) return false;
      if (groupSel.length && !groupSel.includes(typeGroup(c.type))) return false;
      if (!q) return true;
      return (
        c.nameEn.toLowerCase().includes(q) ||
        c.nameJp.includes(query.trim()) ||
        c.setcode.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
    return sortCards(list, sort);
  }, [all, query, colorSel, groupSel, sort]);

  // Promo sets show every printed version as its own tile (like the collector).
  const isPromo = !!set?.isPromo;
  const promoEntries = useMemo(
    () => (isPromo ? filtered.flatMap((c) => c.arts.map((art) => ({ card: c, art }))) : []),
    [isPromo, filtered],
  );

  const activeFilters = colorSel.length + groupSel.length;

  if (set?.comingSoon) {
    return (
      <View style={[styles.screen, styles.soonWrap]}>
        <Ionicons name="time-outline" size={56} color={colors.accent} />
        <Text style={styles.soonTitle}>Coming soon</Text>
        <Text style={styles.soonText}>
          {set.name} hasn't been officially released yet. Its cards will appear here once
          they're out.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Fixed controls — always reachable */}
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            placeholder="Search this set…"
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

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btn, activeFilters > 0 && styles.btnActive]}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons name="options-outline" size={17} color={colors.text} />
            <Text style={styles.btnText}>Filter &amp; Sort</Text>
            {activeFilters > 0 ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            style={styles.iconBtn}
            onPress={() => setGridSize((s) => (s === 'large' ? 'small' : 'large'))}
          >
            <Ionicons
              name={gridSize === 'large' ? 'grid-outline' : 'apps-outline'}
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>

        <Text style={styles.resultCount}>
          {isPromo
            ? `${promoEntries.length} versions · ${filtered.length} cards`
            : `${filtered.length} of ${all.length} cards`}
        </Text>
      </View>

      {isPromo ? (
        <FlatList
          key={`promo-cols-${columns}`}
          data={promoEntries}
          keyExtractor={(e) => e.art.artId}
          numColumns={columns}
          columnWrapperStyle={styles.col}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.empty}>No cards match your filters.</Text>}
          renderItem={({ item }) => (
            <View style={{ width: cellWidth }}>
              <CardTile
                card={item.card}
                art={item.art}
                compact={compact}
                onPress={() => navigation.navigate('CardDetail', { uid: item.card.uid })}
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={filtered}
          keyExtractor={(c) => c.uid}
          numColumns={columns}
          columnWrapperStyle={styles.col}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.empty}>No cards match your filters.</Text>}
          renderItem={({ item }) => (
            <View style={{ width: cellWidth }}>
              <CardTile
                card={item}
                compact={compact}
                onPress={() => navigation.navigate('CardDetail', { uid: item.uid })}
              />
            </View>
          )}
        />
      )}

      <CardFilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        colorSel={colorSel}
        groupSel={groupSel}
        sort={sort}
        resultCount={filtered.length}
        onToggleColor={(c) =>
          setColorSel((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
        }
        onToggleGroup={(g) =>
          setGroupSel((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))
        }
        onSetSort={setSort}
        onClear={() => {
          setColorSel([]);
          setGroupSel([]);
          setSort('number');
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
  controls: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActive: { borderColor: colors.accent },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCount: { color: colors.textFaint, fontSize: 12, fontWeight: '600' },
  grid: { padding: spacing.lg, rowGap: spacing.lg, flexGrow: 1 },
  col: { gap: spacing.md, justifyContent: 'flex-start', alignItems: 'flex-start' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
});
