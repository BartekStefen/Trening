import { useMemo, useState } from 'react';
import {
  Image, Modal, Platform, ScrollView, SectionList,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { EXERCISE_DATABASE } from '../../screens/ExercisesLibraryScreen';

const ALL_KEY = 'Wszystkie';

// ─── Bottom Sheet: multi-select atlas ćwiczeń ────────────────────────────────
// onAdd(exercises[]) — callback gdy użytkownik zatwierdza wybór
export default function ExercisePickerSheet({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const [query,       setQuery]       = useState('');
  const [muscle,      setMuscle]      = useState(ALL_KEY);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const s = makeStyles(colors);

  const filterKeys = [ALL_KEY, ...EXERCISE_DATABASE.map((sec) => sec.filterKey)];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_DATABASE
      .filter((sec) => muscle === ALL_KEY || sec.filterKey === muscle)
      .map((sec) => ({
        ...sec,
        data: q ? sec.data.filter((ex) => ex.name.toLowerCase().includes(q)) : sec.data,
      }))
      .filter((sec) => sec.data.length > 0);
  }, [query, muscle]);

  const toggleId = (id) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const exercises = EXERCISE_DATABASE.flatMap((sec) => sec.data).filter((ex) => selectedIds.has(ex.id));
    onAdd?.(exercises);
    // reset
    setQuery('');
    setMuscle(ALL_KEY);
    setSelectedIds(new Set());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClose = () => {
    setQuery('');
    setMuscle(ALL_KEY);
    setSelectedIds(new Set());
    onClose?.();
  };

  const renderItem = ({ item }) => {
    const sel = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[s.row, sel && s.rowSelected]}
        onPress={() => toggleId(item.id)}
        activeOpacity={0.75}
      >
        <Image source={{ uri: item.image }} style={s.thumb} resizeMode="cover" />
        <View style={s.rowInfo}>
          <Text style={[s.rowName, sel && { color: colors.library }]}>{item.name}</Text>
          <Text style={s.rowMeta}>{item.equipment} · {item.muscles[0]}</Text>
        </View>
        <View style={[s.check, sel && { backgroundColor: colors.library, borderColor: colors.library }]}>
          {sel && <Ionicons name="checkmark" size={14} color="#000" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = ({ section }) => (
    <View style={[s.secHeader, { borderLeftColor: section.accent }]}>
      <Text style={[s.secTitle, { color: section.accent }]}>{section.title}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={s.screen}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Nagłówek */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={s.title}>Dodaj ćwiczenia</Text>
          {selectedIds.size > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{selectedIds.size}</Text>
            </View>
          )}
        </View>

        {/* Szukaj */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            placeholder="Szukaj ćwiczenia..."
            placeholderTextColor={colors.borderMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtry partii — poziomy scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
          style={{ flexShrink: 0 }}
        >
          {filterKeys.map((key) => {
            const sec     = EXERCISE_DATABASE.find((s) => s.filterKey === key);
            const active  = muscle === key;
            const accent  = sec?.accent ?? colors.library;
            const label   = key === ALL_KEY ? 'Wszystkie' : sec?.title ?? key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.filterChip, active && { backgroundColor: accent, borderColor: accent }]}
                onPress={() => { setMuscle(key); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Text style={[s.filterChipTxt, active && { color: '#000' }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={36} color={colors.borderMuted} />
            <Text style={s.emptyTxt}>Brak wyników dla „{query}"</Text>
          </View>
        ) : (
          <SectionList
            sections={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderHeader}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: selectedIds.size > 0 ? 100 : 24 }}
            ItemSeparatorComponent={() => <View style={s.sep} />}
          />
        )}

        {/* Stopka — widoczna gdy jest coś zaznaczone */}
        {selectedIds.size > 0 && (
          <View style={s.footer}>
            <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.library }]} onPress={handleAdd} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={s.addBtnTxt}>Dodaj {selectedIds.size} ćwiczeń do planu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:  { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },

  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  closeBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: 17, fontWeight: '700', color: c.textPrimary, flex: 1 },
  countBadge:{ minWidth: 26, height: 26, borderRadius: 13, backgroundColor: c.library, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  countText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 14, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, borderWidth: 0.5, borderColor: c.border, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: c.textPrimary, paddingVertical: 0 },

  filtersRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  filterChipTxt: { fontSize: 13, fontWeight: '600', color: c.textSecondary },

  secHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundSecondary, paddingHorizontal: 20, paddingVertical: 8, borderLeftWidth: 3 },
  secTitle:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: c.backgroundSecondary, gap: 12 },
  rowSelected: { backgroundColor: c.librarySoft ?? c.card },
  thumb:       { width: 46, height: 46, borderRadius: 10, backgroundColor: c.card },
  rowInfo:     { flex: 1, minWidth: 0 },
  rowName:     { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
  rowMeta:     { fontSize: 11, color: c.textTertiary },
  check:       { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.borderMuted, justifyContent: 'center', alignItems: 'center' },
  sep:         { height: 0.5, backgroundColor: c.border, marginLeft: 74 },

  empty:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyTxt: { fontSize: 14, color: c.borderMuted },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 20, backgroundColor: c.backgroundSecondary, borderTopWidth: 0.5, borderTopColor: c.border },
  addBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15 },
  addBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
