/** Wspólne cele makro/kcal — Dieta i pierścienie korzystają z tych samych wartości. */
export const DEFAULT_NUTRITION = {
  kcalEaten: 1500,
  kcalGoal: 3000,
  protein: { eaten: 120, min: 150, max: 170 },
  fat: { eaten: 40, min: 45, max: 55 },
  carbs: { eaten: 130, min: 200, max: 230 },
};

export const MACRO_COLORS = {
  kcal: '#FF6B6B',
  protein: '#00E676',
  fat: '#EF9F27',
  carbs: '#378ADD',
  water: '#378ADD',
  volume: '#A78BFA',
};

export const RING_VOLUME_GOALS = {
  dayKg: 8000,
  weekKg: 35000,
};

export const RING_WEEK_SESSION_GOAL = 4;
