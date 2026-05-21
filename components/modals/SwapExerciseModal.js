import { useMemo, useState } from 'react';
import {
  Image, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Wspólny ConfirmModal (lokalny, nie eksportowany) ────────────────────────
const ConfirmModal = ({ visible, title, body, confirmLabel, confirmDanger, onConfirm, onCancel }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
    <View style={confirmStyles.backdrop}>
      <View style={confirmStyles.box}>
        <Text style={confirmStyles.title}>{title}</Text>
        <Text style={confirmStyles.body}>{body}</Text>
        <View style={confirmStyles.actions}>
          <TouchableOpacity style={confirmStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={confirmStyles.cancelText}>Anuluj</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[confirmStyles.confirmBtn, confirmDanger && { backgroundColor: '#FF5252' }]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={confirmStyles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const confirmStyles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:         { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, width: '100%', borderWidth: 0.5, borderColor: '#2C2C2E' },
  title:       { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  body:        { fontSize: 14, color: '#8E8E93', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  actions:     { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText:  { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  confirmBtn:  { flex: 1, backgroundColor: '#00E676', borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#000000' },
});

// ─── SwapExerciseModal ────────────────────────────────────────────────────────
// Wyświetla listę ćwiczeń z miniaturami, sugerowane zamienniki na górze,
// a po wyborze prosi o potwierdzenie przed podmianą.
//
// Props:
//   isVisible                   – boolean
//   currentExercise             – obiekt bieżącego ćwiczenia { name, alternatives[] }
//   exerciseDatabase            – cała baza [ { data: [{ id, name, muscles, equipment, image, alternatives }] } ]
//   exerciseMap                 – { [id]: obiekt } do szybkiego lookup zamienników
//   onSwap(newExerciseObject)   – callback po potwierdzeniu zamiany
//   onClose()                   – callback zamknięcia bez zapisu
const SwapExerciseModal = ({
  isVisible,
  currentExercise,
  exerciseDatabase,
  exerciseMap,
  onSwap,
  onClose,
}) => {
  const [query, setQuery]         = useState('');
  const [pendingSwap, setPending] = useState(null);

  // Sugerowane zamienniki zdefiniowane w danych ćwiczenia
  const suggested = (currentExercise?.alternatives ?? [])
    .map((id) => exerciseMap?.[id])
    .filter(Boolean);

  // Wszystkie ćwiczenia z bazy z wyjątkiem bieżącego
  const allExercises = useMemo(
    () => (exerciseDatabase ?? []).flatMap((s) => s.data).filter((ex) => ex.id !== currentExercise?.id),
    [exerciseDatabase, currentExercise],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allExercises.filter((ex) => ex.name.toLowerCase().includes(q)) : allExercises;
  }, [query, allExercises]);

  const handleConfirmSwap = () => {
    onSwap(pendingSwap);
    setPending(null);
    onClose();
  };

  const ExRow = ({ ex, badge }) => (
    <TouchableOpacity style={styles.row} onPress={() => setPending(ex)} activeOpacity={0.7}>
      <Image
        source={{ uri: ex.image ?? 'https://via.placeholder.com/46/2C2C2E/636366?text=EX' }}
        style={styles.thumbnail}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{ex.name}</Text>
        <Text style={styles.rowMeta}>{ex.muscles?.[0]} · {ex.equipment}</Text>
      </View>
      {badge
        ? <View style={styles.badge}><Text style={styles.badgeText}>Zalecane</Text></View>
        : <Ionicons name="chevron-forward" size={17} color="#3A3A3C" />}
    </TouchableOpacity>
  );

  return (
    <>
      {/* ── Główna lista ── */}
      <Modal
        visible={isVisible && !pendingSwap}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.screen}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <Text style={styles.title}>Zamień ćwiczenie</Text>
          <Text style={styles.sub}>{currentExercise?.name}</Text>

          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={17} color="#636366" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj..."
              placeholderTextColor="#636366"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={17} color="#636366" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Sugerowane zamienniki – tylko gdy brak wyszukiwania */}
            {suggested.length > 0 && !query && (
              <>
                <Text style={styles.sLabel}>Sugerowane zamienniki</Text>
                {suggested.map((ex) => <ExRow key={ex.id} ex={ex} badge />)}
                <View style={styles.divider} />
                <Text style={styles.sLabel}>Wszystkie ćwiczenia</Text>
              </>
            )}
            {filtered.map((ex) => <ExRow key={ex.id} ex={ex} />)}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Potwierdzenie zamiany ── */}
      <ConfirmModal
        visible={!!pendingSwap}
        title="Zamień ćwiczenie?"
        body={`Zastąpić\n${currentExercise?.name}\nćwiczeniem\n${pendingSwap?.name}?`}
        confirmLabel="Zamień"
        onConfirm={handleConfirmSwap}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0A0A0A' },
  handle:        { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:      { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:         { fontSize: 20, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  sub:           { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 14 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', marginHorizontal: 16, marginBottom: 14, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 0.5, borderColor: '#2C2C2E' },
  searchInput:   { flex: 1, fontSize: 14, color: '#FFFFFF', paddingVertical: 0 },
  sLabel:        { fontSize: 11, fontWeight: '700', color: '#636366', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  thumbnail:     { width: 46, height: 46, borderRadius: 10, backgroundColor: '#1C1C1E' },
  rowInfo:       { flex: 1 },
  rowName:       { fontSize: 14, fontWeight: '500', color: '#FFFFFF', marginBottom: 3 },
  rowMeta:       { fontSize: 11, color: '#636366' },
  badge:         { backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:     { fontSize: 11, color: '#00E676', fontWeight: '600' },
  divider:       { height: 0.5, backgroundColor: '#2C2C2E', marginHorizontal: 20, marginVertical: 12 },
});

export default SwapExerciseModal;