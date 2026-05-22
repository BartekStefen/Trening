import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useWorkoutContext } from '../../context/WorkoutContext';

const MUSCLE_REGION_MAP = {
  'klatka': 'Klatka',    'piersiow': 'Klatka',
  'najszerszy': 'Plecy', 'plec': 'Plecy',
  'czworoglow': 'Nogi',  'poslad': 'Nogi', 'dwuglow': 'Nogi',
  'biceps': 'Biceps',    'ramienno': 'Biceps',
  'triceps': 'Triceps',
  'bark': 'Barki',       'naramienny': 'Barki',
  'brzuch': 'Brzuch',
};

const mapMuscle = (str) => {
  const n = (str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, label] of Object.entries(MUSCLE_REGION_MAP)) {
    if (n.includes(key)) return label;
  }
  return null;
};

const MUSCLE_COLORS = {
  'Klatka':   '#E53935',
  'Plecy':    '#1565C0',
  'Nogi':     '#2E7D32',
  'Biceps':   '#F9A825',
  'Triceps':  '#6A1B9A',
  'Barki':    '#0277BD',
  'Brzuch':   '#37474F',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
};

// Ostatnie N sesji — pasek tonażu per sesja
const SessionBars = ({ sessions }) => {
  if (!sessions.length) return null;
  const max = Math.max(...sessions.map((s) => s.tonnage), 1);

  return (
    <View style={s.barsSection}>
      <Text style={s.sectionTitle}>Tonaż na sesję</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barsRow}>
        {sessions.map((session, i) => {
          const pct = session.tonnage / max;
          return (
            <View key={i} style={s.barCol}>
              <Text style={s.barKg}>
                {session.tonnage >= 1000
                  ? `${(session.tonnage / 1000).toFixed(1)}t`
                  : `${session.tonnage}kg`}
              </Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { height: `${Math.max(pct * 100, 4)}%` }]} />
              </View>
              <Text style={s.barDate}>{fmtDate(session.date)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Torta partii — poziome paski sumy tonażu per partia
const MuscleBreakdown = ({ muscleMap }) => {
  const entries = Object.entries(muscleMap).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const max = entries[0][1];

  return (
    <View style={s.muscleSection}>
      <Text style={s.sectionTitle}>Objętość per partia (łącznie)</Text>
      {entries.map(([muscle, kg]) => {
        const color = MUSCLE_COLORS[muscle] ?? '#636366';
        const pct   = kg / max;
        return (
          <View key={muscle} style={s.muscleRow}>
            <View style={[s.muscleDot, { backgroundColor: color }]} />
            <Text style={s.muscleLabel}>{muscle}</Text>
            <View style={s.muscleTrack}>
              <View style={[s.muscleFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
            </View>
            <Text style={s.muscleKg}>
              {kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const VolumeChart = () => {
  const { workoutHistory } = useWorkoutContext();

  const { sessions, muscleMap, totalTonnage, totalSessions } = useMemo(() => {
    if (!workoutHistory?.length) return { sessions: [], muscleMap: {}, totalTonnage: 0, totalSessions: 0 };

    const mMap = {};
    const sess = workoutHistory.slice(0, 12).map((w) => {
      const ton = w.tonnage ?? w.exercises?.reduce((a, ex) =>
        a + (ex.sets?.filter((s) => s.done).reduce((b, s) =>
          b + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0) ?? 0), 0) ?? 0;

      w.exercises?.forEach((ex) => {
        const doneSets = ex.sets?.filter((s) => s.done).length ?? 0;
        if (!doneSets) return;
        const seen = new Set();
        [...(ex.muscles ?? []), ...(ex.muscleGroup?.split(/[·,]/) ?? [])].forEach((m) => {
          const mapped = mapMuscle(m);
          if (mapped && !seen.has(mapped)) {
            seen.add(mapped);
            const exTon = ex.sets?.filter((s) => s.done).reduce((a, s) =>
              a + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0) ?? 0;
            mMap[mapped] = (mMap[mapped] ?? 0) + exTon;
          }
        });
      });

      return { date: w.savedAt, tonnage: Math.round(ton) };
    }).reverse();

    const total = workoutHistory.reduce((a, w) => a + (w.tonnage ?? 0), 0);

    return { sessions: sess, muscleMap: mMap, totalTonnage: total, totalSessions: workoutHistory.length };
  }, [workoutHistory]);

  if (!workoutHistory?.length) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>Brak danych — ukończ pierwszy trening</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Podsumowanie łączne */}
      <View style={s.totalsRow}>
        <View style={s.totalCard}>
          <Text style={s.totalVal}>{totalSessions}</Text>
          <Text style={s.totalLbl}>Treningi</Text>
        </View>
        <View style={s.totalCard}>
          <Text style={s.totalVal}>
            {totalTonnage >= 1000 ? `${(totalTonnage / 1000).toFixed(1)}t` : `${Math.round(totalTonnage)}kg`}
          </Text>
          <Text style={s.totalLbl}>Łączny tonaż</Text>
        </View>
        <View style={s.totalCard}>
          <Text style={s.totalVal}>
            {totalSessions > 0 ? Math.round(totalTonnage / totalSessions).toLocaleString('pl-PL') : '—'}
          </Text>
          <Text style={s.totalLbl}>Śr. sesja (kg)</Text>
        </View>
      </View>

      <SessionBars sessions={sessions} />
      <MuscleBreakdown muscleMap={muscleMap} />
    </View>
  );
};

const s = StyleSheet.create({
  container: { paddingBottom: 8 },
  empty:     { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#3A3A3C', textAlign: 'center' },

  totalsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  totalCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  totalVal:  { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  totalLbl:  { fontSize: 10, color: '#8E8E93' },

  barsSection: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: '#636366', marginBottom: 12, letterSpacing: 0.3 },
  barsRow:     { gap: 8, alignItems: 'flex-end', paddingBottom: 4 },
  barCol:      { alignItems: 'center', gap: 4, width: 44 },
  barKg:       { fontSize: 9, color: '#636366', textAlign: 'center' },
  barTrack:    { width: 28, height: 80, backgroundColor: '#1C1C1E', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:     { width: '100%', backgroundColor: '#00E676', borderRadius: 6 },
  barDate:     { fontSize: 9, color: '#636366' },

  muscleSection: { marginHorizontal: 16, gap: 10 },
  muscleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muscleDot:     { width: 8, height: 8, borderRadius: 4 },
  muscleLabel:   { fontSize: 12, color: '#8E8E93', width: 60 },
  muscleTrack:   { flex: 1, height: 8, backgroundColor: '#1C1C1E', borderRadius: 4, overflow: 'hidden' },
  muscleFill:    { height: '100%', borderRadius: 4 },
  muscleKg:      { fontSize: 11, fontWeight: '600', color: '#FFFFFF', width: 44, textAlign: 'right' },
});

export default VolumeChart;