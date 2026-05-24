import { computeLevelSystem } from './profileAnalytics';

/** Kolejność rang od najniższej */
export const TIER_ORDER = ['copper', 'bronze', 'silver', 'gold', 'platinum', 'elite', 'legendary'];

export const ACHIEVEMENT_TIERS = {
  copper: { color: '#B87333', label: 'Miedź', order: 0 },
  bronze: { color: '#CD7F32', label: 'Brąz', order: 1 },
  silver: { color: '#90A4AE', label: 'Srebro', order: 2 },
  gold: { color: '#FFD700', label: 'Złoto', order: 3 },
  platinum: { color: '#E5E4E2', label: 'Platyna', order: 4 },
  elite: { color: '#AB47BC', label: 'Elita', order: 5 },
  legendary: { color: '#FF6F00', label: 'Legenda', order: 6 },
};

export const ACHIEVEMENTS = [
  { id: 'first_workout', title: 'Pierwszy krok', description: 'Zapisz pierwszy ukończony trening.', icon: 'footsteps', tier: 'copper', category: 'trening', target: 1, progressKey: 'sessions' },
  { id: 'sessions_5', title: 'Rozgrzewka', description: 'Ukończ 5 sesji treningowych.', icon: 'walk', tier: 'copper', category: 'trening', target: 5, progressKey: 'sessions' },
  { id: 'sessions_10', title: 'W stałej formie', description: 'Ukończ 10 sesji treningowych.', icon: 'calendar', tier: 'bronze', category: 'trening', target: 10, progressKey: 'sessions' },
  { id: 'sessions_25', title: 'Dyscyplina', description: 'Ukończ 25 sesji treningowych.', icon: 'barbell', tier: 'bronze', category: 'trening', target: 25, progressKey: 'sessions' },
  { id: 'sessions_50', title: 'Weteran', description: 'Ukończ 50 sesji treningowych.', icon: 'fitness', tier: 'silver', category: 'trening', target: 50, progressKey: 'sessions' },
  { id: 'sessions_100', title: 'Nie do zatrzymania', description: 'Ukończ 100 sesji treningowych.', icon: 'flame', tier: 'gold', category: 'trening', target: 100, progressKey: 'sessions' },
  { id: 'sessions_200', title: 'Maszyna', description: 'Ukończ 200 sesji treningowych.', icon: 'rocket', tier: 'platinum', category: 'trening', target: 200, progressKey: 'sessions' },
  { id: 'sessions_365', title: 'Rok w sali', description: 'Ukończ 365 sesji treningowych.', icon: 'trophy', tier: 'legendary', category: 'trening', target: 365, progressKey: 'sessions' },

  { id: 'tonnage_1k', title: 'Pierwsza tona', description: 'Łączny tonaż 1 000 kg.', icon: 'trending-up', tier: 'copper', category: 'objętość', target: 1000, progressKey: 'totalTonnage' },
  { id: 'tonnage_10k', title: 'Dziesięć ton', description: 'Łączny tonaż 10 000 kg.', icon: 'barbell', tier: 'bronze', category: 'objętość', target: 10000, progressKey: 'totalTonnage' },
  { id: 'tonnage_25k', title: 'Dwadzieścia pięć ton', description: 'Łączny tonaż 25 000 kg.', icon: 'stats-chart', tier: 'silver', category: 'objętość', target: 25000, progressKey: 'totalTonnage' },
  { id: 'tonnage_50k', title: 'Pięćdziesiąt ton', description: 'Łączny tonaż 50 000 kg.', icon: 'pulse', tier: 'silver', category: 'objętość', target: 50000, progressKey: 'totalTonnage' },
  { id: 'tonnage_100k', title: 'Sto ton', description: 'Łączny tonaż 100 000 kg.', icon: 'medal', tier: 'gold', category: 'objętość', target: 100000, progressKey: 'totalTonnage' },
  { id: 'tonnage_250k', title: 'Tytan tonażu', description: 'Łączny tonaż 250 000 kg.', icon: 'shield', tier: 'platinum', category: 'objętość', target: 250000, progressKey: 'totalTonnage' },
  { id: 'tonnage_500k', title: 'Pół miliona', description: 'Łączny tonaż 500 000 kg.', icon: 'star', tier: 'elite', category: 'objętość', target: 500000, progressKey: 'totalTonnage' },
  { id: 'tonnage_1m', title: 'Milion kilogramów', description: 'Łączny tonaż 1 000 000 kg.', icon: 'diamond', tier: 'legendary', category: 'objętość', target: 1000000, progressKey: 'totalTonnage' },

  { id: 'first_pr', title: 'Personal Best', description: 'Ustaw pierwszy rekord 1RM.', icon: 'ribbon', tier: 'bronze', category: 'rekordy', target: 1, progressKey: 'recordCount' },
  { id: 'pr_three', title: 'Kolekcjoner PR', description: 'Zapisz rekordy w 3 ćwiczeniach.', icon: 'bookmark', tier: 'bronze', category: 'rekordy', target: 3, progressKey: 'recordCount' },
  { id: 'pr_five', title: 'Rekordziarz', description: 'Zapisz rekordy w 5 ćwiczeniach.', icon: 'medal', tier: 'silver', category: 'rekordy', target: 5, progressKey: 'recordCount' },
  { id: 'pr_ten', title: 'Biblioteka siły', description: 'Zapisz rekordy w 10 ćwiczeniach.', icon: 'library', tier: 'gold', category: 'rekordy', target: 10, progressKey: 'recordCount' },
  { id: 'pr_twenty', title: 'Atlas rekordów', description: 'Zapisz rekordy w 20 ćwiczeniach.', icon: 'trophy', tier: 'elite', category: 'rekordy', target: 20, progressKey: 'recordCount' },

  { id: 'plan_maker', title: 'Twórca planu', description: 'Stwórz własny plan w kreatorze.', icon: 'construct', tier: 'bronze', category: 'planowanie', target: 1, progressKey: 'customPlanCount' },
  { id: 'plan_architect', title: 'Architekt rutyny', description: 'Stwórz 3 własne plany.', icon: 'layers', tier: 'silver', category: 'planowanie', target: 3, progressKey: 'customPlanCount' },
  { id: 'plan_master', title: 'Mistrz planowania', description: 'Stwórz 5 własnych planów.', icon: 'grid', tier: 'gold', category: 'planowanie', target: 5, progressKey: 'customPlanCount' },

  { id: 'onboarding', title: 'Pełna konfiguracja', description: 'Ukończ onboarding profilu.', icon: 'checkmark-circle', tier: 'copper', category: 'profil' },
  { id: 'habits_perfect', title: 'Perfekcyjny dzień', description: 'Odhacz wszystkie nawyki dzienne.', icon: 'sparkles', tier: 'bronze', category: 'nawyki' },

  { id: 'level_3', title: 'Adept', description: 'Osiągnij poziom 3 w systemie XP.', icon: 'arrow-up', tier: 'bronze', category: 'poziomy', target: 3, progressKey: 'level' },
  { id: 'level_5', title: 'Wojownik', description: 'Osiągnij poziom 5 w systemie XP.', icon: 'shield', tier: 'silver', category: 'poziomy', target: 5, progressKey: 'level' },
  { id: 'level_7', title: 'Mistrz', description: 'Osiągnij poziom 7 w systemie XP.', icon: 'flash', tier: 'gold', category: 'poziomy', target: 7, progressKey: 'level' },
  { id: 'level_10', title: 'Legenda XP', description: 'Osiągnij poziom 10 w systemie XP.', icon: 'star', tier: 'platinum', category: 'poziomy', target: 10, progressKey: 'level' },
  { id: 'level_15', title: 'Immortal', description: 'Osiągnij poziom 15 w systemie XP.', icon: 'infinite', tier: 'legendary', category: 'poziomy', target: 15, progressKey: 'level' },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

const CHECKS = {
  first_workout: (s) => s.sessions >= 1,
  sessions_5: (s) => s.sessions >= 5,
  sessions_10: (s) => s.sessions >= 10,
  sessions_25: (s) => s.sessions >= 25,
  sessions_50: (s) => s.sessions >= 50,
  sessions_100: (s) => s.sessions >= 100,
  sessions_200: (s) => s.sessions >= 200,
  sessions_365: (s) => s.sessions >= 365,
  tonnage_1k: (s) => s.totalTonnage >= 1000,
  tonnage_10k: (s) => s.totalTonnage >= 10000,
  tonnage_25k: (s) => s.totalTonnage >= 25000,
  tonnage_50k: (s) => s.totalTonnage >= 50000,
  tonnage_100k: (s) => s.totalTonnage >= 100000,
  tonnage_250k: (s) => s.totalTonnage >= 250000,
  tonnage_500k: (s) => s.totalTonnage >= 500000,
  tonnage_1m: (s) => s.totalTonnage >= 1000000,
  first_pr: (s) => s.recordCount >= 1,
  pr_three: (s) => s.recordCount >= 3,
  pr_five: (s) => s.recordCount >= 5,
  pr_ten: (s) => s.recordCount >= 10,
  pr_twenty: (s) => s.recordCount >= 20,
  plan_maker: (s) => s.customPlanCount >= 1,
  plan_architect: (s) => s.customPlanCount >= 3,
  plan_master: (s) => s.customPlanCount >= 5,
  onboarding: (s) => s.onboardingCompleted,
  habits_perfect: (s) => s.allHabitsDone,
  level_3: (s) => s.level >= 3,
  level_5: (s) => s.level >= 5,
  level_7: (s) => s.level >= 7,
  level_10: (s) => s.level >= 10,
  level_15: (s) => s.level >= 15,
};

export function buildAchievementStats({
  workoutHistory,
  exerciseRecords,
  customPlans,
  dailyHabits,
  onboardingCompleted,
  bodyWeightKg,
  gender,
}) {
  const sessions = workoutHistory?.length ?? 0;
  const totalTonnage = (workoutHistory ?? []).reduce((a, w) => a + (w.tonnage ?? 0), 0);
  const recordCount = Object.keys(exerciseRecords ?? {}).length;
  const customPlanCount = customPlans?.length ?? 0;
  const allHabitsDone = (dailyHabits?.length ?? 0) > 0 && dailyHabits.every((h) => h.done);
  const { level } = computeLevelSystem(workoutHistory, bodyWeightKg, gender);

  return {
    sessions,
    totalTonnage,
    recordCount,
    customPlanCount,
    allHabitsDone,
    onboardingCompleted: !!onboardingCompleted,
    level,
  };
}

export function evaluateAchievements(stats) {
  const unlocked = [];
  for (const def of ACHIEVEMENTS) {
    const check = CHECKS[def.id];
    if (check?.(stats)) unlocked.push(def.id);
  }
  return unlocked;
}

export function getAchievementProgress(def, stats) {
  if (!def.progressKey || !def.target) return null;
  const current = stats[def.progressKey] ?? 0;
  return Math.min(current / def.target, 1);
}

export function formatUnlockDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function filterAchievements(badges, { query = '', tier = 'all', status = 'all' }) {
  const q = query.trim().toLowerCase();
  return badges.filter((b) => {
    if (tier !== 'all' && b.tier !== tier) return false;
    if (status === 'unlocked' && !b.isUnlocked) return false;
    if (status === 'locked' && b.isUnlocked) return false;
    if (!q) return true;
    const tierLabel = ACHIEVEMENT_TIERS[b.tier]?.label?.toLowerCase() ?? '';
    return (
      b.title.toLowerCase().includes(q)
      || b.description.toLowerCase().includes(q)
      || b.category.toLowerCase().includes(q)
      || tierLabel.includes(q)
    );
  });
}

export function groupBadgesByTier(badges) {
  return TIER_ORDER.map((tierId) => {
    const tierBadges = badges.filter((b) => b.tier === tierId);
    if (!tierBadges.length) return null;
    return {
      tierId,
      label: ACHIEVEMENT_TIERS[tierId].label,
      color: ACHIEVEMENT_TIERS[tierId].color,
      badges: tierBadges,
    };
  }).filter(Boolean);
}

export function pickPreviewBadges(badges, count = 3) {
  const unlocked = badges
    .filter((b) => b.isUnlocked)
    .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0));
  const locked = badges
    .filter((b) => !b.isUnlocked)
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));

  const picked = [...unlocked.slice(0, count)];
  if (picked.length < count) {
    picked.push(...locked.slice(0, count - picked.length));
  }
  return picked.slice(0, count);
}
