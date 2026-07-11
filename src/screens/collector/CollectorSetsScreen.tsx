import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectorStackParams } from '../../navigation/types';
import { SETS } from '../../data/sets';
import { artCountInSet, cardsInSet } from '../../data/cards';
import { CardSet, Collection } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { colors, radius, spacing } from '../../theme';
import { ProgressBar } from '../../components/ui';
import Collapsible from '../../components/Collapsible';
import { getSetSections } from '../../utils/setGroups';

type Props = NativeStackScreenProps<CollectorStackParams, 'CollectorSets'>;

function ownedArtsInSet(setCode: string, collection: Collection): number {
  let n = 0;
  for (const card of cardsInSet(setCode)) {
    for (const art of card.arts) if ((collection[art.artId] ?? 0) > 0) n++;
  }
  return n;
}

export default function CollectorSetsScreen({ navigation }: Props) {
  const { collection } = useAppData();
  const sections = useMemo(() => getSetSections(SETS), []);

  const totals = useMemo(() => {
    let owned = 0;
    let total = 0;
    let masterOwned = 0;
    let masterTotal = 0;
    for (const s of SETS) {
      const o = ownedArtsInSet(s.code, collection);
      const t = artCountInSet(s.code);
      owned += o;
      total += t;
      if (!s.isPromo) {
        masterOwned += o;
        masterTotal += t;
      }
    }
    return { owned, total, masterOwned, masterTotal };
  }, [collection]);

  const SetRow = ({ item }: { item: CardSet }) => {
    const total = artCountInSet(item.code);
    const owned = ownedArtsInSet(item.code, collection);
    const pct = total ? owned / total : 0;
    const complete = owned === total && total > 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
        onPress={() => navigation.navigate('CollectorAlbum', { setCode: item.code })}
      >
        <View style={styles.rowTop}>
          <View style={[styles.swatch, { backgroundColor: item.accent }]}>
            {complete ? (
              <Ionicons name="checkmark" size={20} color="#fff" />
            ) : (
              <Text style={styles.swatchText}>{Math.round(pct * 100)}%</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.setName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.setMeta}>
              {owned}/{total} · {Math.round(pct * 100)}%
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </View>
        <ProgressBar value={pct} color={item.accent} />
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryLabel}>Total collection</Text>
          <Text style={styles.summaryPct}>
            {totals.total ? Math.round((totals.owned / totals.total) * 100) : 0}%
          </Text>
        </View>
        <Text style={styles.summaryValue}>
          {totals.owned}
          <Text style={styles.summaryTotal}> / {totals.total} arts</Text>
        </Text>
        <ProgressBar
          value={totals.total ? totals.owned / totals.total : 0}
          color={colors.good}
          height={10}
        />
      </View>

      {/* Master Collector — everything except promos in one album */}
      <Pressable
        style={({ pressed }) => [styles.master, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('CollectorAlbum', { setCode: '__master__' })}
      >
        <View style={styles.masterIcon}>
          <Ionicons name="planet" size={24} color="#3a2c00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.masterTitle}>Master Collection</Text>
          <Text style={styles.masterMeta}>
            {totals.masterOwned} of {totals.masterTotal} · every non-promo card
          </Text>
          <View style={{ marginTop: 6 }}>
            <ProgressBar
              value={totals.masterTotal ? totals.masterOwned / totals.masterTotal : 0}
              color="#f0c14b"
              track="rgba(0,0,0,0.25)"
            />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#3a2c00" />
      </Pressable>

      <Text style={styles.sectionLabel}>Browse by set</Text>
      {sections.map((sec) =>
        sec.collapsible ? (
          <Collapsible key={sec.key} title={sec.title} count={sec.sets.length}>
            {sec.sets.map((s) => (
              <SetRow key={s.code} item={s} />
            ))}
          </Collapsible>
        ) : (
          <View key={sec.key} style={styles.flatSection}>
            <Text style={styles.flatLabel}>{sec.title}</Text>
            {sec.sets.map((s) => (
              <SetRow key={s.code} item={s} />
            ))}
          </View>
        ),
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 8,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryPct: { color: colors.good, fontSize: 18, fontWeight: '900' },
  summaryLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  summaryTotal: { color: colors.textDim, fontSize: 16, fontWeight: '700' },
  master: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#f0c14b',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  masterIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTitle: { color: '#3a2c00', fontWeight: '900', fontSize: 17 },
  masterMeta: { color: '#5a4600', fontWeight: '700', fontSize: 12, marginTop: 2 },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  flatSection: { gap: spacing.sm },
  flatLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginTop: 2,
  },
  row: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  setName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  setMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
});
