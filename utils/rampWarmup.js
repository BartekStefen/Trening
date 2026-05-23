import { EXERCISE_MAP } from '../screens/ExercisesLibraryScreen';

const roundKg = (kg) => Math.max(0, Math.round(kg / 2.5) * 2.5);

export const parseWorkingKg = (sets) => {
  const working = (sets ?? []).filter((s) => !s.isRamp);

  for (let i = working.length - 1; i >= 0; i--) {
    const kg = parseFloat(working[i].kg);
    if (kg > 0) return kg;
  }

  for (let i = working.length - 1; i >= 0; i--) {
    const fromLog = parseFloat((working[i].prevLog ?? '').split(' ')[0]);
    if (!isNaN(fromLog) && fromLog > 0) return fromLog;
  }

  return null;
};

export const parseWorkingReps = (sets) => {
  const working = (sets ?? []).filter((s) => !s.isRamp);

  for (let i = working.length - 1; i >= 0; i--) {
    const r = parseInt(String(working[i].reps ?? '').split('-')[0], 10);
    if (r > 0) return r;
  }

  return 8;
};

const inferEquipment = (ex) => {
  const name = (ex.name ?? '').toLowerCase();
  if (name.includes('maszyn') || name.includes('wyciąg') || name.includes('pushdown')) return 'Maszyna';
  if (name.includes('hantl')) return 'Hantle';
  if (name.includes('gum')) return 'Gumy';
  if (name.includes('drąż') || name.includes('podciąg') || name.includes('dip')) return 'Drążek';
  if (name.includes('sztang') || name.includes('wycisk') || name.includes('przysiad') || name.includes('martwy')) return 'Sztanga';
  return 'Ogólne';
};

/** Klasyfikacja każdego ćwiczenia — zawsze zwraca profil rozgrzewki */
export const classifyExercise = (ex) => {
  const lib = ex.sourcePlanExId ? EXERCISE_MAP[ex.sourcePlanExId] : null;
  const name = (ex.name ?? '').toLowerCase();
  const muscles = ex.muscles ?? lib?.muscles ?? [];
  const equipment = lib?.equipment ?? inferEquipment(ex);
  const loadMode = ex.loadMode ?? 'barbell';
  const muscleCount = muscles.length || 1;

  if (
    ex.exerciseType === 'bodyweight_weighted'
    || loadMode === 'bodyweight'
    || equipment === 'Drążek'
    || /podciąg|dip|pomp|drąż|pull.?up|mus.?up/.test(name)
  ) {
    return 'bodyweight';
  }

  if (loadMode === 'bands' || equipment === 'Gumy oporowe') return 'bands';

  const heavyKeywords = /przysiad|martwy|wycisk.*sztang|ciąg|squat|deadlift|bench press|hip thrust|żołniersk/;
  const moderateKeywords = /wiosłow|rumun|wykrok|goblet|hantl|wycisk.*hantl|row|lunge|press/;

  if (
    equipment === 'Sztanga'
    && (muscleCount >= 2 || heavyKeywords.test(name))
  ) {
    return 'heavy_compound';
  }

  if (
    heavyKeywords.test(name)
    || (muscleCount >= 3 && equipment !== 'Maszyna')
  ) {
    return 'heavy_compound';
  }

  if (
    moderateKeywords.test(name)
    || muscleCount >= 2
    || equipment === 'Hantle'
    || equipment === 'Kettlebell'
  ) {
    return 'moderate';
  }

  if (equipment === 'Maszyna' || equipment === 'Wyciąg' || muscleCount === 1) {
    return 'isolation';
  }

  return 'moderate';
};

const estimateWorkingKg = (ex, profile) => {
  const lib = ex.sourcePlanExId ? EXERCISE_MAP[ex.sourcePlanExId] : null;
  const equipment = lib?.equipment ?? inferEquipment(ex);

  const defaults = {
    heavy_compound: 60,
    moderate: 20,
    isolation: 15,
    bands: 0,
    bodyweight: 0,
  };

  if (equipment === 'Sztanga') return 60;
  if (equipment === 'Hantle') return 16;
  if (equipment === 'Maszyna' || equipment === 'Wyciąg') return 25;
  return defaults[profile] ?? 20;
};

