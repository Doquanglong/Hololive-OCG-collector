import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DeckStackParams } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { CARDS, CARD_BY_CODE, artCountInSet } from '../../data/cards';
import { SETS, SET_BY_CODE } from '../../data/sets';
import { Card, CardColor, CardSet, TypeGroup } from '../../types';
import { colors, radius, spacing } from '../../theme';
import CardTile from '../../components/CardTile';
import CardFilterModal from '../../components/CardFilterModal';
import Collapsible from '../../components/Collapsible';
import { getSetSections } from '../../utils/setGroups';
import { useGrid } from '../../hooks/useColumns';
import {
  SortKey,
  TYPE_GROUPS,
  TYPE_GROUP_COLOR,
  sortCards,
  typeGroup,
} from '../../utils/cardType';
import { DECK_RULES, analyzeDeck, canAddCard, maxCountFor } from '../../utils/deckRules';
import { shareUrlForDeck } from '../../utils/deckShare';

type Props = NativeStackScreenProps<DeckStackParams, 'DeckDetail'>;
type Mode = 'deck' | 'add';

export default function DeckDetailScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const { decks, addCardToDeck, setCardInDeck, deckSize, renameDeck, deleteDeck, duplicateDeck } =
    useAppData();
  const deck = decks.find((d) => d.id === deckId);

  const [mode, setMode] = useState<Mode>('deck');
  const [query, setQuery] = useState('');
  const [setFilter, setSetFilter] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<CardColor[]>([]);
  const [groupSel, setGroupSel] = useState<TypeGroup[]>([]);
  const [sort, setSort] = useState<SortKey>('number');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editText, setEditText] = useState('');

  const { columns, cellWidth } = useGrid('small');
  const sections = useMemo(() => getSetSections(SETS), []);

  const openRename = () => {
    setRenameText(deck?.name ?? '');
    setMenuOpen(false);
    setRenameOpen(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable style={styles.titleBtn} onPress={openRename}>
          <Text style={styles.titleText} numberOfLines={1}>
            {deck?.name ?? 'Deck'}
          </Text>
          <Ionicons name="pencil" size={14} color={colors.textDim} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.headerText} />
        </Pressable>
      ),
    });
  }, [navigation, deck?.name]);

  // Cards currently in the deck, grouped by type (Oshi / Holomem / Support / Cheer).
  const grouped = useMemo(() => {
    const map: Record<TypeGroup, { card: Card; count: number }[]> = {
      Oshi: [],
      Holomem: [],
      Support: [],
      Cheer: [],
    };
    if (deck) {
      for (const dc of deck.cards) {
        const card = CARD_BY_CODE[dc.setcode];
        if (card) map[typeGroup(card.type)].push({ card, count: dc.count });
      }
    }
    return map;
  }, [deck]);

  const addResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = CARDS.filter((c) => {
      if (setFilter && c.set !== setFilter) return false;
      if (colorSel.length && !colorSel.includes(c.color)) return false;
      if (groupSel.length && !groupSel.includes(typeGroup(c.type))) return false;
      if (!q) return true;
      return (
        c.nameEn.toLowerCase().includes(q) ||
        c.nameJp.includes(query.trim()) ||
        c.setcode.toLowerCase().includes(q)
      );
    });
    return sortCards(list, sort);
  }, [query, setFilter, colorSel, groupSel, sort]);

  if (!deck) {
    return (
      <View style={styles.screen}>
        <Text style={styles.empty}>Deck not found.</Text>
      </View>
    );
  }

  const size = deckSize(deck.id);
  const activeFilters = colorSel.length + groupSel.length;
  const analysis = analyzeDeck(deck);

  const openEdit = (card: Card, count: number) => {
    setEditCard(card);
    setEditText(String(count));
  };

  const renderTile = (card: Card) => {
    const count = deck.cards.find((c) => c.setcode === card.setcode)?.count ?? 0;
    return (
      <View key={card.setcode} style={{ width: cellWidth }}>
        <CardTile
          card={card}
          count={count}
          compact
          imageOnlyPress
          onPress={() => navigation.navigate('CardDetail', { uid: card.uid })}
          footer={
            <Stepper
              count={count}
              canAdd={canAddCard(deck, card, count)}
              onAdd={() => addCardToDeck(deck.id, card.setcode, 1)}
              onSub={() => addCardToDeck(deck.id, card.setcode, -1)}
              onEdit={() => openEdit(card, count)}
            />
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Deck legality header — 1 Oshi / 20 Cheer / 60 main */}
      <View style={styles.stats}>
        <RuleStat label="Oshi" value={analysis.oshi} target={DECK_RULES.oshi} color={TYPE_GROUP_COLOR.Oshi} />
        <RuleStat label="Cheer" value={analysis.cheer} target={DECK_RULES.cheer} color={TYPE_GROUP_COLOR.Cheer} />
        <RuleStat label="Deck" value={analysis.main} target={DECK_RULES.main} color={TYPE_GROUP_COLOR.Holomem} />
        <Pressable
          style={[styles.legal, analysis.valid ? styles.legalOk : styles.legalBad]}
          onPress={() => setRulesOpen(true)}
        >
          <Ionicons
            name={analysis.valid ? 'checkmark-circle' : 'information-circle'}
            size={16}
            color="#fff"
          />
          <Text style={styles.legalText}>{analysis.valid ? 'Legal' : 'Rules'}</Text>
        </Pressable>
      </View>

      {/* Your Deck / Add Cards */}
      <View style={styles.segment}>
        <SegBtn label={`Your Deck · ${size}`} icon="layers" active={mode === 'deck'} onPress={() => setMode('deck')} />
        <SegBtn label="Add Cards" icon="add-circle" active={mode === 'add'} onPress={() => setMode('add')} />
      </View>

      {mode === 'deck' ? (
        <ScrollView contentContainerStyle={styles.deckScroll}>
          {size === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={40} color={colors.textFaint} />
              <Text style={styles.empty}>This deck is empty.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setMode('add')}>
                <Text style={styles.emptyBtnText}>Add cards</Text>
              </Pressable>
            </View>
          ) : (
            TYPE_GROUPS.map((g) => {
              const items = grouped[g];
              if (!items.length) return null;
              const n = items.reduce((s, x) => s + x.count, 0);
              return (
                <View key={g} style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View style={[styles.sectionBar, { backgroundColor: TYPE_GROUP_COLOR[g] }]} />
                    <Text style={styles.sectionTitle}>{g}</Text>
                    <Text style={styles.sectionCount}>{n}</Text>
                  </View>
                  <View style={styles.wrapGrid}>
                    {sortCards(items.map((x) => x.card), sort).map(renderTile)}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : setFilter === null ? (
        /* Step 1 — pick which set to add cards from */
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerHint}>Pick a set to add cards from</Text>
          {sections.map((sec) =>
            sec.collapsible ? (
              <Collapsible key={sec.key} title={sec.title} count={sec.sets.length}>
                {sec.sets.map((s) => (
                  <SetPickRow key={s.code} set={s} onPress={() => setSetFilter(s.code)} />
                ))}
              </Collapsible>
            ) : (
              <View key={sec.key} style={styles.flatSection}>
                <Text style={styles.flatLabel}>{sec.title}</Text>
                {sec.sets.map((s) => (
                  <SetPickRow key={s.code} set={s} onPress={() => setSetFilter(s.code)} />
                ))}
              </View>
            ),
          )}
        </ScrollView>
      ) : (
        /* Step 2 — add cards from the chosen set */
        <>
          <View style={styles.selectedBar}>
            <Pressable
              style={styles.changeBtn}
              onPress={() => {
                setSetFilter(null);
                setQuery('');
              }}
            >
              <Ionicons name="chevron-back" size={18} color={colors.accent} />
              <Text style={styles.changeText}>Sets</Text>
            </Pressable>
            <Text style={styles.selectedName} numberOfLines={1}>
              {SET_BY_CODE[setFilter]?.name ?? setFilter}
            </Text>
            <Pressable
              style={[styles.filterBtn, activeFilters > 0 && { borderColor: colors.accent }]}
              onPress={() => setFilterOpen(true)}
            >
              <Ionicons name="options-outline" size={18} color={colors.text} />
              {activeFilters > 0 ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{activeFilters}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.controls}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textFaint} />
              <TextInput
                placeholder={`Search ${SET_BY_CODE[setFilter]?.shortName ?? 'set'}…`}
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>

          <FlatList
            key={`cols-${columns}`}
            data={addResults}
            keyExtractor={(c) => c.setcode}
            numColumns={columns}
            columnWrapperStyle={styles.col}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={<Text style={styles.empty}>No cards match your search.</Text>}
            renderItem={({ item }) => {
              const count = deck.cards.find((c) => c.setcode === item.setcode)?.count ?? 0;
              return (
                <View style={{ width: cellWidth }}>
                  <CardTile
                    card={item}
                    count={count}
                    compact
                    imageOnlyPress
                    onPress={() => navigation.navigate('CardDetail', { uid: item.uid })}
                    footer={
                      <Stepper
                        count={count}
                        canAdd={canAddCard(deck, item, count)}
                        onAdd={() => addCardToDeck(deck.id, item.setcode, 1)}
                        onSub={() => addCardToDeck(deck.id, item.setcode, -1)}
                        onEdit={() => openEdit(item, count)}
                      />
                    }
                  />
                </View>
              );
            }}
          />
        </>
      )}

      <CardFilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        colorSel={colorSel}
        groupSel={groupSel}
        sort={sort}
        resultCount={addResults.length}
        onToggleColor={(c) => setColorSel((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
        onToggleGroup={(g) => setGroupSel((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))}
        onSetSort={setSort}
        onClear={() => {
          setColorSel([]);
          setGroupSel([]);
          setSort('number');
        }}
      />

      {/* Deck actions menu */}
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <MenuItem icon="pencil" label="Rename deck" onPress={openRename} />
            <MenuItem
              icon="share-outline"
              label="Share / export"
              onPress={() => {
                setMenuOpen(false);
                setShareOpen(true);
              }}
            />
            <MenuItem
              icon="copy-outline"
              label="Duplicate deck"
              onPress={() => {
                const copy = duplicateDeck(deck.id);
                setMenuOpen(false);
                if (copy) navigation.replace('DeckDetail', { deckId: copy.id });
              }}
            />
            <MenuItem
              icon="trash-outline"
              label="Delete deck"
              danger
              onPress={() => {
                setMenuOpen(false);
                Alert.alert('Delete deck', `Delete "${deck.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteDeck(deck.id);
                      navigation.goBack();
                    },
                  },
                ]);
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Rename */}
      <Modal transparent visible={renameOpen} animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setRenameOpen(false)}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            <Text style={styles.renameTitle}>Rename deck</Text>
            <TextInput
              autoFocus
              value={renameText}
              onChangeText={setRenameText}
              style={styles.renameInput}
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={() => {
                renameDeck(deck.id, renameText);
                setRenameOpen(false);
              }}
              returnKeyType="done"
            />
            <View style={styles.renameBtns}>
              <Pressable style={[styles.renameBtn, styles.renameCancel]} onPress={() => setRenameOpen(false)}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.renameBtn, styles.renameSave]}
                onPress={() => {
                  renameDeck(deck.id, renameText);
                  setRenameOpen(false);
                }}
              >
                <Text style={styles.renameSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Deck-building rules sidebar */}
      <RulesSidebar visible={rulesOpen} analysis={analysis} onClose={() => setRulesOpen(false)} />

      {/* Type an exact number of copies */}
      <Modal
        transparent
        visible={editCard != null}
        animationType="fade"
        onRequestClose={() => setEditCard(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditCard(null)}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            {editCard ? (
              <>
                <Text style={styles.renameTitle}>How many copies?</Text>
                <Text style={styles.editSub} numberOfLines={1}>
                  {editCard.nameEn} · max {maxCountFor(deck, editCard)}
                </Text>
                <TextInput
                  autoFocus
                  value={editText}
                  onChangeText={(t) => setEditText(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={styles.renameInput}
                  onSubmitEditing={() => {
                    const max = maxCountFor(deck, editCard);
                    setCardInDeck(deck.id, editCard.setcode, Math.max(0, Math.min(max, parseInt(editText, 10) || 0)));
                    setEditCard(null);
                  }}
                  returnKeyType="done"
                />
                <View style={styles.renameBtns}>
                  <Pressable style={[styles.renameBtn, styles.renameCancel]} onPress={() => setEditCard(null)}>
                    <Text style={styles.renameCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.renameBtn, styles.renameSave]}
                    onPress={() => {
                      const max = maxCountFor(deck, editCard);
                      setCardInDeck(deck.id, editCard.setcode, Math.max(0, Math.min(max, parseInt(editText, 10) || 0)));
                      setEditCard(null);
                    }}
                  >
                    <Text style={styles.renameSaveText}>Set</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Share / export deck as a link */}
      <Modal transparent visible={shareOpen} animationType="fade" onRequestClose={() => setShareOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShareOpen(false)}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            <Text style={styles.renameTitle}>Share deck</Text>
            <Text style={styles.shareHint}>Anyone with this link can import “{deck.name}”.</Text>
            <TextInput
              value={shareUrlForDeck(deck)}
              editable={false}
              multiline
              selectTextOnFocus
              style={styles.shareUrl}
            />
            <View style={styles.renameBtns}>
              <Pressable style={[styles.renameBtn, styles.renameCancel]} onPress={() => setShareOpen(false)}>
                <Text style={styles.renameCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.renameBtn, styles.renameSave]}
                onPress={() => {
                  Share.share({ message: shareUrlForDeck(deck), title: deck.name }).catch(() => {});
                }}
              >
                <Text style={styles.renameSaveText}>Share…</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={19} color={danger ? '#e5484d' : colors.text} />
      <Text style={[styles.menuText, danger && { color: '#e5484d' }]}>{label}</Text>
    </Pressable>
  );
}

function RulesSidebar({
  visible,
  analysis,
  onClose,
}: {
  visible: boolean;
  analysis: ReturnType<typeof analyzeDeck>;
  onClose: () => void;
}) {
  const rule = (label: string, have: number, need: number) => {
    const ok = have === need;
    return (
      <View style={styles.ruleRow}>
        <Ionicons
          name={ok ? 'checkmark-circle' : 'ellipse-outline'}
          size={18}
          color={ok ? colors.good : colors.textFaint}
        />
        <Text style={styles.ruleRowText}>{label}</Text>
        <Text style={[styles.ruleRowCount, ok && { color: colors.good }]}>
          {have}/{need}
        </Text>
      </View>
    );
  };
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sidebarRoot}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHead}>
            <Text style={styles.sidebarTitle}>Deck rules</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.sidebarSection}>A legal deck has</Text>
          {rule('Oshi holomem', analysis.oshi, DECK_RULES.oshi)}
          {rule('Cheer deck', analysis.cheer, DECK_RULES.cheer)}
          {rule('Main deck (holomem + Support)', analysis.main, DECK_RULES.main)}

          <Text style={styles.sidebarSection}>Card limits</Text>
          <Bullet text="Max 4 copies of any holomem / Support (by card number) — unless a card says you may include any number." />
          <Bullet text="Cheer has no per-card limit, but the cheer deck is exactly 20." />
          <Bullet text="Exactly 1 Oshi holomem." />
          <Bullet text="Different rarities of the same card number count as the same card." />

          {analysis.issues.length ? (
            <>
              <Text style={styles.sidebarSection}>To finish this deck</Text>
              {analysis.issues.map((i) => (
                <View key={i} style={styles.issueRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.warn} />
                  <Text style={styles.issueText}>{i}</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.legalBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.good} />
              <Text style={styles.legalBannerText}>This deck is legal!</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.sidebarScrim} onPress={onClose} />
      </View>
    </Modal>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function SegBtn({ label, icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segBtn, active && styles.segActive]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={active ? '#fff' : colors.textDim} />
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SetPickRow({ set, onPress }: { set: CardSet; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={[styles.pickSwatch, { backgroundColor: set.accent }]}>
        <Text style={styles.pickSwatchText}>
          {set.isPromo ? 'PR' : set.code.replace('h', '')}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pickName} numberOfLines={1}>
          {set.name}
        </Text>
        <Text style={styles.pickMeta}>
          {set.code} · {artCountInSet(set.code)} cards
        </Text>
      </View>
      <Ionicons name="add-circle" size={22} color={colors.accent} />
    </Pressable>
  );
}

function RuleStat({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const ok = value === target;
  const over = value > target;
  return (
    <View style={styles.ruleStat}>
      <View style={[styles.ruleDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.ruleLabel}>{label}</Text>
        <Text style={[styles.ruleValue, ok && { color: colors.good }, over && { color: colors.warn }]}>
          {value}
          <Text style={styles.ruleTarget}>/{target}</Text>
        </Text>
      </View>
    </View>
  );
}

function Stepper({
  count,
  canAdd = true,
  onAdd,
  onSub,
  onEdit,
}: {
  count: number;
  canAdd?: boolean;
  onAdd: () => void;
  onSub: () => void;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={[styles.stepBtn, count === 0 && styles.stepDisabled]} onPress={onSub} disabled={count === 0}>
        <Ionicons name="remove" size={15} color={colors.text} />
      </Pressable>
      <Pressable style={styles.stepCountBtn} onPress={onEdit} disabled={!onEdit}>
        <Text style={styles.stepCount}>{count}</Text>
      </Pressable>
      <Pressable
        style={[styles.stepBtn, styles.stepAdd, !canAdd && styles.stepDisabled]}
        onPress={onAdd}
        disabled={!canAdd}
      >
        <Ionicons name="add" size={15} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  ruleStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ruleDot: { width: 8, height: 8, borderRadius: 4 },
  ruleLabel: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  ruleValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  ruleTarget: { color: colors.textFaint, fontSize: 12, fontWeight: '700' },
  legal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  legalOk: { backgroundColor: colors.good },
  legalBad: { backgroundColor: colors.textDim },
  legalText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  segment: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  segText: { color: colors.textDim, fontWeight: '800', fontSize: 14 },
  segTextActive: { color: '#fff' },
  deckScroll: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', flex: 1 },
  sectionCount: { color: colors.textDim, fontSize: 15, fontWeight: '800' },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  controls: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  filterBtn: {
    width: 48,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pill: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  pickerContent: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 40 },
  pickerHint: { color: colors.textDim, fontSize: 13 },
  flatSection: { gap: spacing.sm },
  flatLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pickSwatch: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickSwatchText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  pickName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  pickMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  selectedName: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 15 },
  grid: { padding: spacing.lg, paddingTop: 4, rowGap: spacing.lg, flexGrow: 1 },
  col: { gap: spacing.md, justifyContent: 'flex-start', alignItems: 'flex-start' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },
  empty: { color: colors.textDim, textAlign: 'center', fontSize: 14 },
  emptyBtn: {
    backgroundColor: colors.accentDeep,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepAdd: { backgroundColor: colors.accentDeep },
  stepDisabled: { opacity: 0.4 },
  stepCountBtn: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stepCount: { color: colors.text, fontWeight: '900', fontSize: 15 },

  // header title / menu
  titleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 220 },
  titleText: { color: colors.headerText, fontSize: 17, fontWeight: '800' },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingTop: 60, paddingRight: spacing.md, alignItems: 'flex-end' },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    minWidth: 200,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '600' },

  // rename
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.xl },
  renameSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  renameTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  editSub: { color: colors.textDim, fontSize: 13, marginTop: -6 },
  shareHint: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: -6 },
  shareUrl: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: 12,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  renameInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.text,
    fontSize: 15,
  },
  renameBtns: { flexDirection: 'row', gap: spacing.md },
  renameBtn: { flex: 1, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  renameCancel: { backgroundColor: colors.surface2 },
  renameCancelText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  renameSave: { backgroundColor: colors.accentDeep },
  renameSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // rules sidebar
  sidebarRoot: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    width: '82%',
    maxWidth: 360,
    backgroundColor: colors.bg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: spacing.lg,
    gap: 6,
  },
  sidebarScrim: { flex: 1 },
  sidebarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sidebarTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sidebarSection: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: 4,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  ruleRowText: { color: colors.text, fontSize: 15, flex: 1 },
  ruleRowCount: { color: colors.textDim, fontSize: 15, fontWeight: '800' },
  bullet: { flexDirection: 'row', gap: 10, paddingVertical: 5, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  bulletText: { color: colors.textDim, fontSize: 13, lineHeight: 19, flex: 1 },
  issueRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 },
  issueText: { color: colors.text, fontSize: 13, flex: 1 },
  legalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(55,199,106,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  legalBannerText: { color: colors.good, fontWeight: '800', fontSize: 15 },
});
