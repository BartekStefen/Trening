import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PLANS    = '@fitness_custom_plans';
const STORAGE_HISTORY  = '@fitness_workout_history';
const STORAGE_USE_RIR  = '@fitness_use_rir';
const STORAGE_HIDDEN_BUILTINS = '@fitness_hidden_builtins';

// ─── Kontekst globalny aplikacji fitness ──────────────────────────────────────
// Stan globalny: zminimalizowany trening, plany użytkownika, historia
const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout]   = useState(null);
  const [customPlans, setCustomPlans]       = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [useRIR, setUseRIR]                   = useState(false);
  const [hiddenBuiltins, setHiddenBuiltins]   = useState([]);
  const [hydrated, setHydrated]               = useState(false);

  // Ładowanie danych z AsyncStorage przy starcie
  useEffect(() => {
    (async () => {
      try {
        const [plans, history, rir, hidden] = await Promise.all([
          AsyncStorage.getItem(STORAGE_PLANS),
          AsyncStorage.getItem(STORAGE_HISTORY),
          AsyncStorage.getItem(STORAGE_USE_RIR),
          AsyncStorage.getItem(STORAGE_HIDDEN_BUILTINS),
        ]);
        if (plans)   setCustomPlans(JSON.parse(plans));
        if (history) setWorkoutHistory(JSON.parse(history));
        if (rir !== null) setUseRIR(rir === 'true');
        if (hidden)  setHiddenBuiltins(JSON.parse(hidden));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Zapis planów do AsyncStorage gdy się zmienią (tylko po hydratacji)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_PLANS, JSON.stringify(customPlans)).catch(() => {});
  }, [customPlans, hydrated]);

  // Zapis historii do AsyncStorage gdy się zmieni (tylko po hydratacji)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_HISTORY, JSON.stringify(workoutHistory)).catch(() => {});
  }, [workoutHistory, hydrated]);

  const toggleRIR = useCallback(async () => {
    const next = !useRIR;
    setUseRIR(next);
    try { await AsyncStorage.setItem(STORAGE_USE_RIR, String(next)); } catch {}
  }, [useRIR]);

  const hideBuiltin = useCallback(async (id) => {
    setHiddenBuiltins((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      AsyncStorage.setItem(STORAGE_HIDDEN_BUILTINS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const restoreBuiltin = useCallback(async (id) => {
    setHiddenBuiltins((prev) => {
      const next = prev.filter((x) => x !== id);
      AsyncStorage.setItem(STORAGE_HIDDEN_BUILTINS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Timer tła – liczy od znacznika czasu, nie zatrzymuje się w tle OS
  const bgIntervalRef = useRef(null);

  const computeTimerSec = useCallback((workout) => {
    if (!workout) return 0;
    const base = workout.timerSecBase ?? workout.timerSec ?? 0;
    const anchor = workout.timerAnchorMs ?? Date.now();
    return base + Math.floor((Date.now() - anchor) / 1000);
  }, []);

  const startBgTimer = useCallback(() => {
    clearInterval(bgIntervalRef.current);
    bgIntervalRef.current = setInterval(() => {
      setActiveWorkout((prev) => {
        if (!prev) return prev;
        return { ...prev, timerSec: computeTimerSec(prev) };
      });
    }, 1000);
  }, [computeTimerSec]);

  const stopBgTimer = useCallback(() => {
    clearInterval(bgIntervalRef.current);
    bgIntervalRef.current = null;
  }, []);

  const minimizeWorkout = useCallback((data) => {
    const timerSecBase = data.timerSec ?? 0;
    setActiveWorkout({
      ...data,
      timerSecBase,
      timerAnchorMs: Date.now(),
      timerSec: timerSecBase,
    });
    startBgTimer();
  }, [startBgTimer]);

  const clearActiveWorkout = useCallback(() => {
    stopBgTimer();
    setActiveWorkout(null);
  }, [stopBgTimer]);

  const addCustomPlan = useCallback((plan) => {
    setCustomPlans((prev) => [
      {
        ...plan,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        supersetGroups: plan.supersetGroups ?? {},
      },
      ...prev,
    ]);
  }, []);

  const deleteCustomPlan = useCallback((planId) => {
    setCustomPlans((prev) => prev.filter((p) => p.id !== planId));
  }, []);

  const updateCustomPlan = useCallback((planId, updates) => {
    setCustomPlans((prev) => prev.map((p) =>
      p.id === planId ? { ...p, ...updates, lastUsedAt: new Date().toISOString() } : p
    ));
  }, []);

  const saveWorkoutToHistory = useCallback((data) => {
    stopBgTimer();
    setWorkoutHistory((prev) => [
      { ...data, id: Date.now().toString(), savedAt: new Date().toISOString() },
      ...prev,
    ]);
    setActiveWorkout(null);
  }, [stopBgTimer]);

  useEffect(() => () => clearInterval(bgIntervalRef.current), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setActiveWorkout((prev) => {
          if (!prev?.timerAnchorMs) return prev;
          return { ...prev, timerSec: computeTimerSec(prev) };
        });
      }
    });
    return () => sub.remove();
  }, [computeTimerSec]);

  return (
    <WorkoutContext.Provider value={{
      activeWorkout, customPlans, workoutHistory,
      minimizeWorkout, clearActiveWorkout, addCustomPlan, deleteCustomPlan, updateCustomPlan, saveWorkoutToHistory,
      useRIR, toggleRIR,
      hiddenBuiltins, hideBuiltin, restoreBuiltin,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkoutContext = () => {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkoutContext poza WorkoutProvider');
  return ctx;
};