import { DEFAULT_NUTRITION, RING_VOLUME_GOALS, RING_WEEK_SESSION_GOAL } from '../constants/dietNutrition';
import { buildReadinessOpts, computeLevelSystem, computeReadinessScore } from './profileAnalytics';
import { targetCalories } from './tdee';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const todayKey = () => new Date().toISOString().slice(0, 10);

const isSameDay = (iso, key = todayKey()) => {
  try {
    return new Date(iso).toISOString().slice(0, 10) === key;
  } catch {
    return false;
  }
};

const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

export const RING_METRICS = {
  volume_day: {
    id: 'volume_day',
    label: 'Objętość dziś',
    short: 'Tonaż',
    color: '#A78BFA',
    unit: 'kg',
    category: 'trening',
  },
  volume_week: {
    id: 'volume_week',
    label: 'Objętość tydzień',
    short: 'Tydz.',
    color: '#8B5CF6',
    unit: 'kg',
    category: 'trening',
  },
  water: {
    id: 'water',
    label: 'Nawodnienie',
    short: 'Woda',
    color: '#378ADD',
    unit: 'ml',
    category: 'dieta',
  },
  calories: {
    id: 'calories',
    label: 'Kalorie',
    short: 'kcal',
    color: '#FF6B6B',
    unit: 'kcal',
    category: 'dieta',
  },
  protein: {
    id: 'protein',
    label: 'Białko',
    short: 'B',
    color: '#00E676',
    unit: 'g',
    category: 'dieta',
  },
  fat: {
    id: 'fat',
    label: 'Tłuszcze',
    short: 'T',
    color: '#EF9F27',
    unit: 'g',
    category: 'dieta',
  },
  carbs: {
    id: 'carbs',
    label: 'Węglowodany',
    short: 'W',
    color: '#378ADD',
    unit: 'g',
    category: 'dieta',
  },
  sessions_week: {
    id: 'sessions_week',
    label: 'Treningi w tyg.',
    short: 'Sesje',
    color: '#00E676',
    unit: '',
    category: 'trening',
  },
  readiness: {
    id: 'readiness',
    label: 'Gotowość',
    short: 'Got.',
    color: '#FAC775',
    unit: '/10',
    category: 'regeneracja',
  },
  habits: {
    id: 'habits',
    label: 'Nawyki dzienne',
    short: 'Naw.',
    color: '#34D399',
    unit: '',
    category: 'regeneracja',
  },
  water_streak: {
    id: 'water_streak',
    label: 'Seria wody',
    short: 'H₂O',
    color: '#378ADD',
    unit: 'dni',
    category: 'regeneracja',
  },
  sessions_total: {
    id: 'sessions_total',
    label: 'Łącznie sesji',
    short: 'Sesje',
    color: '#22D3EE',
    unit: '',
    category: 'trening',
  },
  workout_streak: {
    id: 'workout_streak',
    label: 'Seria treningów',
    short: 'Seria',
    color: '#F472B6',
    unit: 'dni',
    category: 'trening',
  },
  training_minutes: {
    id: 'training_minutes',
    label: 'Czas treningu dziś',
    short: 'Min',
    color: '#FB923C',
    unit: 'min',
    category: 'trening',
  },
  wellness_sleep: {
    id: 'wellness_sleep',
    label: 'Jakość snu',
    short: 'Sen',
    color: '#818CF8',
    unit: '/5',
    category: 'regeneracja',
  },
  wellness_energy: {
    id: 'wellness_energy',
    label: 'Energia',
    short: 'Energ.',
    color: '#FACC15',
    unit: '/5',
    category: 'regeneracja',
  },
  wellness_doms: {
    id: 'wellness_doms',
    label: 'Regeneracja mięśni',
    short: 'DOMS',
    color: '#A3E635',
    unit: '/5',
    category: 'regeneracja',
  },
  wellness_stress: {
    id: 'wellness_stress',
    label: 'Poziom stresu',
    short: 'Stres',
    color: '#F87171',
    unit: '/5',
    category: 'regeneracja',
  },
  kcal_remaining: {
    id: 'kcal_remaining',
    label: 'Pozostałe kcal',
    short: 'Zapas',
    color: '#FF8A80',
    unit: 'kcal',
    category: 'dieta',
  },
  records_count: {
    id: 'records_count',
    label: 'Rekordy 1RM',
    short: 'PR',
    color: '#FFD700',
    unit: '',
    category: 'postep',
  },
  custom_plans: {
    id: 'custom_plans',
    label: 'Własne plany',
    short: 'Plany',
    color: '#C084FC',
    unit: '',
    category: 'postep',
  },
  level_progress: {
    id: 'level_progress',
    label: 'Postęp poziomu XP',
    short: 'XP',
    color: '#00E676',
    unit: '',
    category: 'postep',
  },
};

