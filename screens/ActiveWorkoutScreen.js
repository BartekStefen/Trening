import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from 'react';
import {
  Alert, Animated, AppState, Image, InteractionManager, Keyboard, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { EXERCISE_DATABASE, EXERCISE_MAP } from './ExercisesLibraryScreen';
import RestTimerBanner         from '../components/workout/RestTimerBanner';
import WorkoutTimerHUD         from '../components/workout/WorkoutTimerHUD';
import MuscleDistributionModal from '../components/modals/MuscleDistributionModal';
import SwipeableSetRow         from '../components/workout/SwipeableSetRow';
import RepsModeSheet             from '../components/workout/RepsModeSheet';
import RestPickerModal         from '../components/modals/RestPickerModal';
import SwapExerciseModal       from '../components/modals/SwapExerciseModal';
import WorkoutSummaryModal     from '../components/modals/WorkoutSummaryModal';
import WeightInputModal        from '../components/workout/WeightInputModal';
import PlateCalculatorModal    from '../components/workout/PlateCalculatorModal';
import ExerciseHistoryModal    from '../components/workout/ExerciseHistoryModal';
import AddCustomExerciseModal  from '../components/workout/AddCustomExerciseModal';
import ExerciseActionsModal    from '../components/modals/ExerciseActionsModal';
import MachineSettingsModal   from '../components/workout/MachineSettingsModal';
import PRCelebration          from '../components/workout/PRCelebration';
import LoadModeModal, { LOAD_MODES } from '../components/workout/LoadModeModal';
import useMuscleHeatmap       from '../hooks/useMuscleHeatmap';
import useBodyWeight          from '../hooks/useBodyWeight';
import LiveMuscleMap          from '../components/LiveMuscleMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  setupWorkoutNotifications,
  scheduleRestEndNotification,
  cancelRestEndNotification,
  showWorkoutLockScreenNotification,
  dismissWorkoutLockScreenNotification,
  cancelAllWorkoutNotifications,
} from '../components/workout/WorkoutNotificationService';
import { parseRepsString, repsForVolume } from '../utils/repsUtils';

const GYM_KEYWORDS = [
  'kg','kilo','powt','rep','rpe','rir','zapas','seri','max','maksa','pr','rekord',
  'wycisk','sztang','hantl','law','maszyn','wyciag','suwnic','gryf','talerz',
  'ciezar','obciazeni','gum','siad','ciag','martwy','pomp','podciag',
  'brzuch','klat','plec','biceps','triceps','nog','lekko','ciezko','git',
  'okej','ok','izi','izzi','luz','luzno','upadek','smierc','masakra',
  'gladko','opor','zajechany','zrobion','poszlo','wzia','dorzuc','odejmij',
  'zaloz','okolo','czuj','nastepn',
];

