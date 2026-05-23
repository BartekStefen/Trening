import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWeatherHydrationModifier, getHydrationModifierLabel } from '../utils/weatherHydration';

export const PORTION_ML = 250;
export const BASE_GOAL_ML = 2500;

const STORAGE_LOG = '@diet_water_log';
const STORAGE_WEATHER_ENABLED = '@diet_weather_modifier_enabled';

const todayKey = () => new Date().toISOString().slice(0, 10);

const DietContext = createContext(null);

export function DietProvider({ children }) {
  const [waterLog, setWaterLog] = useState({});
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherModifierMl, setWeatherModifierMl] = useState(0);
  const [weatherTempC, setWeatherTempC] = useState(null);
  const [weatherHumidity, setWeatherHumidity] = useState(null);
  const [weatherLevel, setWeatherLevel] = useState('normal');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [log, weather] = await Promise.all([
          AsyncStorage.getItem(STORAGE_LOG),
          AsyncStorage.getItem(STORAGE_WEATHER_ENABLED),
        ]);
        if (log) setWaterLog(JSON.parse(log));
        if (weather !== null) setWeatherEnabled(weather === 'true');
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_LOG, JSON.stringify(waterLog)).catch(() => {});
  }, [waterLog, hydrated]);

  const refreshWeatherModifier = useCallback(async () => {
    if (!weatherEnabled) {
      setWeatherModifierMl(0);
      setWeatherTempC(null);
      setWeatherHumidity(null);
      setWeatherLevel('normal');
      return;
    }
    setWeatherLoading(true);
    try {
      const result = await fetchWeatherHydrationModifier();
      setWeatherModifierMl(result.modifierMl ?? 0);
      setWeatherTempC(result.tempC ?? null);
      setWeatherHumidity(result.humidityPct ?? null);
      setWeatherLevel(result.level ?? 'normal');
    } catch {
      setWeatherModifierMl(0);
      setWeatherLevel('normal');
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    refreshWeatherModifier();
  }, [hydrated, refreshWeatherModifier]);

  const toggleWeatherModifier = useCallback(async () => {
    const next = !weatherEnabled;
    setWeatherEnabled(next);
    try {
      await AsyncStorage.setItem(STORAGE_WEATHER_ENABLED, String(next));
    } catch {}
    if (!next) {
      setWeatherModifierMl(0);
      setWeatherTempC(null);
      setWeatherHumidity(null);
      setWeatherLevel('normal');
    }
  }, [weatherEnabled]);

  const effectiveGoalMl = BASE_GOAL_ML + (weatherEnabled ? weatherModifierMl : 0);
  const maxPortions = Math.ceil(effectiveGoalMl / PORTION_ML);

  const getPortionsForDate = useCallback((dateKey) => waterLog[dateKey] ?? 0, [waterLog]);

  const addWaterPortion = useCallback((dateKey = todayKey()) => {
    setWaterLog((prev) => {
      const current = prev[dateKey] ?? 0;
      if (current >= maxPortions) return prev;
      return { ...prev, [dateKey]: current + 1 };
    });
  }, [maxPortions]);

  const todayPortions = waterLog[todayKey()] ?? 0;
  const todayMl = todayPortions * PORTION_ML;
  const weatherBoostActive = weatherEnabled && weatherModifierMl > 0;
  const weatherLabel = weatherBoostActive
    ? getHydrationModifierLabel({ modifierMl: weatherModifierMl, tempC: weatherTempC, level: weatherLevel })
    : null;

  const value = useMemo(() => ({
    portionMl: PORTION_ML,
    baseGoalMl: BASE_GOAL_ML,
    effectiveGoalMl,
    maxPortions,
    todayPortions,
    todayMl,
    waterLog,
    weatherEnabled,
    weatherModifierMl,
    weatherTempC,
    weatherHumidity,
    weatherLevel,
    weatherLoading,
    weatherBoostActive,
    weatherLabel,
    toggleWeatherModifier,
    refreshWeatherModifier,
    getPortionsForDate,
    addWaterPortion,
    hydrated,
  }), [
    effectiveGoalMl, maxPortions, todayPortions, todayMl, waterLog,
    weatherEnabled, weatherModifierMl, weatherTempC, weatherHumidity, weatherLevel,
    weatherLoading, weatherBoostActive, weatherLabel,
    toggleWeatherModifier, refreshWeatherModifier, getPortionsForDate, addWaterPortion, hydrated,
  ]);

  return (
    <DietContext.Provider value={value}>
      {children}
    </DietContext.Provider>
  );
}

export const useDietContext = () => {
  const ctx = useContext(DietContext);
  if (!ctx) throw new Error('useDietContext poza DietProvider');
  return ctx;
};
