export const DEFAULT_RPE = '8';

/** Ostatnie RPE z zaliczonych serii tego ćwiczenia, inaczej domyślne 8. */
export const inferDefaultRpe = (sets, currentSetId) => {
  for (let i = (sets?.length ?? 0) - 1; i >= 0; i--) {
    const s = sets[i];
    if (s.id === currentSetId || !s.done || !s.rpe) continue;
    const r = parseFloat(s.rpe);
    if (!isNaN(r) && r >= 6 && r <= 10) return String(s.rpe);
  }
  return DEFAULT_RPE;
};
