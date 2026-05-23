// ─── Algorytmy modułu Profil i Analityka ─────────────────────────────────────

export const calcEpley1RM = (kg, reps) => {
  const w = parseFloat(kg);
  const r = parseInt(reps, 10);
  if (!w || !r || r <= 0) return null;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 2) / 2;
};

const norm = (str) =>
  (str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Klasyfikacja ruchu: Push / Pull / Nogi / Core
const PUSH_KW = ['klatka', 'piersiow', 'wycisk', 'triceps', 'bark', 'naramienny', 'dipy', 'pompki', 'overhead', 'zolniersk'];
const PULL_KW = ['plec', 'najszerszy', 'wioslow', 'podciag', 'biceps', 'ramienno', 'tylny bark', 'face pull', 'shrugg'];
const LEGS_KW = ['noga', 'czworoglow', 'poslad', 'dwuglow', 'przysiad', 'martwy', 'wypad', 'leg press', 'lydk'];
const CORE_KW = ['brzuch', 'core', 'plank', 'brzusz'];

export const classifyMovement = (exercise) => {
  const blob = norm([
    exercise?.name,
    ...(exercise?.muscles ?? []),
    ...(exercise?.muscleGroup?.split(/[·,]/) ?? []),
  ].join(' '));

  if (LEGS_KW.some((k) => blob.includes(k))) return 'legs';
  if (PULL_KW.some((k) => blob.includes(k))) return 'pull';
  if (PUSH_KW.some((k) => blob.includes(k))) return 'push';
  if (CORE_KW.some((k) => blob.includes(k))) return 'core';
  return 'other';
};

export const setTonnage = (set) => {
  if (!set?.done) return 0;
  return (parseFloat(set.kg) || 0) * (parseInt(set.reps, 10) || 0);
};

export const exerciseTonnage = (ex) =>
  (ex.sets ?? []).reduce((a, s) => a + setTonnage(s), 0);

// ─── Asymetria Push / Pull / Nogi / Core ─────────────────────────────────────
export const computeAsymmetryStats = (workoutHistory) => {
  const totals = { push: 0, pull: 0, legs: 0, core: 0, other: 0 };

  (workoutHistory ?? []).forEach((w) => {
    (w.exercises ?? []).forEach((ex) => {
      const ton = exerciseTonnage(ex);
      if (!ton) return;
      const cat = classifyMovement(ex);
      totals[cat] = (totals[cat] ?? 0) + ton;
    });
  });

  const axes = [
    { key: 'push', label: 'Push' },
    { key: 'pull', label: 'Pull' },
    { key: 'legs', label: 'Nogi' },
    { key: 'core', label: 'Core' },
  ];

  const max = Math.max(...axes.map((a) => totals[a.key]), 1);
  const values = axes.map((a) => ({
    ...a,
    tonnage: totals[a.key],
    normalized: totals[a.key] / max,
  }));

  const pushPullRatio = totals.pull > 0
    ? Math.round((totals.push / totals.pull) * 100) / 100
    : null;

  let balanceHint = 'Zbalansowany rozkład objętości.';
  if (pushPullRatio !== null) {
    if (pushPullRatio > 1.35) balanceHint = 'Przewaga Push — rozważ więcej ćwiczeń na plecy.';
    else if (pushPullRatio < 0.75) balanceHint = 'Przewaga Pull — dodaj objętości na klatkę/barki.';
  }

  return { values, pushPullRatio, balanceHint, hasData: max > 1 };
};

// ─── Prognoza zmęczenia (2 tyg.) ─────────────────────────────────────────────
export const computeFatigueForecast = (workoutHistory) => {
  if (!workoutHistory?.length) return { points: [], trendPct: 0, message: 'Brak danych treningowych.' };

  const now = Date.now();
  const weekMs = 7 * 24 * 3600 * 1000;

  const weeklyVolumes = [];
  for (let w = 0; w < 6; w++) {
    const start = now - (w + 1) * weekMs;
    const end   = now - w * weekMs;
    const vol = workoutHistory
      .filter((h) => {
        const t = new Date(h.savedAt).getTime();
        return t >= start && t < end;
      })
      .reduce((a, h) => a + (h.tonnage ?? 0), 0);
    weeklyVolumes.unshift({ week: 6 - w, volume: vol });
  }

  const recent = weeklyVolumes.slice(-3).map((x) => x.volume);
  const avgRecent = recent.reduce((a, b) => a + b, 0) / Math.max(recent.length, 1);
  const prevAvg = weeklyVolumes.slice(0, 3).reduce((a, x) => a + x.volume, 0) / 3;
  const trendPct = prevAvg > 0 ? Math.round(((avgRecent - prevAvg) / prevAvg) * 100) : 0;

  // Indeks siły bazowy z najlepszych 1RM z ostatnich 4 tyg.
  let best1RM = 0;
  workoutHistory
    .filter((h) => now - new Date(h.savedAt).getTime() < 4 * weekMs)
    .forEach((h) => {
      (h.exercises ?? []).forEach((ex) => {
        (ex.sets ?? []).filter((s) => s.done).forEach((s) => {
          const orm = calcEpley1RM(s.kg, s.reps);
          if (orm && orm > best1RM) best1RM = orm;
        });
      });
    });

  const baseStrength = best1RM || 100;
  const fatigueRate = Math.max(0, trendPct) * 0.003 + (avgRecent > prevAvg * 1.2 ? 0.02 : 0);

  const points = [
    { label: 'Dziś', strength: 100 },
    { label: '+1 tydz.', strength: Math.round((1 - fatigueRate * 0.5) * 100) },
    { label: '+2 tyg.', strength: Math.round((1 - fatigueRate) * 100) },
  ];

  let message = 'Obciążenie stabilne — siła powinna utrzymać poziom.';
  if (trendPct > 15) message = 'Szybki wzrost objętości — ryzyko kumulacji zmęczenia za ~2 tygodnie.';
  else if (trendPct > 5) message = 'Umiarkowany wzrost obciążenia — monitoruj regenerację.';

  return { points, trendPct, baseStrength, message, weeklyVolumes };
};

// ─── Ready-to-Lift Score (1–10) ──────────────────────────────────────────────
export const computeReadinessScore = (workoutHistory, opts = {}) => {
  const { sleepOk = false, creatineOk = false } = opts;
  if (!workoutHistory?.length) {
    return { score: 5, factors: [], label: 'Umiarkowana', color: '#FAC775' };
  }

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const last = new Date(workoutHistory[0].savedAt).getTime();
  const daysSince = (now - last) / dayMs;

  const weekMs = 7 * dayMs;
  const acuteVol = workoutHistory
    .filter((h) => now - new Date(h.savedAt).getTime() < weekMs)
    .reduce((a, h) => a + (h.tonnage ?? 0), 0);
  const chronicVol = workoutHistory
    .filter((h) => now - new Date(h.savedAt).getTime() < 4 * weekMs)
    .reduce((a, h) => a + (h.tonnage ?? 0), 0) / 4;
  const acwr = chronicVol > 0 ? acuteVol / chronicVol : 1;

  let lastRpe = null;
  const lastEx = workoutHistory[0]?.exercises ?? [];
  lastEx.forEach((ex) => {
    (ex.sets ?? []).filter((s) => s.done && s.rpe).forEach((s) => {
      const r = parseFloat(s.rpe);
      if (!isNaN(r)) lastRpe = lastRpe === null ? r : Math.max(lastRpe, r);
    });
  });

  let score = 7;
  const factors = [];

  if (daysSince >= 1 && daysSince <= 2) { score += 1; factors.push({ text: '1–2 dni odpoczynku', impact: +1 }); }
  else if (daysSince < 1) { score -= 1.5; factors.push({ text: 'Trening wczoraj/dziś', impact: -1.5 }); }
  else if (daysSince > 5) { score -= 0.5; factors.push({ text: 'Dłuższa przerwa (>5 dni)', impact: -0.5 }); }

  if (acwr > 1.3) { score -= 1.5; factors.push({ text: 'Wysokie obciążenie ostre (ACWR)', impact: -1.5 }); }
  else if (acwr >= 0.8 && acwr <= 1.2) { score += 0.5; factors.push({ text: 'Optymalne obciążenie tygodniowe', impact: +0.5 }); }

  if (lastRpe !== null && lastRpe >= 9.5) { score -= 1; factors.push({ text: 'Ostatnia sesja bardzo ciężka (RPE 9.5+)', impact: -1 }); }
  if (sleepOk) { score += 0.5; factors.push({ text: 'Sen odhaczony', impact: +0.5 }); }
  if (creatineOk) { score += 0.3; factors.push({ text: 'Kreatyna przyjęta', impact: +0.3 }); }

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  let label = 'Umiarkowana';
  let color = '#FAC775';
  if (score >= 8) { label = 'Wysoka'; color = '#00E676'; }
  else if (score >= 6) { label = 'Dobra'; color = '#378ADD'; }
  else if (score < 4) { label = 'Niska'; color = '#FF5252'; }

  return { score, factors, label, color, acwr: Math.round(acwr * 100) / 100, daysSince: Math.round(daysSince * 10) / 10 };
};

// ─── Estymacja celu wagowego (redukcja / masa) ───────────────────────────────
export const getGoalMode = (currentKg, targetKg) => {
  const current = parseFloat(currentKg);
  const target  = parseFloat(targetKg);
  if (!current || !target || current === target) return null;
  return target < current ? 'cut' : 'bulk';
};

export const estimateGoalDate = (currentKg, targetKg, dailyAdjustmentKcal) => {
  const current = parseFloat(currentKg);
  const target  = parseFloat(targetKg);
  const adjustment = parseFloat(dailyAdjustmentKcal);
  const mode = getGoalMode(current, target);

  if (!mode) {
    return { days: null, date: null, weeklyChangeKg: 0, mode: null, message: 'Ustaw wagę docelową różną od obecnej.' };
  }
  if (!adjustment || adjustment <= 0) {
    return {
      days: null,
      date: null,
      weeklyChangeKg: 0,
      mode,
      message: mode === 'cut'
        ? 'Ustaw dodatni deficyt kaloryczny.'
        : 'Ustaw dodatnią nadwyżkę kaloryczną.',
    };
  }

  const diffKg = Math.abs(current - target);
  // Przy masie realistycznie wolniejszy przyrost niż spadek przy deficycie
  const kcalPerKg = mode === 'cut' ? 7700 : 5500;
  const dailyChangeKg = adjustment / kcalPerKg;
  const days = Math.ceil(diffKg / dailyChangeKg);
  const date = new Date();
  date.setDate(date.getDate() + days);
  const weeklyChangeKg = Math.round(dailyChangeKg * 7 * 100) / 100;

  const calorieLabel = mode === 'cut' ? 'deficyt' : 'nadwyżka';
  const directionLabel = mode === 'cut' ? 'redukcji' : 'budowy masy';

  return {
    days,
    date,
    weeklyChangeKg,
    diffKg: Math.round(diffKg * 10) / 10,
    mode,
    calorieLabel,
    adjustment,
    message: `Przy ${calorieLabel} ${adjustment} kcal/d szacowany czas ${directionLabel}: ~${days} dni (${weeklyChangeKg} kg/tydz.).`,
  };
};

// ─── Wilks / Dots ────────────────────────────────────────────────────────────
export const calcWilks = (totalKg, bodyWeightKg, gender = 'male') => {
  const bw = parseFloat(bodyWeightKg);
  const total = parseFloat(totalKg);
  if (!bw || !total) return null;

  if (gender === 'female') {
    const a = 594.31747775582, b = -27.23842536447, c = 0.82112226871;
    const d = -0.00930733913, e = 0.00004731582, f = -0.00000009054;
    const denom = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5;
    return Math.round((total * 500 / denom) * 10) / 10;
  }

  const a = -216.0475144, b = 16.2606339, c = -0.002388645;
  const d = -0.00113732, e = 7.01863e-06, f = -1.291e-08;
  const denom = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5;
  return Math.round((total * 500 / denom) * 10) / 10;
};

export const calcDots = (totalKg, bodyWeightKg, gender = 'male') => {
  const bw = parseFloat(bodyWeightKg);
  const total = parseFloat(totalKg);
  if (!bw || !total) return null;

  if (gender === 'female') {
    const a = -0.0000010706, b = 0.0005153579, c = -0.1195973362;
    const d = 13.6175032, e = -172.132502;
    const denom = a * bw ** 5 + b * bw ** 4 + c * bw ** 3 + d * bw ** 2 + e * bw;
    return Math.round((total * 500 / denom) * 10) / 10;
  }

  const a = -0.0000010930, b = 0.0007391293, c = -0.1918759221;
  const d = 24.0900756, e = -307.75076;
  const denom = a * bw ** 5 + b * bw ** 4 + c * bw ** 3 + d * bw ** 2 + e * bw;
  return Math.round((total * 500 / denom) * 10) / 10;
};

export const estimateSBDTotal = (workoutHistory) => {
  const bests = { squat: 0, bench: 0, deadlift: 0 };

  (workoutHistory ?? []).forEach((w) => {
    (w.exercises ?? []).forEach((ex) => {
      const n = norm(ex.name);
      let lift = null;
      if (n.includes('przysiad') || n.includes('squat')) lift = 'squat';
      else if (n.includes('wycisk') && (n.includes('lez') || n.includes('lawce') || n.includes('bench'))) lift = 'bench';
      else if (n.includes('martwy') || n.includes('deadlift')) lift = 'deadlift';
      if (!lift) return;

      (ex.sets ?? []).filter((s) => s.done).forEach((s) => {
        const orm = calcEpley1RM(s.kg, s.reps);
        if (orm && orm > bests[lift]) bests[lift] = orm;
      });
    });
  });

  const total = bests.squat + bests.bench + bests.deadlift;
  return { bests, total, hasData: total > 0 };
};

const LEVEL_THRESHOLDS = [
  0, 500, 1500, 3500, 7000, 12000, 20000, 32000, 50000, 80000, 120000,
];

export const computeLevelSystem = (workoutHistory, bodyWeightKg, gender = 'male') => {
  const totalTonnage = (workoutHistory ?? []).reduce((a, w) => a + (w.tonnage ?? 0), 0);
  const xp = Math.floor(totalTonnage / 100);

  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = nextThreshold > currentThreshold
    ? (xp - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;

  const { total: sbdTotal, hasData: hasSbd } = estimateSBDTotal(workoutHistory);
  const wilks = hasSbd ? calcWilks(sbdTotal, bodyWeightKg, gender) : null;
  const dots  = hasSbd ? calcDots(sbdTotal, bodyWeightKg, gender) : null;

  const titles = [
    'Nowicjusz', 'Amator', 'Regular', 'Adept', 'Wojownik',
    'Mistrz', 'Elita', 'Tytan', 'Legenda', 'Immortal', 'Bezgraniczny',
  ];

  return {
    xp,
    level,
    levelTitle: titles[Math.min(level - 1, titles.length - 1)],
    progress: Math.min(Math.max(progress, 0), 1),
    nextXp: nextThreshold,
    totalTonnage,
    wilks,
    dots,
    sbdTotal,
    hasSbd,
  };
};

export const buildShareSummary = (workoutHistory, levelData) => {
  const sessions = workoutHistory?.length ?? 0;
  const tonnage  = levelData?.totalTonnage ?? 0;
  const last     = workoutHistory?.[0];
  return {
    sessions,
    tonnage,
    level: levelData?.level ?? 1,
    levelTitle: levelData?.levelTitle ?? 'Nowicjusz',
    xp: levelData?.xp ?? 0,
    lastWorkout: last?.workoutName ?? '—',
    lastDate: last?.savedAt ?? null,
    wilks: levelData?.wilks,
    dots: levelData?.dots,
  };
};
