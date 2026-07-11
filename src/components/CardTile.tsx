import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, CardArt } from '../types';
import { colors, radius } from '../theme';
import CardImage from './CardImage';
import { ColorDot, Badge } from './ui';

interface Props {
  card: Card;
  /** Show a specific art instead of the primary one (hides the "N arts" badge). */
  art?: CardArt;
  onPress?: () => void;
  /** Number badge in the corner (e.g. copies in deck / owned). */
  count?: number;
  /** Dim the tile when not owned/collected. */
  dim?: boolean;
  /** Dense layout: image + tiny name only, no type/stat rows. */
  compact?: boolean;
  /** Only the image opens the card (used in the deck builder); the rest doesn't. */
  imageOnlyPress?: boolean;
  footer?: React.ReactNode;
}

export default function CardTile({
  card,
  art,
  onPress,
  count,
  dim,
  compact,
  imageOnlyPress,
  footer,
}: Props) {
  const variants = art ? 1 : card.arts.length;

  const image = (
    <View style={[styles.imgWrap, dim && styles.dim]}>
      <CardImage card={card} art={art} rounded={radius.md} />
      {count != null && count > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}×</Text>
        </View>
      ) : null}
      {variants > 1 ? (
        <View style={styles.variantBadge}>
          <Text style={styles.variantText}>{compact ? variants : `${variants} arts`}</Text>
        </View>
      ) : null}
    </View>
  );

  const meta = compact ? (
    <View style={styles.metaCompact}>
      <Text style={styles.nameCompact} numberOfLines={1}>
        {card.nameEn}
      </Text>
      {footer}
    </View>
  ) : (
    <View style={styles.meta}>
      <View style={styles.nameRow}>
        <ColorDot color={card.color} size={10} />
        <Text style={styles.name} numberOfLines={1}>
          {card.nameEn}
        </Text>
      </View>
      <Text style={styles.sub} numberOfLines={1}>
        {card.type}
      </Text>
      <View style={styles.statRow}>
        <Text style={styles.code}>{card.setcode}</Text>
        {card.life != null ? (
          <Badge text={`LIFE ${card.life}`} color="#b5561f" />
        ) : card.hp != null ? (
          <Text style={styles.hp}>HP {card.hp}</Text>
        ) : null}
      </View>
      {footer}
    </View>
  );

  // Deck builder: only the picture opens the card, so taps on the name/stepper
  // don't accidentally navigate.
  if (imageOnlyPress) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={onPress} disabled={!onPress}>
          {image}
        </Pressable>
        {meta}
      </View>
    );
  }

  return (
    <Pressable style={styles.wrap} onPress={onPress} disabled={!onPress}>
      {image}
      {meta}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  imgWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dim: {
    opacity: 0.32,
  },
  countBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  variantBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(123,59,226,0.9)',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  variantText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  meta: {
    paddingTop: 8,
    paddingHorizontal: 2,
    gap: 2,
  },
  metaCompact: {
    paddingTop: 5,
    paddingHorizontal: 2,
    gap: 4,
  },
  nameCompact: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: colors.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  sub: { color: colors.textDim, fontSize: 12 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  code: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
  hp: { color: colors.text, fontSize: 12, fontWeight: '800' },
});
