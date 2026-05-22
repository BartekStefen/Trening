
import { useCallback, useState } from 'react';
import {
  FlatList, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import LiveMuscleMap from '../components/LiveMuscleMap';
import useMuscleHeatmap from '../hooks/useMuscleHeatmap';

const fmtDur = (s) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
};

const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
};

const WorkoutDetailModal = ({ workout, onClose }) => {
  const { colors } = useTheme();
  const d = makeDetailStyles(colors);
  // Hook musi być przed early return (Rules of Hooks)
  const heatmap  = useMuscleHeatmap(workout?.exercises ?? []);

  if (!workout) return null;
  const doneSets = workout.exercises?.reduce(
    (a, ex) => a + (ex.sets?.filter((s) => s.done).length ?? 0), 0,
  ) ?? 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={d.screen}>
        <View style={d.handle} />
        <TouchableOpacity style={d.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={d.scroll} showsVerticalScrollIndicator={false}>
          <Text style={d.title} numberOfLines={2}>{workout.workoutName ?? 'Trening'}</Text>
          <Text style={d.date}>{fmtDate(workout.savedAt)} · {fmtTime(workout.savedAt)}</Text>

          <View style={d.statsRow}>
            <View style={d.stat}>
              <Text style={d.statVal}>{fmtDur(workout.timerSec)}</Text>
              <Text style={d.statLbl}>Czas</Text>
            </View>
            <View style={d.statSep} />
            <View style={d.stat}>
              <Text style={d.statVal}>{doneSets}</Text>
              <Text style={d.statLbl}>Serie</Text>
            </View>
            <View style={d.statSep} />
            <View style={d.stat}>
              <Text style={d.statVal}>
                {(workout.tonnage ?? 0).toLocaleString('pl-PL')} kg
              </Text>
              <Text style={d.statLbl}>Tonaż</Text>
            </View>
          </View>

          {Object.keys(heatmap).length > 0 && (
            <View style={d.mapCard}>
              <LiveMuscleMap heatmap={heatmap} />
            </View>
          )}

          <Text style={d.sectionTitle}>Ćwiczenia</Text>
          {workout.exercises?.map((ex, i) => {
            const done = ex.sets?.filter((s) => s.done) ?? [];
            return (
              <View key={ex.id ?? i} style={d.exCard}>
                <Text style={d.exName}>{ex.name}</Text>
                <Text style={d.exMuscles}>{ex.muscleGroup}</Text>
                <View style={d.pillsRow}>
                  {done.map((set, si) => (
                    <View key={set.id ?? si} style={d.pill}>
                      <Text style={d.pillText}>{set.kg} kg × {set.reps}</Text>
                    </View>
                  ))}
                  {done.length === 0 && <Text style={d.noSets}>Brak serii</Text>}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const WorkoutHistoryScreen = ({ navigation }) => {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(null);

  const s = makeListStyles(colors);

  const renderItem = useCallback(({ item }) => {
    const doneSets = item.exercises?.reduce(
      (a, ex) => a + (ex.sets?.filter((s) => s.done).length ?? 0), 0,
    ) ?? 0;
    const exCount = item.exercises?.length ?? 0;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => setSelected(item)}
        activeOpacity={0.7}
      >
        <View style={s.cardLeft}>
          <View style={s.dateBadge}>
            <Text style={s.dateDay}>
              {item.savedAt ? new Date(item.savedAt).getDate() : '—'}
            </Text>
            <Text style={s.dateMon}>
              {item.savedAt
                ? new Date(item.savedAt).toLocaleDateString('pl-PL', { month: 'short' })
                : ''}
            </Text>
          </View>
        </View>

        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.workoutName ?? 'Trening'}
          </Text>
          <Text style={s.cardMeta}>
            {fmtDur(item.timerSec)} · {exCount} ćw. · {doneSets} serii
          </Text>
          {(item.tonnage ?? 0) > 0 && (
            <Text style={s.cardTonnage}>
              {(item.tonnage ?? 0).toLocaleString('pl-PL')} kg tonażu
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
      </TouchableOpacity>
    );
  }, [s, colors]);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Historia treningów</Text>
      </View>

      {workoutHistory.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="barbell-outline" size={48} color={colors.borderMuted} />
          <Text style={s.emptyTitle}>Brak historii</Text>
          <Text style={s.emptySub}>
            Ukończ pierwszy trening, a pojawi się tutaj z pełnymi statystykami.
          </Text>
        </View>
      ) : (
        <FlatList
          data={workoutHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selected && (
        <WorkoutDetailModal workout={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
};

const makeListStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 58, paddingHorizontal: 16, paddingBottom: 16, gap: 10,
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  title:   { fontSize: 22, fontWeight: '700', color: c.textPrimary },
  list:    { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.backgroundSecondary,
    borderRadius: 18, padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: c.border, gap: 12,
  },
  cardLeft:  { alignItems: 'center' },
  dateBadge: { width: 44, height: 50, backgroundColor: c.card, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: c.border },
  dateDay:   { fontSize: 18, fontWeight: '700', color: c.textPrimary, lineHeight: 22 },
  dateMon:   { fontSize: 10, color: c.textSecondary, textTransform: 'uppercase' },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 3 },
  cardMeta:  { fontSize: 12, color: c.textSecondary },
  cardTonnage:{ fontSize: 12, color: c.accent, marginTop: 2, fontWeight: '500' },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: c.textTertiary },
  emptySub:   { fontSize: 14, color: c.borderMuted, textAlign: 'center', lineHeight: 20 },
});

const makeDetailStyles = (c) => StyleSheet.create({
  screen:   { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:   { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  scroll:   { padding: 20, paddingBottom: 40 },
  title:    { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: 4, paddingRight: 40 },
  date:     { fontSize: 13, color: c.textTertiary, marginBottom: 20 },

  statsRow: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 0.5, borderColor: c.border },
  stat:     { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 3 },
  statLbl:  { fontSize: 11, color: c.textSecondary },
  statSep:  { width: 0.5, backgroundColor: c.border },

  mapCard:  { backgroundColor: c.card, borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 0.5, borderColor: c.border },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
  exCard:    { backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: c.border },
  exName:    { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
  exMuscles: { fontSize: 11, color: c.textTertiary, marginBottom: 10 },
  pillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:      { backgroundColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:  { fontSize: 12, color: c.textPrimary, fontWeight: '500' },
  noSets:    { fontSize: 12, color: c.borderMuted },
});

export default WorkoutHistoryScreen;
