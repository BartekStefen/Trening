import { Accelerometer } from 'expo-sensors';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from 'react';
import {
  Alert, Animated, Image, InteractionManager, Keyboard, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutContext } from '../context/WorkoutContext';
import { EXERCISE_DATABASE, EXERCISE_MAP } from './ExercisesLibraryScreen';
import LiveMuscleMap           from '../components/LiveMuscleMap';
import RestTimerBanner         from '../components/workout/RestTimerBanner';
import WorkoutTimerHUD         from '../components/workout/WorkoutTimerHUD';
import MuscleDistributionModal from '../components/modals/MuscleDistributionModal';

const REST_PRESETS  = Array.from({ length: 55 }, (_, i) => 30 + i * 5);
const PRESET_ITEM_H = 62;

const GYM_KEYWORDS = [
  'kg','kilo','powt','rep','rpe','rir','zapas','seri','max','maksa','pr','rekord',
  'wycisk','sztang','hantl','law','maszyn','wyciag','suwnic','gryf','talerz',
  'ciezar','obciazeni','gum','siad','ciag','martwy','pomp','podciag',
  'brzuch','klat','plec','biceps','triceps','nog','lekko','ciezko','git',
  'okej','ok','izi','izzi','luz','luzno','upadek','smierc','masakra',
  'gladko','opor','zajechany','zrobion','poszlo','wzia','dorzuc','odejmij',
  'zaloz','okolo','czuj','nastepn',
];

const MUSCLE_REGION_MAP = {
  'klatka': 'chest',      'piersiow': 'chest',
  'najszerszy': 'back_lat', 'plec': 'back_lat',
  'romboid': 'back_upper', 'trapez': 'back_upper',
  'czworoglow': 'quads',   'poslad': 'glutes',
  'dwuglow': 'hamstrings', 'lydki': 'calves',
  'biceps': 'biceps',      'ramienno': 'biceps',
  'triceps': 'triceps',
  'bark': 'shoulders',     'naramienny': 'shoulders',
  'brzuch': 'abs',         'prostownik': 'abs', 'poprzeczny': 'abs',
};

// FIX #3: guard Set – każdy region zliczany max raz na ćwiczenie,
// eliminuje potrójne duplikowanie gdy wiele kluczy mapuje ten sam region.
const buildMuscleHeatmap = (exercises) => {
  const map = {};
  exercises.forEach((ex) => {
    const doneSets = ex.sets.filter((s) => s.done).length;
    if (doneSets === 0) return;
    const mappedRegions = new Set();
    [...(ex.muscles ?? []), ...(ex.muscleGroup?.split(/[·,]/) ?? [])].forEach((m) => {
      const ml = m.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      Object.entries(MUSCLE_REGION_MAP).forEach(([key, region]) => {
        if (!mappedRegions.has(region) && ml.includes(key)) {
          mappedRegions.add(region);
          map[region] = (map[region] ?? 0) + doneSets;
        }
      });
    });
  });
  return map;
};

