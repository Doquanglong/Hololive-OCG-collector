import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

function Gate() {
  const { ready } = useAppData();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppDataProvider>
        <Gate />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
