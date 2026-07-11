import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  count?: number;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A titled dropdown section that expands/collapses its children. */
export default function Collapsible({ title, count, subtitle, defaultOpen, children }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={toggle}>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={colors.accent}
        />
        <Text style={styles.title}>{title}</Text>
        {count != null ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        ) : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  badge: {
    minWidth: 24,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textDim, fontWeight: '800', fontSize: 12 },
  subtitle: { color: colors.textFaint, fontSize: 12, marginLeft: 'auto' },
  body: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
});