const PROFILE_CONFIG = {
  heavy_compound: {
    title: 'Protokół RAMP (boj wielostawowy)',
    rationale:
      'RAMP (Raise–Activate–Motivate–Potentiate) — stopniowa progresja przed ciężkimi seriami. '
      + 'Aktywuje układ nerwowo-mięśniowy i stawy bez zmęczenia przed seriami roboczymi (ACSM, NSCA).',
    steps: [
      { pct: 0.4, reps: '8', purpose: 'Aktywacja wzorców ruchowych — rozgrzanie stawów i więzadeł' },
      { pct: 0.6, reps: '5', purpose: 'Progresja — przygotowanie układu nerwowo-mięśniowego' },
      { pct: 0.8, reps: '3', purpose: 'Potencjacja — zbliżenie do ciężaru roboczego' },
    ],
  },
  moderate: {
    title: 'Rozgrzewka progresywna (ćwiczenie złożone)',
    rationale:
      'Przed ćwiczeniami wielostawowymi o umiarkowanym ciężaru zaleca się 2 serie rozgrzewkowe '
      + 'w zakresie 50–70% obciążenia roboczego, aby przygotować stawy i mięśnie (ACSM).',
    steps: [
      { pct: 0.5, reps: '10', purpose: 'Rozgrzanie stawów — pełny zakres ruchu, kontrolowane tempo' },
      { pct: 0.7, reps: '6', purpose: 'Aktywacja mięśni docelowych przed serią roboczą' },
    ],
  },
  isolation: {
    title: 'Rozgrzewka izolacyjna',
    rationale:
      'Przy ćwiczeniach izolacyjnych wystarczą 2 lekkie serie (40–60% ciężaru), '
      + 'aby przepłukać staw i mięsień docelowy bez zmęczenia (ACSM Guidelines).',
    steps: [
      { pct: 0.4, reps: '15', purpose: 'Lekka seria — nauka wzorca ruchu i tętnica do mięśnia' },
      { pct: 0.6, reps: '10', purpose: 'Stopniowe zwiększenie obciążenia przed serią roboczą' },
    ],
  },
  bodyweight: {
    title: 'Rozgrzewka kalisteniczna',
    rationale:
      'Przy ćwiczeniach z masą ciała rozgrzewka opiera się na progresji powtórzeń — '
      + 'najpierw mniejsza objętość, potem zbliżenie do serii roboczej (NSCA).',
    steps: [
      { repPct: 0.5, purpose: 'Aktywacja — połowa docelowych powtórzeń, pełna kontrola' },
      { repPct: 0.75, purpose: 'Potencjacja — zbliżenie do objętości roboczej' },
    ],
  },
  bands: {
    title: 'Rozgrzewka z gumą oporową',
    rationale:
      'Przy pracy z gumą zacznij od lżejszego oporu, progresywnie zwiększając napięcie — '
      + 'przygotowuje stawy bez przeciążenia (ACSM).',
    steps: [
      { pct: 0.5, reps: '12', purpose: 'Lekki opór — pełny zakres, aktywacja stabilizatorów' },
      { pct: 0.75, reps: '8', purpose: 'Większe napięcie — przygotowanie do serii roboczej' },
    ],
  },
};

const buildWeightedSteps = (workingKg, config) =>
  config.steps.map((step, i) => ({
    id: i + 1,
    kg: String(roundKg(Math.max(2.5, workingKg * step.pct))),
    reps: step.reps,
    pct: Math.round(step.pct * 100),
    purpose: step.purpose,
    restSec: 60,
  }));

const buildBodyweightSteps = (workingReps, config) =>
  config.steps.map((step, i) => ({
    id: i + 1,
    kg: 'BW',
    reps: String(Math.max(3, Math.round(workingReps * step.repPct))),
    pct: Math.round(step.repPct * 100),
    purpose: step.purpose,
    restSec: 45,
  }));

export const getRampRecommendation = (ex, options = {}) => {
  const { overrideWorkingKg, overrideWorkingReps } = options;
  const alreadyApplied = ex.sets.some((s) => s.isRamp);
  const profile = classifyExercise(ex);
  const config = PROFILE_CONFIG[profile];

  const parsedKg = parseWorkingKg(ex.sets);
  const parsedReps = parseWorkingReps(ex.sets);

  const hasManualKg = overrideWorkingKg != null && overrideWorkingKg > 0;
  let workingKg = hasManualKg ? overrideWorkingKg : parsedKg;
  const workingReps = overrideWorkingReps ?? parsedReps;
  const usedEstimate = !hasManualKg && !workingKg && profile !== 'bodyweight';

  if (!workingKg && profile !== 'bodyweight') {
    workingKg = estimateWorkingKg(ex, profile);
  }

  let steps;
  if (profile === 'bodyweight') {
    steps = buildBodyweightSteps(workingReps, config);
  } else {
    steps = buildWeightedSteps(workingKg, config);
  }

  let weightSource = 'estimate';
  if (hasManualKg) weightSource = 'manual';
  else if (parsedKg) weightSource = 'training';

  let rationale = config.rationale;
  if (usedEstimate) {
    rationale += ` (Szacunkowy ciężar roboczy: ${workingKg} kg — kliknij chip powyżej, aby wpisać właściwy.)`;
  } else if (weightSource === 'training') {
    rationale += ' (Ciężar roboczy pobrany z ostatniego wpisu w treningu.)';
  }

  return {
    applicable: true,
    alreadyApplied,
    profile,
    compound: profile === 'heavy_compound',
    workingKg: profile === 'bodyweight' ? null : workingKg,
    workingReps,
    usedEstimate,
    weightSource,
    title: config.title,
    rationale,
    steps,
  };
};

const buildRampSetsFromSteps = (steps) =>
  steps.map((step, i) => ({
    id: `ramp_${Date.now()}_${i}`,
    prevLog: '—',
    kg: step.kg === 'BW' ? '' : step.kg,
    reps: step.reps,
    rpe: '',
    done: false,
    suggested: step.kg === 'BW' ? 'Rozgrzewka BW' : null,
    aiSuggested: false,
    isRamp: true,
  }));

export const applyRampToExercise = (ex, overrideWorkingKg) => {
  if (ex.sets.some((s) => s.isRamp)) return ex;

  const plan = getRampRecommendation(ex, { overrideWorkingKg });
  if (!plan.steps.length) return ex;

  const rampSets = buildRampSetsFromSteps(plan.steps);
  return { ...ex, sets: [...rampSets, ...ex.sets] };
};

export const getSetRestDuration = (ex, set) =>
  set?.isRamp ? 60 : (ex.restDuration ?? 90);

// Zachowane dla kompatybilności
export const isCompoundExercise = (ex) =>
  classifyExercise(ex) === 'heavy_compound';
