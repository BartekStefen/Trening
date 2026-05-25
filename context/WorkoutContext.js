import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextAudioMode, AUDIO_MODES } from '../utils/audioAssistantConstants';
import { exerciseKey } from '../utils/trainingIntelligence';
import { DEFAULT_DAILY_HABITS } from '../constants/dailyHabits';
import { normalizeWellnessForToday } from '../constants/wellnessDefaults';
import { enrichWorkoutLoad } from '../utils/trainingLoad';

const STORAGE_PLANS    = '@fitness_custom_plans';
const STORAGE_HISTORY  = '@fitness_workout_history';
const STORAGE_USE_RIR  = '@fitness_use_rir';
const STORAGE_RAMP     = '@fitness_ramp_enabled';
const STORAGE_AUDIO    = '@fitness_audio_assistant_mode';
const STORAGE_AUDIO_LEGACY = '@fitness_audio_assistant';
const STORAGE_HIDDEN_BUILTINS = '@fitness_hidden_builtins';
const STORAGE_SURVIVAL = '@fitness_survival_mode';
const STORAGE_AUTO_DELOAD = '@fitness_auto_deload';
const STORAGE_EX_RECORDS = '@fitness_exercise_records';
const STORAGE_DAILY_HABITS = '@fitness_daily_habits';
const STORAGE_DAILY_WELLNESS = '@fitness_daily_wellness';

// ─── Kontekst globalny aplikacji fitness ──────────────────────────────────────
// Stan globalny: zminimalizowany trening, plany użytkownika, historia
const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout]   = useState(null);
  const [customPlans, setCustomPlans]       = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [useRIR, setUseRIR]                   = useState(false);
  const [rampEnabled, setRampEnabled]         = useState(false);
  const [audioAssistantMode, setAudioAssistantMode] = useState(AUDIO_MODES.OFF);
  const [hiddenBuiltins, setHiddenBuiltins]   = useState([]);
  const [survivalModeEnabled, setSurvivalModeEnabled] = useState(false);
  const [autoDeloadEnabled, setAutoDeloadEnabled]     = useState(false);
  const [exerciseRecords, setExerciseRecords]         = useState({});
  const [dailyHabits, setDailyHabits]                 = useState(DEFAULT_DAILY_HABITS);
  const [dailyWellness, setDailyWellness]             = useState(() => normalizeWellnessForToday(null));
  const [hydrated, setHydrated]               = useState(false);

  // Ładowanie danych z AsyncStorage przy starcie
  useEffect(() => {
    (async () => {
      try {
        const [plans, history, rir, ramp, audio, audioLegacy, hidden, survival, deload, records, habits, wellness] = await Promise.all([
          AsyncStorage.getItem(STORAGE_PLANS),
          AsyncStorage.getItem(STORAGE_HISTORY),
          AsyncStorage.getItem(STORAGE_USE_RIR),
          AsyncStorage.getItem(STORAGE_RAMP),
          AsyncStorage.getItem(STORAGE_AUDIO),
          AsyncStorage.getItem(STORAGE_AUDIO_LEGACY),
          AsyncStorage.getItem(STORAGE_HIDDEN_BUILTINS),
          AsyncStorage.getItem(STORAGE_SURVIVAL),
          AsyncStorage.getItem(STORAGE_AUTO_DELOAD),
          AsyncStorage.getItem(STORAGE_EX_RECORDS),
          AsyncStorage.getItem(STORAGE_DAILY_HABITS),
          AsyncStorage.getItem(STORAGE_DAILY_WELLNESS),
        ]);
        if (plans)   setCustomPlans(JSON.parse(plans));
        if (history) setWorkoutHistory(JSON.parse(history));
        if (rir !== null) setUseRIR(rir === 'true');
        if (ramp !== null) setRampEnabled(ramp === 'true');
        if (audio === AUDIO_MODES.VOICE || audio === AUDIO_MODES.TICK) {
          setAudioAssistantMode(audio);
        } else if (audioLegacy === 'true') {
          setAudioAssistantMode(AUDIO_MODES.VOICE);
        }
        if (hidden)  setHiddenBuiltins(JSON.parse(hidden));
        if (survival !== null) setSurvivalModeEnabled(survival === 'true');
        if (deload !== null) setAutoDeloadEnabled(deload === 'true');
        if (records) setExerciseRecords(JSON.parse(records));
        if (habits) {
          const parsed = JSON.parse(habits);
          if (Array.isArray(parsed) && parsed.length) setDailyHabits(parsed);
        }
        if (wellness) {
          setDailyWellness(normalizeWellnessForToday(JSON.parse(wellness)));
        }
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

  const toggleRamp = useCallback(async () => {
    const next = !rampEnabled;
    setRampEnabled(next);
    try { await AsyncStorage.setItem(STORAGE_RAMP, String(next)); } catch {}
  }, [rampEnabled]);

  const cycleAudioAssistant = useCallback(async () => {
    const next = getNextAudioMode(audioAssistantMode);
    setAudioAssistantMode(next);
    try { await AsyncStorage.setItem(STORAGE_AUDIO, next); } catch {}
  }, [audioAssistantMode]);

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

  const toggleSurvivalMode = useCallback(async () => {
    const next = !survivalModeEnabled;
    setSurvivalModeEnabled(next);
    try { await AsyncStorage.setItem(STORAGE_SURVIVAL, String(next)); } catch {}
  }, [survivalModeEnabled]);

  const toggleAutoDeload = useCallback(async () => {
    const next = !autoDeloadEnabled;
    setAutoDeloadEnabled(next);
    try { await AsyncStorage.setItem(STORAGE_AUTO_DELOAD, String(next)); } catch {}
  }, [autoDeloadEnabled]);

  const updateExerciseRecord = useCallback(async (exerciseName, oneRM, meta = {}) => {
    const key = meta.exerciseId ?? exerciseKey({ name: exerciseName });
    if (!key || !oneRM) return;
    setExerciseRecords((prev) => {
      const next = {
        ...prev,
        [key]: {
          exerciseName,
          oneRM: parseFloat(oneRM),
          updatedAt: new Date().toISOString(),
          ...meta,
        },
      };
      AsyncStorage.setItem(STORAGE_EX_RECORDS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleDailyHabit = useCallback((id) => {
    setDailyHabits((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
      AsyncStorage.setItem(STORAGE_DAILY_HABITS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setWellnessValue = useCallback((key, value) => {
    setDailyWellness((prev) => {
      const next = normalizeWellnessForToday({ ...prev, [key]: value });
      AsyncStorage.setItem(STORAGE_DAILY_WELLNESS, JSON.stringify(next)).catch(() => {});
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
    const enriched = enrichWorkoutLoad(data);
    setWorkoutHistory((prev) => [
      { ...enriched, id: Date.now().toString(), savedAt: new Date().toISOString() },
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
      rampEnabled, toggleRamp,
      audioAssistantMode, cycleAudioAssistant,
      hiddenBuiltins, hideBuiltin, restoreBuiltin,
      survivalModeEnabled, toggleSurvivalMode,
      autoDeloadEnabled, toggleAutoDeload,
      exerciseRecords, updateExerciseRecord,
      dailyHabits, toggleDailyHabit,
      dailyWellness, setWellnessValue,
      hydrated,
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