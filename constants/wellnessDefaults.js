/** Kwestionariusz dzienny — wzorowany na monitoringu Hooper (sen, zmęczenie, DOMS, stres). */

export const WELLNESS_ITEMS = [
  { key: 'sleep', label: 'Sen', hint: '1 = bardzo słaby · 5 = wypoczęty' },
  { key: 'fatigue', label: 'Energia', hint: '1 = wyczerpany · 5 = pełna energia' },
  { key: 'doms', label: 'DOMS', hint: '1 = silny ból · 5 = brak bólu' },
  { key: 'stress', label: 'Stres', hint: '1 = bardzo wysoki · 5 = spokój' },
];

export const NEUTRAL_WELLNESS = { sleep: 3, fatigue: 3, doms: 3, stress: 3 };

export const todayDateKey = () => new Date().toISOString().slice(0, 10);

export const normalizeWellnessForToday = (stored) => {
  const today = todayDateKey();
  if (!stored || stored.date !== today) {
    return { date: today, ...NEUTRAL_WELLNESS };
  }
  return {
    date: today,
    sleep: stored.sleep ?? 3,
    fatigue: stored.fatigue ?? 3,
    doms: stored.doms ?? 3,
    stress: stored.stress ?? 3,
  };
};
