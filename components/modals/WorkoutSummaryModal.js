import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Helpers lokalne ──────────────────────────────────────────────────────────
const KG_PER_CAR = 1500;

const fmtDur = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sc}s`;
  return `${sc}s`;
};

// Wykrywa nowe rekordy: kg > pierwsza liczba w prevLog (format "80 kg x 8 powt.")
const detectPRs = (exercises) =>
  exercises.reduce((acc, ex) => {
    const prs = ex.sets.filter(
      (s) => s.done && s.kg && parseFloat(s.kg) > parseFloat((s.prevLog ?? '').split(' ')[0]),
    );
    if (prs.length > 0) {
      const best = prs.reduce((a, s) => (parseFloat(s.kg) > parseFloat(a.kg) ? s : a));
      acc.push({ name: ex.name, kg: best.kg, reps: best.reps });
    }
    return acc;
  }, []);

// ─── WorkoutSummaryModal ──────────────────────────────────────────────────────
// Ekran podsumowania sesji treningowej. Czysty komponent – nie dotyka kontekstu.
//
// Props:
//   isVisible   – boolean
//   onClose()   – zamknięcie bez zapisywania
//   summaryData – {
//     totalSec     : number,   // czas treningu w sekundach
//     totalTonnage : number,   // łączny tonaż (kg)
//     exercises    : array,    // pełna lista ćwiczeń z seriami
//   }
//   onSave()    – callback zapisania do historii (obsługuje WorkoutContext w rodzicu)
const WorkoutSummaryModal = ({ isVisible, onClose, summaryData, onSave }) => {
  const { totalSec = 0, totalTonnage = 0, exercises = [] } = summaryData ?? {};

  const cars     = Math.floor(totalTonnage / KG_PER_CAR);
  const prs      = detectPRs(exercises);
  const doneSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={styles.handle} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>TRENING UKOŃCZONY</Text>
            <Text style={styles.heroTitle}>Brawo! 💪</Text>
          </View>

          {/* ── Siatka statystyk ── */}
          <View style={styles.grid}>
            {/* Czas */}
            <View style={styles.card}>
              <Ionicons name="time-outline" size={22} color="#00E676" style={{ marginBottom: 8 }} />
              <Text style={styles.cLabel}>Czas</Text>
              <Text style={styles.cValue}>{fmtDur(totalSec)}</Text>
            </View>

            {/* Serie */}
            <View style={styles.card}>
              <Ionicons name="layers-outline" size={22} color="#378ADD" style={{ marginBottom: 8 }} />
              <Text style={styles.cLabel}>Serie</Text>
              <Text style={styles.cValue}>{doneSets}</Text>
            </View>

            {/* Tonaż – szeroka karta z metaforą samochodową */}
            <View style={[styles.card, styles.cardWide]}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cLabel}>Tonaż całkowity</Text>
                  <Text style={[styles.cValue, { fontSize: 28 }]}>
                    {totalTonnage.toLocaleString('pl-PL')} kg
                  </Text>
                  {cars > 0 && (
                    <Text style={styles.cSub}>
                      Równowartość {cars} {cars === 1 ? 'samochodu' : 'samochodów'}!
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  {Array.from({ length: Math.min(cars, 3) }).map((_, i) => (
                    <Ionicons key={i} name="car-sport-outline" size={24} color="#EF9F27" />
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Placeholder heatmapy mięśni ── */}
          <View style={styles.heatmap}>
            <Ionicons name="body-outline" size={40} color="#3A3A3C" />
            <Text style={styles.heatmapTitle}>Heatmapa mięśni</Text>
            <Text style={styles.heatmapSub}>Tu pojawi się mapa przetrenowanych partii</Text>
          </View>

          {/* ── Nowe rekordy ── */}
          {prs.length > 0 && (
            <>
              <Text style={styles.stitle}>Nowe rekordy 🏆</Text>
              {prs.map((pr, i) => (
                <View key={i} style={styles.prCard}>
                  <View style={styles.prTrophy}>
                    <Ionicons name="trophy" size={17} color="#FAC775" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prName}>{pr.name}</Text>
                    <Text style={styles.prVal}>{pr.kg} kg x {pr.reps} powt.</Text>
                  </View>
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>Nowy PR!</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {prs.length === 0 && (
            <View style={styles.noPr}>
              <Text style={styles.noPrText}>Brak nowych rekordów – konsekwencja to klucz. 💪</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Przycisk zapisu ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Zapisz do historii</Text>
            <Text style={styles.saveBtnSub}>Trening trafi do Twojego profilu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#0A0A0A' },
  handle:       { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  scroll:       { paddingBottom: 20 },
  hero:         { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  heroLabel:    { fontSize: 12, fontWeight: '700', color: '#00E676', letterSpacing: 2, marginBottom: 6 },
  heroTitle:    { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  card:         { flex: 1, minWidth: '45%', backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, borderWidth: 0.5, borderColor: '#2C2C2E' },
  cardWide:     { flexBasis: '100%', flex: 0 },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cLabel:       { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  cValue:       { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  cSub:         { fontSize: 12, color: '#636366', marginTop: 6, lineHeight: 17 },
  heatmap:      { marginHorizontal: 16, marginBottom: 20, borderRadius: 18, height: 140, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2C2C2E', borderStyle: 'dashed' },
  heatmapTitle: { fontSize: 14, fontWeight: '500', color: '#3A3A3C' },
  heatmapSub:   { fontSize: 12, color: '#3A3A3C', textAlign: 'center', paddingHorizontal: 24 },
  stitle:       { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12 },
  prCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, gap: 12, borderWidth: 0.5, borderColor: '#2C2C2E' },
  prTrophy:     { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,179,71,0.15)', justifyContent: 'center', alignItems: 'center' },
  prName:       { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  prVal:        { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  prBadge:      { backgroundColor: 'rgba(255,179,71,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  prBadgeText:  { fontSize: 11, fontWeight: '700', color: '#FAC775' },
  noPr:         { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#2C2C2E' },
  noPrText:     { fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 20 },
  footer:       { padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderColor: '#2C2C2E' },
  saveBtn:      { backgroundColor: '#00E676', borderRadius: 18, padding: 18, alignItems: 'center' },
  saveBtnText:  { fontSize: 17, fontWeight: '700', color: '#000000' },
  saveBtnSub:   { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 4 },
});

export default WorkoutSummaryModal;