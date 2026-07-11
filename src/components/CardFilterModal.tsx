import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardColor, TypeGroup } from '../types';
import { cardColorSwatch, colors, radius, spacing } from '../theme';
import { SORT_LABEL, SortKey, TYPE_GROUPS, TYPE_GROUP_COLOR } from '../utils/cardType';

const COLORS: CardColor[] = ['White', 'Red', 'Green', 'Blue', 'Purple', 'Yellow', 'None'];
const SORTS: SortKey[] = ['number', 'name', 'type', 'color'];

interface Props {
  visible: boolean;
  onClose: () => void;
  colorSel: CardColor[];
  groupSel: TypeGroup[];
  sort: SortKey;
  onToggleColor: (c: CardColor) => void;
  onToggleGroup: (g: TypeGroup) => void;
  onSetSort: (s: SortKey) => void;
  onClear: () => void;
  resultCount: number;
}

export default function CardFilterModal({
  visible,
  onClose,
  colorSel,
  groupSel,
  sort,
  onToggleColor,
  onToggleGroup,
  onSetSort,
  onClear,
  resultCount,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filter &amp; Sort</Text>
            <Pressable onPress={onClear} hitSlop={8}>
              <Text style={styles.clear}>Clear all</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.section}>Type</Text>
            <View style={styles.wrap}>
              {TYPE_GROUPS.map((g) => {
                const on = groupSel.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => onToggleGroup(g)}
                    style={[styles.chip, on && { backgroundColor: TYPE_GROUP_COLOR[g], borderColor: TYPE_GROUP_COLOR[g] }]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Color</Text>
            <View style={styles.wrap}>
              {COLORS.map((c) => {
                const on = colorSel.includes(c);
                return (
                  <Pressable
                    key={c}
                    onPress={() => onToggleColor(c)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: cardColorSwatch[c], borderWidth: c === 'White' ? 1 : 0 },
                      ]}
                    />
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Sort by</Text>
            <View style={styles.wrap}>
              {SORTS.map((s) => {
                const on = sort === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => onSetSort(s)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    {on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{SORT_LABEL[s]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable style={styles.apply} onPress={onClose}>
            <Text style={styles.applyText}>Show {resultCount} cards</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '82%',
    gap: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 19, fontWeight: '900' },
  clear: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  section: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  chipText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: '#fff' },
  dot: { width: 12, height: 12, borderRadius: 6, borderColor: '#c8c8d0' },
  apply: {
    marginTop: spacing.md,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
