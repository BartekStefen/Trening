import { Alert, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { evaluateSurvivalRecommendation } from '../utils/trainingIntelligence';
import { buildReadinessOpts } from '../utils/profileAnalytics';
import { classifySessionSplit } from '../utils/trainingLoad';

const BUILTIN_TEMPLATES = [
  { id: 'upper', tag: 'Góra ciała', title: 'Upper Power',    meta: '5 ćwiczeń · klatka, barki, triceps, biceps' },
  { id: 'lower', tag: 'Dół ciała',  title: 'Lower Strength', meta: '4 ćwiczenia · nogi, pośladki, łydki' },
];

// Dane ćwiczeń dla wbudowanych szablonów — używane do edycji w PlanCreator
const BUILTIN_PLAN_EXERCISES = {
  upper: [
    { id: 'ex1',   name: 'Wyciskanie sztangi leżąc',  muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'],          description: 'Opuść kontrolowanie do klatki, wypychaj eksplozywnie.', planConfig: { setRows: [{ weight: '80', reps: '8' }, { weight: '80', reps: '8' }, { weight: '80', reps: '6' }], rest: 120, notes: '', sets: 3, setTypes: ['N','N','N'], repsMin: null, repsMax: null, weight: '' } },
    { id: 'ex2',   name: 'Wiosłowanie sztangą',        muscles: ['Najszerszy grzbietu', 'Biceps', 'Tylny bark'],          description: 'Tułów ~45°. Przyciągaj do brzucha.', planConfig: { setRows: [{ weight: '90', reps: '8' }, { weight: '90', reps: '8' }], rest: 90, notes: '', sets: 2, setTypes: ['N','N'], repsMin: null, repsMax: null, weight: '' } },
    { id: 'ex3',   name: 'Wyciskanie żołnierskie',     muscles: ['Przedni bark', 'Boczny bark', 'Triceps'],               description: 'Sztanga na obojczykach. Wypychaj pionowo.', planConfig: { setRows: [{ weight: '60', reps: '8' }, { weight: '60', reps: '8' }], rest: 90, notes: '', sets: 2, setTypes: ['N','N'], repsMin: null, repsMax: null, weight: '' } },
    { id: 'ex4',   name: 'Biceps Curl ze sztangą',     muscles: ['Biceps'],                                               description: 'Ramiona przy tułowiu. Uginaj do pełnego skurczu.', planConfig: { setRows: [{ weight: '40', reps: '10' }, { weight: '40', reps: '10' }], rest: 60, notes: '', sets: 2, setTypes: ['N','N'], repsMin: null, repsMax: null, weight: '' } },
    { id: 'ex5',   name: 'Triceps Pushdown',           muscles: ['Triceps'],                                              description: 'Łokcie przy tułowiu. Prostuj do pełnego wyprostu.', planConfig: { setRows: [{ weight: '35', reps: '12' }, { weight: '35', reps: '12' }], rest: 60, notes: '', sets: 2, setTypes: ['N','N'], repsMin: null, repsMax: null, weight: '' } },
  ],
  lower: [
    { id: 'ex_l1', name: 'Przysiad ze sztangą',        muscles: ['Czworogłowy', 'Pośladki', 'Dwugłowy uda'],             description: 'Zniżaj do co najmniej równoległości ud z podłożem.', planConfig: { setRows: [{ weight: '100', reps: '5' }, { weight: '100', reps: '5' }, { weight: '100', reps: '5' }], rest: 150, notes: '', sets: 3, setTypes: ['N','N','N'], repsMin: null, repsMax: null, weight: '' } },
    { id: 'ex_l2', name: 'Hip Thrust',                 muscles: ['Pośladki', 'Dwugłowy uda'],                            description: 'Pchnij biodra ku górze do pełnego wyprostu.', planConfig: { setRows: [{ weight: '80', reps: '10' }, { weight: '80', reps: '10' }], rest: 120, notes: '', sets: 2, setTypes: ['N','N'], repsMin: null, repsMax: null, weight: '' } },
  ],
};

const formatTime = (s) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, '0')).join(':');

const inferSplitFromParams = (params) => {
  if (params?.templateId === 'upper') return 'upper';
  if (params?.templateId === 'lower') return 'lower';

  const fromContent = classifySessionSplit({
    workoutName: params?.templateName ?? params?.workoutName,
    exercises: params?.customExercises ?? [],
  });
  if (fromContent === 'upper' || fromContent === 'lower') return fromContent;

  const name = (params?.templateName ?? params?.workoutName ?? '').toLowerCase();
  if (/upper|gora|góra/.test(name)) return 'upper';
  if (/lower|dol|dół|nogi/.test(name)) return 'lower';
  return null;
};