const fmtDur = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sc}s`;
  return `${sc}s`;
};

// ZADANIE 3: HUD z flexbox justify="space-evenly" – równomierny rozkład + wyśrodkowana ikonka
const WorkoutHUD = memo(({ exercises, heatmap, onMuscleMapPress, timerRef, initialSec }) => {
  const { colors } = useTheme();
  const { useRIR }  = useWorkoutContext();
  const hudStyles = makeHudStyles(colors);
  const tonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * repsForVolume(set.reps) : s, 0
      ), 0), [exercises]);

  const avgRpe = useMemo(() => {
    const vals = exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.done && s.rpe && !isNaN(parseFloat(s.rpe)))
        .map((s) => parseFloat(s.rpe)));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [exercises]);

  const rpeHigh = avgRpe !== null && parseFloat(avgRpe) > 8.0;

  const intensityLabel = useMemo(() => {
    if (avgRpe === null) return '—';
    if (useRIR) {
      const avgRir = Math.max(0, Math.round(10 - parseFloat(avgRpe)));
      return `RIR ${avgRir}`;
    }
    return `RPE ${avgRpe}`;
  }, [avgRpe, useRIR]);

  return (
    <View style={hudStyles.wrapper}>
      <View style={hudStyles.row}>
        <View style={hudStyles.cell}>
          <Text style={hudStyles.lbl}>Czas</Text>
          <WorkoutTimerHUD ref={timerRef} initialSec={initialSec} />
        </View>

        <View style={hudStyles.sep} />

        <View style={hudStyles.cell}>
          <Text style={hudStyles.lbl}>Tonaż</Text>
          <Text style={hudStyles.valWhite}>{tonnage > 0 ? `${tonnage} kg` : '—'}</Text>
        </View>

        <View style={hudStyles.sep} />

        <View style={hudStyles.cell}>
          <Ionicons name="flame" size={10} color={rpeHigh ? '#FF5252' : '#EF9F27'} />
          <Text style={[hudStyles.valWhite, rpeHigh && { color: '#FF5252' }]}>
            {intensityLabel}
          </Text>
        </View>

        <View style={hudStyles.sep} />

        <View style={hudStyles.cell}>
          <Ionicons name="water" size={10} color={colors.water} />
          <Text style={[hudStyles.valWhite, { color: colors.water }]}>250 ml</Text>
        </View>

        <View style={hudStyles.sep} />

        <TouchableOpacity
          style={hudStyles.muscleCell}
          onPress={onMuscleMapPress}
          activeOpacity={0.75}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <LiveMuscleMap heatmap={heatmap} scale={0.13} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const makeHudStyles = (c) => StyleSheet.create({
  wrapper: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: c.backgroundSecondary,
    borderRadius: 14, borderWidth: 0.5, borderColor: c.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
  cell:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  muscleCell: { flex: 1.4, alignItems: 'center', justifyContent: 'center' },
  lbl:        { fontSize: 9, color: c.textSecondary, letterSpacing: 0.3 },
  valWhite:   { fontSize: 13, fontWeight: '700', color: c.textPrimary, fontVariant: ['tabular-nums'] },
  sep:        { width: 0.5, height: 28, backgroundColor: c.border },
});

const UPPER_EXERCISES = () => [
  {
    id: 'ex1', name: 'Wyciskanie sztangi leżąc', muscleGroup: 'Klatka · Triceps · Barki',
    description: 'Opuść kontrolowanie do klatki, wypychaj eksplozywnie. Łopatki ściągnięte.',
    muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'],
    alternatives: ['c3', 'c5'], restDuration: 120, nextTrainingKg: null,
    lastPerformedDate: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WS',
    sets: [
      { id: 's1', prevLog: '80 kg x 8', kg: '80', reps: '8', rpe: '8', done: false, suggested: null, aiSuggested: false },
      { id: 's2', prevLog: '80 kg x 8', kg: '',   reps: '',  rpe: '',  done: false, suggested: null, aiSuggested: false },
      { id: 's3', prevLog: '80 kg x 6', kg: '',   reps: '',  rpe: '',  done: false, suggested: null, aiSuggested: false },
    ],
  },
  {
    id: 'ex2', name: 'Wiosłowanie sztangą', muscleGroup: 'Plecy · Biceps',
    description: 'Tułów ~45°. Przyciągaj do brzucha, łokcie blisko ciała.',
    muscles: ['Najszerszy grzbietu', 'Biceps', 'Tylny bark'],
    alternatives: ['b4', 'b5'], restDuration: 90, nextTrainingKg: null,
    lastPerformedDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WS',
    sets: [
      { id: 's4', prevLog: '90 kg x 8', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
      { id: 's5', prevLog: '90 kg x 8', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    ],
  },
  {
    id: 'ex3', name: 'Wyciskanie żołnierskie', muscleGroup: 'Barki · Triceps',
    description: 'Sztanga na obojczykach. Wypychaj pionowo.',
    muscles: ['Przedni bark', 'Boczny bark', 'Triceps'],
    alternatives: ['s2'], restDuration: 90, nextTrainingKg: null,
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WZ',
    sets: [
      { id: 's6', prevLog: '60 kg x 8', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
      { id: 's7', prevLog: '60 kg x 8', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    ],
  },
  {
    id: 'ex4', name: 'Biceps Curl ze sztangą', muscleGroup: 'Biceps',
    description: 'Ramiona przy tułowiu. Uginaj do pełnego skurczu.',
    muscles: ['Biceps'], alternatives: ['a2', 'a3'], restDuration: 60, nextTrainingKg: null,
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=BC',
    sets: [
      { id: 's8', prevLog: '40 kg x 10', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
      { id: 's9', prevLog: '40 kg x 10', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    ],
  },
  {
    id: 'ex5', name: 'Triceps Pushdown', muscleGroup: 'Triceps',
    description: 'Łokcie przy tułowiu. Prostuj do pełnego wyprostu.',
    muscles: ['Triceps'], alternatives: ['t2'], restDuration: 60, nextTrainingKg: null,
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=TP',
    sets: [
      { id: 's10', prevLog: '35 kg x 12', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
      { id: 's11', prevLog: '35 kg x 12', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    ],
  },
];

const LOWER_EXERCISES = () => [
  {
    id: 'ex_l1', name: 'Przysiad ze sztangą', muscleGroup: 'Czworogłowy · Pośladki',
    description: 'Zniżaj do co najmniej równoległości ud z podłożem.',
    muscles: ['Czworogłowy', 'Pośladki', 'Dwugłowy uda'],
    alternatives: ['l2'], restDuration: 150, nextTrainingKg: null,
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=PS',
    sets: [
      { id: 'sl1', prevLog: '100 kg x 5', kg: '100', reps: '5', rpe: '8', done: false, suggested: null, aiSuggested: false },
      { id: 'sl2', prevLog: '100 kg x 5', kg: '',    reps: '',  rpe: '',  done: false, suggested: null, aiSuggested: false },
      { id: 'sl3', prevLog: '100 kg x 5', kg: '',    reps: '',  rpe: '',  done: false, suggested: null, aiSuggested: false },
    ],
  },
  {
    id: 'ex_l2', name: 'Hip Thrust', muscleGroup: 'Pośladki · Dwugłowy',
    description: 'Pchnij biodra ku górze do pełnego wyprostu.',
    muscles: ['Pośladki', 'Dwugłowy uda'],
    alternatives: [], restDuration: 120, nextTrainingKg: null,
    image: 'https://via.placeholder.com/40/2C2C2E/636366?text=HT',
    sets: [
      { id: 'sl4', prevLog: '80 kg x 10', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
      { id: 'sl5', prevLog: '80 kg x 10', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    ],
  },
];

// ─── Mapa zamienników domowych (exercise id → zamiennik) ─────────────────────
const HOME_ALTERNATIVES = {
  ex1: { name: 'Pompki z gumą oporową', muscleGroup: 'Klatka · Triceps · Barki', muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'], equipment: 'Gumy oporowe', description: 'Guma przez plecy, chwyt szeroki. Pompki z oporem gumy w fazie koncentrycznej.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=PP', alternatives: [], restDuration: 90 },
  ex2: { name: 'Wiosłowanie hantlem', muscleGroup: 'Plecy · Biceps', muscles: ['Najszerszy grzbietu', 'Romboid', 'Biceps'], equipment: 'Hantle', description: 'Oprzyj kolano na sofie. Przyciągaj hantel do biodra, łokieć ku górze.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WH', alternatives: [], restDuration: 90 },
  ex3: { name: 'Wyciskanie hantlami stojąc', muscleGroup: 'Barki · Triceps', muscles: ['Przedni bark', 'Boczny bark', 'Triceps'], equipment: 'Hantle', description: 'Stojąc, wyciskaj hantle synchronicznie nad głowę. Napnij core przez cały ruch.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WH', alternatives: [], restDuration: 90 },
  ex4: { name: 'Biceps Curl z hantlami', muscleGroup: 'Biceps', muscles: ['Biceps'], equipment: 'Hantle', description: 'Stojąc, uginaj naprzemiennie lub oburęcznie. Ramiona przy tułowiu.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=BC', alternatives: [], restDuration: 60 },
  ex5: { name: 'Dipy na blacie / krześle', muscleGroup: 'Triceps', muscles: ['Triceps'], equipment: 'Krzesło', description: 'Oprzyj dłonie na twardej krawędzi. Opuszczaj i prostuj ramiona pełnym zakresem.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=DK', alternatives: [], restDuration: 60 },
  ex_l1: { name: 'Goblet Squat z hantlem', muscleGroup: 'Czworogłowy · Pośladki', muscles: ['Czworogłowy', 'Pośladki'], equipment: 'Hantle', description: 'Hantel oburącz przy klatce. Głęboki przysiad, kolana nad palcami stóp.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=GS', alternatives: [], restDuration: 120 },
  ex_l2: { name: 'Hip Thrust z hantlem na podłodze', muscleGroup: 'Pośladki · Dwugłowy', muscles: ['Pośladki', 'Dwugłowy uda'], equipment: 'Hantle', description: 'Plecy na sofie, hantel na biodrach. Pchnij biodra ku górze do pełnego wyprostu.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=HH', alternatives: [], restDuration: 90 },
  c1: { name: 'Pompki z gumą oporową', muscleGroup: 'Klatka · Triceps · Barki', muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'], equipment: 'Gumy oporowe', description: 'Guma przez plecy. Chwyt szeroki, pompki z dodatkowym oporem.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=PP', alternatives: [], restDuration: 90 },
  c2: { name: 'Pompki na skosie (nogi wyżej)', muscleGroup: 'Górna klatka · Triceps', muscles: ['Górna klatka', 'Triceps'], equipment: 'Krzesło', description: 'Nogi na krześle, dłonie na podłodze. Układ aktywuje górną część klatki.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=PS', alternatives: [], restDuration: 90 },
  b1: { name: 'Wiosłowanie hantlem', muscleGroup: 'Plecy · Biceps', muscles: ['Najszerszy grzbietu', 'Romboid', 'Biceps'], equipment: 'Hantle', description: 'Praca jednostronna eliminuje kompensacje. Oprzyj kolano i rękę na ławce lub sofie.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WH', alternatives: [], restDuration: 90 },
  b2: { name: 'Romanian Deadlift z hantlami', muscleGroup: 'Pośladki · Plecy · Dwugłowy', muscles: ['Pośladki', 'Dwugłowy uda', 'Prostowniki pleców'], equipment: 'Hantle', description: 'Hantle przed sobą. Schylaj z płaskim plecami, czujesz rozciągnięcie bicepsów uda.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=RD', alternatives: [], restDuration: 120 },
  l1: { name: 'Goblet Squat z hantlem', muscleGroup: 'Czworogłowy · Pośladki', muscles: ['Czworogłowy', 'Pośladki'], equipment: 'Hantle', description: 'Hantel oburącz przy klatce. Głęboki przysiad z pełną kontrolą.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=GS', alternatives: [], restDuration: 120 },
  l4: { name: 'Hip Thrust z hantlem', muscleGroup: 'Pośladki · Dwugłowy', muscles: ['Pośladki', 'Dwugłowy uda'], equipment: 'Hantle', description: 'Plecy na sofie, hantel na biodrach. Mocny izometryczny skurcz pośladków w górze.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=HH', alternatives: [], restDuration: 90 },
  s1: { name: 'Wyciskanie hantlami stojąc', muscleGroup: 'Barki · Triceps', muscles: ['Przedni bark', 'Boczny bark', 'Triceps'], equipment: 'Hantle', description: 'Stojąc, wyciskaj synchronicznie. Pełny wyprost nad głową.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=WH', alternatives: [], restDuration: 90 },
  t1: { name: 'Dipy na blacie', muscleGroup: 'Triceps', muscles: ['Triceps'], equipment: 'Krzesło / blat', description: 'Oprzyj dłonie na twardej powierzchni za plecami. Zginaj i prostuj łokcie.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=DK', alternatives: [], restDuration: 60 },
  t2: { name: 'Skull Crusher z hantlami', muscleGroup: 'Triceps', muscles: ['Triceps (wszystkie głowy)'], equipment: 'Hantle', description: 'Leżąc, trzymaj hantle. Uginaj wyłącznie w łokciach, opuszczaj za głowę.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=SC', alternatives: [], restDuration: 60 },
  a1: { name: 'Biceps Curl z hantlami', muscleGroup: 'Biceps', muscles: ['Biceps'], equipment: 'Hantle', description: 'Oburęcznie lub naprzemiennie. Ramiona przy tułowiu przez cały ruch.', image: 'https://via.placeholder.com/40/2C2C2E/636366?text=BC', alternatives: [], restDuration: 60 },
};

const getHomeAlternative = (ex) => {
  if (HOME_ALTERNATIVES[ex.id]) return HOME_ALTERNATIVES[ex.id];
  // custom_c1_0 → extract 'c1'
  const m = ex.id.match(/^custom_(.+)_\d+$/);
  if (m && HOME_ALTERNATIVES[m[1]]) return HOME_ALTERNATIVES[m[1]];
  return null;
};

const applyHomeSwap = (ex) => {
  const alt = getHomeAlternative(ex);
  if (!alt) return ex;
  return {
    ...ex,
    ...alt,
    id: ex.id,
    isHomeReplacement: true,
    originalName: ex.name,
    sets: ex.sets.map((s) => ({ ...s, done: false })),
  };
};

const convertLibraryExercise = (ex, index) => {
  const cfg  = ex.planConfig;
  const base = {
    id:             `custom_${ex.id}_${index}`,
    name:            ex.name,
    muscleGroup:    (ex.muscles ?? []).join(' · '),
    description:     ex.description ?? '',
    muscles:         ex.muscles ?? [],
    alternatives:    ex.alternatives ?? [],
    image:           ex.image ?? null,
    exerciseType:    ex.exerciseType ?? null,
    restDuration:    cfg?.rest ?? 90,
    nextTrainingKg:  null,
    sourcePlanExId:  ex.id,
    planConfig:      cfg ?? null,
  };

  // Nowy format z indywidualnymi seriami (setRows)
  if (cfg?.setRows?.length) {
    const isRange = cfg.repsMode === 'range';
    return {
      ...base,
      sets: cfg.setRows.map((row, i) => {
        const rowReps = row.reps ?? '';
        const suggested = isRange && rowReps
          ? `${rowReps.replace('-', '–')} pow.`
          : null;
        return {
          id:          `cs_${ex.id}_${i + 1}_${Date.now() + i}`,
          prevLog:     '—',
          kg:          row.weight ?? '',
          reps:        rowReps,
          rpe:         '',
          done:        false,
          suggested,
          aiSuggested: false,
          setType:     'N',
        };
      }),
    };
  }

  // Stary format (kompatybilność wsteczna)
  const setCount  = cfg?.sets ?? 3;
  const setTypes  = cfg?.setTypes ?? [];
  const prefillKg = cfg?.weight ?? '';
  const hasLegacyRange = cfg?.repsMin && cfg?.repsMax;
  const prefillReps = hasLegacyRange
    ? `${cfg.repsMin}-${cfg.repsMax}`
    : (cfg?.repsMin ? String(cfg.repsMin) : '');
  const suggested   = hasLegacyRange ? `${cfg.repsMin}–${cfg.repsMax} pow.` : null;
  const legacyRepsMode = hasLegacyRange ? 'range' : (cfg?.repsMode ?? 'single');

  return {
    ...base,
    planConfig: { ...cfg, repsMode: legacyRepsMode },
    sets: Array.from({ length: setCount }, (_, i) => ({
      id:          `cs_${ex.id}_${i + 1}_${Date.now() + i}`,
      prevLog:     '—',
      kg:          prefillKg,
      reps:        prefillReps,
      rpe:         '',
      done:        false,
      suggested,
      aiSuggested: false,
      setType:     setTypes[i] ?? 'N',
    })),
  };
};

// ─── Epley 1RM: waga × (1 + powt/30) ────────────────────────────────────────
const calcEpley1RM = (kg, reps) => {
  const w = parseFloat(kg);
  const r = repsForVolume(reps);
  if (!w || !r || r <= 0) return null;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 2) / 2;
};

// ─── Krzywa Zaniku 1RM: -5% na każde 4 tygodnie przerwy (max -30%) ───────────
const applyDecayCurve = (oneRM, lastPerformedDate) => {
  if (!oneRM || !lastPerformedDate) return { decayed: oneRM, weeksOff: 0, decayPct: 0 };
  const msOff    = Date.now() - new Date(lastPerformedDate).getTime();
  const weeksOff = msOff / (7 * 24 * 3600 * 1000);
  if (weeksOff < 4) return { decayed: oneRM, weeksOff: Math.floor(weeksOff), decayPct: 0 };
  const periods  = Math.floor(weeksOff / 4);
  const decayPct = Math.min(periods * 5, 30);
  const decayed  = Math.round(oneRM * (1 - decayPct / 100) * 2) / 2;
  return { decayed, weeksOff: Math.floor(weeksOff), decayPct };
};

const calculateAPRE = (sets, prevLog) => {
  const lastDone = [...sets].reverse().find((s) => s.done && s.kg);
  const rawFirst = (prevLog ?? '').split(' ')[0] ?? '0';
  const baseKg   = lastDone ? parseFloat(lastDone.kg) : parseFloat(rawFirst);
  const baseReps = lastDone?.reps || (prevLog ?? '').split('x')[1]?.trim().split(' ')[0] || '8';
  if (isNaN(baseKg) || baseKg === 0) return { suggestedKg: null, label: '—' };
  const rpe     = lastDone ? parseFloat(lastDone.rpe) : NaN;
  const rir     = isNaN(rpe) ? NaN : 10 - rpe;
  const delta   = isNaN(rir) ? 2.5 : rir >= 3 ? 5 : rir >= 1 ? 2.5 : -(baseKg * 0.05);
  const rounded = Math.round(Math.max(0, baseKg + delta) * 2) / 2;
  return { suggestedKg: rounded, label: `${rounded} kg x ${baseReps}` };
};

// ─── Pływający Widget 1RM ─────────────────────────────────────────────────────
const OneRMWidget = memo(function OneRMWidget({ sets, lastPerformedDate, colors }) {
  const [expanded, setExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const bestSet = useMemo(() => {
    const done = sets.filter((s) => s.done && parseFloat(s.kg) > 0 && repsForVolume(s.reps) > 0);
    if (!done.length) {
      // Jeśli nic nie zaliczone — bierz pierwszy wiersz z wypełnionymi danymi
      return sets.find((s) => parseFloat(s.kg) > 0 && repsForVolume(s.reps) > 0) ?? null;
    }
    return done.reduce((best, s) => {
      const orm = calcEpley1RM(s.kg, s.reps);
      return orm > (calcEpley1RM(best.kg, best.reps) ?? 0) ? s : best;
    }, done[0]);
  }, [sets]);

  const rawOneRM = bestSet ? calcEpley1RM(bestSet.kg, bestSet.reps) : null;
  const { decayed, weeksOff, decayPct } = useMemo(
    () => applyDecayCurve(rawOneRM, lastPerformedDate),
    [rawOneRM, lastPerformedDate],
  );

  const hasDecay = decayPct > 0;

  useEffect(() => {
    if (!hasDecay) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasDecay]);

  if (!rawOneRM) return null;

  const widgetStyles = makeWidgetStyles(colors);

  return (
    <TouchableOpacity
      style={[widgetStyles.chip, hasDecay && widgetStyles.chipDecay]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <Animated.View style={[widgetStyles.chipInner, hasDecay && { transform: [{ scale: pulseAnim }] }]}>
        <Text style={widgetStyles.chipLabel}>1RM</Text>
        <Text style={[widgetStyles.chipValue, hasDecay && widgetStyles.chipValueDecay]}>
          {decayed} kg
        </Text>
        {hasDecay && (
          <View style={widgetStyles.decayBadge}>
            <Text style={widgetStyles.decayBadgeText}>-{decayPct}%</Text>
          </View>
        )}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={11}
          color={hasDecay ? colors.warning : colors.textTertiary}
        />
      </Animated.View>

      {expanded && (
        <View style={widgetStyles.expanded}>
          <View style={widgetStyles.expandRow}>
            <Text style={widgetStyles.expandLabel}>Surowe 1RM (Epley)</Text>
            <Text style={widgetStyles.expandValue}>{rawOneRM} kg</Text>
          </View>
          {hasDecay && (
            <>
              <View style={widgetStyles.expandRow}>
                <Text style={widgetStyles.expandLabel}>Przerwa w ćwiczeniu</Text>
                <Text style={[widgetStyles.expandValue, { color: colors.warning }]}>{weeksOff} tygodni</Text>
              </View>
              <View style={widgetStyles.expandRow}>
                <Text style={widgetStyles.expandLabel}>Zastosowany zanik</Text>
                <Text style={[widgetStyles.expandValue, { color: colors.danger }]}>-{decayPct}%</Text>
              </View>
              <Text style={widgetStyles.decayTip}>
                ⚠️ Wznów ćwiczenie — 1RM zostanie przywrócone po 4 tygodniach regularnych treningów.
              </Text>
            </>
          )}
          <View style={widgetStyles.expandRow}>
            <Text style={widgetStyles.expandLabel}>Ostatni wynik</Text>
            <Text style={widgetStyles.expandValue}>{bestSet?.kg} kg × {bestSet?.reps} powt.</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const makeWidgetStyles = (c) => StyleSheet.create({
  chip: {
    alignSelf: 'flex-end',
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  chipDecay: { borderColor: c.warning },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipLabel:      { fontSize: 9, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8 },
  chipValue:      { fontSize: 13, fontWeight: '700', color: c.accent },
  chipValueDecay: { color: c.warning },
  decayBadge:     { backgroundColor: c.dangerSoft, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  decayBadgeText: { fontSize: 9, fontWeight: '700', color: c.danger },
  expanded:       { padding: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: c.border, gap: 6 },
  expandRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  expandLabel:    { fontSize: 11, color: c.textTertiary },
  expandValue:    { fontSize: 11, fontWeight: '600', color: c.textPrimary },
  decayTip:       { fontSize: 10, color: c.warning, lineHeight: 14, fontStyle: 'italic' },
});

const parseSlangInput = (inputText) => {
  if (!inputText) return null;
  const n = inputText.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const patterns = [
    /(?:zapas(?:u|em)?|zostalo|rir)\s*(?:na\s*)?(\d+)\s*/i,
    /(\d+)\s*(?:zapas|zostalo|rir)\s*/i,
    /(?:na\s*)?(\d+)\s*(?:w\s*)?(?:zapas|rezerw)\s*/i,
    /rpe\s*(\d+(?:[.,]\d+)?)\s*/i,
  ];
  for (const pat of patterns) {
    const m = n.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (pat.source.includes('rpe')) return { rir: Math.max(0, Math.round(10 - val)) };
      return { rir: Math.round(val) };
    }
  }
  if (/\b(?:max|upadek|fail)\b/.test(n))                          return { rir: 0 };
  if (/\b(?:lekko|luz|git|okej|ok|izi|izzi|gladko|poszlo)\b/.test(n)) return { rir: 3 };
  if (/\b(?:ciezko|smierc|masakra|opor|zajechany)\b/.test(n))     return { rir: 0 };
  return null;
};

const deltaFromRir = (rir) => rir >= 3 ? 5 : rir >= 1 ? 2.5 : 0;

const analyzeWorkoutNoteHybrid = async ({ note, uiKg, uiReps, isLastSet }) => {
  const raw        = (note ?? '').trim();
  const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!raw && !uiKg) return { type: 'empty', message: 'Opisz serię lub uzupełnij pola kg / RPE.' };
  const hasGymKw = GYM_KEYWORDS.some((kw) => normalized.includes(kw));
  if (raw && !hasGymKw) return { type: 'blocked', message: '❌ Odrzucono: Komunikat niezwiązany z treningiem.' };
  const kgMatch       = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo(?:gram)?)/);
  const extractedKg   = kgMatch ? parseFloat(kgMatch[1].replace(',', '.')) : null;
  const repsMatch     = normalized.match(/(?:na|x)\s*(\d+)|(\d+)\s*powt/);
  const extractedReps = repsMatch ? parseInt(repsMatch[1] ?? repsMatch[2]) : null;
  const currentKg     = extractedKg   ?? parseFloat(uiKg)  ?? null;
  const currentReps   = extractedReps ?? parseInt(uiReps)   ?? null;
  if (!currentKg) return { type: 'error', message: '❌ Nie znaleziono ciężaru.' };
  const slang = parseSlangInput(raw);
  const rir   = slang?.rir ?? null;
  if (rir !== null) {
    const deltaKg  = deltaFromRir(rir);
    const findings = rir >= 3 ? `Duży zapas sił (RIR ${rir})` : rir >= 1 ? `Umiarkowany zapas (RIR ${rir})` : 'RIR 0 – limit intensywności';
    const decision = rir >= 1 ? `+${deltaKg} kg` : 'Utrzymaj ciężar';
    const newKg    = Math.round(Math.max(0, currentKg + deltaKg) * 2) / 2;
    const base     = { type: 'math', status: 'Analiza lokalna (slang NLP)', findings, decision, suggestedKg: newKg, suggestedReps: currentReps };
    if (isLastSet) return { ...base, isLastSet: true, nextTrainingKg: newKg, decision: `AI zapisało ${newKg} kg na kolejny trening.` };
    return base;
  }
  try {
    await new Promise((res) => setTimeout(res, 1500));
    const base = { type: 'cloud', status: 'Cloud AI', findings: 'Złożony wzorzec', decision: 'Deload -5 kg', suggestedKg: currentKg, suggestedReps: currentReps };
    if (isLastSet) return { ...base, isLastSet: true, nextTrainingKg: currentKg, decision: `AI zapisało ${currentKg} kg na kolejny trening.` };
    return base;
  } catch {
    return { type: 'offline', message: '⚠️ Brak sieci. Wpisz "zapas X" lub "RIR X".' };
  }
};

const ConfirmModal = ({ visible, title, body, confirmLabel, confirmDanger, onConfirm, onCancel }) => {
  const { colors } = useTheme();
  const confirmStyles = makeConfirmStyles(colors);
  return (
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
            onPress={onConfirm} activeOpacity={0.7}
          >
            <Text style={confirmStyles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

const makeConfirmStyles = (c) => StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:         { backgroundColor: c.card, borderRadius: 20, padding: 24, width: '100%', borderWidth: 0.5, borderColor: c.border },
  title:       { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 12, textAlign: 'center' },
  body:        { fontSize: 14, color: c.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  actions:     { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, backgroundColor: c.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText:  { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  confirmBtn:  { flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: c.accentText },
});

const ExerciseInfoModal = ({ visible, exercise, onClose }) => {
  const { colors } = useTheme();
  const infoStyles = makeInfoStyles(colors);
  return (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View style={infoStyles.screen}>
      <View style={infoStyles.handle} />
      <TouchableOpacity style={infoStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={20} color="#8E8E93" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={infoStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={infoStyles.title}>{exercise?.name}</Text>
        <Text style={infoStyles.subtitle}>{exercise?.muscleGroup}</Text>
        <View style={infoStyles.imagePlaceholder}>
          <Ionicons name="body-outline" size={52} color="#3A3A3C" />
          <Text style={infoStyles.imageText}>Animacja techniki</Text>
        </View>
        <Text style={infoStyles.sl}>Opis techniki</Text>
        <Text style={infoStyles.description}>{exercise?.description}</Text>
        <Text style={infoStyles.sl}>Zaangażowane mięśnie</Text>
        {exercise?.muscles?.map((m, i) => (
          <View key={i} style={infoStyles.muscleRow}>
            <View style={infoStyles.dot} />
            <Text style={infoStyles.muscleText}>{m}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  </Modal>
  );
};

const makeInfoStyles = (c) => StyleSheet.create({
  screen:           { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:           { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:         { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  content:          { padding: 24, paddingTop: 16 },
  title:            { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  subtitle:         { fontSize: 13, color: c.textSecondary, marginBottom: 20 },
  imagePlaceholder: { height: 160, backgroundColor: c.card, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 10, borderWidth: 0.5, borderColor: c.border },
  imageText:        { fontSize: 13, color: c.borderMuted },
  sl:               { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  description:      { fontSize: 15, color: c.textPrimary, lineHeight: 23, marginBottom: 24 },
  muscleRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  muscleText:       { fontSize: 15, color: c.textPrimary },
});

// ─── SupersetPickerModal — wybór ćwiczenia do połączenia ─────────────────────
const SupersetPickerModal = memo(function SupersetPickerModal({
  visible, exercises, fromExIdx, supersetGroups, onConnect, onClose, colors,
}) {
  const fromEx      = exercises[fromExIdx];
  const fromGroupId = fromEx ? supersetGroups[fromEx.id] : null;

  const pickerStyles = makeSupersetPickerStyles(colors);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.screen}>
        <View style={pickerStyles.handle} />
        <View style={pickerStyles.topBar}>
          <View style={pickerStyles.iconCircle}>
            <Text style={{ fontSize: 18 }}>⛓️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pickerStyles.title}>Połącz Super-Serię</Text>
            <Text style={pickerStyles.subtitle} numberOfLines={1}>
              {fromEx?.name ?? ''}
            </Text>
          </View>
          <TouchableOpacity style={pickerStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={pickerStyles.hint}>
          Wybierz ćwiczenia, które mają tworzyć super-serię z powyższym. Odznacz, by rozłączyć.
        </Text>

        <ScrollView contentContainerStyle={pickerStyles.list} showsVerticalScrollIndicator={false}>
          {exercises.map((ex, idx) => {
            if (idx === fromExIdx) return null;
            const isConnected = fromGroupId && supersetGroups[ex.id] === fromGroupId;
            const color = isConnected
              ? supersetColor(fromGroupId)
              : colors.textSecondary;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[pickerStyles.row, isConnected && pickerStyles.rowActive]}
                onPress={() => onConnect(fromExIdx, ex.id, isConnected)}
                activeOpacity={0.75}
              >
                <View style={[pickerStyles.rowNum, isConnected && { borderColor: color }]}>
                  <Text style={[pickerStyles.rowNumText, isConnected && { color }]}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[pickerStyles.rowName, isConnected && { color }]}>
                    {ex.name}
                  </Text>
                  <Text style={pickerStyles.rowMuscles} numberOfLines={1}>
                    {ex.muscleGroup}
                  </Text>
                </View>
                <View style={[pickerStyles.checkCircle, isConnected && { backgroundColor: color, borderColor: color }]}>
                  {isConnected && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={pickerStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={pickerStyles.doneBtnText}>Gotowe</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
});

const makeSupersetPickerStyles = (c) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:     { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.librarySoft, justifyContent: 'center', alignItems: 'center' },
  title:      { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  subtitle:   { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  closeBtn:   { width: 32, height: 32, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },
  hint:       { fontSize: 12, color: c.textTertiary, paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18 },
  list:       { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.card, borderRadius: 16,
    padding: 14, borderWidth: 0.5, borderColor: c.border,
  },
  rowActive:      { borderColor: c.library },
  rowNum:         { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  rowNumText:     { fontSize: 12, fontWeight: '700', color: c.textTertiary },
  rowName:        { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  rowMuscles:     { fontSize: 11, color: c.textTertiary, marginTop: 2 },
  checkCircle:    { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: c.borderMuted, justifyContent: 'center', alignItems: 'center' },
  doneBtn:        { margin: 16, backgroundColor: c.accent, borderRadius: 16, height: 50, justifyContent: 'center', alignItems: 'center' },
  doneBtnText:    { fontSize: 16, fontWeight: '700', color: c.accentText },
});

// ─── Super-seria: konektor z pulsującą poświatą ───────────────────────────────
const SupersetConnector = memo(function SupersetConnector({ colors, groupColor }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const glow      = groupColor ?? colors.library;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 0, alignItems: 'flex-start' }}>
      <Animated.View style={{
        width: 3,
        height: 28,
        borderRadius: 2,
        backgroundColor: glow,
        marginLeft: 28,
        opacity: pulseAnim,
        shadowColor: glow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 8,
      }} />
      <View style={{
        position: 'absolute',
        left: 14,
        top: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}>
        <Animated.View style={{
          width: 16,
          height: 1,
          backgroundColor: glow,
          opacity: pulseAnim,
        }} />
        <Text style={{ fontSize: 8, color: glow, fontWeight: '700', letterSpacing: 0.5 }}>
          SUPER-SERIA
        </Text>
      </View>
    </View>
  );
});

// Kolory grup super-serii
const SUPERSET_COLORS = ['#A78BFA', '#38BDF8', '#FB923C', '#34D399', '#F472B6'];
const supersetColor = (groupId) => {
  if (!groupId) return null;
  const hash = [...groupId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return SUPERSET_COLORS[hash % SUPERSET_COLORS.length];
};

const BAND_LEVELS = [
  { id: 'light',  label: 'Lekka',        color: '#FCD34D' },
  { id: 'medium', label: 'Średnia',       color: '#34D399' },
  { id: 'heavy',  label: 'Mocna',         color: '#60A5FA' },
  { id: 'xheavy', label: 'Bardzo mocna',  color: '#F472B6' },
];

const ExerciseCard = memo(function ExerciseCard({
  exercise, exIndex,
  onUpdateSet, onToggleSet, onDeleteSet, onAddSet,
  onRestChange, onInfoPress, onCascadeUpdate,
  onDeleteExercise, onSwapExercise,
  onDropSetPress,
  onChangeLoadMode,
  supersetGroup,
  onToggleSuperset,
  bodyWeight,
  onUpdateBodyWeight,
  onRepsModeChange,
}) {
  const isBWWeighted = exercise.exerciseType === 'bodyweight_weighted';
  const { colors } = useTheme();
  const { useRIR }  = useWorkoutContext();
  const cardStyles = makeCardStyles(colors);
  const [restModal, setRestModal]                   = useState(false);
  const [swapModal, setSwapModal]                   = useState(false);
  const [actionsModal, setActionsModal]             = useState(false);
  const [plateCalcKg, setPlateCalcKg]               = useState(null);
  const [historyVisible, setHistoryVisible]         = useState(false);
  const [machineSettingsVisible, setMachineSettingsVisible] = useState(false);
  const [loadModeVisible, setLoadModeVisible]       = useState(false);
  const [repsModeSheetVisible, setRepsModeSheetVisible] = useState(false);
  const [bandLevel, setBandLevel]                   = useState('medium'); // dla trybu gumy

  const loadMode = exercise.loadMode ?? 'barbell';
  const loadModeInfo = LOAD_MODES.find((m) => m.id === loadMode);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowColor = supersetGroup ? supersetColor(supersetGroup) : null;

  useEffect(() => {
    if (!supersetGroup) { glowAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [supersetGroup]);

  const fmt       = (s) => s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`;
  const progression = useMemo(
    () => calculateAPRE(exercise.sets, exercise.sets[0]?.prevLog),
    [exercise.sets],
  );

  // ZADANIE 4: limit 3 drop-setów per ćwiczenie
  const dropSetCount     = exercise.sets.filter((s) => s.isDropSet).length;
  const dropSetLimitReached = dropSetCount >= 3;
  const repsMode = exercise.planConfig?.repsMode ?? 'single';
  const isRepsRangeMode = repsMode === 'range';

  const confirmDeleteExercise = () => {
    Alert.alert(
      'Usuń ćwiczenie?',
      `Czy na pewno chcesz usunąć\n${exercise.name}\nz tego treningu?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: onDeleteExercise },
      ],
    );
  };

  // Potwierdzenie odbywa się w SwipeableSetRow — tu już bezpośrednio usuwamy

  const borderColorAnim = glowColor
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, glowColor] })
    : colors.border;

  return (
    <Animated.View style={[
      cardStyles.card,
      supersetGroup && { borderColor: borderColorAnim, borderWidth: 1.5 },
    ]}>
      {supersetGroup && (
        <View style={[cardStyles.supersetBadge, { backgroundColor: glowColor + '22', borderColor: glowColor }]}>
          <Text style={[cardStyles.supersetBadgeText, { color: glowColor }]}>⚡ Super-Seria</Text>
        </View>
      )}
      <View style={cardStyles.header}>
        <Image
          source={{ uri: exercise.image ?? 'https://via.placeholder.com/40/2C2C2E/636366?text=EX' }}
          style={cardStyles.thumbnail}
        />
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={cardStyles.name}>{exercise.name}</Text>
          <Text style={cardStyles.muscles}>{exercise.muscleGroup}</Text>
          {exercise.nextTrainingKg != null && (
            <Text style={cardStyles.nextKg}>
              Kolejny trening: <Text style={{ color: '#EF9F27', fontWeight: '700' }}>{exercise.nextTrainingKg} kg</Text>
            </Text>
          )}
        </View>
        <TouchableOpacity style={cardStyles.infoBtn} onPress={onInfoPress} activeOpacity={0.7}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
        <TouchableOpacity
          style={cardStyles.infoBtn}
          onPress={() => setHistoryVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
        {/* menu kontekstowe */}
        <TouchableOpacity
          style={cardStyles.moreBtn}
          onPress={() => setActionsModal(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#636366" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <TouchableOpacity style={cardStyles.restChip} onPress={() => setRestModal(true)} activeOpacity={0.7}>
          <Ionicons name="timer-outline" size={13} color="#8E8E93" />
          <Text style={cardStyles.restChipText}>Przerwa: {fmt(exercise.restDuration)}</Text>
          <Ionicons name="chevron-down" size={12} color="#3A3A3C" />
        </TouchableOpacity>

        {/* Chip trybu obciążenia (pokazuje się tylko gdy nie jest domyślny) */}
        {loadMode !== 'barbell' && (
          <TouchableOpacity
            style={[cardStyles.restChip, { borderColor: '#34D399', borderWidth: 1 }]}
            onPress={() => setLoadModeVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12 }}>{loadModeInfo?.icon ?? '🏋️'}</Text>
            <Text style={[cardStyles.restChipText, { color: '#34D399' }]}>{loadModeInfo?.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Specjalny baner Kalistenika / Gumy */}
      {loadMode === 'bodyweight' && (
        <View style={[cardStyles.loadModeBanner, { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: '#34D399' }]}>
          <Text style={{ fontSize: 16 }}>🤸</Text>
          <Text style={{ fontSize: 12, color: '#34D399', flex: 1 }}>
            Tryb waga ciała — w polu kg podaj dodatkowe obciążenie (np. pas z talerzami). Bez obciążenia wpisz 0.
          </Text>
        </View>
      )}
      {loadMode === 'bands' && (
        <View style={[cardStyles.loadModeBanner, { backgroundColor: 'rgba(167,139,250,0.08)', borderColor: colors.library }]}>
          <Text style={{ fontSize: 16 }}>🎯</Text>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 12, color: colors.library }}>Opór gumy — wybierz poziom:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {BAND_LEVELS.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    cardStyles.bandChip,
                    { borderColor: b.color, backgroundColor: bandLevel === b.id ? b.color + '25' : 'transparent' },
                  ]}
                  onPress={() => setBandLevel(b.id)}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: b.color }}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
      {loadMode === 'dumbbells' && (
        <View style={[cardStyles.loadModeBanner, { backgroundColor: 'rgba(239,159,39,0.08)', borderColor: colors.warning }]}>
          <Text style={{ fontSize: 16 }}>💪</Text>
          <Text style={{ fontSize: 12, color: colors.warning, flex: 1 }}>
            Hantle — wpisz ciężar jednego hantla. Łączne obciążenie = 2× podana wartość.
          </Text>
        </View>
      )}

      {/* Pływający Widget 1RM */}
      <OneRMWidget
        sets={exercise.sets}
        lastPerformedDate={exercise.lastPerformedDate ?? null}
        colors={colors}
      />

      <View style={cardStyles.colHeaders}>
        <View style={{ width: 20 }} />
        <View style={{ flex: 1 }}><Text style={cardStyles.colH}>Poprzednio</Text></View>
        <Text style={[cardStyles.colH, { width: 46, textAlign: 'center' }]}>{useRIR ? 'RIR' : 'RPE'}</Text>
        {isBWWeighted ? (
          <Text style={[cardStyles.colH, { width: 104, textAlign: 'center', color: colors.accent }]}>
            👤BW + ⚙️ Dodane
          </Text>
        ) : (
          <Text style={[cardStyles.colH, { width: 46, textAlign: 'center' }]}>kg</Text>
        )}
        <TouchableOpacity
          style={[cardStyles.colRepsBtn, { width: isRepsRangeMode ? 88 : 52 }]}
          onPress={() => setRepsModeSheetVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[cardStyles.colH, { textAlign: 'center' }]}>
            {isRepsRangeMode ? 'Zakres' : 'Powt.'}
          </Text>
          <Ionicons name="chevron-down" size={10} color={colors.textTertiary} />
        </TouchableOpacity>
        <Text style={[cardStyles.colH, { width: 44, textAlign: 'center' }]}>✓</Text>
      </View>

      {exercise.sets.map((set, idx) => (
        <SwipeableSetRow
          key={set.id}
          setData={set}
          index={idx}
          totalSets={exercise.sets.length}
          progression={progression}
          onUpdate={(field, value) => onUpdateSet(exIndex, set.id, field, value)}
          onToggleComplete={() => onToggleSet(exIndex, set.id)}
          onDeleteSet={() => onDeleteSet(exIndex, set.id)}
          onDeleteExercise={confirmDeleteExercise}
          onCascadeUpdate={(newKg, newReps) => onCascadeUpdate(exIndex, idx, newKg, newReps, null)}
          onDropSetPress={() => onDropSetPress?.(exIndex, idx)}
          isBWWeighted={isBWWeighted}
          bodyWeight={bodyWeight}
          onUpdateBodyWeight={onUpdateBodyWeight}
          repsMode={repsMode}
        />
      ))}

      <View style={cardStyles.divider} />

      <View style={cardStyles.actions}>
        <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.actionAdd]} onPress={() => onAddSet(exIndex)} activeOpacity={0.7}>
          <Ionicons name="add" size={15} color="#00E676" />
          <Text style={cardStyles.actionAddText}>Dodaj serię</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.actionSwap]} onPress={() => setSwapModal(true)} activeOpacity={0.7}>
          <Ionicons name="swap-horizontal" size={15} color="#8E8E93" />
          <Text style={cardStyles.actionSwapText}>Zamień</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cardStyles.deleteExBtn} onPress={confirmDeleteExercise} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <RestPickerModal
        isVisible={restModal}
        currentRest={exercise.restDuration}
        onSelectTime={(sec) => { onRestChange(exIndex, sec); setRestModal(false); }}
        onClose={() => setRestModal(false)}
      />
      <SwapExerciseModal
        isVisible={swapModal}
        currentExercise={exercise}
        exerciseDatabase={EXERCISE_DATABASE}
        exerciseMap={EXERCISE_MAP}
        currentSets={exercise.sets}
        onSwap={(newEx, adjustedSets) => { onSwapExercise(exIndex, newEx, adjustedSets); setSwapModal(false); }}
        onClose={() => setSwapModal(false)}
      />

      {/* Wizualizacja sztangi z wpisem kg */}
      <PlateCalculatorModal
        isVisible={plateCalcKg !== null}
        initialWeight={plateCalcKg ?? 20}
        onClose={() => setPlateCalcKg(null)}
      />

      {/* Historia ćwiczenia */}
      <ExerciseHistoryModal
        isVisible={historyVisible}
        exerciseName={exercise.name}
        onClose={() => setHistoryVisible(false)}
      />

      <ExerciseActionsModal
        isVisible={actionsModal}
        exerciseName={exercise.name}
        dropSetLimitReached={dropSetLimitReached}
        isInSuperset={!!supersetGroup}
        onClose={() => setActionsModal(false)}
        onPlateCalc={() => {
          setActionsModal(false);
          const lastWithKg = [...exercise.sets].reverse().find((s) => parseFloat(s.kg) > 0);
          const kg = parseFloat(lastWithKg?.kg ?? '0');
          setPlateCalcKg(kg > 0 ? kg : 20);
        }}
        onDropSet={() => {
          setActionsModal(false);
          if (dropSetLimitReached) return;
          const lastIdx = exercise.sets.reduce((best, s, i) =>
            parseFloat(s.kg) > 0 ? i : best, -1);
          if (lastIdx >= 0) onDropSetPress?.(exIndex, lastIdx);
        }}
        onSwap={() => { setActionsModal(false); setSwapModal(true); }}
        onDelete={() => { setActionsModal(false); confirmDeleteExercise(); }}
        onToggleSuperset={() => { setActionsModal(false); onToggleSuperset?.(exIndex); }}
        onMachineSettings={() => { setActionsModal(false); setMachineSettingsVisible(true); }}
        onLoadMode={() => { setActionsModal(false); setLoadModeVisible(true); }}
        currentLoadMode={loadMode}
      />

      <MachineSettingsModal
        isVisible={machineSettingsVisible}
        exerciseName={exercise.name}
        onClose={() => setMachineSettingsVisible(false)}
      />

      <LoadModeModal
        isVisible={loadModeVisible}
        currentMode={loadMode}
        onSelect={(mode) => onChangeLoadMode?.(exIndex, mode)}
        onClose={() => setLoadModeVisible(false)}
      />

      <RepsModeSheet
        visible={repsModeSheetVisible}
        currentMode={repsMode}
        onSelect={(mode) => onRepsModeChange(exIndex, mode)}
        onClose={() => setRepsModeSheetVisible(false)}
        colors={colors}
      />
    </Animated.View>
  );
});

const makeCardStyles = (c) => StyleSheet.create({
  card:           { backgroundColor: c.backgroundSecondary, marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: c.border },
  supersetBadge:  { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  supersetBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  thumbnail:     { width: 40, height: 40, borderRadius: 8, backgroundColor: c.border },
  name:          { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  muscles:       { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  nextKg:        { fontSize: 11, color: c.textTertiary, marginTop: 4 },
  infoBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },
  moreBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  restChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: c.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 12 },
  restChipText:  { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
  colHeaders:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  colH:          { fontSize: 10, color: c.textTertiary, fontWeight: '500', letterSpacing: 0.3 },
  colRepsBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  divider:       { height: 0.5, backgroundColor: c.border, marginVertical: 12 },
  actions:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, paddingVertical: 10, borderWidth: 1 },
  actionAdd:     { backgroundColor: c.accentSoft, borderColor: c.accentSoft },
  actionAddText: { fontSize: 13, fontWeight: '500', color: c.accent },
  actionSwap:    { backgroundColor: c.backgroundSecondary, borderColor: c.border },
  actionSwapText:{ fontSize: 13, fontWeight: '500', color: c.textSecondary },
  deleteExBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: c.dangerSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: c.dangerSoft },
  loadModeBanner:{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 0.5, padding: 10, marginBottom: 10 },
  bandChip:      { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});

// ─── Tryb Krajobrazowy (Rack View) ───────────────────────────────────────────
const RackView = memo(function RackView({ exercises, timerRef, restActive, restDuration, restKey, colors }) {
  const insets = useSafeAreaInsets();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [restSec, setRestSec]       = useState(restDuration);
  const endsAtRef                   = useRef(Date.now() + restDuration * 1000);

  useEffect(() => {
    const iv = setInterval(() => setElapsedSec(timerRef.current?.getSeconds() ?? 0), 1000);
    return () => clearInterval(iv);
  }, [timerRef]);

  useEffect(() => {
    if (!restActive) return undefined;
    endsAtRef.current = Date.now() + restDuration * 1000;
    setRestSec(restDuration);
    const syncRest = () => {
      setRestSec(Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000)));
    };
    syncRest();
    const iv = setInterval(syncRest, 500);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncRest();
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [restActive, restDuration, restKey]);

  // Znajdź pierwszą niezaliczoną serię
  const nextSet = useMemo(() => {
    for (const ex of exercises) {
      const setIdx = ex.sets.findIndex((s) => !s.done);
      if (setIdx !== -1) {
        const set = ex.sets[setIdx];
        return {
          exName: ex.name,
          muscles: ex.muscleGroup,
          setNum: setIdx + 1,
          totalSets: ex.sets.length,
          kg: set.kg || '—',
          reps: set.reps || '—',
        };
      }
    }
    return null;
  }, [exercises]);

  // Tonaż ukończonych serii
  const tonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * repsForVolume(set.reps) : s, 0), 0),
    [exercises]);

  const doneSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);
  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60), sc = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  const rackStyles = makeRackStyles(colors, insets);

  return (
    <View style={rackStyles.overlay}>
      <View style={rackStyles.topBar}>
        <View style={rackStyles.timerBlock}>
          <Text style={rackStyles.timerLabel}>CZAS TRENINGU</Text>
          <Text style={rackStyles.timer} adjustsFontSizeToFit numberOfLines={1}>{fmtTime(elapsedSec)}</Text>
        </View>
        {restActive && (
          <View style={rackStyles.restBlock}>
            <Text style={rackStyles.restLabel}>PRZERWA</Text>
            <Text style={rackStyles.restTimer} adjustsFontSizeToFit numberOfLines={1}>{fmtTime(restSec)}</Text>
          </View>
        )}
      </View>

      <View style={rackStyles.main}>
        {nextSet ? (
          <>
            <Text style={rackStyles.exerciseName} numberOfLines={2}>{nextSet.exName}</Text>
            <Text style={rackStyles.muscles} numberOfLines={1}>{nextSet.muscles}</Text>
            <View style={rackStyles.setRow}>
              <View style={rackStyles.dataBlock}>
                <Text style={rackStyles.dataLabel}>CIĘŻAR</Text>
                <Text style={rackStyles.dataValue} adjustsFontSizeToFit numberOfLines={1}>
                  {nextSet.kg}<Text style={rackStyles.dataUnit}> kg</Text>
                </Text>
              </View>
              <View style={rackStyles.dataSep} />
              <View style={rackStyles.dataBlock}>
                <Text style={rackStyles.dataLabel}>POWT.</Text>
                <Text style={rackStyles.dataValue} adjustsFontSizeToFit numberOfLines={1}>
                  {nextSet.reps}<Text style={rackStyles.dataUnit}> ×</Text>
                </Text>
              </View>
              <View style={rackStyles.dataSep} />
              <View style={rackStyles.dataBlock}>
                <Text style={rackStyles.dataLabel}>SERIA</Text>
                <Text style={rackStyles.dataValue} adjustsFontSizeToFit numberOfLines={1}>
                  {nextSet.setNum}<Text style={rackStyles.dataUnit}>/{nextSet.totalSets}</Text>
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={rackStyles.allDone}>✅ Wszystkie serie zaliczone!</Text>
        )}
      </View>

      <View style={rackStyles.bottomBar}>
        <View style={rackStyles.footer}>
          <View style={rackStyles.footerItem}>
            <Ionicons name="barbell-outline" size={12} color={colors.textTertiary} />
            <Text style={rackStyles.footerText}>{tonnage} kg</Text>
          </View>
          <View style={rackStyles.footerItem}>
            <Ionicons name="checkmark-circle-outline" size={12} color={colors.textTertiary} />
            <Text style={rackStyles.footerText}>{doneSets}/{totalSets} serii</Text>
          </View>
        </View>
        <Text style={rackStyles.hint}>Obróć telefon pionowo, by wrócić</Text>
      </View>
    </View>
  );
});

const makeRackStyles = (c, insets) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.background,
    zIndex: 9999,
    paddingTop: Math.max(insets.top, 8),
    paddingBottom: Math.max(insets.bottom, 8),
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 28,
    minHeight: 56,
  },
  timerBlock: { alignItems: 'center', minWidth: 120 },
  restBlock:  { alignItems: 'center', minWidth: 100 },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
  },
  timerLabel:   { fontSize: 9, fontWeight: '700', color: c.textTertiary, letterSpacing: 1.5 },
  timer:        { fontSize: 44, fontWeight: '800', color: c.textPrimary, letterSpacing: 1, fontVariant: ['tabular-nums'], lineHeight: 48 },
  restLabel:    { fontSize: 9, fontWeight: '700', color: c.accent, letterSpacing: 1.5 },
  restTimer:    { fontSize: 36, fontWeight: '800', color: c.accent, letterSpacing: 1, fontVariant: ['tabular-nums'], lineHeight: 40 },
  exerciseName: { fontSize: 18, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
  muscles:      { fontSize: 11, color: c.textSecondary, textAlign: 'center', marginBottom: 6 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: c.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: c.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dataBlock:  { flex: 1, alignItems: 'center', gap: 2 },
  dataLabel:  { fontSize: 8, fontWeight: '700', color: c.textTertiary, letterSpacing: 1 },
  dataValue:  { fontSize: 26, fontWeight: '800', color: c.accent, fontVariant: ['tabular-nums'] },
  dataUnit:   { fontSize: 11, fontWeight: '600', color: c.textSecondary },
  dataSep:    { width: 1, height: 36, backgroundColor: c.border },
  allDone:    { fontSize: 18, fontWeight: '700', color: c.accent, textAlign: 'center' },
  footer:     { flexDirection: 'row', gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: c.textTertiary },
  hint:       { fontSize: 10, color: c.borderMuted },
});

export default function ActiveWorkoutScreen({ navigation, route }) {
  const { activeWorkout, customPlans, minimizeWorkout, saveWorkoutToHistory, clearActiveWorkout, updateCustomPlan } = useWorkoutContext();
  const { colors } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const isLandscape = winW > winH;
  const [bodyWeight, updateBodyWeight] = useBodyWeight(80);

  // Odblokuj obrót tylko na ekranie treningu (app.json ma portrait)
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.unlockAsync().catch(() => {});
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      };
    }, []),
  );

  const workoutName        = route?.params?.templateName ?? activeWorkout?.workoutName ?? 'Mój trening';
  const templateId         = route?.params?.templateId;
  const customExercises    = route?.params?.customExercises;
  const initialSSGroups    = route?.params?.supersetGroups ?? {};
  const customPlanId       = route?.params?.customPlanId ?? null;

  const initialExercises = useMemo(() => {
    if (activeWorkout?.exercises?.length > 0) return activeWorkout.exercises;
    if (customExercises?.length > 0) return customExercises.map(convertLibraryExercise);
    if (templateId === 'lower') return LOWER_EXERCISES();
    return UPPER_EXERCISES();
  }, []);

  const initialTimerSec = activeWorkout?.timerSec ?? 0;

  const [exercises, setExercises]           = useState(initialExercises);
  // Oryginalna kolejność ID — używana przy przywracaniu po rozłączeniu super-serii
  const originalOrderRef = useRef(initialExercises.map((ex) => ex.id));

  // ── Tryb Domowy ──────────────────────────────────────────────────────────────
  const [homeModeActive, setHomeModeActive]         = useState(false);
  const [homeTransitioning, setHomeTransitioning]   = useState(false);
  const originalExercisesRef                        = useRef(null);
  const exerciseListOpacity                         = useRef(new Animated.Value(1)).current;

  // ── Quick BW Update Modal ────────────────────────────────────────────────────
  const [bwModalVisible, setBWModalVisible] = useState(false);
  const [tempBW, setTempBW]                 = useState('');
  // supersetGroups: { exId: groupId } — inicjowane z planu jeśli dostępne
  // Remapowanie kluczy z ID planu (ex.id) na ID treningu (custom_ex.id_idx)
  const [supersetGroups, setSupersetGroups] = useState(() => {
    if (!customExercises?.length || !Object.keys(initialSSGroups).length) return initialSSGroups;
    const remapped = {};
    customExercises.forEach((ex, idx) => {
      const groupId = initialSSGroups[ex.id];
      if (groupId) remapped[`custom_${ex.id}_${idx}`] = groupId;
    });
    return remapped;
  });
  const [supersetPickerExIdx, setSupersetPickerExIdx] = useState(null);
  const [restActive, setRestActive]         = useState(false);
  const [restDuration, setRestDuration]     = useState(120);
  const [restLabel, setRestLabel]           = useState('');
  const [restKey, setRestKey]               = useState(0);
  const [infoVisible, setInfoVisible]       = useState(false);
  const [infoExercise, setInfoExercise]     = useState(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prData, setPRData]               = useState(null);
  const [muscleModalVisible, setMuscleModalVisible]       = useState(false);
  const [isPlateCalcVisible, setIsPlateCalcVisible]       = useState(false);
  const [selectedWeightForCalc, setSelectedWeightForCalc] = useState(0);
  const [customExModalVisible, setCustomExModalVisible]   = useState(false);
  const [sessionNote, setSessionNote]                     = useState('');

  // ZADANIE 1: InteractionManager – lista renderowana po zakończeniu animacji wejścia
  const [isReady, setIsReady] = useState(false);
  const timerHudRef           = useRef(null);

  useEffect(() => {
    clearActiveWorkout?.();
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, []);

  // ─── Powiadomienia: uprawnienia + czyszczenie przy odmontowaniu ──────────────
  useEffect(() => {
    setupWorkoutNotifications();
    return () => {
      cancelAllWorkoutNotifications();
    };
  }, []);

  // ─── AppState: lock-screen widget przy zejściu w tło ────────────────────────
  const appStateRef = useRef(AppState.currentState);
  const restActiveRef = useRef(false);
  const restDurationRef = useRef(120);
  const restLabelRef = useRef('');

  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (Math.abs(z) > 1.8) confirmFirstPendingSet();
    });
    return () => sub.remove();
  }, [exercises]);

  const heatmap = useMuscleHeatmap(exercises);
  const totalTonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * repsForVolume(set.reps) : s, 0
      ), 0), [exercises]);
  const doneSets = useMemo(() =>
    exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0),
  [exercises]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasActive = appStateRef.current === 'active';
      const goingBackground = nextState === 'background' || nextState === 'inactive';
      appStateRef.current = nextState;

      if (wasActive && goingBackground) {
        const currentEx = exercises.find((ex) => ex.sets.some((s) => !s.done))?.name
          ?? exercises[exercises.length - 1]?.name
          ?? null;
        showWorkoutLockScreenNotification({
          workoutName,
          currentExercise: currentEx,
          doneSets,
          restSecondsLeft: restActiveRef.current ? restDurationRef.current : 0,
        });
      } else if (nextState === 'active') {
        dismissWorkoutLockScreenNotification();
      }
    });
    return () => sub.remove();
  }, [exercises, workoutName, doneSets]);

  const showRestBanner = useCallback((label, duration) => {
    setRestLabel(label);
    setRestDuration(duration);
    setRestKey((k) => k + 1);
    setRestActive(true);
    restActiveRef.current = true;
    restDurationRef.current = duration;
    restLabelRef.current = label;
    // Wrist / smartwatch notification: fires when rest ends
    const exerciseName = label.split(' – ')[0];
    scheduleRestEndNotification(exerciseName, duration);
  }, []);

  const hideRestBanner = useCallback(() => {
    setRestActive(false);
    restActiveRef.current = false;
    cancelRestEndNotification();
  }, []);

  const handleRestRemainingChange = useCallback((remaining) => {
    restDurationRef.current = remaining;
    if (remaining <= 0) return;
    const exerciseName = restLabelRef.current.split(' – ')[0];
    scheduleRestEndNotification(exerciseName, remaining);
  }, []);

  const toggleHomeMode = useCallback(() => {
    if (homeTransitioning) return;
    setHomeTransitioning(true);
    Animated.timing(exerciseListOpacity, { toValue: 0.12, duration: 280, useNativeDriver: true }).start(() => {
      setExercises((prev) => {
        if (!homeModeActive) {
          originalExercisesRef.current = prev;
          return prev.map(applyHomeSwap);
        }
        return originalExercisesRef.current ?? prev;
      });
      setHomeModeActive((v) => !v);
      setTimeout(() => {
        Animated.timing(exerciseListOpacity, { toValue: 1, duration: 380, useNativeDriver: true }).start();
        setHomeTransitioning(false);
      }, 350);
    });
  }, [homeModeActive, homeTransitioning, exerciseListOpacity]);

  const confirmFirstPendingSet = useCallback(() => {
    setExercises((prev) => {
      let found = false;
      return prev.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s, si) => {
          if (!s.done && !found) {
            found = true;
            showRestBanner(`${ex.name} – s.${si + 1}`, ex.restDuration);
            return { ...s, done: true };
          }
          return s;
        }),
      }));
    });
  }, [showRestBanner]);

  const handleUpdateSet = useCallback((exIdx, setId, field, value) => {
    setExercises((prev) => prev.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) }
    ));
  }, []);

  const handleToggleSet = useCallback((exIdx, setId) => {
    setExercises((prev) => {
      const ex  = prev[exIdx];
      const set = ex.sets.find((s) => s.id === setId);
      if (set?.done) {
        return prev.map((e, i) =>
          i !== exIdx ? e : { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, done: false } : s) }
        );
      }
      // Wykrywanie PR: nowe kg > poprzedni rekord z prevLog
      const prevKg = parseFloat((set?.prevLog ?? '').split(' ')[0]);
      const newKg  = parseFloat(set?.kg ?? '');
      const hasPrevLog = set?.prevLog && set.prevLog !== '—' && !isNaN(prevKg) && prevKg > 0;
      if (set && hasPrevLog && !isNaN(newKg) && newKg > prevKg) {
        setTimeout(() => setPRData({ exerciseName: ex.name, newKg: set.kg, newReps: set.reps }), 150);
      }
      const si = ex.sets.findIndex((s) => s.id === setId);
      showRestBanner(`${ex.name} – s.${si + 1}`, ex.restDuration);
      return prev.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, done: true } : s) }
      );
    });
  }, [showRestBanner]);

  // ZADANIE 2: onDeleteSet teraz wywołuje Alert – stąd ExerciseCard wywołuje confirmDeleteSet wewnętrznie
  const handleDeleteSet = useCallback((exIdx, setId) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx || ex.sets.length <= 1) return ex;
      return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
    }));
  }, []);

  const handleAddSet = useCallback((exIdx) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, {
          id: Date.now().toString(),
          prevLog: last?.prevLog ?? '—',
          kg: last?.kg ?? '', reps: last?.reps ?? '', rpe: '',
          done: false, suggested: null, aiSuggested: false,
        }],
      };
    }));
  }, []);

  const handleDeleteExercise = useCallback((exIdx) => {
    setExercises((prev) => {
      const exId = prev[exIdx]?.id;
      if (exId) originalOrderRef.current = originalOrderRef.current.filter((id) => id !== exId);
      return prev.filter((_, i) => i !== exIdx);
    });
  }, []);

  const handleSwapExercise = useCallback((exIdx, newEx, adjustedSets) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        id:          `swapped_${newEx.id}_${Date.now()}`,
        name:        newEx.name,
        muscleGroup: (newEx.muscles ?? []).join(' · '),
        description: newEx.description ?? '',
        muscles:     newEx.muscles ?? [],
        alternatives:newEx.alternatives ?? [],
        image:       newEx.image ?? null,
        nextTrainingKg: null,
        // Jeśli SwapExerciseModal przekazał przeliczone serie — stosujemy je;
        // w przeciwnym razie zostawiamy oryginalne
        sets: adjustedSets ?? ex.sets,
      };
    }));
  }, []);

  const handleRestChange = useCallback((exIdx, sec) => {
    setExercises((prev) => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, restDuration: sec }));
  }, []);

  const handleRepsModeChange = useCallback((exIdx, mode) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const sets = ex.sets.map((s) => {
        const parsed = parseRepsString(s.reps);
        if (mode === 'single') {
          const val = parsed.mode === 'range' ? (parsed.min || parsed.max) : parsed.value;
          return { ...s, reps: val };
        }
        if (parsed.mode === 'range') return s;
        return { ...s, reps: parsed.value || '' };
      });
      return {
        ...ex,
        sets,
        planConfig: { ...(ex.planConfig ?? {}), repsMode: mode },
      };
    }));
  }, []);

  const handleCascadeUpdate = useCallback((exIdx, setIdx, newKg, newReps, nextTrainingKg) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        nextTrainingKg: nextTrainingKg != null ? nextTrainingKg : ex.nextTrainingKg,
        sets: ex.sets.map((s, si) => {
          if (si !== setIdx + 1) return s;
          return { ...s, suggested: newReps ? `${newKg} kg x ${newReps}` : `${newKg} kg`, aiSuggested: true };
        }),
      };
    }));
  }, []);

  const roundTo2_5 = useCallback((kg) => Math.round(kg / 2.5) * 2.5, []);

  // Otwiera picker z listą ćwiczeń
  const handleToggleSuperset = useCallback((exIdx) => {
    setSupersetPickerExIdx(exIdx);
  }, []);

  // Połącz lub rozłącz dwa ćwiczenia w super-serię + reorder listy
  const handleSupersetConnect = useCallback((fromExIdx, toExId, alreadyConnected) => {
    const fromEx = exercises[fromExIdx];
    if (!fromEx) return;

    if (alreadyConnected) {
      // ── ROZŁĄCZ ─────────────────────────────────────────────────────────────
      setSupersetGroups((prev) => {
        const updated = { ...prev };
        delete updated[toExId];
        const groupId = updated[fromEx.id];
        const stillHasPartner = exercises.some(
          (ex) => ex.id !== fromEx.id && ex.id !== toExId && updated[ex.id] === groupId
        );
        if (!stillHasPartner) delete updated[fromEx.id];
        return updated;
      });

      // Przywróć toExId na jego oryginalne miejsce
      setExercises((prev) => {
        const origOrder = originalOrderRef.current;
        const toEx = prev.find((ex) => ex.id === toExId);
        if (!toEx) return prev;
        const without = prev.filter((ex) => ex.id !== toExId);
        const origIdx = origOrder.indexOf(toExId);
        // Wstaw przed pierwszym ćwiczeniem, które w oryginale stało PO toExId
        let insertAt = without.length;
        for (let i = 0; i < without.length; i++) {
          if (origOrder.indexOf(without[i].id) > origIdx) {
            insertAt = i;
            break;
          }
        }
        const result = [...without];
        result.splice(insertAt, 0, toEx);
        return result;
      });
      return;
    }

    // ── POŁĄCZ ──────────────────────────────────────────────────────────────
    // 1. Aktualizuj grupy
    let resolvedGroupId;
    setSupersetGroups((prev) => {
      const updated    = { ...prev };
      resolvedGroupId  = updated[fromEx.id] ?? `ss_${fromEx.id}_${Date.now()}`;
      updated[fromEx.id] = resolvedGroupId;
      updated[toExId]    = resolvedGroupId;
      return updated;
    });

    // 2. Przesuń toEx tuż za ostatnim ćwiczeniem grupy fromEx
    setExercises((prev) => {
      const toEx = prev.find((ex) => ex.id === toExId);
      if (!toEx) return prev;
      const without = prev.filter((ex) => ex.id !== toExId);

      // Znajdź ostatnie ćwiczenie z tej samej grupy (przed usunięciem toEx)
      const currentGroupId = supersetGroups[fromEx.id]; // może być undefined (nowa grupa)
      let insertAfterIdx = without.findIndex((ex) => ex.id === fromEx.id);
      if (insertAfterIdx === -1) return prev;

      // Przesuń insertAfterIdx na koniec bieżącej grupy
      for (let i = insertAfterIdx + 1; i < without.length; i++) {
        const gid = supersetGroups[without[i].id];
        if (currentGroupId && gid === currentGroupId) {
          insertAfterIdx = i;
        } else {
          break;
        }
      }

      const result = [...without];
      result.splice(insertAfterIdx + 1, 0, toEx);
      return result;
    });
  }, [exercises, supersetGroups]);

  // ZADANIE 4: blokada przy ≥3 drop-setach
  const handleDropSetCreate = useCallback((exIdx, setIdx) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const currentDropCount = ex.sets.filter((s) => s.isDropSet).length;
      if (currentDropCount >= 3) return ex;
      const sourceSet = ex.sets[setIdx];
      const baseKg    = parseFloat(sourceSet?.kg) || 0;
      if (baseKg === 0) return ex;

      const drop1Kg = roundTo2_5(baseKg * 0.8);
      const drop2Kg = roundTo2_5(drop1Kg * 0.8);
      const ts      = Date.now();

      const dropSets = [
        { id: `drop_${ts}_1`, prevLog: sourceSet.prevLog ?? '—', kg: String(drop1Kg), reps: sourceSet.reps ?? '', rpe: '', done: false, suggested: null, aiSuggested: false, isDropSet: true },
        { id: `drop_${ts}_2`, prevLog: sourceSet.prevLog ?? '—', kg: String(drop2Kg), reps: sourceSet.reps ?? '', rpe: '', done: false, suggested: null, aiSuggested: false, isDropSet: true },
      ];

      const setsBelow = ex.sets.slice(setIdx + 1);
      // Serie poniżej bez wypełnionych danych — usuwamy, bo drop-set je zastępuje
      const keptBelow = setsBelow.filter(
        (s) => (s.kg && s.kg.trim() !== '') || (s.reps && s.reps.trim() !== '') || s.done
      );

      return {
        ...ex,
        sets: [...ex.sets.slice(0, setIdx + 1), ...dropSets, ...keptBelow],
      };
    }));
  }, [roundTo2_5]);

  // ZADANIE 5: otwieranie PlateCalculatorModal z poziomu wiersza (long-press na kg)
  const handleWeightPress = useCallback((weight) => {
    const parsed = parseFloat(weight);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedWeightForCalc(parsed);
      setIsPlateCalcVisible(true);
    }
  }, []);

  const handleAddCustomExercise = useCallback((exercise) => {
    originalOrderRef.current = [...originalOrderRef.current, exercise.id];
    setExercises((prev) => [...prev, exercise]);
  }, []);

  const handleChangeLoadMode = useCallback((exIdx, mode) => {
    setExercises((prev) => prev.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, loadMode: mode }
    ));
  }, []);

  const segmentFill = (ex) => {
    const done = ex.sets.filter((s) => s.done).length;
    return ex.sets.length === 0 ? 0 : done / ex.sets.length;
  };

  const handleMinimize = () => {
    const currentSec = timerHudRef.current?.getSeconds() ?? 0;
    minimizeWorkout({ workoutName, timerSec: currentSec, doneSets, exercises });
    // Lock-screen widget: show persistent notification with workout status
    const currentEx = exercises.find((ex) => ex.sets.some((s) => !s.done))?.name
      ?? exercises[exercises.length - 1]?.name
      ?? null;
    showWorkoutLockScreenNotification({
      workoutName,
      currentExercise: currentEx,
      doneSets,
      restSecondsLeft: restActiveRef.current ? restDurationRef.current : 0,
    });
    navigation.goBack();
  };

  const checkProgressiveOverload = useCallback((completedExercises, planId) => {
    const plan = customPlans?.find(p => p.id === planId);
    if (!plan) return;
    const improvements = [];
    completedExercises.forEach(ex => {
      const planEx = plan.exercises?.find(pe =>
        pe.id === ex.sourcePlanExId || pe.name === ex.name
      );
      if (!planEx?.planConfig) return;
      const templateKg = parseFloat(planEx.planConfig.weight || '0');
      if (!templateKg) return;
      const bestKg = Math.max(0, ...ex.sets
        .filter(s => s.done && parseFloat(s.kg) > 0)
        .map(s => parseFloat(s.kg)));
      if (bestKg > templateKg) {
        improvements.push({ name: ex.name, old: templateKg, new: bestKg, planEx });
      }
    });
    if (!improvements.length) return;
    const lines = improvements.map(i => `• ${i.name}: ${i.old} → ${i.new} kg`).join('\n');
    Alert.alert(
      '🏆 Rekord pobity!',
      `Ciężar szablonu pobity:\n${lines}\n\nZaktualizować plan?`,
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Aktualizuj',
          onPress: () => {
            const updatedExercises = plan.exercises.map(pe => {
              const imp = improvements.find(i => i.planEx === pe);
              if (!imp) return pe;
              return { ...pe, planConfig: { ...pe.planConfig, weight: String(imp.new) } };
            });
            updateCustomPlan(planId, { exercises: updatedExercises });
          },
        },
      ]
    );
  }, [customPlans, updateCustomPlan]);

  const handleFinish = () => {
    timerHudRef.current?.pause();
    setRestActive(false);
    restActiveRef.current = false;
    cancelAllWorkoutNotifications();
    setSummaryVisible(true);
  };

  const styles = makeStyles(colors);
  const bwMS   = bwModalStyles(colors);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* ─── Tryb Krajobrazowy (Rack View) ─────────────────────────── */}
          {isLandscape && (
            <RackView
              exercises={exercises}
              timerRef={timerHudRef}
              restActive={restActive}
              restDuration={restDuration}
              restKey={restKey}
              colors={colors}
            />
          )}

          {/* Segmentowy pasek postępu — kolor zmienia się gdy ćwiczenie ukończone */}
          <View style={styles.segmentBar}>
            {exercises.map((ex, idx) => {
              const done  = ex.sets.filter((s) => s.done).length;
              const total = ex.sets.length;
              const fill  = total === 0 ? 0 : done / total;
              const complete = fill >= 1;
              const started  = fill > 0;
              return (
                <View key={ex.id} style={styles.segment}>
                  {fill > 0 && (
                    <View style={[
                      styles.segmentFill,
                      { flex: fill },
                      complete && styles.segmentFillDone,
                      !complete && started && styles.segmentFillActive,
                    ]} />
                  )}
                  {fill < 1 && <View style={[styles.segmentEmpty, { flex: 1 - fill }]} />}
                </View>
              );
            })}
          </View>

          <View style={styles.topBar}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.workoutTitle} numberOfLines={1}>{workoutName}</Text>
              <Text style={styles.workoutSub}>{exercises.length} ćwiczeń · {doneSets} serii</Text>
            </View>

            {/* Tryb Domowy toggle */}
            <TouchableOpacity
              style={[styles.homeModeBtn, homeModeActive && styles.homeModeBtnActive]}
              onPress={toggleHomeMode}
              activeOpacity={0.75}
              disabled={homeTransitioning}
            >
              <Text style={styles.homeModeEmoji}>🏠</Text>
              {homeModeActive && (
                <View style={styles.homeModeDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.minimizeBtn} onPress={handleMinimize} activeOpacity={0.7}>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.endButton} onPress={handleFinish} activeOpacity={0.8}>
              <Text style={styles.endButtonText}>Zakończ</Text>
            </TouchableOpacity>
          </View>

          <WorkoutHUD
            exercises={exercises}
            heatmap={heatmap}
            timerRef={timerHudRef}
            initialSec={initialTimerSec}
            onMuscleMapPress={() => setMuscleModalVisible(true)}
          />

          {/* ZADANIE 1: ScrollView z optymalizacjami wydajności + skeleton */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            windowSize={10}
          >
            {!isReady && (
              <View style={styles.skeletonWrapper}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={styles.skeletonCard} />
                ))}
              </View>
            )}

            {/* Tryb domowy — skeleton podczas podmiany */}
            {homeTransitioning && (
              <View style={styles.skeletonWrapper}>
                <View style={styles.homeModeSkeletonBanner}>
                  <Text style={styles.homeModeSkeletonText}>
                    {homeModeActive ? '🏠 Przełączam na ćwiczenia domowe...' : '🏋️ Przywracam plan siłowniany...'}
                  </Text>
                </View>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={styles.skeletonCard} />
                ))}
              </View>
            )}

            {isReady && !homeTransitioning && (
              <Animated.View style={{ opacity: exerciseListOpacity }}>
                {exercises.map((ex, exIdx) => {
                  const group      = supersetGroups[ex.id] ?? null;
                  const nextGroup  = exercises[exIdx + 1] ? supersetGroups[exercises[exIdx + 1].id] : null;
                  const showConnector = group && nextGroup && group === nextGroup;
                  return (
                    <View key={ex.id}>
                      {ex.isHomeReplacement && (
                        <View style={styles.homeReplacementBanner}>
                          <Text style={styles.homeReplacementText}>🏠 zamiennik · {ex.originalName}</Text>
                        </View>
                      )}
                      <ExerciseCard
                        exercise={ex}
                        exIndex={exIdx}
                        onUpdateSet={handleUpdateSet}
                        onToggleSet={handleToggleSet}
                        onDeleteSet={handleDeleteSet}
                        onAddSet={handleAddSet}
                        onRestChange={handleRestChange}
                        onInfoPress={() => { setInfoExercise(ex); setInfoVisible(true); }}
                        onCascadeUpdate={handleCascadeUpdate}
                        onDeleteExercise={() => handleDeleteExercise(exIdx)}
                        onSwapExercise={handleSwapExercise}
                        onDropSetPress={handleDropSetCreate}
                        onChangeLoadMode={handleChangeLoadMode}
                        supersetGroup={group}
                        onToggleSuperset={handleToggleSuperset}
                        bodyWeight={bodyWeight}
                        onUpdateBodyWeight={() => { setTempBW(String(bodyWeight)); setBWModalVisible(true); }}
                        onRepsModeChange={handleRepsModeChange}
                      />
                      {showConnector && (
                        <SupersetConnector
                          colors={colors}
                          groupColor={supersetColor(group)}
                        />
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            )}

            {isReady && exercises.length === 0 && (
              <View style={styles.emptyPlan}>
              <Ionicons name="barbell-outline" size={40} color={colors.borderMuted} />
              <Text style={styles.emptyPlanText}>Brak ćwiczeń w tym treningu.</Text>
              </View>
            )}

            {isReady && exercises.length > 0 && (
              <View style={styles.endOfWorkout}>
                <Ionicons name="flag-outline" size={24} color={colors.borderMuted} />
                <Text style={styles.endOfWorkoutText}>Koniec planu treningowego</Text>

                {/* Notatka do treningu — dyskretny kafelek, zero związku z AI */}
                <View style={styles.noteCard}>
                  <Text style={styles.noteCardLabel}>📝 Notatka do sesji</Text>
                  <TextInput
                    style={styles.noteCardInput}
                    value={sessionNote}
                    onChangeText={setSessionNote}
                    placeholder="Jak poszło? Samopoczucie, PR, uwagi..."
                    placeholderTextColor={colors.borderMuted}
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.addCustomExBtn}
                  onPress={() => setCustomExModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.library} />
                  <Text style={styles.addCustomExText}>Dodaj własne ćwiczenie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
                  <Text style={styles.finishBtnText}>Zakończ i podsumuj</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {restActive && (
            <RestTimerBanner
              key={restKey}
              label={restLabel}
              duration={restDuration}
              onDismiss={hideRestBanner}
              onRemainingChange={handleRestRemainingChange}
            />
          )}

          <SupersetPickerModal
            visible={supersetPickerExIdx !== null}
            exercises={exercises}
            fromExIdx={supersetPickerExIdx ?? 0}
            supersetGroups={supersetGroups}
            onConnect={handleSupersetConnect}
            onClose={() => setSupersetPickerExIdx(null)}
            colors={colors}
          />
          <ExerciseInfoModal visible={infoVisible} exercise={infoExercise} onClose={() => setInfoVisible(false)} />
          <MuscleDistributionModal
            isVisible={muscleModalVisible}
            heatmap={heatmap}
            onClose={() => setMuscleModalVisible(false)}
          />
          {/* PlateCalculatorModal zastąpiony przez WeightInputModal w SwipeableSetRow */}
          <AddCustomExerciseModal
            isVisible={customExModalVisible}
            onAdd={handleAddCustomExercise}
            onClose={() => setCustomExModalVisible(false)}
          />
          <WorkoutSummaryModal
            isVisible={summaryVisible}
            onClose={() => setSummaryVisible(false)}
            summaryData={{
              totalSec:     timerHudRef.current?.getSeconds() ?? 0,
              totalTonnage: totalTonnage,
              exercises:    exercises,
              sessionNote:  sessionNote,
              workoutName:  workoutName,
            }}
            onSave={() => {
              const finalSec = timerHudRef.current?.getSeconds() ?? 0;
              saveWorkoutToHistory({ workoutName, exercises, timerSec: finalSec, tonnage: totalTonnage, note: sessionNote, sourcePlanId: customPlanId });
              setSummaryVisible(false);
              navigation?.goBack();
              if (customPlanId) {
                setTimeout(() => checkProgressiveOverload(exercises, customPlanId), 600);
              }
            }}
          />

          {/* PR Celebration */}
          <PRCelebration
            visible={!!prData}
            exerciseName={prData?.exerciseName}
            newKg={prData?.newKg}
            newReps={prData?.newReps}
            onClose={() => setPRData(null)}
          />

          {/* Quick BW Update Modal */}
          <Modal
            visible={bwModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setBWModalVisible(false)}
          >
            <TouchableOpacity
              style={bwMS.overlay}
              onPress={() => setBWModalVisible(false)}
              activeOpacity={1}
            >
              <View style={bwMS.box}>
                <View style={bwMS.handle} />
                <Text style={bwMS.title}>👤 Waga ciała</Text>
                <Text style={bwMS.subtitle}>
                  Używana do obliczeń tonażu w ćwiczeniach z obciążeniem własnym ciała.
                </Text>
                <View style={bwMS.inputRow}>
                  <TextInput
                    style={bwMS.input}
                    value={tempBW}
                    onChangeText={setTempBW}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectTextOnFocus
                    maxLength={5}
                    placeholder="80"
                    placeholderTextColor={colors.borderMuted}
                  />
                  <Text style={bwMS.unit}>kg</Text>
                </View>
                <TouchableOpacity
                  style={bwMS.saveBtn}
                  onPress={async () => {
                    await updateBodyWeight(tempBW);
                    setBWModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={16} color={colors.accentText} />
                  <Text style={bwMS.saveBtnText}>Zapisz wagę</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:        { flex: 1, backgroundColor: c.background },
  scrollContent: { paddingBottom: 240 },

  segmentBar:        { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  segment:           { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  segmentFill:       { backgroundColor: c.accent },
  segmentFillActive: { backgroundColor: c.accent },
  segmentFillDone:   { backgroundColor: c.accent },
  segmentEmpty:      { backgroundColor: c.border },

  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  workoutTitle:  { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  workoutSub:    { fontSize: 10, color: c.textSecondary, marginTop: 2 },
  minimizeBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  endButton:     { backgroundColor: c.dangerSoft, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  endButtonText: { fontSize: 13, fontWeight: '600', color: c.danger },

  emptyPlan:     { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32, gap: 12 },
  emptyPlanText: { fontSize: 14, color: c.textTertiary, textAlign: 'center' },

  endOfWorkout:     { alignItems: 'center', padding: 32, gap: 12 },
  endOfWorkoutText: { fontSize: 14, color: c.borderMuted },
  addCustomExBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.librarySoft, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 0.5, borderColor: c.librarySoft },
  addCustomExText:  { fontSize: 14, fontWeight: '600', color: c.library },
  finishBtn:        { backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14, borderWidth: 0.5, borderColor: c.border, marginTop: 4 },
  finishBtnText:    { fontSize: 15, fontWeight: '600', color: c.textSecondary },

  noteCard:       { width: '100%', backgroundColor: c.backgroundSecondary, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: c.border, gap: 8 },
  noteCardLabel:  { fontSize: 12, color: c.textTertiary, fontWeight: '500' },
  noteCardInput:  { color: c.textPrimary, fontSize: 14, lineHeight: 20, minHeight: 56 },

  skeletonWrapper: { paddingTop: 8 },
  skeletonCard:    { height: 140, backgroundColor: c.backgroundSecondary, marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 0.5, borderColor: c.border, opacity: 0.6 },

  homeModeBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: c.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: c.border,
  },
  homeModeBtnActive: {
    backgroundColor: '#EF9F2722', borderColor: '#EF9F27',
  },
  homeModeEmoji: { fontSize: 16 },
  homeModeDot: {
    position: 'absolute', top: 5, right: 5,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#EF9F27',
  },

  homeModeSkeletonBanner: {
    marginHorizontal: 16, marginBottom: 10, marginTop: 4,
    backgroundColor: '#EF9F2722',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: '#EF9F27',
    alignItems: 'center',
  },
  homeModeSkeletonText: {
    fontSize: 13, fontWeight: '600', color: '#EF9F27',
  },

  homeReplacementBanner: {
    marginHorizontal: 16, marginBottom: -6, marginTop: 6,
    backgroundColor: '#EF9F2714',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  homeReplacementText: {
    fontSize: 10, fontWeight: '500', color: '#EF9F27', letterSpacing: 0.3,
  },

  restBanner:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: c.backgroundSecondary, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 0.5, borderColor: c.border },
  restTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  restLabel:      { fontSize: 13, color: c.textSecondary, fontWeight: '500', flex: 1, marginRight: 10 },
  restDonePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  restDoneText:   { fontSize: 12, color: c.accent, fontWeight: '600' },
  restTrack:      { height: 3, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  restFill:       { height: '100%', backgroundColor: c.accent, borderRadius: 3 },
  restTimerValue: { fontSize: 46, fontWeight: '700', color: c.textPrimary, textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: 16 },
  restBtns:       { flexDirection: 'row', gap: 8 },
  restBtn:        { flex: 1, backgroundColor: c.card, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 0.5, borderColor: c.border },
  restBtnSkip:    { backgroundColor: c.accentSoft, borderColor: c.accentSoft },
  restBtnText:    { fontSize: 14, fontWeight: '600', color: c.textPrimary },
});

const bwModalStyles = (c) => StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  box: {
    width: 300, backgroundColor: c.backgroundSecondary,
    borderRadius: 22, padding: 24,
    borderWidth: 0.5, borderColor: c.border,
    alignItems: 'center', gap: 10,
  },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 4 },
  title:    { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  subtitle: { fontSize: 12, color: c.textTertiary, textAlign: 'center', lineHeight: 17, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:    {
    width: 120, height: 54,
    backgroundColor: c.background, borderWidth: 1.5, borderColor: c.accent + '88', borderRadius: 14,
    fontSize: 28, fontWeight: '700', color: c.textPrimary, textAlign: 'center',
  },
  unit:     { fontSize: 18, fontWeight: '600', color: c.textSecondary },
  saveBtn:  {
    marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.accent, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: c.accentText },
});
