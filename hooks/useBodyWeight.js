import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const BW_STORAGE_KEY = '@user_body_weight_kg';

/**
 * Hook do zarządzania wagą ciała użytkownika.
 * Ładuje z AsyncStorage przy mount, zapis jest trwały.
 * Returns: [bodyWeight: number, updateBodyWeight: (kg: string|number) => Promise<number>]
 */
export default function useBodyWeight(defaultKg = 80) {
  const [bodyWeight, setBodyWeight] = useState(defaultKg);

  useEffect(() => {
    AsyncStorage.getItem(BW_STORAGE_KEY).then((stored) => {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) setBodyWeight(parsed);
    }).catch(() => {});
  }, []);

  const updateBodyWeight = useCallback(async (rawKg) => {
    const val = Math.round(
      Math.max(30, Math.min(300, parseFloat(rawKg) || defaultKg)) * 10,
    ) / 10;
    setBodyWeight(val);
    try {
      await AsyncStorage.setItem(BW_STORAGE_KEY, String(val));
    } catch (_) {}
    return val;
  }, [defaultKg]);

  return [bodyWeight, updateBodyWeight];
}
