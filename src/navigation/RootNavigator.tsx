import React from 'react';
import { Platform } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { useAppData } from '../context/AppDataContext';
import { decodeDeckPayload } from '../utils/deckShare';
import {
  CollectorStackParams,
  DashboardStackParams,
  DatabaseStackParams,
  DeckStackParams,
} from './types';

import SetsScreen from '../screens/database/SetsScreen';
import SetCardsScreen from '../screens/database/SetCardsScreen';
import CardDetailScreen from '../screens/database/CardDetailScreen';
import DecksScreen from '../screens/deck/DecksScreen';
import DeckDetailScreen from '../screens/deck/DeckDetailScreen';
import CollectorSetsScreen from '../screens/collector/CollectorSetsScreen';
import CollectorAlbumScreen from '../screens/collector/CollectorAlbumScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.header,
    text: colors.headerText,
    border: 'transparent',
    primary: colors.accentDeep,
  },
};

const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.header },
  headerTintColor: colors.headerText,
  headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

const DatabaseStack = createNativeStackNavigator<DatabaseStackParams>();
function DatabaseNavigator() {
  return (
    <DatabaseStack.Navigator screenOptions={stackScreenOptions}>
      <DatabaseStack.Screen name="Sets" component={SetsScreen} options={{ title: 'Database' }} />
      <DatabaseStack.Screen name="SetCards" component={SetCardsScreen} />
      <DatabaseStack.Screen name="CardDetail" component={CardDetailScreen} />
    </DatabaseStack.Navigator>
  );
}

const DeckStack = createNativeStackNavigator<DeckStackParams>();
function DeckNavigator() {
  return (
    <DeckStack.Navigator screenOptions={stackScreenOptions}>
      <DeckStack.Screen name="Decks" component={DecksScreen} options={{ title: 'My Decks' }} />
      <DeckStack.Screen name="DeckDetail" component={DeckDetailScreen} />
      <DeckStack.Screen name="CardDetail" component={CardDetailScreen} />
    </DeckStack.Navigator>
  );
}

const CollectorStack = createNativeStackNavigator<CollectorStackParams>();
function CollectorNavigator() {
  return (
    <CollectorStack.Navigator screenOptions={stackScreenOptions}>
      <CollectorStack.Screen
        name="CollectorSets"
        component={CollectorSetsScreen}
        options={{ title: 'Collection' }}
      />
      <CollectorStack.Screen name="CollectorAlbum" component={CollectorAlbumScreen} />
    </CollectorStack.Navigator>
  );
}

const DashboardStack = createNativeStackNavigator<DashboardStackParams>();
function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </DashboardStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const TAB_ICON: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  DatabaseTab: ['search', 'search-outline'],
  DeckTab: ['layers', 'layers-outline'],
  CollectorTab: ['albums', 'albums-outline'],
  DashboardTab: ['stats-chart', 'stats-chart-outline'],
};

export default function RootNavigator() {
  const navRef = useNavigationContainerRef();
  const { createDeckFrom } = useAppData();

  // Click-to-import: opening a share link ( …/#d=<payload> ) on the web builds
  // the deck and jumps straight to it, then clears the hash so a refresh won't
  // re-import.
  const handleShareLink = React.useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const m = window.location.hash.match(/[#?&]d=([^&]+)/);
    if (!m) return;
    const parsed = decodeDeckPayload(m[1]);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (parsed && parsed.cards.length) {
      const deck = createDeckFrom(parsed.name, parsed.cards);
      (navRef as any).navigate('DeckTab', {
        screen: 'DeckDetail',
        params: { deckId: deck.id },
      });
    }
  }, [createDeckFrom, navRef]);

  return (
    <NavigationContainer theme={navTheme} ref={navRef} onReady={handleShareLink}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
          tabBarIcon: ({ focused, color, size }) => {
            const [on, off] = TAB_ICON[route.name] ?? ['ellipse', 'ellipse-outline'];
            return <Ionicons name={focused ? on : off} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="DatabaseTab"
          component={DatabaseNavigator}
          options={{ title: 'Database' }}
        />
        <Tab.Screen name="DeckTab" component={DeckNavigator} options={{ title: 'Decks' }} />
        <Tab.Screen
          name="CollectorTab"
          component={CollectorNavigator}
          options={{ title: 'Collector' }}
        />
        <Tab.Screen
          name="DashboardTab"
          component={DashboardNavigator}
          options={{ title: 'Dashboard' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
