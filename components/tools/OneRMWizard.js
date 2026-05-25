import { useMemo, useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { EXERCISE_DATABASE } from '../../screens/ExercisesLibraryScreen';
import {
  generateMaxAttemptProtocol,
  getBest1RMFromHistory,
} from '../../utils/trainingIntelligence';

const fmt = (n) => (Math.round(n * 2) / 2).toFixed(1).replace('.', ',');

const ALL_EXERCISES = EXERCISE_DATABASE.flatMap((s) => s.data);

export default function OneRMWizard({ isVisible, onClose }) {
  const { colors } = useTheme();
  const { workoutHistory, exerciseRecords, updateExerciseRecord } = useWorkoutContext();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [targetInput, setTargetInput] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_EXERCISES.slice(0, 12);
    return ALL_EXERCISES.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 20);
  }, [query]);

  const current1RM = useMemo(() => {
    if (!selected) return null;
    const stored = exerciseRecords[selected.id]?.oneRM;
    const fromHistory = getBest1RMFromHistory(workoutHistory, selected.id, selected.name);
    if (stored && fromHistory) return Math.max(stored, fromHistory);
    return stored ?? fromHistory;
  }, [selected, workoutHistory, exerciseRecords]);

  const protocol = useMemo(() => {
    if (!selected) return null;
    const target = parseFloat(targetInput.replace(',', '.'));
    return generateMaxAttemptProtocol(current1RM ?? 0, target || 0);
  }, [selected, current1RM, targetInput]);

  const handleSelect = (ex) => {
    setSelected(ex);
    setConfirmed(false);
    const base = getBest1RMFromHistory(workoutHistory, ex.id, ex.name)
      ?? exerciseRecords[ex.id]?.oneRM
      ?? 0;
    setTargetInput(base > 0 ? String(Math.round((base + 2.5) * 2) / 2) : '');
  };

  const handleConfirmSuccess = () => {
    if (!selected || !protocol?.testWeight) return;
    updateExerciseRecord(selected.name, protocol.testWeight, {
      exerciseId: selected.id,
      source: '1rm_wizard',
    });
    setConfirmed(true);
    Alert.alert(
      'Rekord zaktualizowany',
      `${selected.name}: 1RM ${fmt(protocol.testWeight)} kg zapisany w profilu.`,
      [{ text: 'OK' }],
    );
  };

  const handleClose = () => {
    setQuery('');
    setSelected(null);
    setTargetInput('');
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={s.title}>Kreator prób 1RM</Text>
        <Text style={s.subtitle}>
          Protokół NSCA: 2 rozgrzewki + 2 podejścia w planie (w sali max 5 single z przerwą 3 min)
        </Text>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!selected ? (
            <>
              <TextInput
                style={s.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Szukaj ćwiczenia..."
                placeholderTextColor={colors.textTertiary}
              />
              {filtered.map((ex) => (
                <TouchableOpacity key={ex.id} style={s.exRow} onPress={() => handleSelect(ex)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{ex.name}</Text>
                    <Text style={s.exMeta}>{ex.equipment} · {ex.muscles?.[0]}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.borderMuted} />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <TouchableOpacity style={s.backRow} onPress={() => setSelected(null)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color={colors.accent} />
                <Text style={s.backText}>Zmień ćwiczenie</Text>
              </TouchableOpacity>

              <View style={s.heroCard}>
                <Text style={s.heroLabel}>Aktualny rekord 1RM</Text>
                <Text style={s.heroValue}>
                  {current1RM ? `${fmt(current1RM)} kg` : 'Brak danych — wpisz cel poniżej'}
                </Text>
                <Text style={s.heroExercise}>{selected.name}</Text>
              </View>

              <Text style={s.sectionLabel}>Cel 1RM (kg)</Text>
              <Text style={s.fieldHint}>
                Wpisz wagę, którą chcesz maksymalnie unieść raz. To będzie jedyna „próba 1RM” w protokole.
              </Text>
              <TextInput
                style={s.targetInput}
                value={targetInput}
                onChangeText={setTargetInput}
                keyboardType="decimal-pad"
                placeholder={current1RM ? fmt(current1RM + 2.5) : 'np. 100'}
                placeholderTextColor={colors.textTertiary}
              />

              {protocol && protocol.steps.length > 0 && (
                <>
                  <View style={s.infoBox}>
                    <Text style={s.infoText}>{protocol.summary}</Text>
                    <Text style={s.infoSource}>Źródło: {protocol.source}</Text>
                  </View>

                  <Text style={s.sectionLabel}>Plan ({protocol.steps.length} serii)</Text>
                  {protocol.steps.map((step) => (
                    <View
                      key={step.id}
                      style={[
                        s.stepCard,
                        step.phase === 'attempt' && s.stepAttempt,
                        step.isKey && s.stepMax,
                      ]}
                    >
                      <View style={s.stepHeader}>
                        <Text style={s.stepLabel}>{step.label}</Text>
                        <Text style={s.stepLoad}>{fmt(step.kg)} kg × {step.reps}</Text>
                      </View>
                      <Text style={s.stepNote}>{step.note}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[s.confirmBtn, confirmed && s.confirmBtnDone]}
                    onPress={handleConfirmSuccess}
                    activeOpacity={0.85}
                    disabled={confirmed || !protocol.testWeight}
                  >
                    <Ionicons name={confirmed ? 'checkmark-circle' : 'trophy'} size={20} color="#000" />
                    <Text style={s.confirmBtnText}>
                      {confirmed ? 'Rekord zapisany' : `Zaliczyłem/am — zapisz ${fmt(protocol.testWeight)} kg`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:   { flex: 1, backgroundColor: c.background },
  handle:   { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: c.backgroundSecondary, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:    { fontSize: 22, fontWeight: '700', color: c.textPrimary, paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  subtitle: { fontSize: 12, color: c.textSecondary, lineHeight: 18, paddingHorizontal: 20, marginBottom: 16 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 48 },

  search: {
    backgroundColor: c.backgroundSecondary,
    borderRadius: 14, borderWidth: 0.5, borderColor: c.border,
    color: c.textPrimary, fontSize: 15,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  exRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.backgroundSecondary, borderRadius: 14,
    padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: c.border,
  },
  exName: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
  exMeta: { fontSize: 11, color: c.textTertiary },

  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { fontSize: 14, color: c.accent, fontWeight: '600' },

  heroCard: {
    backgroundColor: c.backgroundSecondary, borderRadius: 20, padding: 22,
    alignItems: 'center', marginBottom: 18, borderWidth: 0.5, borderColor: 'rgba(0,230,118,0.3)',
  },
  heroLabel:    { fontSize: 12, color: c.textSecondary, marginBottom: 6 },
  heroValue:    { fontSize: 40, fontWeight: '800', color: '#00E676', marginBottom: 6, textAlign: 'center' },
  heroExercise: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  fieldHint: { fontSize: 12, color: c.textSecondary, lineHeight: 18, marginBottom: 10 },

  targetInput: {
    backgroundColor: c.backgroundSecondary, borderRadius: 14,
    borderWidth: 0.5, borderColor: c.border, color: c.textPrimary,
    fontSize: 24, fontWeight: '700', textAlign: 'center',
    paddingVertical: 14, marginBottom: 14,
  },

  infoBox: {
    backgroundColor: c.backgroundSecondary, borderRadius: 14,
    padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: c.border,
  },
  infoText: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
  infoSource: { fontSize: 10, color: c.textTertiary, marginTop: 6 },

  stepCard: {
    backgroundColor: c.backgroundSecondary, borderRadius: 14,
    padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: c.border,
  },
  stepAttempt: { borderColor: 'rgba(55,138,221,0.35)' },
  stepMax:     { borderColor: 'rgba(0,230,118,0.45)', backgroundColor: 'rgba(0,230,118,0.06)' },
  stepHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stepLabel:   { fontSize: 14, fontWeight: '700', color: c.textPrimary, flex: 1, paddingRight: 8 },
  stepLoad:    { fontSize: 15, fontWeight: '800', color: c.accent },
  stepNote:    { fontSize: 12, color: c.textSecondary, lineHeight: 17 },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#00E676', borderRadius: 16, paddingVertical: 16, marginTop: 12,
  },
  confirmBtnDone: { backgroundColor: c.border },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#000', textAlign: 'center', flex: 1 },
});
