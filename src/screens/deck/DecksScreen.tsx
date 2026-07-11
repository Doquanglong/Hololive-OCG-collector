import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DeckStackParams } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { colors, radius, spacing } from '../../theme';
import { fetchDecklogDeck, parseImportInput, decodeDeckPayload } from '../../utils/deckShare';

type Props = NativeStackScreenProps<DeckStackParams, 'Decks'>;

export default function DecksScreen({ navigation }: Props) {
  const { decks, createDeck, createDeckFrom, deleteDeck, deckSize } = useAppData();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setImportOpen(true)} hitSlop={10} style={styles.importBtn}>
          <Ionicons name="download-outline" size={18} color={colors.headerText} />
          <Text style={styles.importBtnText}>Import</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const confirmCreate = () => {
    const deck = createDeck(name);
    setName('');
    setModal(false);
    navigation.navigate('DeckDetail', { deckId: deck.id });
  };

  const runImport = async () => {
    setImportError(null);
    const parsed = parseImportInput(importText);
    if (!parsed) {
      setImportError('Enter a Deck Log code (e.g. 6GDT7) or a shared deck link.');
      return;
    }
    try {
      setImporting(true);
      let deckName: string;
      let cards;
      let skipped = 0;
      if (parsed.kind === 'decklog') {
        const r = await fetchDecklogDeck(parsed.code);
        deckName = r.name;
        cards = r.cards;
        skipped = r.skipped;
      } else {
        const r = decodeDeckPayload(parsed.payload);
        if (!r) {
          setImportError('That shared link is invalid.');
          return;
        }
        deckName = r.name;
        cards = r.cards;
      }
      const deck = createDeckFrom(deckName, cards);
      setImportOpen(false);
      setImportText('');
      navigation.navigate('DeckDetail', { deckId: deck.id });
      if (skipped > 0) {
        Alert.alert('Imported', `${skipped} card(s) aren't in the database yet and were skipped.`);
      }
    } catch (e: any) {
      setImportError(e?.message ?? 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const onLongPress = (id: string, deckName: string) => {
    Alert.alert('Delete deck', `Delete "${deckName}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDeck(id) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={decks}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No decks yet.</Text>
            <Text style={styles.emptySub}>Tap + to build your first deck.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('DeckDetail', { deckId: item.id })}
            onLongPress={() => onLongPress(item.id, item.name)}
          >
            <View style={[styles.folder, { backgroundColor: item.accent }]}>
              <Ionicons name="layers" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.deckMeta}>Cards: {deckSize(item.id)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => setModal(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal transparent visible={modal} animationType="fade" onRequestClose={() => setModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModal(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>New deck</Text>
            <TextInput
              autoFocus
              placeholder="Deck name"
              placeholderTextColor={colors.textFaint}
              style={styles.sheetInput}
              value={name}
              onChangeText={setName}
              onSubmitEditing={confirmCreate}
              returnKeyType="done"
            />
            <View style={styles.sheetBtns}>
              <Pressable style={[styles.sheetBtn, styles.cancel]} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, styles.create]} onPress={confirmCreate}>
                <Text style={styles.createText}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Import from a Deck Log code or a shared link */}
      <Modal
        transparent
        visible={importOpen}
        animationType="fade"
        onRequestClose={() => setImportOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => !importing && setImportOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Import a deck</Text>
            <Text style={styles.importHint}>
              Paste a Deck Log code (e.g. 6GDT7) or a shared deck link. Deck Log decks must be for
              the hololive Card Game.
            </Text>
            <TextInput
              autoFocus
              autoCapitalize="characters"
              placeholder="Deck Log code or link"
              placeholderTextColor={colors.textFaint}
              style={styles.sheetInput}
              value={importText}
              onChangeText={(t) => {
                setImportText(t);
                setImportError(null);
              }}
              onSubmitEditing={runImport}
              returnKeyType="go"
              editable={!importing}
            />
            {importError ? <Text style={styles.importError}>{importError}</Text> : null}
            <View style={styles.sheetBtns}>
              <Pressable
                style={[styles.sheetBtn, styles.cancel]}
                onPress={() => setImportOpen(false)}
                disabled={importing}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, styles.create]} onPress={runImport} disabled={importing}>
                {importing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createText}>Import</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  importBtnText: { color: colors.headerText, fontWeight: '700', fontSize: 15 },
  importHint: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  importError: { color: '#e5484d', fontSize: 13, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  folder: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckName: { color: colors.text, fontWeight: '800', fontSize: 16 },
  deckMeta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 80 },
  emptyText: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptySub: { color: colors.textDim, fontSize: 13 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sheetInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.text,
    fontSize: 15,
  },
  sheetBtns: { flexDirection: 'row', gap: spacing.md },
  sheetBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { backgroundColor: colors.surface2 },
  cancelText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  create: { backgroundColor: colors.accentDeep },
  createText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
