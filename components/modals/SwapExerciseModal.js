import { useMemo, useState } from 'react';
import {
  Image, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfirmModal = ({ visible, title, body, confirmLabel, onConfirm, onCancel, children }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
    <View style={cs.backdrop}>
      <View style={cs.box}>
        <Text style={cs.title}>{title}</Text>
        <Text style={cs.body}>{body}</Text>
        {children}
        <View style={cs.actions}>
          <TouchableOpacity style={cs.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={cs.cancelText}>Anuluj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cs.confirmBtn} onPress={onConfirm} activeOpacity={0.7}>
            <Text style={cs.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const cs = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:        { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, width: '100%', borderWidth: 0.5, borderColor: '#2C2C2E' },
  title:      { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  body:       { fontSize: 14, color: '#8E8E93', lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  actions:    { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:  { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  confirmBtn: { flex: 1, backgroundColor: '#00E676', borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmText:{ fontSize: 15, fontWeight: '700', color: '#000000' },
});

// Przelicza ciężar z ćwiczenia bazowego na zamiennik.
// Logika: bazujemy na pierwszym RM jednocześnie biorąc pod uwagę,
// że ćwiczenia izolowane wymagają ok. 40-60% ciężaru ćwiczeń złożonych.
// Uproszczone, ale intuicyjne dla użytkownika.
const EXERCISE_TYPE_FACTOR = {
  compound: 1.0,   // wielostawowe: wyciskanie, martwy, przysiad
  isolation: 0.55, // izolowane: curl, rozpiętki, pushdown
  cable: 0.65,     // wyciąg
  machine: 0.75,   // maszyna
};

const getTypeFactor = (equipment) => {
  const eq = (equipment ?? '').toLowerCase();
  if (eq.includes('maszyn') || eq.includes('machine')) return EXERCISE_TYPE_FACTOR.machine;
  if (eq.includes('wyciąg') || eq.includes('cable') || eq.includes('kabel')) return EXERCISE_TYPE_FACTOR.cable;
  return EXERCISE_TYPE_FACTOR.compound;
};

const calcSwapWeight = (currentKg, fromEx, toEx) => {
  if (!currentKg || isNaN(parseFloat(currentKg))) return null;
  const kg         = parseFloat(currentKg);
  const fromFactor = getTypeFactor(fromEx?.equipment);
  const toFactor   = getTypeFactor(toEx?.equipment);
  // Przelicz przez "wspólny mianownik" — szacowany % siły bazowej
  const baseKg  = kg / fromFactor;
  const newKg   = baseKg * toFactor;
  // Zaokrąglij do 2.5 kg
  return Math.round(Math.max(2.5, newKg) / 2.5) * 2.5;
};

// Props:
//   isVisible, currentExercise, exerciseDatabase, exerciseMap
//   currentSets    – aktualne serie { kg, reps }[] z ćwiczenia (do przeliczenia)
//   onSwap(newEx, adjustedSets)
//   onClose()
const SwapExerciseModal = ({
  isVisible,
  currentExercise,
  exerciseDatabase,
  exerciseMap,
  currentSets,
  onSwap,
  onClose,
}) => {
  const [query, setQuery]         = useState('');
  const [pendingSwap, setPending] = useState(null);
  const [adjustedSets, setAdjusted] = useState(null);

  const suggested = (currentExercise?.alternatives ?? [])
    .map((id) => exerciseMap?.[id])
    .filter(Boolean);

  const allExercises = useMemo(
    () => (exerciseDatabase ?? []).flatMap((s) => s.data)
      .filter((ex) => ex.id !== currentExercise?.id),
    [exerciseDatabase, currentExercise],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allExercises.filter((ex) => ex.name.toLowerCase().includes(q)) : allExercises;
  }, [query, allExercises]);

  const handleSelect = (ex) => {
    // Oblicz przeliczone serie
    const adjusted = (currentSets ?? []).map((s) => ({
      ...s,
      kg: s.kg && !s.done
        ? String(calcSwapWeight(s.kg, currentExercise, ex) ?? s.kg)
        : s.kg,
    }));
    setPending(ex);
    setAdjusted(adjusted);
  };

  const handleConfirm = () => {
    onSwap(pendingSwap, adjustedSets);
    setPending(null);
    setAdjusted(null);
    onClose();
  };

  const ExRow = ({ ex, badge }) => {
    const newKg = calcSwapWeight(
      currentSets?.find((s) => s.kg)?.kg,
      currentExercise,
      ex,
    );
    return (
      <TouchableOpacity style={s.row} onPress={() => handleSelect(ex)} activeOpacity={0.7}>
        <Image
          source={{ uri: ex.image ?? 'https://via.placeholder.com/46/2C2C2E/636366?text=EX' }}
          style={s.thumbnail}
        />
        <View style={s.rowInfo}>
          <Text style={s.rowName}>{ex.name}</Text>
          <Text style={s.rowMeta}>{ex.muscles?.[0]} · {ex.equipment}</Text>
          {newKg && (
            <Text style={s.rowWeight}>
              Sugerowany ciężar: <Text style={{ color: '#00E676', fontWeight: '700' }}>{newKg} kg</Text>
            </Text>
          )}
        </View>
        {badge
          ? <View style={s.badge}><Text style={s.badgeText}>Zalecane</Text></View>
          : <Ionicons name="chevron-forward" size={17} color="#3A3A3C" />}
      </TouchableOpacity>
    );
  };

  // Podgląd przeliczonych serii w modalu potwierdzenia
  const WeightPreview = () => {
    if (!adjustedSets?.length) return null;
    const withKg = adjustedSets.filter((s) => s.kg && !s.done);
    if (!withKg.length) return null;
    return (
      <View style={s.previewBox}>
        <Text style={s.previewLabel}>Przeliczone serie:</Text>
        <View style={s.previewRow}>
          {withKg.map((s, i) => (
            <View key={i} style={s.previewPill ?? s2.previewPill}>
              <Text style={s2.previewPillText}>{s.kg} kg</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={isVisible && !pendingSwap}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={s.screen}>
          <View style={s.handle} />
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <Text style={s.title}>Zamień ćwiczenie</Text>
          <Text style={s.sub}>{currentExercise?.name}</Text>

          <View style={s.searchWrapper}>
            <Ionicons name="search" size={17} color="#636366" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
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
            {suggested.length > 0 && !query && (
              <>
                <Text style={s.sLabel}>Sugerowane zamienniki</Text>
                {suggested.map((ex) => <ExRow key={ex.id} ex={ex} badge />)}
                <View style={s.divider} />
                <Text style={s.sLabel}>Wszystkie ćwiczenia</Text>
              </>
            )}
            {filtered.map((ex) => <ExRow key={ex.id} ex={ex} />)}
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!pendingSwap}
        title="Zamień ćwiczenie?"
        body={`${currentExercise?.name}\n→ ${pendingSwap?.name}`}
        confirmLabel="Zamień"
        onConfirm={handleConfirm}
        onCancel={() => { setPending(null); setAdjusted(null); }}
      >
        <WeightPreview />
      </ConfirmModal>
    </>
  );
};

const s2 = StyleSheet.create({
  previewPill:     { backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(0,230,118,0.3)' },
  previewPillText: { fontSize: 13, color: '#00E676', fontWeight: '600' },
});

const s = StyleSheet.create({
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
  rowName:       { fontSize: 14, fontWeight: '500', color: '#FFFFFF', marginBottom: 2 },
  rowMeta:       { fontSize: 11, color: '#636366' },
  rowWeight:     { fontSize: 11, color: '#8E8E93', marginTop: 3 },
  badge:         { backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:     { fontSize: 11, color: '#00E676', fontWeight: '600' },
  divider:       { height: 0.5, backgroundColor: '#2C2C2E', marginHorizontal: 20, marginVertical: 12 },
  previewBox:    { backgroundColor: '#121212', borderRadius: 12, padding: 12, marginBottom: 8 },
  previewLabel:  { fontSize: 11, color: '#8E8E93', marginBottom: 8 },
  previewRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

export default SwapExerciseModal;