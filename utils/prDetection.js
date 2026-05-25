/** Wykrywanie PR — ciężar musi pobić historię (prevLog) i poprzednie serie w tej sesji. */

export const parsePrevLogKg = (prevLog) => {
  const kg = parseFloat(String(prevLog ?? '').split(' ')[0]);
  return !isNaN(kg) && kg > 0 ? kg : 0;
};

/** Najwyższy kg z innych zaliczonych serii w tym ćwiczeniu (bieżąca sesja). */
export const getSessionBestKg = (sets, excludeSetId = null) => {
  let best = 0;
  (sets ?? []).forEach((s) => {
    if (s.id === excludeSetId || !s.done) return;
    const kg = parseFloat(s.kg);
    if (!isNaN(kg) && kg > best) best = kg;
  });
  return best;
};

/**
 * PR tylko gdy:
 * - kg > max poprzednich serii w tej sesji (np. 115 po 120 → nie)
 * - oraz kg > prevLog z historii (gdy jest)
 */
export const isPersonalRecord = (set, exerciseSets) => {
  const newKg = parseFloat(set?.kg);
  if (!set?.done || isNaN(newKg) || newKg <= 0) return false;

  const sessionBest = getSessionBestKg(exerciseSets, set.id);
  if (newKg <= sessionBest) return false;

  const prevKg = parsePrevLogKg(set.prevLog);
  if (prevKg > 0) return newKg > prevKg;

  return newKg > sessionBest;
};

export const collectSessionPRs = (exercises) =>
  (exercises ?? []).reduce((acc, ex) => {
    const hits = (ex.sets ?? []).filter((s) => isPersonalRecord(s, ex.sets));
    if (!hits.length) return acc;
    const best = hits.reduce((a, s) =>
      (parseFloat(s.kg) > parseFloat(a.kg) ? s : a));
    acc.push({ name: ex.name, exerciseName: ex.name, kg: best.kg, reps: best.reps });
    return acc;
  }, []);