/** Pierścień 1 — dzień / aktywność (bez kcal — są w Makro). */
export const RING1_DEFAULT_SLOTS = ['volume_day', 'water', 'sessions_week'];
export const RING1_ALLOWED = [
  'volume_day', 'volume_week', 'water', 'sessions_week',
  'training_minutes', 'workout_streak', 'protein',
];

/** Pierścień 2 — wyłącznie dieta i makra. */
export const RING2_DEFAULT_SLOTS = ['calories', 'protein', 'fat', 'carbs'];
export const RING2_ALLOWED = ['calories', 'protein', 'fat', 'carbs', 'kcal_remaining'];

/** Pierścień 3 — regeneracja, wellness, postęp długoterminowy. */
export const RING3_DEFAULT_SLOTS = ['readiness', 'water_streak', 'habits'];
export const RING3_ALLOWED = [
  'readiness', 'water_streak', 'habits', 'sessions_week', 'workout_streak',
  'wellness_sleep', 'wellness_energy', 'wellness_doms', 'wellness_stress',
  'level_progress', 'records_count', 'custom_plans',
];

/** Krótki opis do okna wyboru metryki. */
export const METRIC_DESCRIPTIONS = {
  volume_day: `Tonaż z dzisiejszych treningów. Cel: ${(RING_VOLUME_GOALS.dayKg / 1000).toFixed(0)} t.`,
  volume_week: `Suma objętości z ostatnich 7 dni. Cel: ${(RING_VOLUME_GOALS.weekKg / 1000).toFixed(0)} t.`,
  water: 'Wypite ml wody vs dzienny cel (z kalendarza diety).',
  sessions_week: `Ile dni w tygodniu trenowałeś. Cel: ${RING_WEEK_SESSION_GOAL} dni.`,
  training_minutes: 'Łączny czas dzisiejszych sesji (timer treningu). Cel: ~90 min.',
  workout_streak: 'Kolejne dni z zapisanym treningiem. Cel: 7 dni.',
  protein: 'Spożyte białko vs środek widełek z ekranu Dieta.',
  calories: 'Spożyte kcal vs cel z profilu (TDEE i tempo celu).',
  fat: 'Spożyte tłuszcze vs cel z widełek makro.',
  carbs: 'Spożyte węglowodany vs cel z widełek makro.',
  kcal_remaining: 'Ile kalorii zostało do wykorzystania dziś (zapas).',
  readiness: 'Wynik gotowości treningowej 1–10 (wellness + obciążenie).',
  water_streak: 'Dni z rzędu ze spełnionym celem wody.',
  habits: 'Odhaczone codzienne nawyki (kreatyna, sen itd.).',
  wellness_sleep: 'Ocena snu z kwestionariusza wellness (1–5).',
  wellness_energy: 'Poziom energii dziś (1–5).',
  wellness_doms: 'Ból mięśni / DOMS (1 = duży, 5 = brak).',
  wellness_stress: 'Poziom stresu (1 = wysoki, 5 = spokój).',
  level_progress: 'Postęp XP do następnego poziomu (z tonażu).',
  records_count: 'Liczba zapisanych rekordów 1RM w profilu.',
  custom_plans: 'Ile własnych planów masz w kreatorze.',
};

