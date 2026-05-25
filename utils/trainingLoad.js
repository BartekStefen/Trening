/**
 * Obciążenie treningowe i gotowość — wspólna baza naukowa modułu analityki.
 *
 * Session-RPE: Foster et al. (2001) — obciążenie = RPE sesji × czas (min).
 * ACWR: Gabbett (2016) — ostre (7 d) ÷ chroniczne (śr. 4 tyg.).
 * Wellness: monitoring Hooper / RESTQ — sen, zmęczenie, DOMS, stres (1–5).
 * Gotowość: ważona kompozycja 45% wellness + 35% obciążenie + 20% regeneracja.
 */

import {
  aggregateSplitLoadsFromHistory,
  findLastMeaningfulSplitWork,
  maxRpeForSplitExercises,
} from './muscleLoad';

const DAY_MS = 24 * 3600 * 1000;
const FALLBACK_SESSION_RPE = 6;

export const SPLIT_UPPER = 'upper';
export const SPLIT_LOWER = 'lower';
export const SPLIT_FULL = 'full';
export const SPLIT_MIXED = 'mixed';

export const READINESS_WEIGHTS = {
  wellness: 0.45,
  load: 0.35,
  recovery: 0.20,
};

export const ACWR_OPTIMAL_LOW = 0.8;
export const ACWR_OPTIMAL_HIGH = 1.3;
export const ACWR_DANGER = 1.5;

const UPPER_KW = ['klatka', 'piersiow', 'wycisk', 'triceps', 'bark', 'naramienny', 'dipy', 'pompki', 'overhead', 'zolniersk', 'plec', 'najszerszy', 'wioslow', 'podciag', 'biceps', 'ramienno', 'tylny bark'];
const LOWER_KW = ['noga', 'czworoglow', 'poslad', 'dwuglow', 'przysiad', 'martwy', 'wypad', 'leg press', 'lydk', 'hip thrust', 'rumunsk'];

