import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export const MAX_MODIFIER_ML = 750;
export const BASE_TEMP_C = 12;
export const PORTION_ROUND_ML = 250;

const CACHE_KEY = '@diet_weather_cache_v2';

const todayKey = () => new Date().toISOString().slice(0, 10);

const roundToPortions = (ml) =>
  Math.max(0, Math.round(ml / PORTION_ROUND_ML) * PORTION_ROUND_ML);

/**
 * Inteligentny modyfikator nawodnienia:
 * - każdy °C powyżej 12°C → +50 ml (zaokr. do butelek 250 ml)
 * - wilgotność >65% → dodatkowy bonus (gorsze odparowanie potu)
 * - 20°C ≈ +500 ml, 25°C ≈ +750 ml
 */
export function calcHydrationModifier(tempC, feelsLikeC, humidityPct = 50) {
  const effective = Math.max(tempC ?? 0, feelsLikeC ?? 0);

  const tempRaw = effective > BASE_TEMP_C
    ? (effective - BASE_TEMP_C) * 50
    : 0;
  const tempMod = roundToPortions(tempRaw);

  let humidityMod = 0;
  if (humidityPct > 65) {
    const humidRaw = Math.min(200, (humidityPct - 65) * 4);
    humidityMod = roundToPortions(humidRaw);
  }

  const modifierMl = Math.min(MAX_MODIFIER_ML, tempMod + humidityMod);

  let level = 'normal';
  if (modifierMl >= 600 || effective >= 28) level = 'hot';
  else if (modifierMl >= 350 || effective >= 22) level = 'warm';
  else if (modifierMl > 0) level = 'mild';

  return {
    modifierMl,
    tempC: effective,
    humidityPct,
    level,
    tempMod,
    humidityMod,
  };
}

export function getHydrationModifierLabel({ modifierMl, tempC, level }) {
  if (!modifierMl || modifierMl <= 0) return null;
  const tempStr = tempC != null ? ` · ${Math.round(tempC)}°C` : '';
  if (level === 'hot') return `☀️ +${modifierMl} ml (upał${tempStr})`;
  if (level === 'warm') return `🌤️ +${modifierMl} ml (ciepło${tempStr})`;
  return `🌡️ +${modifierMl} ml (pogoda${tempStr})`;
}

const readCache = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = async (data) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
};

export async function fetchWeatherHydrationModifier() {
  const date = todayKey();
  const cached = await readCache();
  if (cached?.date === date) {
    return { ...cached, fromCache: true };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return {
      modifierMl: 0, tempC: null, humidityPct: null,
      level: 'normal', permissionDenied: true,
    };
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = pos.coords;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API error');

  const data = await res.json();
  const tempC = data?.current?.temperature_2m ?? 0;
  const feelsLike = data?.current?.apparent_temperature ?? tempC;
  const humidityPct = data?.current?.relative_humidity_2m ?? 50;

  const result = calcHydrationModifier(tempC, feelsLike, humidityPct);
  const payload = { date, ...result, fromCache: false };

  await writeCache(payload);
  return payload;
}

// Zachowane dla kompatybilności wstecznej
export const HOT_DAY_MODIFIER_ML = MAX_MODIFIER_ML;