const fmtTime = (s) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, '0')).join(':');
const fmtDur = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sc}s`;
  return `${sc}s`;
};

const WorkoutHUD = ({ exercises, heatmap, onMuscleMapPress, timerRef, initialSec }) => {
  const tonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0) : s, 0
      ), 0), [exercises]);

  const avgRpe = useMemo(() => {
    const vals = exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.done && s.rpe && !isNaN(parseFloat(s.rpe)))
        .map((s) => parseFloat(s.rpe)));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [exercises]);

  const rpeHigh = avgRpe !== null && parseFloat(avgRpe) > 8.0;

  return (
    <View style={hudStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={hudStyles.scrollContent}
      >
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
            {avgRpe !== null ? `RPE ${avgRpe}` : '—'}
          </Text>
        </View>
        <View style={hudStyles.sep} />

        <View style={hudStyles.cell}>
          <Ionicons name="water" size={10} color="#378ADD" />
          <Text style={[hudStyles.valWhite, { color: '#378ADD' }]}>250 ml</Text>
        </View>
        <View style={hudStyles.sep} />

        <TouchableOpacity
          style={[hudStyles.cell, hudStyles.muscleBtn]}
          onPress={onMuscleMapPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="body-outline" size={22} color={Object.keys(heatmap).length > 0 ? '#FF5252' : '#636366'} />
          {Object.keys(heatmap).length > 0 && (
            <View style={hudStyles.muscleBadge}>
              <Text style={hudStyles.muscleBadgeText}>{Object.keys(heatmap).length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const hudStyles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: 'rgba(18,18,18,0.97)',
    borderRadius: 14, borderWidth: 0.5, borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  scrollContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  cell:      { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, minWidth: 62 },
  lbl:       { fontSize: 9, color: '#888888', marginBottom: 2, letterSpacing: 0.3 },
  valGreen:  { fontSize: 13, fontWeight: '700', color: '#00E676', fontVariant: ['tabular-nums'] },
  valWhite:  { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  sep:       { width: 0.5, height: 28, backgroundColor: '#2C2C2E' },
  muscleBtn:       { paddingHorizontal: 14, position: 'relative' },
  muscleBadge:     { position: 'absolute', top: -4, right: 6, backgroundColor: '#FF5252', borderRadius: 7, minWidth: 14, height: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  muscleBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
});

const UPPER_EXERCISES = () => [
  {
    id: 'ex1', name: 'Wyciskanie sztangi leżąc', muscleGroup: 'Klatka · Triceps · Barki',
    description: 'Opuść kontrolowanie do klatki, wypychaj eksplozywnie. Łopatki ściągnięte.',
    muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'],
    alternatives: ['c3', 'c5'], restDuration: 120, nextTrainingKg: null,
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

const convertLibraryExercise = (ex, index) => ({
  id: `custom_${ex.id}_${index}`,
  name: ex.name,
  muscleGroup: (ex.muscles ?? []).join(' · '),
  description: ex.description ?? '',
  muscles: ex.muscles ?? [],
  alternatives: ex.alternatives ?? [],
  image: ex.image ?? null,
  restDuration: 90,
  nextTrainingKg: null,
  sets: [
    { id: `cs_${ex.id}_1`, prevLog: '—', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    { id: `cs_${ex.id}_2`, prevLog: '—', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
    { id: `cs_${ex.id}_3`, prevLog: '—', kg: '', reps: '', rpe: '', done: false, suggested: null, aiSuggested: false },
  ],
});

const calculateAPRE = (sets, prevLog) => {
  const lastDone = [...sets].reverse().find((s) => s.done && s.kg);
  const rawFirst = (prevLog ?? '').split(' ')[0] ?? '0';
  const baseKg   = lastDone ? parseFloat(lastDone.kg) : parseFloat(rawFirst);
  const baseReps = lastDone?.reps || (prevLog ?? '').split('x')[1]?.trim().split(' ')[0] || '8';
  if (isNaN(baseKg) || baseKg === 0) return { suggestedKg: null, label: '—' };
  const rpe   = lastDone ? parseFloat(lastDone.rpe) : NaN;
  const rir   = isNaN(rpe) ? NaN : 10 - rpe;
  const delta = isNaN(rir) ? 2.5 : rir >= 3 ? 5 : rir >= 1 ? 2.5 : -(baseKg * 0.05);
  const rounded = Math.round(Math.max(0, baseKg + delta) * 2) / 2;
  return { suggestedKg: rounded, label: `${rounded} kg x ${baseReps}` };
};

// FIX #1 (ActiveWorkoutScreen side): normalizacja w parseSlangInput
const parseSlangInput = (inputText) => {
  if (!inputText) return null;
  const normalizedText = inputText.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const patterns = [
    /(?:zapas(?:u|em)?|zostalo|rir)\s*(?:na\s*)?(\d+)\s*/i,
    /(\d+)\s*(?:zapas|zostalo|rir)\s*/i,
    /(?:na\s*)?(\d+)\s*(?:w\s*)?(?:zapas|rezerw)\s*/i,
    /rpe\s*(\d+(?:[.,]\d+)?)\s*/i,
  ];

  for (const pat of patterns) {
    const m = normalizedText.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (pat.source.includes('rpe')) return { rir: Math.max(0, Math.round(10 - val)) };
      return { rir: Math.round(val) };
    }
  }

  if (/\b(?:max|upadek|fail)\b/.test(normalizedText))                          return { rir: 0 };
  if (/\b(?:lekko|luz|git|okej|ok|izi|izzi|gladko|poszlo)\b/.test(normalizedText)) return { rir: 3 };
  if (/\b(?:ciezko|smierc|masakra|opor|zajechany)\b/.test(normalizedText))     return { rir: 0 };

  return null;
};

const deltaFromRir = (rir) => {
  if (rir >= 3) return 5;
  if (rir >= 1) return 2.5;
  return 0;
};

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

  const currentKg   = extractedKg   ?? parseFloat(uiKg)  ?? null;
  const currentReps = extractedReps ?? parseInt(uiReps)   ?? null;
  if (!currentKg) return { type: 'error', message: '❌ Nie znaleziono ciężaru.' };

  const slang = parseSlangInput(raw);
  const rir   = slang?.rir ?? null;

  if (rir !== null) {
    const deltaKg  = deltaFromRir(rir);
    const findings = rir >= 3 ? `Duży zapas sił (RIR ${rir})` : rir >= 1 ? `Umiarkowany zapas (RIR ${rir})` : 'RIR 0 – limit intensywności';
    const decision = rir >= 3 ? `+${deltaKg} kg` : rir >= 1 ? `+${deltaKg} kg` : 'Utrzymaj ciężar';
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

import SwipeableSetRow      from '../components/workout/SwipeableSetRow';
import RestPickerModal      from '../components/modals/RestPickerModal';
import SwapExerciseModal    from '../components/modals/SwapExerciseModal';
import WorkoutSummaryModal  from '../components/modals/WorkoutSummaryModal';
import PlateCalculatorModal from '../components/workout/PlateCalculatorModal';
import DropSetButton from '../components/workout/DropSetButton';

const ConfirmModal = ({ visible, title, body, confirmLabel, confirmDanger, onConfirm, onCancel }) => (
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

const confirmStyles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  box:         { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, width: '100%', borderWidth: 0.5, borderColor: '#2C2C2E' },
  title:       { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  body:        { fontSize: 14, color: '#8E8E93', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  actions:     { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText:  { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  confirmBtn:  { flex: 1, backgroundColor: '#00E676', borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#000000' },
});

const ExerciseInfoModal = ({ visible, exercise, onClose }) => (
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

const infoStyles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#111111' },
  handle:           { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:         { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  content:          { padding: 24, paddingTop: 16 },
  title:            { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle:         { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  imagePlaceholder: { height: 160, backgroundColor: '#1C1C1E', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 10, borderWidth: 0.5, borderColor: '#2C2C2E' },
  imageText:        { fontSize: 13, color: '#3A3A3C' },
  sl:               { fontSize: 11, fontWeight: '700', color: '#636366', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  description:      { fontSize: 15, color: '#EBEBEB', lineHeight: 23, marginBottom: 24 },
  muscleRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676' },
  muscleText:       { fontSize: 15, color: '#FFFFFF' },
});

// FIX #4: miniaturka ćwiczenia w stylu Hevy – Image 40×40 z lewej strony nazwy
const ExerciseCard = memo(function ExerciseCard({
  exercise, exIndex,
  onUpdateSet, onToggleSet, onDeleteSet, onAddSet,
  onRestChange, onInfoPress, onCascadeUpdate,
  onDeleteExercise, onSwapExercise,
  onDropSetPress, onWeightPress,
}) {
  const [restModal, setRestModal]         = useState(false);
  const [swapModal, setSwapModal]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fmt       = (s) => s < 60 ? `${s} s` : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} min`;
  const progression = useMemo(
    () => calculateAPRE(exercise.sets, exercise.sets[0]?.prevLog),
    [exercise.sets],
  );

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        {/* FIX #4: miniaturka z EXERCISE_DATABASE / convertLibraryExercise */}
        <Image
          source={{ uri: exercise.image ?? 'https://via.placeholder.com/40/2C2C2E/636366?text=EX' }}
          style={cardStyles.thumbnail}
        />
        <View style={{ flex: 1, marginRight: 10 }}>
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
      </View>

      <TouchableOpacity style={cardStyles.restChip} onPress={() => setRestModal(true)} activeOpacity={0.7}>
        <Ionicons name="timer-outline" size={13} color="#8E8E93" />
        <Text style={cardStyles.restChipText}>Przerwa: {fmt(exercise.restDuration)}</Text>
        <Ionicons name="chevron-down" size={12} color="#3A3A3C" />
      </TouchableOpacity>

      <View style={cardStyles.colHeaders}>
        <View style={{ width: 20 }} />
        <View style={{ flex: 1 }}><Text style={cardStyles.colH}>Poprzednio</Text></View>
        <Text style={[cardStyles.colH, { width: 46, textAlign: 'center' }]}>RPE</Text>
        <Text style={[cardStyles.colH, { width: 46, textAlign: 'center' }]}>kg</Text>
        <Text style={[cardStyles.colH, { width: 52, textAlign: 'center' }]}>Powt.</Text>
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
          onCascadeUpdate={(newKg, newReps) => onCascadeUpdate(exIndex, idx, newKg, newReps, null)}
          onDropSetPress={() => onDropSetPress?.(exIndex, idx)}
          onWeightPress={(w) => onWeightPress?.(w)}
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
        <TouchableOpacity style={cardStyles.deleteExBtn} onPress={() => setDeleteConfirm(true)} activeOpacity={0.7}>
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
        onSwap={(newEx) => { onSwapExercise(exIndex, newEx); setSwapModal(false); }}
        onClose={() => setSwapModal(false)}
      />
      <ConfirmModal
        visible={deleteConfirm}
        title="Usuń ćwiczenie?"
        body={`Czy na pewno chcesz usunąć\n${exercise.name}\nz tego treningu?`}
        confirmLabel="Usuń"
        confirmDanger
        onConfirm={() => { setDeleteConfirm(false); onDeleteExercise(); }}
        onCancel={() => setDeleteConfirm(false)}
      />
    </View>
  );
});

