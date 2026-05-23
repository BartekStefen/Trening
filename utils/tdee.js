// Wspólna logika TDEE (Mifflin-St Jeor) — onboarding + kalkulator

export const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Siedzący',      desc: 'Biuro, brak ćwiczeń',             factor: 1.2   },
  { id: 'light',      label: 'Lekki',          desc: '1–3 treningi / tydzień',          factor: 1.375 },
  { id: 'moderate',   label: 'Umiarkowany',    desc: '3–5 treningów / tydzień',         factor: 1.55  },
  { id: 'active',     label: 'Aktywny',        desc: '6–7 treningów / tydzień',         factor: 1.725 },
  { id: 'veryactive', label: 'Bardzo aktywny', desc: 'Ciężka praca fizyczna + trening', factor: 1.9   },
];

export const GOAL_INTENTS = [
  {
    id: 'cut',
    label: 'Redukcja',
    desc: 'Schudnąć i odsłonić sylwetkę',
    icon: 'trending-down-outline',
    color: '#FF5252',
    needsTarget: true,
    defaultPace: 'cut',
  },
  {
    id: 'bulk',
    label: 'Budowa masy',
    desc: 'Przybrać na wadze i sile',
    icon: 'trending-up-outline',
    color: '#378ADD',
    needsTarget: true,
    defaultPace: 'bulk',
  },
  {
    id: 'maintain',
    label: 'Utrzymanie',
    desc: 'Trzymać obecną wagę i formę',
    icon: 'remove-outline',
    color: '#00E676',
    needsTarget: false,
    defaultPace: 'maintain',
  },
  {
    id: 'strength',
    label: 'Siła / moc',
    desc: 'Koncentruj się na progresji w treningu',
    icon: 'barbell-outline',
    color: '#FAC775',
    needsTarget: false,
    defaultPace: 'mild_bulk',
  },
];

export const GOAL_PACES = [
  { id: 'cut',       label: 'Redukcja',     delta: -500, desc: '~0.5 kg / tydzień' },
  { id: 'mild_cut',  label: 'Lekka reduk.', delta: -250, desc: '~0.25 kg / tydzień' },
  { id: 'maintain',  label: 'Utrzymanie',   delta: 0,    desc: 'Bez zmian wagi' },
  { id: 'mild_bulk', label: 'Lekka masa',   delta: 250,  desc: '~0.25 kg / tydzień' },
  { id: 'bulk',      label: 'Masa',         delta: 500,  desc: '~0.5 kg / tydzień' },
];

export const calcBMR = ({ weight, height, age, sex }) => {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseFloat(age);
  if (!w || !h || !a) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
};

export const calcTDEE = ({ weight, height, age, sex, activityId }) => {
  const bmr = calcBMR({ weight, height, age, sex });
  if (!bmr) return null;
  const act = ACTIVITY_LEVELS.find((a) => a.id === activityId);
  return Math.round(bmr * (act?.factor ?? 1.55));
};

export const paceDelta = (paceId) =>
  GOAL_PACES.find((p) => p.id === paceId)?.delta ?? 0;

export const suggestTargetWeight = (currentKg, intent) => {
  const w = parseFloat(currentKg);
  if (!w) return 75;
  if (intent === 'cut') return Math.round((w - 5) * 10) / 10;
  if (intent === 'bulk') return Math.round((w + 3) * 10) / 10;
  return w;
};

export const calorieAdjustmentFromPace = (paceId) => Math.abs(paceDelta(paceId));

export const targetCalories = (tdee, paceId) => {
  if (!tdee) return null;
  return tdee + paceDelta(paceId);
};
