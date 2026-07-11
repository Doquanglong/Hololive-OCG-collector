import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SETS } from '../../data/sets';
import { CARDS, artCountInSet, cardsInSet } from '../../data/cards';
import { useAppData } from '../../context/AppDataContext';
import { colors, radius, spacing } from '../../theme';
import { ProgressBar } from '../../components/ui';
import Collapsible from '../../components/Collapsible';
import { getSetSections } from '../../utils/setGroups';

function ownedArtsInSet(setCode: string, collection: Record<string, number>): number {
  let n = 0;
  for (const card of cardsInSet(setCode)) {
    for (const art of card.arts) if ((collection[art.artId] ?? 0) > 0) n++;
  }
  return n;
}

export default function DashboardScreen() {
  const { decks, collection, deckSize } = useAppData();
  const sections = useMemo(() => getSetSections(SETS), []);

  const stats = useMemo(() => {
    const totalArts = CARDS.reduce((s, c) => s + c.arts.length, 0);
    const ownedArts = Object.values(collection).filter((n) => n > 0).length;
    return { totalArts, ownedArts };
  }, [collection]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Top stat tiles */}
      <View style={styles.tiles}>
        <StatTile
          icon="layers"
          value={decks.length}
          label={decks.length === 1 ? 'Deck' : 'Decks'}
          accent={colors.accentDeep}
        />
        <StatTile
          icon="albums"
          value={stats.ownedArts}
          label="Cards owned"
          accent={colors.good}
        />
        <StatTile
          icon="pie-chart"
          value={`${stats.totalArts ? Math.round((stats.ownedArts / stats.totalArts) * 100) : 0}%`}
          label="Completion"
          accent={colors.warn}
        />
      </View>

      {/* Collection progress grouped by category */}
      <Text style={styles.sectionTitle}>Collection by category</Text>
      {sections.map((sec) => {
        const total = sec.sets.reduce((s, x) => s + artCountInSet(x.code), 0);
        const owned = sec.sets.reduce((s, x) => s + ownedArtsInSet(x.code, collection), 0);
        const pct = total ? owned / total : 0;
        return (
          <Collapsible
            key={sec.key}
            title={sec.title}
            subtitle={`${owned}/${total} · ${Math.round(pct * 100)}%`}
          >
            <View style={styles.catBar}>
              <ProgressBar value={pct} color={colors.good} height={8} />
            </View>
            {sec.sets.map((s) => {
              const t = artCountInSet(s.code);
              const o = ownedArtsInSet(s.code, collection);
              return (
                <View key={s.code} style={styles.setRow}>
                  <View style={styles.setRowTop}>
                    <Text style={styles.setName} numberOfLines={1}>
                      {s.code}
                    </Text>
                    <Text style={styles.setPct}>
                      {o}/{t}
                    </Text>
                  </View>
                  <ProgressBar value={t ? o / t : 0} color={s.accent} height={7} />
                </View>
              );
            })}
          </Collapsible>
        );
      })}

      {/* Decks overview */}
      <Text style={styles.sectionTitle}>Your decks</Text>
      {decks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="layers-outline" size={30} color={colors.textFaint} />
          <Text style={styles.emptyText}>No decks built yet.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {decks.map((d, i) => (
            <View key={d.id} style={[styles.deckRow, i > 0 && styles.divider]}>
              <View style={[styles.dot, { backgroundColor: d.accent }]} />
              <Text style={styles.deckName} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={styles.deckCount}>{deckSize(d.id)} cards</Text>
            </View>
          ))}
        </View>
      )}

      {/* Project link */}
      <Pressable
        style={styles.repoLink}
        onPress={() => Linking.openURL('https://github.com/Doquanglong/Hololive-OCG-collector')}
      >
        <Ionicons name="logo-github" size={16} color={colors.textDim} />
        <Text style={styles.repoText}>Doquanglong/Hololive-OCG-collector</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: any;
  value: number | string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  repoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  repoText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  tileLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  catBar: { paddingHorizontal: 4, paddingBottom: 4 },
  setRow: { paddingVertical: 8, paddingHorizontal: 4, gap: 6 },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  setRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  setName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  setPct: { color: colors.textDim, fontSize: 13, fontWeight: '700' },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  deckName: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  deckCount: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: colors.textDim, fontSize: 14 },
});
