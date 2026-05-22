import { useMemo } from 'react';
import {
  MUSCLE_KEYWORD_PAIRS,
  INTENSITY_CAPS,
  LEGACY_KEY_MAP,
  REGION_KEYS,
} from '../constants/muscleConstants';

// ─── useMuscleHeatmap ─────────────────────────────────────────────────────────
// Przelicza tablicę ćwiczeń na mapę intensywności regionów SVG.
//
// Wejście:
//   exercises – tablica ćwiczeń z aktywnymi/zapisanymi seriami.
//   Każde ćwiczenie może mieć:
//     muscles:     string[]  – nazwy partii z bazy ćwiczeń
//     muscleGroup: string    – złączone grupy oddzielone '·' lub ','
//     sets:        { done, rpe?, kg?, reps? }[]
//
// Wyjście:
//   { [regionKey]: number }  – wartości 0.0–1.0 (znormalizowane przez INTENSITY_CAPS)
//   Brakujące regiony nie są uwzględniane w obiekcie (=> 0 na mapie).
//
// Backward compat:
//   Stare klucze 'chest', 'shoulders', 'back', 'legs' (z AddCustomExerciseModal)
//   są rozkładane proporcjonalnie na sub-regiony wg LEGACY_KEY_MAP.
// ─────────────────────────────────────────────────────────────────────────────

const normalizeStr = (str) =>
  str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Główna logika mapowania polskiej nazwy mięśnia → klucz SVG regionu.
// Zwraca JEDEN klucz lub null. Używa MUSCLE_KEYWORD_PAIRS w kolejności
// (od bardziej szczegółowych do ogólnych) – zatrzymuje się przy pierwszym trafieniu.
const matchMuscleToRegion = (muscleName) => {
  const normalized = normalizeStr(muscleName);
  for (const [keyword, region] of MUSCLE_KEYWORD_PAIRS) {
    if (normalized.includes(keyword)) return region;
  }
  return null;
};

// Oblicza wagę intensywności dla zestawu serii.
// Jeśli seria ma RPE, waga = doneSets × (avgRpe / 10).
// Bez RPE – używa surowej liczby zaliczonych serii.
const calcWeight = (sets) => {
  const done = sets.filter((s) => s.done);
  if (done.length === 0) return 0;

  const rpeValues = done
    .map((s) => parseFloat(s.rpe))
    .filter((v) => !isNaN(v) && v >= 1 && v <= 10);

  if (rpeValues.length > 0) {
    const avgRpe = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
    return done.length * (avgRpe / 10);
  }

  return done.length;
};

// Normalizuje wartość raw do zakresu 0–1 wg progu nasycenia dla regionu.
const normalizeIntensity = (region, raw) => {
  const cap = INTENSITY_CAPS[region] ?? 5;
  return Math.min(raw / cap, 1.0);
};

// ─────────────────────────────────────────────────────────────────────────────

const useMuscleHeatmap = (exercises) => {
  return useMemo(() => {
    if (!exercises || exercises.length === 0) return {};

    // Akumulujemy surowe wartości (ważone serie) per region
    const rawMap = {};

    exercises.forEach((ex) => {
      const weight = calcWeight(ex.sets ?? []);
      if (weight === 0) return;

      const mappedRegions = new Set();

      // Zbieramy wszystkie nazwy mięśni z tego ćwiczenia
      const muscleNames = [
        ...(ex.muscles ?? []),
        ...(ex.muscleGroup?.split(/[·,]/) ?? []),
      ];

      muscleNames.forEach((m) => {
        const region = matchMuscleToRegion(m);

        if (region && !mappedRegions.has(region)) {
          mappedRegions.add(region);
          rawMap[region] = (rawMap[region] ?? 0) + weight;
          return;
        }

        // Backward compat – sprawdź czy to stary klucz (np. 'chest', 'shoulders')
        const normalizedM = normalizeStr(m);
        const legacyEntry = LEGACY_KEY_MAP[normalizedM];
        if (legacyEntry) {
          Object.entries(legacyEntry).forEach(([subRegion, ratio]) => {
            if (!mappedRegions.has(subRegion)) {
              mappedRegions.add(subRegion);
              rawMap[subRegion] = (rawMap[subRegion] ?? 0) + weight * ratio;
            }
          });
        }
      });
    });

    // Normalizuj do 0–1
    const result = {};
    Object.entries(rawMap).forEach(([region, raw]) => {
      if (REGION_KEYS.includes(region)) {
        result[region] = normalizeIntensity(region, raw);
      }
    });

    return result;
  }, [exercises]);
};

export default useMuscleHeatmap;
