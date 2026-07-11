import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardArt } from '../types';
import { cardColorGradient, radius } from '../theme';
import { RarityBadge } from './ui';

interface Props {
  card: Card;
  art?: CardArt;
  style?: ViewStyle;
  rounded?: number;
  /** Show the rarity indicator overlay (rainbow for foils/secrets). */
  showRarity?: boolean;
}

function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '★';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function Placeholder({ card, art }: { card: Card; art?: CardArt }) {
  const grad = art?.gradient ?? cardColorGradient[card.color] ?? cardColorGradient.None;
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fill, styles.placeholder]}
    >
      <Text style={styles.initials} numberOfLines={1}>
        {initials(card.nameEn)}
      </Text>
      <Text style={styles.code} numberOfLines={1}>
        {card.setcode}
      </Text>
    </LinearGradient>
  );
}

/**
 * Card artwork. Loads the official scan from `art.image` when available and
 * falls back to a themed, color-tinted placeholder otherwise. A rarity badge
 * (rainbow for foils/secrets) is overlaid in the top-left.
 */
export default function CardImage({
  card,
  art,
  style,
  rounded = radius.md,
  showRarity = true,
}: Props) {
  const a = art ?? card.arts[0];
  const uri = a?.image;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  return (
    <View style={[styles.base, { borderRadius: rounded }, style]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={styles.fill as any}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : null}
      {(!uri || failed) ? <Placeholder card={card} art={a} /> : null}
      {showRarity && a?.rarity ? <RarityBadge rarity={a.rarity} style={styles.rarityPos} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    aspectRatio: 0.72,
    width: '100%',
    backgroundColor: '#e6e3f0',
    overflow: 'hidden',
    position: 'relative',
  },
  // Absolute fill is reliable under the New Architecture, where a percentage
  // height inside an aspectRatio box can collapse to zero.
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    padding: 8,
    justifyContent: 'flex-end',
  },
  rarityPos: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  initials: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    fontSize: 34,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  code: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
  },
});
