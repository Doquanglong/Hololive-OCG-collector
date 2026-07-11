import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DatabaseStackParams } from '../../navigation/types';
import { SETS } from '../../data/sets';
import { artCountInSet, cardsInSet } from '../../data/cards';
import { CardSet } from '../../types';
import { colors, radius, spacing } from '../../theme';
import Collapsible from '../../components/Collapsible';
import { getSetSections } from '../../utils/setGroups';

type Props = NativeStackScreenProps<DatabaseStackParams, 'Sets'>;

export default function SetsScreen({ navigation }: Props) {
  const sections = useMemo(() => getSetSections(SETS), []);

  const SetRow = ({ item }: { item: CardSet }) => {
    const cards = cardsInSet(item.code).length;
    const arts = artCountInSet(item.code);
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => navigation.navigate('SetCards', { setCode: item.code })}
      >
        <View style={[styles.swatch, { backgroundColor: item.accent }]}>
          <Text style={styles.swatchText}>
            {item.isPromo ? 'PR' : item.code.replace('h', '')}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.nameRow}>
            <Text style={styles.setName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.comingSoon ? (
              <View style={styles.soonTag}>
                <Text style={styles.soonTagText}>SOON</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.setMeta}>
            {item.comingSoon
              ? `${item.code} · not yet released`
              : `${item.code} · ${cards} cards · ${arts} arts`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>Tap a category, then a set to browse its cards</Text>
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
  hint: { color: colors.textDim, fontSize: 13, marginBottom: 2 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  swatch: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  rowBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setName: { color: colors.text, fontWeight: '800', fontSize: 15, flexShrink: 1 },
  setMeta: { color: colors.textDim, fontSize: 12 },
  soonTag: {
    backgroundColor: colors.accentDeep,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  soonTagText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 0.5 },
});