export default function TrainingScreen({ navigation }) {
  const {
    activeWorkout, customPlans, deleteCustomPlan, hiddenBuiltins, hideBuiltin,
    workoutHistory, survivalModeEnabled, dailyWellness,
  } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [manageMode, setManageMode] = useState(false);
  const manageModeAnim = useRef(new Animated.Value(0)).current;

  const startWorkout = (params) => {
    const split = inferSplitFromParams(params);
    const assessment = evaluateSurvivalRecommendation(
      workoutHistory,
      buildReadinessOpts(dailyWellness, split),
    );
    if (survivalModeEnabled && assessment.shouldOffer) {
      const pct = Math.round(assessment.volumeReductionPct * 100);
      Alert.alert(
        'Tryb Przetrwania',
        `${assessment.rationale}\n\nSkrócić dzisiejszy plan o ~${pct}% objętości?`,
        [
          { text: 'Normalny trening', onPress: () => navigation.navigate('ActiveWorkout', params) },
          {
            text: 'Tryb Przetrwania',
            style: 'destructive',
            onPress: () => navigation.navigate('ActiveWorkout', {
              ...params,
              survivalMode: true,
              survivalVolumePct: assessment.volumeReductionPct,
            }),
          },
        ],
      );
      return;
    }
    navigation.navigate('ActiveWorkout', params);
  };

  const toggleManageMode = () => {
    const next = !manageMode;
    setManageMode(next);
    Animated.timing(manageModeAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const visibleBuiltins = BUILTIN_TEMPLATES.filter((t) => !hiddenBuiltins.includes(t.id));

  const allTemplates = [
    ...visibleBuiltins,
    ...customPlans.map((p) => ({
      id:              p.id,
      tag:             'Mój plan',
      title:           p.name,
      meta:            `${p.exercises?.length ?? 0} ćwiczeń`,
      custom:          true,
      exercises:       p.exercises,
      supersetGroups:  p.supersetGroups ?? {},
      supersetConfigs: p.supersetConfigs ?? {},
    })),
  ];

  const confirmDelete = (item) => {
    Alert.alert(
      'Usuń plan?',
      `Czy na pewno chcesz usunąć\n„${item.title}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń', style: 'destructive',
          onPress: () => item.custom ? deleteCustomPlan(item.id) : hideBuiltin(item.id),
        },
      ],
    );
  };

  const handleEdit = (item) => {
    if (item.custom) {
      // Edycja istniejącego własnego planu
      navigation.navigate('PlanCreator', {
        editPlanId:       item.id,
        initialPlanName:  item.title,
        exercises:        item.exercises ?? [],
        initialSupersets: item.supersetGroups ?? {},
      });
    } else {
      // Edycja wbudowanego szablonu → tworzy nowy plan na jego podstawie
      navigation.navigate('PlanCreator', {
        initialPlanName: item.title,
        exercises:       BUILTIN_PLAN_EXERCISES[item.id] ?? [],
        initialSupersets: {},
      });
    }
  };

  const renderTemplate = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        item.custom && styles.cardCustom,
        manageMode && styles.cardManage,
      ]}
      activeOpacity={0.7}
      onPress={() => {
        if (manageMode) return;
        startWorkout({
          templateId:       item.id,
          templateName:     item.title,
          customExercises:  item.exercises ?? null,
          supersetGroups:   item.supersetGroups  ?? {},
          supersetConfigs:  item.supersetConfigs ?? {},
          customPlanId:     item.custom ? item.id : null,
        });
      }}
      onLongPress={!manageMode ? () => confirmDelete(item) : undefined}
      delayLongPress={600}
    >
      <View style={styles.cardContent}>
        <View style={[styles.tagWrapper, item.custom && styles.tagWrapperCustom]}>
          <Text style={[styles.tagText, item.custom && styles.tagTextCustom]}>{item.tag}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.meta}</Text>
      </View>

      {manageMode ? (
        <View style={styles.manageActions}>
          <TouchableOpacity
            style={styles.manageEditBtn}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manageDeleteBtn}
            onPress={() => confirmDelete(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.borderMuted} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={allTemplates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Dzień dobry 👋</Text>
              <Text style={styles.title}>Trening</Text>
            </View>

            {/* Nowy pusty trening */}
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.85}
              onPress={() => startWorkout({
                templateId:      null,
                templateName:    'Pusty trening',
                customExercises: [],
              })}
            >
              <View style={styles.startIconWrapper}>
                <Ionicons name="add" size={26} color={colors.accentText} />
              </View>
              <View>
                <Text style={styles.startButtonText}>Nowy pusty trening</Text>
                <Text style={styles.startButtonSubText}>Zacznij od zera i dodaj ćwiczenia</Text>
              </View>
            </TouchableOpacity>

            {/* Baza ćwiczeń i Kreator */}
            <TouchableOpacity
              style={styles.libraryButton}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('ExercisesLibrary')}
            >
              <View style={styles.libraryIconWrapper}>
                <Ionicons name="search" size={22} color={colors.library} />
              </View>
              <View style={styles.libraryTextGroup}>
                <Text style={styles.libraryTitle}>Baza ćwiczeń i Kreator Planu</Text>
                <Text style={styles.librarySub}>Przeglądaj ćwiczenia i układaj nowe rutyny</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.borderMuted} />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Twoje szablony</Text>
              <TouchableOpacity onPress={toggleManageMode} activeOpacity={0.7}>
                <Text style={[styles.sectionLink, manageMode && styles.sectionLinkActive]}>
                  {manageMode ? 'Gotowe ✓' : 'Zarządzaj'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* Floating Workout Bar */}
      {activeWorkout && (
        <TouchableOpacity
          style={styles.floatingBar}
          onPress={() => navigation.navigate('ActiveWorkout')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingLeft}>
            <View style={styles.floatingPulse} />
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingTitle} numberOfLines={1}>
                ⚡ Aktywny trening: {activeWorkout.workoutName}
              </Text>
              <Text style={styles.floatingSub}>
                {formatTime(activeWorkout.timerSec ?? 0)} · {activeWorkout.doneSets ?? 0} serii
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-up" size={20} color={colors.accentText} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:           { flex: 1, backgroundColor: c.background },
  contentContainer: { paddingBottom: 16 },
  header:   { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  greeting: { fontSize: 14, color: c.textSecondary, marginBottom: 4 },
  title:    { fontSize: 32, fontWeight: '700', color: c.textPrimary, letterSpacing: 0.3 },

  startButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.accent,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, padding: 18, gap: 16,
  },
  startIconWrapper:   { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  startButtonText:    { fontSize: 16, fontWeight: '600', color: c.accentText },
  startButtonSubText: { fontSize: 12, color: c.accentText, opacity: 0.55, marginTop: 3 },

  libraryButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.backgroundSecondary,
    marginHorizontal: 16, marginBottom: 24,
    borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 0.5, borderColor: c.librarySoft,
  },
  libraryIconWrapper: { width: 44, height: 44, borderRadius: 13, backgroundColor: c.librarySoft, justifyContent: 'center', alignItems: 'center' },
  libraryTextGroup:   { flex: 1 },
  libraryTitle:       { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  librarySub:         { fontSize: 12, color: c.textSecondary, marginTop: 3 },

  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:     { fontSize: 20, fontWeight: '600', color: c.textPrimary },
  sectionLink:      { fontSize: 14, color: c.accent },
  sectionLinkActive:{ fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.backgroundSecondary,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 18,
    borderWidth: 0.5, borderColor: c.border,
  },
  cardCustom:       { borderColor: c.librarySoft },
  cardManage:       { borderColor: c.accent, borderWidth: 1 },
  cardContent:      { flex: 1 },
  manageActions:    { flexDirection: 'row', gap: 6, alignItems: 'center' },
  manageEditBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center' },
  manageDeleteBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: c.dangerSoft, justifyContent: 'center', alignItems: 'center' },
  tagWrapper:       { alignSelf: 'flex-start', backgroundColor: c.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  tagWrapperCustom: { backgroundColor: c.librarySoft },
  tagText:          { fontSize: 11, fontWeight: '500', color: c.accent },
  tagTextCustom:    { color: c.library },
  cardTitle:        { fontSize: 17, fontWeight: '600', color: c.textPrimary, marginBottom: 5 },
  cardMeta:         { fontSize: 13, color: c.textSecondary },

  floatingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.accent,
    marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: c.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  floatingLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  floatingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)' },
  floatingTitle: { fontSize: 14, fontWeight: '700', color: c.accentText },
  floatingSub:   { fontSize: 11, color: c.accentText, opacity: 0.55, marginTop: 2 },
});
