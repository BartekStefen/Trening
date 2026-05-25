/**
 * Obciążenie partii z zaliczonych serii — ta sama logika co heatmapa (useMuscleHeatmap).
 * Gotowość Upper/Lower opiera się na realnej pracy mięśni, nie na nazwie planu.
 */

import {
  INTENSITY_CAPS,
  LEGACY_KEY_MAP,
  MUSCLE_KEYWORD_PAIRS,
  REGION_KEYS,
} from '../constants/muscleConstants';

export const SPLIT_UPPER = 'upper';
export const SPLIT_LOWER = 'lower';

/** Minimalne obciążenie splitu (0–1), żeby uznać sesję za „prawdziwy” trening tej strefy. */
export const MEANINGFUL_SPLIT_LOAD = 0.12;

const UPPER_REGIONS = new Set([
  'chest_upper', 'chest_lower',
  'shoulders_front', 'shoulders_side', 'shoulders_rear',
  'back_upper', 'back_lat',
  'biceps', 'triceps', 'forearms',
  'abs',
]);

const LOWER_REGIONS = new Set([
  'glutes', 'quads', 'hamstrings', 'calves',
]);

const normalizeStr = (str) =>
  (str ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const matchMuscleToRegion = (muscleName) => {
  const normalized = normalizeStr(muscleName);
  for (const [keyword, region] of MUSCLE_KEYWORD_PAIRS) {
    if (normalized.includes(keyword)) return region;
  }
  return null;
};

const calcSetWeight = (sets) => {
  const done = (sets ?? []).filter((s) => s.done && !s.isRamp);
  if (!done.length) return 0;

  const rpes = done
    .map((s) => parseFloat(s.rpe))
    .filter((v) => !isNaN(v) && v >= 1 && v <= 10);

  if (rpes.length) {
    const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    return done.length * (avgRpe / 10);
  }
  return done.length;
};

/** Surowe obciążenie per region SVG (jak heatmapa). */
export const accumulateMuscleRawFromExercises = (exercises) => {
  const rawMap = {};

  (exercises ?? []).forEach((ex) => {
    const weight = calcSetWeight(ex.sets);
    if (weight <= 0) return;

    const mappedRegions = new Set();
    const muscleNames = [
      ...(ex.muscles ?? []),
      ...(ex.muscleGroup?.split(/[·,]/) ?? []),
    ];

    muscleNames.forEach((m) => {
      const region = matchMuscleToRegion(m);
      if (region && !mappedRegions.has(region)) {
        mappedRegions.add(region);
        rawMap[region] = (rawMap[region] ?? 0) + weight;
        return;
      }
      const legacyEntry = LEGACY_KEY_MAP[normalizeStr(m)];
      if (legacyEntry) {
        Object.entries(legacyEntry).forEach(([subRegion, ratio]) => {
          if (!mappedRegions.has(subRegion)) {
            mappedRegions.add(subRegion);
            rawMap[subRegion] = (rawMap[subRegion] ?? 0) + weight * ratio;
          }
        });
      }
    });
  });

  return rawMap;
};

const regionIntensity = (region, raw) => {
  const cap = INTENSITY_CAPS[region] ?? 5;
  return Math.min((raw ?? 0) / cap, 1);
};

/** Intensywność 0–1 per split z jednej sesji (średnia po partiach tej strefy). */
export const computeSessionSplitLoads = (exercises) => {
  const raw = accumulateMuscleRawFromExercises(exercises);

  const avgForSet = (regionSet) => {
    const vals = [...regionSet]
      .filter((r) => REGION_KEYS.includes(r) && raw[r] > 0)
      .map((r) => regionIntensity(r, raw[r]));
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return {
    upper: Math.round(avgForSet(UPPER_REGIONS) * 100) / 100,
    lower: Math.round(avgForSet(LOWER_REGIONS) * 100) / 100,
    raw,
  };
};

/** Kumulacja z ostatnich sesji — jak heatmapa profilu, ale per split. */
export const aggregateSplitLoadsFromHistory = (
  workoutHistory,
  windowDays = 7,
  now = Date.now(),
) => {
  const dayMs = 24 * 3600 * 1000;
  const totals = { upper: 0, lower: 0 };
  let sessions = 0;

  (workoutHistory ?? []).forEach((session) => {
    const age = (now - new Date(session.savedAt).getTime()) / dayMs;
    if (age > windowDays) return;
    const loads = computeSessionSplitLoads(session.exercises ?? []);
    const decay = Math.max(0.25, 1 - age / (windowDays + 1));
    totals.upper += loads.upper * decay;
    totals.lower += loads.lower * decay;
    sessions += 1;
  });

  const norm = sessions > 0 ? 1 + sessions * 0.35 : 1;
  return {
    upper: Math.min(1, Math.round((totals.upper / norm) * 100) / 100),
    lower: Math.min(1, Math.round((totals.lower / norm) * 100) / 100),
    sessions,
  };
};

export const maxRpeForSplitExercises = (exercises, split) => {
  const regionSet = split === SPLIT_UPPER ? UPPER_REGIONS : LOWER_REGIONS;
  let max = null;

  (exercises ?? []).forEach((ex) => {
    const raw = accumulateMuscleRawFromExercises([ex]);
    const hit = Object.keys(raw).some((r) => regionSet.has(r) && raw[r] > 0);
    if (!hit) return;

    (ex.sets ?? []).filter((s) => s.done && s.rpe).forEach((s) => {
      const r = parseFloat(s.rpe);
      if (!isNaN(r)) max = max === null ? r : Math.max(max, r);
    });
  });
  return max;
};

/** Ostatnia sesja z realną pracą na danym splitcie (nie sama etykieta planu). */
export const findLastMeaningfulSplitWork = (workoutHistory, split, now = Date.now()) => {
  const dayMs = 24 * 3600 * 1000;

  for (const session of workoutHistory ?? []) {
    const loads = computeSessionSplitLoads(session.exercises ?? []);
    const load = loads[split];
    if (load < MEANINGFUL_SPLIT_LOAD) continue;

    const daysSince = (now - new Date(session.savedAt).getTime()) / dayMs;
    return {
      session,
      load,
      daysSince,
      lastRpe: maxRpeForSplitExercises(session.exercises, split),
    };
  }
  return null;
};
