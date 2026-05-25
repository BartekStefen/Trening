import { calcEpley1RM, computeReadinessScore } from './profileAnalytics';
import { ACWR_OPTIMAL_HIGH } from './trainingLoad';
import { repsForVolume } from './repsUtils';

/**
 * Podstawa naukowa modułu autoregulacji treningowej.
 *
 * Survival / stres:
 * - Smith et al. (2020): zmęczenie psychiczne ↓ objętość treningu ~15,8%
 * - Gabbett (2016): ACWR >1,3–1,5 = podwyższone ryzyko kontuzji
 *
 * Deload:
 * - Traps et al. (2024, PMC10948666): deload przy stagnacji, ↓ objętość + ↓ intensywność + ↑ RIR
 *
 * 1RM:
 * - NSCA/JSCR (2013): rozgrzewka 40%×10, 60%×5, potem do 5 podejść single z przerwą 3 min
 */

export const MENTAL_FATIGUE_VOLUME_CUT = 0.158;
export const AUTO_DELOAD_LOAD_PCT = 0.15;
export const AUTO_DELOAD_VOLUME_PCT = 0.20;
export const PLATEAU_SESSIONS = 3;
export const PLATEAU_TOLERANCE = 0.02;
export const RPE_CREEP_THRESHOLD = 1.0;
export const MAX_SURVIVAL_VOLUME_CUT = 0.40;
export const READINESS_SURVIVAL_THRESHOLD = 4;

const roundKg = (kg) => Math.max(0, Math.round(kg / 2.5) * 2.5);

const normName = (name) =>
  (name ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const exerciseKey = (ex) => ex?.sourcePlanExId ?? normName(ex?.name);

export const getBestSet1RM = (sets) => {
  let best = null;
  (sets ?? []).filter((s) => s.done).forEach((s) => {
    const orm = calcEpley1RM(s.kg, repsForVolume(s.reps));
    if (orm && (!best || orm > best.orm)) {
      best = { orm, kg: s.kg, reps: s.reps };
    }
  });
  return best;
};

export const getBest1RMFromHistory = (workoutHistory, key, name) => {
  let best = null;
  const keyNorm = typeof key === 'string' && !key.includes(' ') ? key : null;
  const nameNorm = normName(name);

  (workoutHistory ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((ex) => {
      const match =
        (keyNorm && ex.sourcePlanExId === keyNorm)
        || (nameNorm && normName(ex.name) === nameNorm);
      if (!match) return;
      const hit = getBestSet1RM(ex.sets);
      if (hit && (!best || hit.orm > best)) best = hit.orm;
    });
  });

  return best;
};

export const resolveExercise1RM = (workoutHistory, exerciseRecords, ex) => {
  const key = exerciseKey(ex);
  const manual = exerciseRecords?.[key]?.oneRM ?? exerciseRecords?.[ex?.name]?.oneRM;
  if (manual) return { oneRM: manual, source: 'profile' };
  const fromHistory = getBest1RMFromHistory(workoutHistory, key, ex?.name);
  if (fromHistory) return { oneRM: fromHistory, source: 'history' };
  return { oneRM: null, source: null };
};