const cardStyles = StyleSheet.create({
  card:          { backgroundColor: '#121212', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: '#2C2C2E' },
  header:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  thumbnail:     { width: 40, height: 40, borderRadius: 8, backgroundColor: '#2C2C2E' },
  name:          { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  muscles:       { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  nextKg:        { fontSize: 11, color: '#636366', marginTop: 4 },
  infoBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  restChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#2C2C2E', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 12 },
  restChipText:  { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  colHeaders:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  colH:          { fontSize: 10, color: '#636366', fontWeight: '500', letterSpacing: 0.3 },
  divider:       { height: 0.5, backgroundColor: '#2C2C2E', marginVertical: 12 },
  actions:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, paddingVertical: 10, borderWidth: 1 },
  actionAdd:     { backgroundColor: 'rgba(0,230,118,0.08)', borderColor: 'rgba(0,230,118,0.2)' },
  actionAddText: { fontSize: 13, fontWeight: '500', color: '#00E676' },
  actionSwap:    { backgroundColor: '#0A0A0A', borderColor: '#2C2C2E' },
  actionSwapText:{ fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  deleteExBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,82,82,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,82,82,0.3)' },
});

export default function ActiveWorkoutScreen({ navigation, route }) {
  const { activeWorkout, minimizeWorkout, saveWorkoutToHistory, clearActiveWorkout } = useWorkoutContext();

  const workoutName     = route?.params?.templateName ?? activeWorkout?.workoutName ?? 'Mój trening';
  const templateId      = route?.params?.templateId;
  const customExercises = route?.params?.customExercises;

  const initialExercises = useMemo(() => {
    if (activeWorkout?.exercises?.length > 0) return activeWorkout.exercises;
    if (customExercises?.length > 0) return customExercises.map(convertLibraryExercise);
    if (templateId === 'lower') return LOWER_EXERCISES();
    return UPPER_EXERCISES();
  }, []);

  const initialTimerSec = activeWorkout?.timerSec ?? 0;

  const [exercises, setExercises]           = useState(initialExercises);
  const [restActive, setRestActive]         = useState(false);
  const [restDuration, setRestDuration]     = useState(120);
  const [restLabel, setRestLabel]           = useState('');
  const [restKey, setRestKey]               = useState(0);
  const [infoVisible, setInfoVisible]       = useState(false);
  const [infoExercise, setInfoExercise]     = useState(null);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const timerHudRef = useRef(null);
  const [muscleModalVisible, setMuscleModalVisible] = useState(false);
  const [isPlateCalcVisible, setIsPlateCalcVisible]       = useState(false);
  const [selectedWeightForCalc, setSelectedWeightForCalc] = useState(0);

  // FIX #2: InteractionManager – lista ćwiczeń renderowana dopiero po zakończeniu
  // animacji wsuwania ekranu, eliminuje freeze ~2s przy maksymalizacji.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    clearActiveWorkout?.();
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, []);

  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (Math.abs(z) > 1.8) confirmFirstPendingSet();
    });
    return () => sub.remove();
  }, [exercises]);

  const heatmap = useMemo(() => buildMuscleHeatmap(exercises), [exercises]);
  const totalTonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0) : s, 0
      ), 0), [exercises]);
  const doneSets = useMemo(() =>
    exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0),
  [exercises]);

  const showRestBanner = useCallback((label, duration) => {
    setRestLabel(label);
    setRestDuration(duration);
    setRestKey((k) => k + 1);
    setRestActive(true);
  }, []);

  const hideRestBanner = useCallback(() => {
    setRestActive(false);
  }, []);

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
      const si = ex.sets.findIndex((s) => s.id === setId);
      showRestBanner(`${ex.name} – s.${si + 1}`, ex.restDuration);
      return prev.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, done: true } : s) }
      );
    });
  }, [showRestBanner]);

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
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  }, []);

  const handleSwapExercise = useCallback((exIdx, newEx) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        id: `swapped_${newEx.id}_${Date.now()}`,
        name: newEx.name,
        muscleGroup: (newEx.muscles ?? []).join(' · '),
        description: newEx.description ?? '',
        muscles: newEx.muscles ?? [],
        alternatives: newEx.alternatives ?? [],
        image: newEx.image ?? null,
        nextTrainingKg: null,
      };
    }));
  }, []);

  const handleRestChange = useCallback((exIdx, sec) => {
    setExercises((prev) => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, restDuration: sec }));
  }, []);

  const handleCascadeUpdate = useCallback((exIdx, setIdx, newKg, newReps, nextTrainingKg) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        nextTrainingKg: nextTrainingKg != null ? nextTrainingKg : ex.nextTrainingKg,
        sets: ex.sets.map((s, si) => {
          if (si !== setIdx + 1) return s;
          return {
            ...s,
            suggested:   newReps ? `${newKg} kg x ${newReps}` : `${newKg} kg`,
            aiSuggested: true,
          };
        }),
      };
    }));
  }, []);

  // Zaokrąglenie do najbliższych 2.5 kg
  const roundTo2_5 = (kg) => Math.round(kg / 2.5) * 2.5;

  const handleDropSetCreate = useCallback((exIdx, setIdx) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const sourceSet = ex.sets[setIdx];
      const baseKg    = parseFloat(sourceSet?.kg) || 0;
      if (baseKg === 0) return ex;

      const drop1Kg = roundTo2_5(baseKg * 0.8);
      const drop2Kg = roundTo2_5(drop1Kg * 0.8);

      const newSets = [
        {
          id:          `drop_${Date.now()}_1`,
          prevLog:     sourceSet.prevLog ?? '—',
          kg:          String(drop1Kg),
          reps:        sourceSet.reps ?? '',
          rpe:         '',
          done:        false,
          suggested:   null,
          aiSuggested: false,
          isDropSet:   true,
        },
        {
          id:          `drop_${Date.now()}_2`,
          prevLog:     sourceSet.prevLog ?? '—',
          kg:          String(drop2Kg),
          reps:        sourceSet.reps ?? '',
          rpe:         '',
          done:        false,
          suggested:   null,
          aiSuggested: false,
          isDropSet:   true,
        },
      ];

      const updatedSets = [
        ...ex.sets.slice(0, setIdx + 1),
        ...newSets,
        ...ex.sets.slice(setIdx + 1),
      ];

      return { ...ex, sets: updatedSets };
    }));
  }, []);

  const handleWeightPress = useCallback((weight) => {
    const parsed = parseFloat(weight);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedWeightForCalc(parsed);
      setIsPlateCalcVisible(true);
    }
  }, []);

  const segmentFill = (ex) => {
    const done = ex.sets.filter((s) => s.done).length;
    return ex.sets.length === 0 ? 0 : done / ex.sets.length;
  };

  const handleMinimize = () => {
    const currentSec = timerHudRef.current?.getSeconds() ?? 0;
    minimizeWorkout({ workoutName, timerSec: currentSec, doneSets, exercises });
    navigation.goBack();
  };

  const handleFinish = () => {
    timerHudRef.current?.pause();
    setRestActive(false);
    setSummaryVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          <View style={styles.segmentBar}>
            {exercises.map((ex) => {
              const fill = segmentFill(ex);
              return (
                <View key={ex.id} style={styles.segment}>
                  {fill > 0 && <View style={[styles.segmentFill,  { flex: fill }]} />}
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
            <TouchableOpacity style={styles.minimizeBtn} onPress={handleMinimize} activeOpacity={0.7}>
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
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

          {/* FIX #2: skeleton placeholder do czasu zakończenia animacji wejścia */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isReady && (
              <View style={styles.skeletonWrapper}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={styles.skeletonCard} />
                ))}
              </View>
            )}

            {isReady && exercises.map((ex, exIdx) => (
              <ExerciseCard
                key={ex.id}
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
                onWeightPress={handleWeightPress}
              />
            ))}

            {isReady && exercises.length === 0 && (
              <View style={styles.emptyPlan}>
                <Ionicons name="barbell-outline" size={40} color="#3A3A3C" />
                <Text style={styles.emptyPlanText}>Brak ćwiczeń w tym treningu.</Text>
              </View>
            )}

            {isReady && (
              <View style={styles.endOfWorkout}>
                <Ionicons name="flag-outline" size={24} color="#3A3A3C" />
                <Text style={styles.endOfWorkoutText}>Koniec planu treningowego</Text>
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
            />
          )}

          <ExerciseInfoModal visible={infoVisible} exercise={infoExercise} onClose={() => setInfoVisible(false)} />
          <MuscleDistributionModal
            isVisible={muscleModalVisible}
            heatmap={heatmap}
            onClose={() => setMuscleModalVisible(false)}
          />
          <PlateCalculatorModal
            isVisible={isPlateCalcVisible}
            targetWeight={selectedWeightForCalc}
            onClose={() => setIsPlateCalcVisible(false)}
          />
          <WorkoutSummaryModal
            isVisible={summaryVisible}
            onClose={() => setSummaryVisible(false)}
            summaryData={{
              totalSec:     timerHudRef.current?.getSeconds() ?? 0,
              totalTonnage: totalTonnage,
              exercises:    exercises,
            }}
            onSave={() => {
              const finalSec = timerHudRef.current?.getSeconds() ?? 0;
              saveWorkoutToHistory({ workoutName, exercises, timerSec: finalSec, tonnage: totalTonnage });
              setSummaryVisible(false);
              navigation?.goBack();
            }}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#000000' },
  scrollContent: { paddingBottom: 240 },

  segmentBar:   { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  segment:      { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  segmentFill:  { backgroundColor: '#00E676' },
  segmentEmpty: { backgroundColor: '#2C2C2E' },

  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  workoutTitle:  { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  workoutSub:    { fontSize: 10, color: '#8E8E93', marginTop: 2 },
  minimizeBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  endButton:     { backgroundColor: 'rgba(255,69,58,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  endButtonText: { fontSize: 13, fontWeight: '600', color: '#FF453A' },

  emptyPlan:     { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32, gap: 12 },
  emptyPlanText: { fontSize: 14, color: '#636366', textAlign: 'center' },

  endOfWorkout:     { alignItems: 'center', padding: 32, gap: 12 },
  endOfWorkoutText: { fontSize: 14, color: '#3A3A3C' },
  finishBtn:        { backgroundColor: '#1C1C1E', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14, borderWidth: 0.5, borderColor: '#2C2C2E', marginTop: 4 },
  finishBtnText:    { fontSize: 15, fontWeight: '600', color: '#8E8E93' },

  // FIX #2: skeleton cards – widoczne przez ~100-300ms zamiast frozen UI
  skeletonWrapper: { paddingTop: 8 },
  skeletonCard:    { height: 140, backgroundColor: '#121212', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 0.5, borderColor: '#2C2C2E', opacity: 0.6 },

  restBanner:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,10,0.97)', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 0.5, borderColor: '#2C2C2E' },
  restTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  restLabel:     { fontSize: 13, color: '#8E8E93', fontWeight: '500', flex: 1, marginRight: 10 },
  restDonePill:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  restDoneText:  { fontSize: 12, color: '#00E676', fontWeight: '600' },
  restTrack:     { height: 3, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  restFill:      { height: '100%', backgroundColor: '#00E676', borderRadius: 3 },
  restTimerValue:{ fontSize: 46, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: 16 },
  restBtns:      { flexDirection: 'row', gap: 8 },
  restBtn:       { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  restBtnSkip:   { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.25)' },
  restBtnText:   { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});