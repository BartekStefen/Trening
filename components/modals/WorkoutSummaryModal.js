import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import LiveMuscleMap from '../LiveMuscleMap';
import { useTheme } from '../../context/ThemeContext';
import useMuscleHeatmap from '../../hooks/useMuscleHeatmap';
import { collectSessionPRs } from '../../utils/prDetection';

const KG_PER_CAR = 1500;

const fmtDur = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sc}s`;
  return `${sc}s`;
};

const WorkoutSummaryModal = ({ isVisible, onClose, summaryData, onSave }) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const { totalSec = 0, totalTonnage = 0, exercises = [], workoutName = '', sessionNote = '' } = summaryData ?? {};

  const cars     = Math.floor(totalTonnage / KG_PER_CAR);
  const prs      = useMemo(() => collectSessionPRs(exercises), [exercises]);
  const doneSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);
  const heatmap  = useMuscleHeatmap(exercises);

  const activeMuscleParts = Object.keys(heatmap).length;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.screen}>
        <View style={s.handle} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>TRENING UKOŃCZONY</Text>
            <Text style={s.heroTitle}>Brawo! 💪</Text>
            {workoutName ? <Text style={s.heroSub}>{workoutName}</Text> : null}
            {sessionNote ? (
              <View style={s.noteBox}>
                <Ionicons name="create-outline" size={13} color={colors.textTertiary} />
                <Text style={s.noteText}>{sessionNote}</Text>
              </View>
            ) : null}
          </View>

          {/* Siatka statystyk */}
          <View style={s.grid}>
            <View style={s.card}>
              <Ionicons name="time-outline" size={20} color={colors.accent} style={s.cardIcon} />
              <Text style={s.cLabel}>Czas</Text>
              <Text style={s.cValue}>{fmtDur(totalSec)}</Text>
            </View>
            <View style={s.card}>
              <Ionicons name="layers-outline" size={20} color={colors.water} style={s.cardIcon} />
              <Text style={s.cLabel}>Serie</Text>
              <Text style={s.cValue}>{doneSets}</Text>
            </View>
            <View style={s.card}>
              <Ionicons name="barbell-outline" size={20} color={colors.library} style={s.cardIcon} />
              <Text style={s.cLabel}>Ćwiczenia</Text>
              <Text style={s.cValue}>{exercises.length}</Text>
            </View>
            <View style={s.card}>
              <Ionicons name="body-outline" size={20} color={colors.danger} style={s.cardIcon} />
              <Text style={s.cLabel}>Partie</Text>
              <Text style={s.cValue}>{activeMuscleParts}</Text>
            </View>

            {/* Tonaż — szeroka karta */}
            <View style={[s.card, s.cardWide]}>
              <View style={s.cardRow}>
                <View>
                  <Text style={s.cLabel}>Tonaż całkowity</Text>
                  <Text style={[s.cValue, { fontSize: 30 }]}>
                    {totalTonnage.toLocaleString('pl-PL')} kg
                  </Text>
                  {cars > 0 && (
                    <Text style={s.cSub}>
                      Równowartość {cars} {cars === 1 ? 'samochodu' : 'samochodów'} osobowych!
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  {Array.from({ length: Math.min(cars, 3) }).map((_, i) => (
                    <Ionicons key={i} name="car-sport-outline" size={26} color="#EF9F27" />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Mapa mięśni */}
          <View style={s.muscleSection}>
            <Text style={s.sectionTitle}>Zaangażowane mięśnie</Text>
            <View style={s.muscleCard}>
              {activeMuscleParts > 0 ? (
                <LiveMuscleMap heatmap={heatmap} />
              ) : (
                <View style={s.musclePlaceholder}>
                  <Ionicons name="body-outline" size={40} color={colors.borderMuted} />
                  <Text style={s.musclePlaceholderText}>Brak zaliczonych serii</Text>
                </View>
              )}
            </View>
          </View>

          {/* Lista ćwiczeń */}
          <Text style={s.sectionTitle}>Szczegóły treningu</Text>
          {exercises.map((ex, i) => {
            const doneSetsEx = ex.sets.filter((set) => set.done);
            const tonnageEx  = doneSetsEx.reduce((a, set) =>
              a + (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0), 0);
            return (
              <View key={ex.id ?? i} style={s.exCard}>
                <View style={s.exHeader}>
                  <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={s.exTonnage}>{tonnageEx > 0 ? `${tonnageEx} kg` : '—'}</Text>
                </View>
                <Text style={s.exMuscles}>{ex.muscleGroup}</Text>
                <View style={s.exSets}>
                  {doneSetsEx.map((set, si) => (
                    <View key={set.id ?? si} style={s.setPill}>
                      <Text style={s.setPillText}>{set.kg} kg × {set.reps}</Text>
                    </View>
                  ))}
                  {doneSetsEx.length === 0 && (
                    <Text style={s.exNoSets}>Brak zaliczonych serii</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Rekordy */}
          {prs.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 8 }]}>Nowe rekordy 🏆</Text>
              {prs.map((pr, i) => (
                <View key={i} style={s.prCard}>
                  <View style={s.prTrophy}>
                    <Ionicons name="trophy" size={17} color="#FAC775" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.prName}>{pr.name}</Text>
                    <Text style={s.prVal}>{pr.kg} kg × {pr.reps} powt.</Text>
                  </View>
                  <View style={s.prBadge}>
                    <Text style={s.prBadgeText}>Nowy PR!</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {prs.length === 0 && (
            <View style={s.noPr}>
              <Text style={s.noPrText}>Brak nowych rekordów — konsekwencja to klucz. 💪</Text>
            </View>
          )}

        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.discardBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.discardText}>Anuluj</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>Zapisz trening</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (c) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:  { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  scroll:  { paddingBottom: 16 },

  hero:      { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  heroLabel: { fontSize: 11, fontWeight: '800', color: c.accent, letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontSize: 38, fontWeight: '800', color: c.textPrimary, marginBottom: 4 },
  heroSub:   { fontSize: 14, color: c.textTertiary },

  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  card:     { flex: 1, minWidth: '45%', backgroundColor: c.card, borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: c.border },
  cardWide: { flexBasis: '100%', flex: 0 },
  cardRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { marginBottom: 6 },
  cLabel:   { fontSize: 11, color: c.textSecondary, marginBottom: 3 },
  cValue:   { fontSize: 22, fontWeight: '700', color: c.textPrimary },
  cSub:     { fontSize: 12, color: c.textTertiary, marginTop: 5, lineHeight: 17 },

  noteBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: c.card, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 0.5, borderColor: c.border, maxWidth: '100%' },
  noteText: { fontSize: 13, color: c.textSecondary, lineHeight: 19, flex: 1, textAlign: 'left' },

  muscleSection:         { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle:          { fontSize: 16, fontWeight: '700', color: c.textPrimary, paddingHorizontal: 16, marginBottom: 12 },
  muscleCard:            { backgroundColor: c.card, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 0.5, borderColor: c.border },
  musclePlaceholder:     { alignItems: 'center', paddingVertical: 20, gap: 10 },
  musclePlaceholderText: { fontSize: 13, color: c.borderMuted },

  exCard:     { backgroundColor: c.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: c.border },
  exHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  exName:     { fontSize: 14, fontWeight: '600', color: c.textPrimary, flex: 1, marginRight: 8 },
  exTonnage:  { fontSize: 13, fontWeight: '600', color: c.textTertiary },
  exMuscles:  { fontSize: 11, color: c.textTertiary, marginBottom: 10 },
  exSets:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setPill:    { backgroundColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  setPillText:{ fontSize: 12, color: c.textPrimary, fontWeight: '500' },
  exNoSets:   { fontSize: 12, color: c.borderMuted },

  prCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 16, padding: 14, gap: 12, borderWidth: 0.5, borderColor: c.border },
  prTrophy:   { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,179,71,0.15)', justifyContent: 'center', alignItems: 'center' },
  prName:     { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  prVal:      { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  prBadge:    { backgroundColor: 'rgba(255,179,71,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  prBadgeText:{ fontSize: 11, fontWeight: '700', color: '#FAC775' },

  noPr:    { marginHorizontal: 16, marginBottom: 8, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: c.border },
  noPrText:{ fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 20 },

  footer:     { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderColor: c.border },
  discardBtn: { flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: c.border },
  discardText:{ fontSize: 15, fontWeight: '600', color: c.textSecondary },
  saveBtn:    { flex: 2, backgroundColor: c.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  saveBtnText:{ fontSize: 16, fontWeight: '700', color: c.accentText },
});

export default WorkoutSummaryModal;
