import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ─── Kontekst globalny aplikacji fitness ──────────────────────────────────────
// Stan globalny: zminimalizowany trening, plany użytkownika, historia
const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout]   = useState(null);
  const [customPlans, setCustomPlans]       = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Timer tła – bije nawet gdy ActiveWorkoutScreen jest odmontowany
  const bgIntervalRef = useRef(null);
  const bgTimerRef    = useRef(0);

  const startBgTimer = useCallback((initialSec) => {
    bgTimerRef.current = initialSec;
    clearInterval(bgIntervalRef.current);
    bgIntervalRef.current = setInterval(() => {
      bgTimerRef.current += 1;
      setActiveWorkout((prev) => prev ? { ...prev, timerSec: bgTimerRef.current } : prev);
    }, 1000);
  }, []);

  const stopBgTimer = useCallback(() => {
    clearInterval(bgIntervalRef.current);
    bgIntervalRef.current = null;
  }, []);

  const minimizeWorkout = useCallback((data) => {
    setActiveWorkout(data);
    startBgTimer(data.timerSec ?? 0);
  }, [startBgTimer]);

  const clearActiveWorkout = useCallback(() => {
    stopBgTimer();
    setActiveWorkout(null);
  }, [stopBgTimer]);

  const addCustomPlan = useCallback((plan) => {
    setCustomPlans((prev) => [
      { ...plan, id: Date.now().toString(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
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

  return (
    <WorkoutContext.Provider value={{
      activeWorkout, customPlans, workoutHistory,
      minimizeWorkout, clearActiveWorkout, addCustomPlan, saveWorkoutToHistory,
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