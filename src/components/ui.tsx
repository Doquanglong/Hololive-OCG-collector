import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, rainbow, cardColorSwatch } from '../theme';
import { CardColor } from '../types';

export function ProgressBar({
  value,
  color = colors.accent,
  height = 8,
  track = colors.surface2,
}: {
  value: number; // 0..1
  color?: string;
  height?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

export function ColorDot({ color, size = 12 }: { color: CardColor; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: cardColorSwatch[color],
        borderWidth: color === 'White' ? 1 : 0,
        borderColor: '#c8c8d0',
      }}
    />
  );
}

// Holo/secret rarities keep the holographic rainbow indicator.
const RAINBOW_RARITIES = new Set(['OSR', 'OUR', 'SEC', 'SR', 'S']);

// Solid-colored rarity chips. C (and anything unlisted) uses the plain dark chip.
const RARITY_COLORS: Record<string, { bg: string; fg: string }> = {
  U: { bg: '#b9bdc7', fg: '#191920' }, // silver / grey
  R: { bg: '#7cc0ff', fg: '#082742' }, // light blue
  RR: { bg: '#9b5de5', fg: '#ffffff' }, // purple
  UR: { bg: '#e5484d', fg: '#ffffff' }, // red
  HR: { bg: '#e5484d', fg: '#ffffff' }, // red
  P: { bg: '#f0902a', fg: '#2e1a00' }, // promo orange
  PR: { bg: '#f0902a', fg: '#2e1a00' }, // promo orange
};

export function RarityBadge({
  rarity,
  style,
  size = 'sm',
}: {
  rarity?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}) {
  if (!rarity) return null;
  const rar = rarity.toUpperCase();
  const pad =
    size === 'md' ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 6, paddingVertical: 2 };
  const fs = size === 'md' ? 12 : 10;

  if (RAINBOW_RARITIES.has(rar)) {
    return (
      <LinearGradient
        colors={rainbow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rarity, pad, style]}
      >
        <Text style={[styles.rarityText, { color: '#141018', fontSize: fs }]}>{rarity}</Text>
      </LinearGradient>
    );
  }

  const solid = RARITY_COLORS[rar];
  if (solid) {
    return (
      <View style={[styles.rarity, { backgroundColor: solid.bg }, pad, style]}>
        <Text style={[styles.rarityText, { color: solid.fg, fontSize: fs }]}>{rarity}</Text>
      </View>
    );
  }

  // C and everything else: dark chip with white text (sits over card art).
  return (
    <View style={[styles.rarity, styles.rarityPlain, pad, style]}>
      <Text style={[styles.rarityText, { color: '#ffffff', fontSize: fs }]}>{rarity}</Text>
    </View>
  );
}

export function Badge({ text, color = colors.accentDeep }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  rarity: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rarityPlain: {
    backgroundColor: 'rgba(20,20,26,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rarityText: {
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});
