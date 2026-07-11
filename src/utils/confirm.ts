import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog. On the web, react-native's `Alert.alert`
 * button callbacks never fire, so we fall back to the browser's confirm().
 * Resolves true if the user confirmed.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'OK',
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.confirm) return Promise.resolve(true);
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