/** Ocena potrzeby trybu przetrwania — wellness + sRPE/ACWR + regeneracja. */
export const evaluateSurvivalRecommendation = (workoutHistory, opts = {}) => {
  const readiness = computeReadinessScore(workoutHistory, opts);
  const score = readiness.score;
  const acwr = readiness.acwr ?? 1;

  if (score > READINESS_SURVIVAL_THRESHOLD) {
    return {
      shouldOffer: false,
      readiness,
      volumeReductionPct: 0,
      rationale: null,
    };
  }

  let volumeReductionPct = MENTAL_FATIGUE_VOLUME_CUT;
  if (score <= 3) volumeReductionPct += 0.12;
  if (score <= 2) volumeReductionPct += 0.12;
  if (acwr > ACWR_OPTIMAL_HIGH) volumeReductionPct += 0.08;
  if (readiness.wellnessSub != null && readiness.wellnessSub <= 4) volumeReductionPct += 0.06;
  volumeReductionPct = Math.min(MAX_SURVIVAL_VOLUME_CUT, volumeReductionPct);

  const pctLabel = Math.round(volumeReductionPct * 100);
  const factors = readiness.factors?.slice(0, 2).map((f) => f.text).join('; ') || readiness.label;
  const splitNote = readiness.focusSplit === 'upper'
    ? ' (gotowość Upper)'
    : readiness.focusSplit === 'lower'
      ? ' (gotowość Lower)'
      : '';

  return {
    shouldOffer: true,
    readiness,
    volumeReductionPct,
    rirBump: score <= 3 ? 2 : 1,
    rationale:
      `Gotowość ${score}/10${splitNote} (${readiness.label}). `
      + `Redukcja objętości ~${pctLabel}% — autoregulacja przy niskim wellness `
      + `lub wysokim obciążeniu sRPE (ACWR ${acwr}). `
      + (factors ? `Czynniki: ${factors}.` : ''),
    citation: 'Foster 2001; Gabbett 2016; Smith et al. 2020',
  };
};

export const shouldOfferSurvivalMode = (readinessScore) =>
  readinessScore != null && readinessScore <= READINESS_SURVIVAL_THRESHOLD;

/**
 * Redukcja objętości przy zachowaniu min. 1 serii roboczej / ćwiczenie.
 * Priorytet: usuwanie końcowych serii (zgodnie z praktyką deload — ↓ serie, stała częstotliwość).
 */
export const applySurvivalMode = (exercises, volumeReductionPct = MENTAL_FATIGUE_VOLUME_CUT) => {
  const cut = Math.min(MAX_SURVIVAL_VOLUME_CUT, Math.max(0.1, volumeReductionPct));
  const workingSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => !s.isRamp).length,
    0,
  );
  const targetRemove = Math.max(1, Math.floor(workingSets * cut));
  let removed = 0;

  const next = exercises.map((ex) => {
    const ramp = ex.sets.filter((s) => s.isRamp);
    const working = ex.sets.filter((s) => !s.isRamp);
    const keepMin = 1;
    const canRemove = Math.max(0, working.length - keepMin);
    const toRemoveHere = Math.min(canRemove, targetRemove - removed);

    if (toRemoveHere <= 0) return ex;

    removed += toRemoveHere;
    const trimmed = working.slice(0, working.length - toRemoveHere);
    return {
      ...ex,
      sets: [...ramp, ...trimmed],
      survivalTrimmed: toRemoveHere,
      survivalNote: `Autoregulacja objętości −${Math.round(cut * 100)}%`,
    };
  });

  return {
    exercises: next,
    removedSets: removed,
    originalSets: workingSets,
    volumeReductionPct: cut,
  };
};

export const detectExercisePlateaus = (workoutHistory, minSessions = PLATEAU_SESSIONS) => {
  const byExercise = {};

  (workoutHistory ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((ex) => {
      const key = exerciseKey(ex);
      const best = getBestSet1RM(ex.sets);
      if (!best) return;
      if (!byExercise[key]) {
        byExercise[key] = { name: ex.name, key, sessions: [] };
      }
      byExercise[key].sessions.push({ date: session.savedAt, oneRM: best.orm });
    });
  });

  const plateaus = [];

  Object.values(byExercise).forEach((entry) => {
    const recent = entry.sessions.slice(0, minSessions + 1);
    if (recent.length < minSessions) return;

    const baseline = recent[recent.length - 1].oneRM;
    const stalled = recent.slice(0, minSessions).every((s) => {
      const diff = (s.oneRM - baseline) / baseline;
      return diff <= PLATEAU_TOLERANCE;
    });

    if (stalled) {
      plateaus.push({
        key: entry.key,
        name: entry.name,
        last1RM: recent[0].oneRM,
        sessions: minSessions,
        suggestedKg: roundKg(recent[0].oneRM * (1 - AUTO_DELOAD_LOAD_PCT)),
      });
    }
  });

  return plateaus;
};

