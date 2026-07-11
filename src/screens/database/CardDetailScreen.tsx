import React, { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_BY_CODE, CARD_BY_UID } from '../../data/cards';
import { SET_BY_CODE } from '../../data/sets';
import { cardColorSwatch, colors, radius, spacing } from '../../theme';
import { useAppData } from '../../context/AppDataContext';
import CardImage from '../../components/CardImage';
import { RarityBadge, ColorDot } from '../../components/ui';

// Works inside both the Database and Deck stacks (loose typing on purpose).
export default function CardDetailScreen({ route, navigation }: any) {
  const key: string = route.params.uid ?? route.params.setcode;
  const card = CARD_BY_UID[key] ?? CARD_BY_CODE[key];
  const { ownedCount, setOwned } = useAppData();
  const [artIndex, setArtIndex] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ title: card?.nameEn ?? 'Card' });
  }, [navigation, card]);

  if (!card) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Card not found.</Text>
      </View>
    );
  }

  const art = card.arts[artIndex];
  const owned = ownedCount(art.artId);
  const set = SET_BY_CODE[card.set];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroWrap}>
        <View style={styles.hero}>
          <CardImage card={card} art={art} rounded={radius.lg} showRarity={false} />
        </View>
      </View>

      {card.arts.length > 1 ? (
        <View style={styles.artStrip}>
          <Text style={styles.stripLabel}>
            {card.arts.length} arts share this card id
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.thumbs}>
              {card.arts.map((a, i) => (
                <Pressable
                  key={a.artId}
                  onPress={() => setArtIndex(i)}
                  style={[styles.thumb, i === artIndex && styles.thumbActive]}
                >
                  <CardImage card={card} art={a} rounded={8} showRarity={false} />
                  <View style={styles.thumbLabel}>
                    <RarityBadge rarity={a.rarity} />
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.jp}>{card.nameJp}</Text>
        <Text style={styles.en}>{card.nameEn}</Text>
      </View>

      <View style={styles.tagRow}>
        <View style={styles.pill}>
          <ColorDot color={card.color} size={12} />
          <Text style={styles.pillText}>{card.color}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{card.type}</Text>
        </View>
        {card.life != null ? (
          <View style={[styles.pill, { backgroundColor: '#b5561f' }]}>
            <Text style={[styles.pillText, { color: '#fff' }]}>LIFE {card.life}</Text>
          </View>
        ) : null}
        {card.hp != null ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>HP {card.hp}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.specCard}>
        <Spec label="Set" value={`${set?.name ?? card.set} (${card.set})`} />
        <Spec label="Card No." value={card.setcode} />
        <Spec label="Rarity" value={art.rarity} />
        {card.bloomLevel ? <Spec label="Bloom" value={card.bloomLevel} /> : null}
        {art.illustrator ? <Spec label="Illustrator" value={art.illustrator} /> : null}
        {card.isReprint ? (
          <Spec label="Reprint from" value={card.reprintOf ?? '—'} highlight />
        ) : null}
        {card.tags?.length ? <Spec label="Tags" value={card.tags.join(' · ')} /> : null}
      </View>

      <View style={styles.textCard}>
        <Text style={styles.textLabel}>Card Text</Text>
        <Text style={styles.body}>{card.text}</Text>
      </View>

      {/* Collection quick-edit for the selected art */}
      <View style={styles.ownRow}>
        <View>
          <Text style={styles.ownLabel}>In your collection</Text>
          <Text style={styles.ownSub}>{art.artId}</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setOwned(art.artId, Math.max(0, owned - 1))}
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.ownCount}>{owned}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setOwned(art.artId, owned + 1)}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function Spec({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={[styles.specValue, highlight && { color: colors.warn }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  missing: { color: colors.textDim, textAlign: 'center', marginTop: 40 },
  heroWrap: { alignItems: 'center' },
  hero: { width: '62%' },
  artStrip: { gap: 8 },
  stripLabel: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  thumbs: { flexDirection: 'row', gap: 10 },
  thumb: {
    width: 64,
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: colors.accent },
  thumbLabel: {
    alignItems: 'center',
    marginTop: 4,
  },
  header: { gap: 2 },
  jp: { color: colors.textDim, fontSize: 15 },
  en: { color: colors.text, fontSize: 24, fontWeight: '900' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  pillText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  specCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  specLabel: { color: colors.textDim, fontSize: 13 },
  specValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  textCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  textLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  ownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  ownLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  ownSub: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownCount: { color: colors.text, fontSize: 20, fontWeight: '900', minWidth: 24, textAlign: 'center' },
});