const normBlob = (ex) =>
  [
    ex?.name,
    ...(ex?.muscles ?? []),
    ...(ex?.muscleGroup?.split(/[·,]/) ?? []),
  ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const setTon = (set) => {
  if (!set?.done) return 0;
  return (parseFloat(set.kg) || 0) * (parseInt(set.reps, 10) || 0);
};

export const exerciseSplit = (ex) => {
  const blob = normBlob(ex);
  if (LOWER_KW.some((k) => blob.includes(k))) return SPLIT_LOWER;
  if (UPPER_KW.some((k) => blob.includes(k))) return SPLIT_UPPER;
  return 'other';
};

/** Upper / Lower / Full / Mixed — z tonażu ćwiczeń lub nazwy planu. */
export const classifySessionSplit = (workout) => {
  if (workout?.splitType) return workout.splitType;

  const name = (workout?.workoutName ?? '').toLowerCase();
  if (/upper|gora ciala|góra ciała/.test(name)) return SPLIT_UPPER;
  if (/lower|dol ciala|dół ciała|nogi/.test(name)) return SPLIT_LOWER;

  let upperTon = 0;
  let lowerTon = 0;
  (workout?.exercises ?? []).forEach((ex) => {
    const ton = (ex.sets ?? []).reduce((a, s) => a + setTon(s), 0);
    if (!ton) return;
    const split = exerciseSplit(ex);
    if (split === SPLIT_UPPER) upperTon += ton;
    else if (split === SPLIT_LOWER) lowerTon += ton;
  });

  const total = upperTon + lowerTon;
  if (total <= 0) return null;
  if (lowerTon / total >= 0.55) return SPLIT_LOWER;
  if (upperTon / total >= 0.55) return SPLIT_UPPER;
  if (upperTon > 0 && lowerTon > 0) return SPLIT_FULL;
  return SPLIT_MIXED;
};

export const sessionAffectsSplit = (session, split) => {
  const type = classifySessionSplit(session);
  if (!type) return false;
  if (type === SPLIT_FULL) return true;
  return type === split;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const round1 = (v) => Math.round(v * 10) / 10;

/** Średnie RPE serii roboczych jako proxy session-RPE (gdy brak oceny całej sesji). */
export const estimateSessionRpe = (workout) => {
  if (workout?.sessionRpe != null) {
    const stored = parseFloat(workout.sessionRpe);
    if (!isNaN(stored)) return stored;
  }

  const rpes = [];
  (workout?.exercises ?? []).forEach((ex) => {
    (ex.sets ?? []).filter((s) => s.done && !s.isRamp && s.rpe).forEach((s) => {
      const r = parseFloat(s.rpe);
      if (!isNaN(r)) rpes.push(r);
    });
  });

  if (!rpes.length) return FALLBACK_SESSION_RPE;
  return round1(rpes.reduce((a, b) => a + b, 0) / rpes.length);
};

/** Foster: obciążenie sesji = RPE × czas trwania (min). */
export const estimateSessionLoad = (workout) => {
  if (workout?.sessionLoad != null && workout.sessionLoad > 0) {
    return Math.round(workout.sessionLoad);
  }
  const durationMin = Math.max(1, Math.round((workout?.timerSec ?? 0) / 60));
  return Math.round(estimateSessionRpe(workout) * durationMin);
};

export const enrichWorkoutLoad = (workout) => {
  const sessionRpe = estimateSessionRpe(workout);
  const sessionLoad = estimateSessionLoad(workout);
  const splitType = classifySessionSplit(workout);
  return { ...workout, sessionRpe, sessionLoad, splitType };
};

const loadsInWindow = (workoutHistory, now, days) =>
  (workoutHistory ?? [])
    .filter((h) => now - new Date(h.savedAt).getTime() < days * DAY_MS)
    .reduce((a, h) => a + estimateSessionLoad(h), 0);

/** ACWR wg Gabbett: suma ostre 7 d ÷ średnia tygodniowa z 28 d. */
export const computeAcwr = (workoutHistory, now = Date.now()) => {
  const acute = loadsInWindow(workoutHistory, now, 7);
  const chronicWeeklyAvg = loadsInWindow(workoutHistory, now, 28) / 4;
  const acwr = chronicWeeklyAvg > 0 ? acute / chronicWeeklyAvg : 1;

  return {
    acwr: round1(acwr),
    acuteLoad: acute,
    chronicWeeklyAvg: Math.round(chronicWeeklyAvg),
  };
};

export const acwrZoneLabel = (acwr) => {
  if (acwr == null) return null;
  if (acwr > ACWR_DANGER) return 'Ryzyko wysokie (>1,5)';
  if (acwr > ACWR_OPTIMAL_HIGH) return 'Podwyższone (1,3–1,5)';
  if (acwr >= ACWR_OPTIMAL_LOW) return 'Optymalne (0,8–1,3)';
  return 'Niskie (<0,8)';
};

/** Subscore obciążenia 0–10 — wyżej przy ACWR w strefie docelowej. */
export const acwrToSubscore = (acwr) => {
  if (acwr == null) return 6;
  if (acwr >= ACWR_OPTIMAL_LOW && acwr <= ACWR_OPTIMAL_HIGH) {
    const center = 1.05;
    const dist = Math.abs(acwr - center);
    return round1(clamp(10 - dist * 6, 7, 10));
  }
  if (acwr > ACWR_DANGER) return round1(clamp(2 + (ACWR_DANGER - acwr) * 2, 1, 3));
  if (acwr > ACWR_OPTIMAL_HIGH) {
    const t = (acwr - ACWR_OPTIMAL_HIGH) / (ACWR_DANGER - ACWR_OPTIMAL_HIGH);
    return round1(7 - t * 3);
  }
  return round1(clamp(5 + (acwr - 0.5) * 2, 4, 6));
};

/** Wellness 1–5 (wyżej = lepiej) → subscore 0–10. */
export const wellnessToSubscore = (wellness) => {
  const w = wellness ?? {};
  const vals = [w.sleep, w.fatigue, w.doms, w.stress].map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
  if (!vals.length) return 5;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return round1(((avg - 1) / 4) * 10);
};

const daysSinceLastSession = (workoutHistory, now) => {
  if (!workoutHistory?.length) return null;
  return (now - new Date(workoutHistory[0].savedAt).getTime()) / DAY_MS;
};

const findLastSessionForSplit = (workoutHistory, split) =>
  findLastMeaningfulSplitWork(workoutHistory, split)?.session ?? null;

const lastSessionMaxRpe = (workoutHistory) => {
  let max = null;
  (workoutHistory?.[0]?.exercises ?? []).forEach((ex) => {
    (ex.sets ?? []).filter((s) => s.done && s.rpe).forEach((s) => {
      const r = parseFloat(s.rpe);
      if (!isNaN(r)) max = max === null ? r : Math.max(max, r);
    });
  });
  return max;
};

const sessionMaxRpeForSplit = (session, split) =>
  maxRpeForSplitExercises(session?.exercises, split);

const recoveryFromDaysAndRpe = (daysSince, lastRpe) => {
  let daysScore = 6;
  if (daysSince == null) daysScore = 7;
  else if (daysSince >= 1.5 && daysSince <= 3) daysScore = 10;
  else if (daysSince >= 0.75 && daysSince < 1.5) daysScore = 7;
  else if (daysSince < 0.75) daysScore = 3;
  else if (daysSince <= 5) daysScore = 8;
  else if (daysSince <= 7) daysScore = 6;
  else daysScore = 4;

  let rpeScore = 6;
  if (lastRpe == null) rpeScore = 6;
  else if (lastRpe <= 7) rpeScore = 10;
  else if (lastRpe < 9) rpeScore = 7;
  else if (lastRpe < 9.5) rpeScore = 5;
  else rpeScore = 2;

  return round1(daysScore * 0.6 + rpeScore * 0.4);
};

/** Regeneracja globalna (legacy / fallback). */
export const computeRecoverySubscore = (workoutHistory, now = Date.now()) => {
  const daysSince = daysSinceLastSession(workoutHistory, now);
  const lastRpe = lastSessionMaxRpe(workoutHistory);
  return recoveryFromDaysAndRpe(daysSince, lastRpe);
};

/** Regeneracja per split — heatmapa z ostatnich treningów + ostatnia realna praca. */
export const computeSplitRecoverySubscore = (workoutHistory, split, now = Date.now()) =>
  computeSplitReadinessMeta(workoutHistory, split, now).recoverySub;

export const computeSplitReadinessMeta = (workoutHistory, split, now = Date.now()) => {
  const recent = aggregateSplitLoadsFromHistory(workoutHistory, 7, now);
  const heatmapLoad = recent[split] ?? 0;
  const lastWork = findLastMeaningfulSplitWork(workoutHistory, split, now);

  const fatigueScore = round1(clamp(10 - heatmapLoad * 7, 3, 10));

  let daysScore = 9;
  let daysSince = null;
  let lastRpe = null;

  if (lastWork) {
    daysSince = round1(lastWork.daysSince);
    lastRpe = lastWork.lastRpe;
    daysScore = recoveryFromDaysAndRpe(daysSince, lastRpe);
  }

  const recoverySub = round1(daysScore * 0.45 + fatigueScore * 0.55);

  return {
    recoverySub,
    daysSince,
    lastRpe,
    heatmapLoad,
    lastSessionLoad: lastWork?.load ?? 0,
    meaningfulWork: !!lastWork,
    lastSplitType: lastWork ? classifySessionSplit(lastWork.session) : null,
  };
};

export const buildReadinessFactors = ({
  wellnessSub,
  loadSub,
  recoverySub,
  acwr,
  daysSince,
  lastRpe,
  wellness,
  splits,
}) => {
  const factors = [];

  const wAvg = wellness
    ? round1(([wellness.sleep, wellness.fatigue, wellness.doms, wellness.stress]
      .reduce((a, b) => a + (parseInt(b, 10) || 3), 0)) / 4)
    : 3;
  factors.push({
    text: `Wellness Hooper (śr. ${wAvg}/5)`,
    impact: Math.round((wellnessSub - 5) / 2),
    subscore: wellnessSub,
  });

  if (acwr != null) {
    factors.push({
      text: `ACWR ${acwr} — ${acwrZoneLabel(acwr)}`,
      impact: Math.round((loadSub - 5) / 2),
      subscore: loadSub,
    });
  }

  if (splits?.upper != null || splits?.lower != null) {
    const fmtSplit = (key, label) => {
      const s = splits[key];
      if (!s) return;
      const pct = Math.round((s.heatmapLoad ?? 0) * 100);
      let text = `${label}: heatmap ${pct}% (7 d)`;
      if (s.meaningfulWork && s.daysSince != null) {
        text += ` · ${s.daysSince} d od pracy`;
        if (s.lastRpe != null) text += ` · RPE ${s.lastRpe}`;
      } else if (!s.meaningfulWork) {
        text += ' · brak realnej pracy na strefie';
      }
      factors.push({
        text,
        impact: Math.round((s.recoverySub - 5) / 2),
        subscore: s.recoverySub,
      });
    };
    fmtSplit('upper', 'Upper');
    fmtSplit('lower', 'Lower');
  } else if (daysSince != null) {
    let restText = `Odstęp ${round1(daysSince)} d od sesji`;
    if (lastRpe != null) restText += ` · max RPE ${lastRpe}`;
    factors.push({
      text: restText,
      impact: Math.round((recoverySub - 5) / 2),
      subscore: recoverySub,
    });
  }

  return factors;
};

const composeReadinessScore = (wellnessSub, loadSub, recoverySub) =>
  clamp(Math.round(
    wellnessSub * READINESS_WEIGHTS.wellness
    + loadSub * READINESS_WEIGHTS.load
    + recoverySub * READINESS_WEIGHTS.recovery,
  ), 1, 10);

export const computeReadinessFromComponents = (workoutHistory, wellness, now = Date.now(), opts = {}) => {
  const { split: focusSplit } = opts;
  const wellnessSub = wellnessToSubscore(wellness);
  const { acwr } = computeAcwr(workoutHistory, now);
  const loadSub = acwrToSubscore(acwr);

  const upperMeta = computeSplitReadinessMeta(workoutHistory, SPLIT_UPPER, now);
  const lowerMeta = computeSplitReadinessMeta(workoutHistory, SPLIT_LOWER, now);

  const splits = {
    upper: {
      ...upperMeta,
      score: composeReadinessScore(wellnessSub, loadSub, upperMeta.recoverySub),
      label: 'Upper',
    },
    lower: {
      ...lowerMeta,
      score: composeReadinessScore(wellnessSub, loadSub, lowerMeta.recoverySub),
      label: 'Lower',
    },
  };

  const recoverySub = workoutHistory?.length
    ? round1((upperMeta.recoverySub + lowerMeta.recoverySub) / 2)
    : 7;

  let score;
  if (focusSplit === SPLIT_UPPER || focusSplit === SPLIT_LOWER) {
    score = splits[focusSplit].score;
  } else if (workoutHistory?.length) {
    score = Math.round((splits.upper.score + splits.lower.score) / 2);
  } else {
    score = composeReadinessScore(wellnessSub, loadSub, recoverySub);
  }

  const daysSince = daysSinceLastSession(workoutHistory, now);

  return {
    score,
    scoreDisplay: `${score}/10`,
    wellnessSub,
    loadSub,
    recoverySub,
    splits,
    focusSplit: focusSplit ?? null,
    acwr,
    acwrZone: acwrZoneLabel(acwr),
    daysSince: daysSince != null ? round1(daysSince) : null,
    factors: buildReadinessFactors({
      wellnessSub,
      loadSub,
      recoverySub,
      acwr: workoutHistory?.length ? acwr : null,
      daysSince: workoutHistory?.length ? daysSince : null,
      lastRpe: null,
      wellness,
      splits: workoutHistory?.length ? splits : null,
    }),
  };
};

/** Tygodniowe obciążenia sRPE — baza prognozy zmęczenia. */
export const computeWeeklySrpeLoads = (workoutHistory, weeks = 6, now = Date.now()) => {
  const weekMs = 7 * DAY_MS;
  const result = [];

  for (let w = 0; w < weeks; w++) {
    const start = now - (w + 1) * weekMs;
    const end = now - w * weekMs;
    const load = (workoutHistory ?? [])
      .filter((h) => {
        const t = new Date(h.savedAt).getTime();
        return t >= start && t < end;
      })
      .reduce((a, h) => a + estimateSessionLoad(h), 0);
    result.unshift({ week: weeks - w, load });
  }

  return result;
};