/** RPE creep: ten sam ciężar, rosnące RPE — sygnał zmęczenia (Traps et al. 2024). */
export const detectRPECreep = (workoutHistory, minSessions = PLATEAU_SESSIONS) => {
  const byExercise = {};

  (workoutHistory ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((ex) => {
      const key = exerciseKey(ex);
      const working = (ex.sets ?? []).filter((s) => s.done && !s.isRamp && s.kg && s.rpe);
      if (!working.length) return;

      const topSet = working.reduce((best, s) => {
        const kg = parseFloat(s.kg);
        if (!best || kg > parseFloat(best.kg)) return s;
        return best;
      }, null);
      if (!topSet) return;

      const avgRpe = working.reduce((a, s) => a + parseFloat(s.rpe), 0) / working.length;
      if (!byExercise[key]) byExercise[key] = { name: ex.name, key, sessions: [] };
      byExercise[key].sessions.push({
        date: session.savedAt,
        kg: parseFloat(topSet.kg),
        avgRpe: Math.round(avgRpe * 10) / 10,
      });
    });
  });

  const creeps = [];
  Object.values(byExercise).forEach((entry) => {
    const recent = entry.sessions.slice(0, minSessions);
    if (recent.length < minSessions) return;

    const baselineKg = recent[recent.length - 1].kg;
    const loadStable = recent.every((s) => Math.abs(s.kg - baselineKg) / baselineKg <= 0.03);
    if (!loadStable) return;

    const rpeRise = recent[0].avgRpe - recent[recent.length - 1].avgRpe;
    if (rpeRise >= RPE_CREEP_THRESHOLD) {
      creeps.push({
        key: entry.key,
        name: entry.name,
        rpeRise: Math.round(rpeRise * 10) / 10,
        sessions: minSessions,
      });
    }
  });

  return creeps;
};

export const evaluateDeloadRecommendation = (workoutHistory, exercisesInPlan = []) => {
  const plateaus = detectExercisePlateaus(workoutHistory);
  const rpeCreeps = detectRPECreep(workoutHistory);
  const planKeys = new Set(exercisesInPlan.map((ex) => exerciseKey(ex)));

  const matchingPlateaus = plateaus.filter((p) => planKeys.has(p.key));
  const matchingCreeps = rpeCreeps.filter((p) => planKeys.has(p.key));
  const triggerKeys = new Set([
    ...matchingPlateaus.map((p) => p.key),
    ...matchingCreeps.map((p) => p.key),
  ]);

  if (!triggerKeys.size) {
    return { shouldApply: false, plateaus, rpeCreeps, rationale: null };
  }

  const names = [
    ...matchingPlateaus.map((p) => p.name),
    ...matchingCreeps.map((p) => `${p.name} (RPE +${p.rpeRise})`),
  ].slice(0, 3);

  return {
    shouldApply: true,
    plateaus: matchingPlateaus,
    rpeCreeps: matchingCreeps,
    loadReductionPct: AUTO_DELOAD_LOAD_PCT,
    volumeReductionPct: AUTO_DELOAD_VOLUME_PCT,
    rationale:
      `Sygnal autoregulacji: stagnacja 1RM lub wzrost RPE przy stałym ciężarze `
      + `(${names.join(', ')}). Deload −${Math.round(AUTO_DELOAD_LOAD_PCT * 100)}% kg, `
      + `−${Math.round(AUTO_DELOAD_VOLUME_PCT * 100)}% objętości (Traps et al. 2024).`,
    citation: 'Traps et al. 2024',
  };
};

