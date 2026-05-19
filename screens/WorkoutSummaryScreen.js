import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';

// Przelicznik tonażu na samochody – symboliczny, motywacyjny element grywalizacji.
// Średnia masa osobówki: 1500 kg
const KG_PER_CAR = 1500;

// Formatuje sekundy do "Xh Ym" lub "Ym Ys" w zależności od długości treningu
const formatDuration = (totalSec) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Wykrywa nowe rekordy: seria zaliczona z wagą większą niż poprzedni log
const detectPRs = (exercises) =>
  exercises.reduce((acc, ex) => {
    const prs = ex.sets.filter((s) => {
      if (!s.done || !s.kg || !s.reps) return false;
      const prevKg = parseFloat(s.prevLog.split('×')[0]);
      return parseFloat(s.kg) > prevKg;
    });
    if (prs.length > 0) {
      const best = prs.reduce((b, s) =>
        parseFloat(s.kg) > parseFloat(b.kg) ? s : b
      );
      acc.push({ exerciseName: ex.name, kg: best.kg, reps: best.reps });
    }
    return acc;
  }, []);

export default function WorkoutSummaryModal({
  visible,
  onClose,
  totalSec = 0,
  totalTonnage = 0,
  exercises = [],
  onSave,
}) {
  const { saveWorkout } = useWorkout();
  const cars = useMemo(() => Math.floor(totalTonnage / KG_PER_CAR), [totalTonnage]);
  const prs   = useMemo(() => detectPRs(exercises), [exercises]);

  const handleSave = () => {
    saveWorkout({
      name: 'Upper Power',
      durationSec: totalSec,
      tonnageKg: totalTonnage,
      exercises,
      prs,
    });
    onSave?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        {/* Uchwyt do przeciągania – konwencja "bottom sheet" znana z iOS */}
        <View style={styles.handle} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>TRENING UKOŃCZONY</Text>
            <Text style={styles.heroTitle}>Brawo! 💪</Text>
            <Text style={styles.heroSub}>Solidna robota. Dane zapisane poniżej.</Text>
          </View>

          {/* ── Siatka statystyk ── */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={22} color="#00E676" style={styles.statIcon} />
              <Text style={styles.statLabel}>Czas treningu</Text>
              <Text style={styles.statValue}>{formatDuration(totalSec)}</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="bar-chart-outline" size={22} color="#378ADD" style={styles.statIcon} />
              <Text style={styles.statLabel}>Serie łącznie</Text>
              <Text style={styles.statValue}>
                {exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0)}
              </Text>
            </View>

            {/* Kafelek tonażu zajmuje całą szerokość */}
            <View style={[styles.statCard, styles.statCardWide]}>
              <View style={styles.statCardRow}>
                <View>
                  <Text style={styles.statLabel}>Tonaż całkowity</Text>
                  <Text style={[styles.statValue, { fontSize: 30 }]}>
                    {totalTonnage.toLocaleString('pl-PL')} kg
                  </Text>
                  {cars > 0 && (
                    <Text style={styles.statSub}>
                      Przerzuciłeś równowartość {cars}{' '}
                      {cars === 1 ? 'samochodu' : cars < 5 ? 'samochodów' : 'samochodów'} osobowych!
                    </Text>
                  )}
                </View>
                {/* Ikona auta jako element grywalizacyjny */}
                <View style={styles.carIconStack}>
                  {Array.from({ length: Math.min(cars, 3) }).map((_, i) => (
                    <Ionicons key={i} name="car-sport-outline" size={26} color="#EF9F27" style={{ marginBottom: 2 }} />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Placeholder heatmapy ── */}
          <View style={styles.heatmapBox}>
            <Ionicons name="body-outline" size={40} color="#3A3A3C" />
            <Text style={styles.heatmapTitle}>Heatmapa mięśni</Text>
            <Text style={styles.heatmapSub}>
              Tu pojawi się mapa mocno przetrenowanych partii ciała
            </Text>
          </View>

          {/* ── Nowe rekordy PR ── */}
          {prs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Nowe rekordy 🏆</Text>
              {prs.map((pr, i) => (
                <View key={i} style={styles.prCard}>
                  <View style={styles.prTrophy}>
                    <Ionicons name="trophy" size={18} color="#FAC775" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prName}>{pr.exerciseName}</Text>
                    <Text style={styles.prVal}>{pr.kg} kg × {pr.reps} powtórzeń</Text>
                  </View>
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>Nowy PR!</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {prs.length === 0 && (
            <View style={styles.noPrBox}>
              <Text style={styles.noPrText}>
                Brak nowych rekordów – ale konsekwencja to klucz. 💪
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Przycisk zapisu – poza ScrollView, zawsze widoczny ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>Zapisz do historii</Text>
            <Text style={styles.saveButtonSub}>Trening trafi do Twojego profilu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0A0A0A' },
  handle:        { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  scrollContent: { paddingBottom: 20 },

  hero:      { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '700', color: '#00E676', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroSub:   { fontSize: 14, color: '#8E8E93', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  statCardWide: { flexBasis: '100%', flex: 0 },
  statCardRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statIcon:     { marginBottom: 8 },
  statLabel:    { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  statValue:    { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  statSub:      { fontSize: 12, color: '#636366', marginTop: 6, lineHeight: 17 },
  carIconStack: { alignItems: 'flex-end', gap: 2 },

  heatmapBox: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    height: 160,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
  },
  heatmapTitle: { fontSize: 15, fontWeight: '500', color: '#3A3A3C' },
  heatmapSub:   { fontSize: 12, color: '#3A3A3C', textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12 },

  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  prTrophy:    { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,179,71,0.15)', justifyContent: 'center', alignItems: 'center' },
  prName:      { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  prVal:       { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  prBadge:     { backgroundColor: 'rgba(255,179,71,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  prBadgeText: { fontSize: 11, fontWeight: '700', color: '#FAC775' },

  noPrBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  noPrText: { fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 20 },

  footer:          { padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderColor: '#2C2C2E' },
  saveButton:      { backgroundColor: '#00E676', borderRadius: 18, padding: 18, alignItems: 'center' },
  saveButtonText:  { fontSize: 17, fontWeight: '700', color: '#000000' },
  saveButtonSub:   { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 4 },
});