/** Sekcje w oknie wyboru — tylko sensowne metryki dla danego pierścienia. */
export const RING_PICKER_SECTIONS = {
  0: [
    {
      title: 'Dziś',
      subtitle: 'Postęp w ciągu dnia',
      metricIds: ['volume_day', 'training_minutes', 'water', 'protein'],
    },
    {
      title: 'Tydzień',
      subtitle: 'Regularność i objętość',
      metricIds: ['volume_week', 'sessions_week', 'workout_streak'],
    },
  ],
  1: [
    {
      title: 'Makroskładniki',
      subtitle: 'Każdy łuk = inne makro (bez powtórzeń)',
      metricIds: ['calories', 'protein', 'fat', 'carbs'],
    },
    {
      title: 'Budżet kaloryczny',
      subtitle: 'Pozostały zapas na dziś',
      metricIds: ['kcal_remaining'],
    },
  ],
  2: [
    {
      title: 'Gotowość i samopoczucie',
      subtitle: 'Z kwestionariusza w profilu',
      metricIds: ['readiness', 'wellness_sleep', 'wellness_energy', 'wellness_doms', 'wellness_stress'],
    },
    {
      title: 'Nawyki i regularność',
      subtitle: 'Serie i tygodniowa aktywność',
      metricIds: ['habits', 'water_streak', 'workout_streak', 'sessions_week'],
    },
    {
      title: 'Postęp długoterminowy',
      subtitle: 'XP, rekordy, plany',
      metricIds: ['level_progress', 'records_count', 'custom_plans'],
    },
  ],
};

export function getRingPickerSections(ringIndex) {
  return RING_PICKER_SECTIONS[ringIndex] ?? RING_PICKER_SECTIONS[0];
}

export function getMetricDescription(metricId) {
  return METRIC_DESCRIPTIONS[metricId] ?? '';
}

export function getMetricDef(id) {
  return RING_METRICS[id] ?? RING_METRICS.calories;
}

function macroTarget(macro) {
  return (macro.min + macro.max) / 2;
}

function computeWorkoutStreak(workoutHistory) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const key = d.toISOString().slice(0, 10);
    const has = (workoutHistory ?? []).some((w) => isSameDay(w.savedAt, key));
    if (has) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return { value: streak, goal: 7, progress: clamp01(streak / 7) };
}

function wellnessVal(wellness, key) {
  const v = wellness?.[key] ?? 3;
  return { value: v, goal: 5, progress: clamp01(v / 5), display: `${v}/5` };
}

function computeWaterStreak(waterLog, effectiveGoalMl, portionMl) {
  const goalPortions = Math.ceil(effectiveGoalMl / portionMl);
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const key = d.toISOString().slice(0, 10);
    const portions = waterLog[key] ?? 0;
    if (portions >= goalPortions) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return { value: streak, goal: 7, progress: clamp01(streak / 7) };
}

