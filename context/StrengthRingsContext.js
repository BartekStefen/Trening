import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkoutContext } from './WorkoutContext';
import { useDietContext } from './DietContext';
import { useProfileGoals } from './ProfileGoalsContext';
import { DEFAULT_NUTRITION } from '../constants/dietNutrition';
import {
  RING1_DEFAULT_SLOTS,
  RING1_ALLOWED,
  RING2_DEFAULT_SLOTS,
  RING2_ALLOWED,
  RING3_DEFAULT_SLOTS,
  RING3_ALLOWED,
  buildRingSegments,
} from '../utils/ringMetrics';

const STORAGE_RING1 = '@fitness_ring1_slots';
const STORAGE_RING2 = '@fitness_ring2_slots';
const STORAGE_RING3 = '@fitness_ring3_slots';

const RING1_FORBIDDEN = new Set(['calories']);

function sanitizeSlots(saved, allowed, defaults, slotCount) {
  const allowedSet = new Set(allowed);
  const result = [];
  const used = new Set();

  (saved ?? []).forEach((id) => {
    if (result.length >= slotCount) return;
    if (!allowedSet.has(id) || used.has(id)) return;
    result.push(id);
    used.add(id);
  });

  for (const id of defaults) {
    if (result.length >= slotCount) break;
    if (!used.has(id) && allowedSet.has(id)) {
      result.push(id);
      used.add(id);
    }
  }

  for (const id of allowed) {
    if (result.length >= slotCount) break;
    if (!used.has(id)) {
      result.push(id);
      used.add(id);
    }
  }

  return result.slice(0, slotCount);
}

function migrateRing1(raw) {
  if (!Array.isArray(raw) || raw.length !== 3) return RING1_DEFAULT_SLOTS;
  const fixed = raw.map((id) => (RING1_FORBIDDEN.has(id) ? 'volume_day' : id));
  return sanitizeSlots(fixed, RING1_ALLOWED, RING1_DEFAULT_SLOTS, 3);
}

const StrengthRingsContext = createContext(null);

export function StrengthRingsProvider({ children }) {
  const {
    workoutHistory, dailyWellness, dailyHabits, exerciseRecords, customPlans,
  } = useWorkoutContext();
  const {
    waterLog,
    effectiveGoalMl,
    portionMl,
    hydrated: dietHydrated,
  } = useDietContext();
  const { tdee, goalPace, currentWeight, gender } = useProfileGoals();

  const [ring1Slots, setRing1Slots] = useState(RING1_DEFAULT_SLOTS);
  const [ring2Slots, setRing2Slots] = useState(RING2_DEFAULT_SLOTS);
  const [ring3Slots, setRing3Slots] = useState(RING3_DEFAULT_SLOTS);
  const [configHydrated, setConfigHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          AsyncStorage.getItem(STORAGE_RING1),
          AsyncStorage.getItem(STORAGE_RING2),
          AsyncStorage.getItem(STORAGE_RING3),
        ]);
        if (r1) setRing1Slots(migrateRing1(JSON.parse(r1)));
        if (r2) {
          const p = JSON.parse(r2);
          if (Array.isArray(p) && p.length === 4) {
            setRing2Slots(sanitizeSlots(p, RING2_ALLOWED, RING2_DEFAULT_SLOTS, 4));
          }
        }
        if (r3) {
          const p = JSON.parse(r3);
          if (Array.isArray(p) && p.length === 3) {
            setRing3Slots(sanitizeSlots(p, RING3_ALLOWED, RING3_DEFAULT_SLOTS, 3));
          }
        }
      } catch {}
      setConfigHydrated(true);
    })();
  }, []);

  const ctx = useMemo(
    () => ({
      workoutHistory,
      waterLog,
      effectiveGoalMl,
      portionMl,
      nutrition: DEFAULT_NUTRITION,
      tdee,
      goalPace,
      dailyWellness,
      dailyHabits,
      exerciseRecords,
      customPlans,
      bodyWeightKg: currentWeight || 80,
      gender,
    }),
    [
      workoutHistory,
      waterLog,
      effectiveGoalMl,
      portionMl,
      tdee,
      goalPace,
      dailyWellness,
      dailyHabits,
      exerciseRecords,
      customPlans,
      currentWeight,
      gender,
    ],
  );

  const ring1 = useMemo(() => buildRingSegments(ring1Slots, ctx), [ring1Slots, ctx]);
  const ring2 = useMemo(() => buildRingSegments(ring2Slots, ctx), [ring2Slots, ctx]);
  const ring3 = useMemo(() => buildRingSegments(ring3Slots, ctx), [ring3Slots, ctx]);

  const ring1Progress = useMemo(() => {
    if (!ring1.length) return 0;
    return ring1.reduce((a, s) => a + s.progress, 0) / ring1.length;
  }, [ring1]);

  const updateRingSlot = useCallback((ringIndex, slotIndex, metricId) => {
    const updaters = [
      { allowed: RING1_ALLOWED, count: 3, key: STORAGE_RING1, setter: setRing1Slots },
      { allowed: RING2_ALLOWED, count: 4, key: STORAGE_RING2, setter: setRing2Slots },
      { allowed: RING3_ALLOWED, count: 3, key: STORAGE_RING3, setter: setRing3Slots },
    ];
    const cfg = updaters[ringIndex];
    if (!cfg || !cfg.allowed.includes(metricId)) return;

    cfg.setter((prev) => {
      const next = [...prev];
      if (slotIndex < 0 || slotIndex >= cfg.count) return prev;
      if (next.some((id, i) => i !== slotIndex && id === metricId)) return prev;
      next[slotIndex] = metricId;
      AsyncStorage.setItem(cfg.key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    ring1,
    ring2,
    ring3,
    ring1Slots,
    ring2Slots,
    ring3Slots,
    ring1Progress,
    updateRingSlot,
    ring1Allowed: RING1_ALLOWED,
    ring2Allowed: RING2_ALLOWED,
    ring3Allowed: RING3_ALLOWED,
    hydrated: dietHydrated && configHydrated,
  }), [
    ring1, ring2, ring3, ring1Slots, ring2Slots, ring3Slots,
    ring1Progress, updateRingSlot, dietHydrated, configHydrated,
  ]);

  return (
    <StrengthRingsContext.Provider value={value}>
      {children}
    </StrengthRingsContext.Provider>
  );
}

export function useStrengthRings() {
  const ctx = useContext(StrengthRingsContext);
  if (!ctx) throw new Error('useStrengthRings poza StrengthRingsProvider');
  return ctx;
}