/** Deload: ↓ obciążenie + usuń 1 serię gdy >2 serie robocze (zachowaj min. 1). */
export const applyAutoDeload = (exercises, plateauKeys) => {
  const keys = new Set(plateauKeys);
  let affected = 0;
  let removedSets = 0;

  const next = exercises.map((ex) => {
    const key = exerciseKey(ex);
    if (!keys.has(key)) return ex;

    affected += 1;
    const ramp = ex.sets.filter((s) => s.isRamp);
    const working = ex.sets.filter((s) => !s.isRamp);
    const trimCount = working.length > 2 ? 1 : 0;
    removedSets += trimCount;
    const trimmed = trimCount > 0 ? working.slice(0, working.length - trimCount) : working;

    return {
      ...ex,
      deloadApplied: true,
      sets: [
        ...ramp,
        ...trimmed.map((s) => {
          const kg = parseFloat(s.kg);
          if (!kg || s.isRamp) return s;
          const deloaded = roundKg(kg * (1 - AUTO_DELOAD_LOAD_PCT));
          return {
            ...s,
            kg: String(deloaded),
            suggested: `Deload −${Math.round(AUTO_DELOAD_LOAD_PCT * 100)}% · cel RIR +2`,
            aiSuggested: true,
          };
        }),
      ],
    };
  });

  return { exercises: next, affectedCount: affected, removedSets };
};

/**
 * Protokół 1RM wg NSCA/JSCR (2013):
 * 2 serie rozgrzewkowe (40%×10, 60%×5) + max 2 podejścia w kreatorze
 * (otwierające ~92%, próba celu 100%). W sali można dodać kolejne +2,5 kg (do 5 łącznie).
 */
export const generateMaxAttemptProtocol = (current1RM, target1RM) => {
  const current = parseFloat(current1RM) || 0;
  const target = parseFloat(target1RM) || 0;

  const testWeight = target > 0
    ? roundKg(target)
    : roundKg(current > 0 ? current : 0);

  const estimate = testWeight > 0 ? testWeight : roundKg(current + 2.5);

  if (estimate <= 0) {
    return {
      current1RM: current,
      testWeight: null,
      target1RM: null,
      maxAttemptsInGym: 5,
      steps: [],
      summary:
        'Ustaw cel 1RM (kg), aby wygenerować protokół. Bez danych bazowych używamy standardu NSCA od szacunkowego ciężaru.',
      source: 'NSCA/JSCR 2013',
    };
  }

  const opener = roundKg(estimate * 0.92);

  const steps = [
    {
      id: 'w1',
      phase: 'warmup',
      label: 'Rozgrzewka 1',
      kg: roundKg(estimate * 0.4),
      reps: 10,
      restSec: 60,
      note: '40% szac. 1RM × 10 — aktywacja (NSCA)',
    },
    {
      id: 'w2',
      phase: 'warmup',
      label: 'Rozgrzewka 2',
      kg: roundKg(estimate * 0.6),
      reps: 5,
      restSec: 60,
      note: '60% × 5 — przerwa 1 min przed próbami (NSCA)',
    },
    {
      id: 'a1',
      phase: 'attempt',
      label: 'Podejście otwierające',
      kg: opener,
      reps: 1,
      restSec: 180,
      note: '~92% celu — sprawdzenie formy, przerwa 3 min',
      isKey: false,
    },
    {
      id: 'a2',
      phase: 'attempt',
      label: 'Próba 1RM',
      kg: estimate,
      reps: 1,
      restSec: 180,
      note: current > 0 && estimate > current
        ? `Cel: ${estimate} kg (+${roundKg(estimate - current)} kg vs rekord). Po sukcesie w sali możesz dodać +2,5 kg (max 5 podejść łącznie).`
        : `Próba maksymalna ${estimate} kg. Po sukcesie dodaj +2,5 kg i powtórz (max 5 podejść łącznie).`,
      isKey: true,
    },
  ];

  return {
    current1RM: current,
    testWeight: estimate,
    target1RM: estimate,
    maxAttemptsInGym: 5,
    steps,
    summary:
      '2 rozgrzewki + 2 podejścia w planie. W treningu stosuj progresję +2,5 kg aż do RPE 9–10 lub braku powtórzenia (≤5 podejść, przerwa 3 min).',
    source: 'NSCA/JSCR 2013; Science for Sport',
  };
};
