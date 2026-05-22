import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useWorkoutContext } from '../../context/WorkoutContext';

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Props:
//   isVisible
//   exerciseName  – szukamy po nazwie w historii
//   onClose()
const ExerciseHistoryModal = ({ isVisible, exerciseName, onClose }) => {
  const { workoutHistory } = useWorkoutContext();

  // Wyciągamy wszystkie wpisy tego ćwiczenia z historii treningów
  const history = useMemo(() => {
    if (!exerciseName || !workoutHistory?.length) return [];
    return workoutHistory
      .map((session) => {
        const ex = session.exercises?.find(
          (e) => e.name?.trim().toLowerCase() === exerciseName.trim().toLowerCase()
        );
        if (!ex) return null;
        const doneSets = ex.sets?.filter((s) => s.done) ?? [];
        if (!doneSets.length) return null;
        const maxKg = Math.max(...doneSets.map((s) => parseFloat(s.kg) || 0));
        const totalVol = doneSets.reduce(
          (a, s) => a + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0
        );
        return {
          date:    session.savedAt,
          sets:    doneSets,
          maxKg,
          totalVol,
        };
      })
      .filter(Boolean)
      .slice(0, 10); // ostatnie 10 sesji
  }, [workoutHistory, exerciseName]);

  const best = history.length
    ? history.reduce((a, b) => b.maxKg > a.maxKg ? b : a)
    : null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={s.title} numberOfLines={2}>{exerciseName}</Text>
        <Text style={s.subtitle}>Historia ćwiczenia</Text>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Rekord */}
          {best && (
            <View style={s.prCard}>
              <View style={s.prTrophy}>
                <Ionicons name="trophy" size={20} color="#FAC775" />
              </View>
              <View>
                <Text style={s.prLabel}>Rekord osobisty</Text>
                <Text style={s.prValue}>{best.maxKg} kg</Text>
              </View>
            </View>
          )}

          {history.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="time-outline" size={40} color="#3A3A3C" />
              <Text style={s.emptyTitle}>Brak historii</Text>
              <Text style={s.emptySub}>
                To ćwiczenie pojawi się tutaj po zapisaniu pierwszego treningu.
              </Text>
            </View>
          )}

          {history.map((entry, i) => (
            <View key={i} style={s.sessionCard}>
              <View style={s.sessionHeader}>
                <Text style={s.sessionDate}>{fmtDate(entry.date)}</Text>
                <Text style={s.sessionVol}>{entry.totalVol.toLocaleString('pl-PL')} kg obj.</Text>
              </View>
              <View style={s.setsRow}>
                {entry.sets.map((set, si) => {
                  const isMax = parseFloat(set.kg) === entry.maxKg;
                  return (
                    <View key={si} style={[s.setPill, isMax && s.setPillMax]}>
                      <Text style={[s.setPillText, isMax && s.setPillTextMax]}>
                        {set.kg} kg × {set.reps}
                      </Text>
                      {isMax && <Text style={s.setPillCrown}>👑</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#0A0A0A' },
  handle:   { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:    { fontSize: 20, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 2, paddingRight: 48 },
  subtitle: { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 20 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 48 },

  prCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(250,199,117,0.08)', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14, borderWidth: 0.5, borderColor: 'rgba(250,199,117,0.3)' },
  prTrophy: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(250,199,117,0.12)', justifyContent: 'center', alignItems: 'center' },
  prLabel:  { fontSize: 11, color: '#8E8E93', marginBottom: 3 },
  prValue:  { fontSize: 24, fontWeight: '800', color: '#FAC775' },

  empty:      { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#636366' },
  emptySub:   { fontSize: 13, color: '#3A3A3C', textAlign: 'center', lineHeight: 20 },

  sessionCard:   { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#2C2C2E' },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sessionDate:   { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  sessionVol:    { fontSize: 11, color: '#636366' },
  setsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setPill:       { backgroundColor: '#2C2C2E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  setPillMax:    { backgroundColor: 'rgba(250,199,117,0.12)', borderWidth: 0.5, borderColor: 'rgba(250,199,117,0.4)' },
  setPillText:   { fontSize: 12, color: '#EBEBEB', fontWeight: '500' },
  setPillTextMax:{ color: '#FAC775', fontWeight: '700' },
  setPillCrown:  { fontSize: 10 },
});

export default ExerciseHistoryModal;