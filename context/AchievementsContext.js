import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkoutContext } from './WorkoutContext';
import { useProfileGoals } from './ProfileGoalsContext';
import useBodyWeight from '../hooks/useBodyWeight';
import {
  ACHIEVEMENTS,
  buildAchievementStats,
  evaluateAchievements,
  getAchievementProgress,
} from '../utils/achievements';
const STORAGE_KEY = '@fitness_achievements_unlocked';
const AchievementsContext = createContext(null);

export function AchievementsProvider({ children }) {
  const {
    workoutHistory,
    exerciseRecords,
    customPlans,
    dailyHabits,
    hydrated: workoutHydrated,
  } = useWorkoutContext();
  const { onboardingCompleted, gender, currentWeight } = useProfileGoals();
  const [bodyWeightFromWorkout] = useBodyWeight(80);

  const [unlockedMap, setUnlockedMap] = useState({});
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [toastQueue, setToastQueue] = useState([]);
  const skipUnlockToastRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUnlockedMap(JSON.parse(raw));
      } catch {}
      setStorageHydrated(true);
    })();
  }, []);

  const stats = useMemo(
    () => buildAchievementStats({
      workoutHistory,
      exerciseRecords,
      customPlans,
      dailyHabits,
      onboardingCompleted,
      bodyWeightKg: currentWeight || bodyWeightFromWorkout,
      gender,
    }),
    [
      workoutHistory,
      exerciseRecords,
      customPlans,
      dailyHabits,
      onboardingCompleted,
      currentWeight,
      bodyWeightFromWorkout,
      gender,
    ],
  );

  const eligibleIds = useMemo(
    () => new Set(evaluateAchievements(stats)),
    [stats],
  );

  const enqueueUnlockToasts = useCallback((ids) => {
    if (!ids.length) return;
    setToastQueue((prev) => [
      ...prev,
      ...ids.map((id) => {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        return def ? { id, at: Date.now() } : null;
      }).filter(Boolean),
    ]);
  }, []);

  useEffect(() => {
    if (!workoutHydrated || !storageHydrated) return;

    setUnlockedMap((prev) => {
      const newlyUnlocked = [];
      let changed = false;
      const next = { ...prev };

      eligibleIds.forEach((id) => {
        if (!next[id]) {
          next[id] = { unlockedAt: new Date().toISOString() };
          if (!skipUnlockToastRef.current) newlyUnlocked.push(id);
          changed = true;
        }
      });

      if (!changed) return prev;

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

      if (skipUnlockToastRef.current) {
        skipUnlockToastRef.current = false;
      } else if (newlyUnlocked.length) {
        setTimeout(() => enqueueUnlockToasts(newlyUnlocked), 0);
      }

      return next;
    });
  }, [eligibleIds, workoutHydrated, storageHydrated, enqueueUnlockToasts]);

  const badges = useMemo(
    () => ACHIEVEMENTS.map((def) => {
      const unlock = unlockedMap[def.id];
      const isUnlocked = !!unlock && eligibleIds.has(def.id);
      return {
        ...def,
        isUnlocked,
        unlockedAt: unlock?.unlockedAt ?? null,
        progress: isUnlocked ? 1 : getAchievementProgress(def, stats),
      };
    }),
    [unlockedMap, eligibleIds, stats],
  );

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);

  const activeToast = toastQueue[0] ?? null;
  const activeToastBadge = activeToast
    ? badges.find((b) => b.id === activeToast.id) ?? { ...ACHIEVEMENTS.find((a) => a.id === activeToast.id), isUnlocked: true }
    : null;

  const hydrated = workoutHydrated && storageHydrated;

  return (
    <AchievementsContext.Provider value={{
      badges,
      unlockedCount,
      totalCount: ACHIEVEMENTS.length,
      stats,
      hydrated,
      activeToastBadge,
      dismissToast,
      toastQueueLength: toastQueue.length,
    }}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error('useAchievements poza AchievementsProvider');
  return ctx;
}