export function computeMetricValue(metricId, ctx) {
  const {
    workoutHistory,
    waterLog,
    effectiveGoalMl,
    portionMl,
    nutrition,
    tdee,
    goalPace,
    dailyWellness,
    dailyHabits,
    exerciseRecords,
    customPlans,
    bodyWeightKg,
    gender,
  } = ctx;

  const n = nutrition ?? DEFAULT_NUTRITION;
  const kcalGoal = tdee != null ? targetCalories(tdee, goalPace) : n.kcalGoal;

  switch (metricId) {
    case 'volume_day': {
      const value = (workoutHistory ?? [])
        .filter((w) => isSameDay(w.savedAt))
        .reduce((a, w) => a + (w.tonnage ?? 0), 0);
      const goal = RING_VOLUME_GOALS.dayKg;
      return { value: Math.round(value), goal, progress: clamp01(value / goal), display: `${Math.round(value)}` };
    }
    case 'volume_week': {
      const since = weekAgo();
      const value = (workoutHistory ?? [])
        .filter((w) => new Date(w.savedAt) >= since)
        .reduce((a, w) => a + (w.tonnage ?? 0), 0);
      const goal = RING_VOLUME_GOALS.weekKg;
      return { value: Math.round(value), goal, progress: clamp01(value / goal), display: `${Math.round(value / 1000)}t` };
    }
    case 'water': {
      const key = todayKey();
      const value = (waterLog[key] ?? 0) * portionMl;
      const goal = effectiveGoalMl;
      return { value, goal, progress: clamp01(value / goal), display: `${value}` };
    }
    case 'calories': {
      const goal = kcalGoal;
      return {
        value: n.kcalEaten,
        goal,
        progress: clamp01(n.kcalEaten / goal),
        display: `${n.kcalEaten}`,
      };
    }
    case 'protein': {
      const goal = macroTarget(n.protein);
      return {
        value: n.protein.eaten,
        goal,
        progress: clamp01(n.protein.eaten / goal),
        display: `${n.protein.eaten}g`,
      };
    }
    case 'fat': {
      const goal = macroTarget(n.fat);
      return {
        value: n.fat.eaten,
        goal,
        progress: clamp01(n.fat.eaten / goal),
        display: `${n.fat.eaten}g`,
      };
    }
    case 'carbs': {
      const goal = macroTarget(n.carbs);
      return {
        value: n.carbs.eaten,
        goal,
        progress: clamp01(n.carbs.eaten / goal),
        display: `${n.carbs.eaten}g`,
      };
    }
    case 'sessions_week': {
      const since = weekAgo();
      const days = new Set(
        (workoutHistory ?? [])
          .filter((w) => new Date(w.savedAt) >= since)
          .map((w) => new Date(w.savedAt).toISOString().slice(0, 10)),
      );
      const value = days.size;
      const goal = RING_WEEK_SESSION_GOAL;
      return { value, goal, progress: clamp01(value / goal), display: `${value}` };
    }
    case 'readiness': {
      const score = computeReadinessScore(
        workoutHistory,
        buildReadinessOpts(dailyWellness),
      ).score;
      return { value: score, goal: 10, progress: clamp01(score / 10), display: `${score}` };
    }
    case 'habits': {
      const total = dailyHabits?.length ?? 0;
      const done = dailyHabits?.filter((h) => h.done).length ?? 0;
      return {
        value: done,
        goal: total || 1,
        progress: total ? clamp01(done / total) : 0,
        display: `${done}/${total}`,
      };
    }
    case 'water_streak': {
      const s = computeWaterStreak(waterLog, effectiveGoalMl, portionMl);
      return { ...s, display: `${s.value}d` };
    }
    case 'sessions_total': {
      const value = workoutHistory?.length ?? 0;
      const goal = 50;
      return { value, goal, progress: clamp01(value / goal), display: `${value}` };
    }
    case 'workout_streak': {
      const s = computeWorkoutStreak(workoutHistory);
      return { ...s, display: `${s.value}d` };
    }
    case 'training_minutes': {
      const mins = Math.round(
        (workoutHistory ?? [])
          .filter((w) => isSameDay(w.savedAt))
          .reduce((a, w) => a + (w.timerSec ?? 0), 0) / 60,
      );
      const goal = 90;
      return { value: mins, goal, progress: clamp01(mins / goal), display: `${mins}` };
    }
    case 'wellness_sleep':
      return wellnessVal(dailyWellness, 'sleep');
    case 'wellness_energy':
      return wellnessVal(dailyWellness, 'fatigue');
    case 'wellness_doms':
      return wellnessVal(dailyWellness, 'doms');
    case 'wellness_stress':
      return wellnessVal(dailyWellness, 'stress');
    case 'kcal_remaining': {
      const goal = kcalGoal;
      const left = Math.max(0, goal - n.kcalEaten);
      return {
        value: left,
        goal,
        progress: clamp01(left / goal),
        display: `${left}`,
      };
    }
    case 'records_count': {
      const value = Object.keys(exerciseRecords ?? {}).length;
      const goal = 15;
      return { value, goal, progress: clamp01(value / goal), display: `${value}` };
    }
    case 'custom_plans': {
      const value = customPlans?.length ?? 0;
      const goal = 5;
      return { value, goal, progress: clamp01(value / goal), display: `${value}` };
    }
    case 'level_progress': {
      const lvl = computeLevelSystem(workoutHistory, bodyWeightKg ?? 80, gender ?? 'male');
      return {
        value: Math.round(lvl.progress * 100),
        goal: 100,
        progress: lvl.progress,
        display: `Lv${lvl.level}`,
      };
    }
    default:
      return { value: 0, goal: 1, progress: 0, display: '—' };
  }
}

export function buildRingSegments(metricIds, ctx) {
  return metricIds.map((id) => {
    const def = getMetricDef(id);
    const computed = computeMetricValue(id, ctx);
    return {
      key: id,
      color: def.color,
      label: def.short,
      fullLabel: def.label,
      progress: computed.progress,
      value: computed.value,
      goal: computed.goal,
      display: computed.display,
      unit: def.unit,
    };
  });
}
