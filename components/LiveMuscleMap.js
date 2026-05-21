import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Rect, Circle } from 'react-native-svg';

// ─── LiveMuscleMap ────────────────────────────────────────────────────────────
// Profesjonalna, anatomiczna mapa mięśni – przód i tył sylwetki side-by-side.
// Każda ścieżka to osobno adresowalny region anatomiczny.
//
// Props:
//   activeMuscles: Set<string> | string[]
//     Zestaw aktywnych regionów (np. new Set(['chest','biceps'])).
//     Nieaktywne regiony mają kolor #333333, aktywne #FF5252.
//     Opcjonalnie: obiekt { [region]: number } z liczbą serii –
//     wtedy kolor skaluje się od #FF9999 (1 seria) do #CC0000 (4+ serie).
//
// Dostępne klucze regionów:
//   chest, back_upper, back_lat, shoulders,
//   biceps, triceps, forearms,
//   abs, glutes, quads, hamstrings, calves
// ─────────────────────────────────────────────────────────────────────────────

const INACTIVE = '#333333';
const NEUTRAL  = '#3A3A3C'; // kości, stawy, głowa

// Skalowanie intensywności czerwieni wg liczby zaliczonych serii
const intensityColor = (value) => {
  if (!value || value === 0) return INACTIVE;
  if (typeof value === 'boolean' || value === true) return '#FF5252';
  if (value === 1) return '#FF9999';
  if (value === 2) return '#FF6666';
  if (value === 3) return '#FF3333';
  return '#CC0000'; // 4+
};

// Normalizuje prop activeMuscles do mapy { region: wartość }
const normalize = (activeMuscles) => {
  if (!activeMuscles) return {};
  if (activeMuscles instanceof Set) {
    const out = {};
    activeMuscles.forEach((k) => { out[k] = true; });
    return out;
  }
  if (Array.isArray(activeMuscles)) {
    const out = {};
    activeMuscles.forEach((k) => { out[k] = true; });
    return out;
  }
  // Obiekt { region: liczba_serii }
  return activeMuscles;
};

// ─── Widok: PRZÓD sylwetki ────────────────────────────────────────────────────
const FrontView = ({ c }) => (
  <Svg width={56} height={110} viewBox="0 0 56 110">
    {/* ── Głowa ── */}
    <Ellipse cx="28" cy="7.5" rx="7" ry="7.5" fill={NEUTRAL} />
    {/* ── Szyja ── */}
    <Rect x="24.5" y="14.5" width="7" height="5" rx="2" fill={NEUTRAL} />

    {/* ── Bark lewy ── */}
    <Path
      d="M14 19 C10 17 7 18 6 21 C5 24 7 27 11 26 C13 25 14 23 14 21 Z"
      fill={c('shoulders')}
    />
    {/* ── Bark prawy ── */}
    <Path
      d="M42 19 C46 17 49 18 50 21 C51 24 49 27 45 26 C43 25 42 23 42 21 Z"
      fill={c('shoulders')}
    />

    {/* ── Klatka piersiowa lewa ── */}
    <Path
      d="M14 19 Q14 18 20 17 L28 17 L28 28 Q22 30 16 27 Q13 25 14 19 Z"
      fill={c('chest')}
    />
    {/* ── Klatka piersiowa prawa ── */}
    <Path
      d="M42 19 Q42 18 36 17 L28 17 L28 28 Q34 30 40 27 Q43 25 42 19 Z"
      fill={c('chest')}
    />

    {/* ── Biceps lewy ── */}
    <Path
      d="M6 24 C4 27 4 33 5 37 C6 40 9 41 11 40 C13 38 13 33 12 29 C11 25 8 23 6 24 Z"
      fill={c('biceps')}
    />
    {/* ── Biceps prawy ── */}
    <Path
      d="M50 24 C52 27 52 33 51 37 C50 40 47 41 45 40 C43 38 43 33 44 29 C45 25 48 23 50 24 Z"
      fill={c('biceps')}
    />

    {/* ── Przedramię lewe ── */}
    <Path
      d="M5 38 C4 43 4 50 5 54 C6 56 9 57 11 56 C13 54 13 47 12 41 C11 38 7 37 5 38 Z"
      fill={c('forearms')}
    />
    {/* ── Przedramię prawe ── */}
    <Path
      d="M51 38 C52 43 52 50 51 54 C50 56 47 57 45 56 C43 54 43 47 44 41 C45 38 49 37 51 38 Z"
      fill={c('forearms')}
    />

    {/* ── Brzuch (6 prostokątów sześciopaku) ── */}
    {/* rząd górny */}
    <Rect x="21" y="29" width="6"  height="5" rx="1.5" fill={c('abs')} />
    <Rect x="29" y="29" width="6"  height="5" rx="1.5" fill={c('abs')} />
    {/* rząd środkowy */}
    <Rect x="21" y="36" width="6"  height="5" rx="1.5" fill={c('abs')} />
    <Rect x="29" y="36" width="6"  height="5" rx="1.5" fill={c('abs')} />
    {/* rząd dolny */}
    <Rect x="21" y="43" width="6"  height="5" rx="1.5" fill={c('abs')} />
    <Rect x="29" y="43" width="6"  height="5" rx="1.5" fill={c('abs')} />

    {/* ── Pas biodrowy ── */}
    <Path d="M17 50 Q28 54 39 50 L39 56 Q28 60 17 56 Z" fill={NEUTRAL} />

    {/* ── Czworogłowy lewy ── */}
    <Path
      d="M17 56 C15 60 14 68 15 75 C16 79 19 80 22 79 C25 78 26 70 25 63 C24 57 20 54 17 56 Z"
      fill={c('quads')}
    />
    {/* ── Czworogłowy prawy ── */}
    <Path
      d="M39 56 C41 60 42 68 41 75 C40 79 37 80 34 79 C31 78 30 70 31 63 C32 57 36 54 39 56 Z"
      fill={c('quads')}
    />

    {/* ── Kolano lewe ── */}
    <Ellipse cx="19" cy="78" rx="4" ry="3" fill={NEUTRAL} />
    {/* ── Kolano prawe ── */}
    <Ellipse cx="37" cy="78" rx="4" ry="3" fill={NEUTRAL} />

    {/* ── Łydka lewa (przód) ── */}
    <Path
      d="M15 81 C14 86 14 94 16 99 C17 102 20 103 22 102 C24 100 24 92 23 86 C22 81 17 80 15 81 Z"
      fill={c('calves')}
    />
    {/* ── Łydka prawa ── */}
    <Path
      d="M41 81 C42 86 42 94 40 99 C39 102 36 103 34 102 C32 100 32 92 33 86 C34 81 39 80 41 81 Z"
      fill={c('calves')}
    />

    {/* ── Kostki i stopy ── */}
    <Ellipse cx="19" cy="101" rx="4"  ry="2.5" fill={NEUTRAL} />
    <Ellipse cx="37" cy="101" rx="4"  ry="2.5" fill={NEUTRAL} />
    <Path d="M15 103 Q19 107 23 105 L23 108 Q19 109 15 107 Z" fill={NEUTRAL} />
    <Path d="M41 103 Q37 107 33 105 L33 108 Q37 109 41 107 Z" fill={NEUTRAL} />
  </Svg>
);

// ─── Widok: TYŁ sylwetki ─────────────────────────────────────────────────────
const BackView = ({ c }) => (
  <Svg width={56} height={110} viewBox="0 0 56 110">
    {/* ── Głowa ── */}
    <Ellipse cx="28" cy="7.5" rx="7" ry="7.5" fill={NEUTRAL} />
    {/* ── Szyja ── */}
    <Rect x="24.5" y="14.5" width="7" height="5" rx="2" fill={NEUTRAL} />

    {/* ── Trapez (górna część pleców) ── */}
    <Path
      d="M14 18 Q28 14 42 18 Q40 26 28 28 Q16 26 14 18 Z"
      fill={c('back_upper')}
    />

    {/* ── Bark lewy (tył) ── */}
    <Path
      d="M14 19 C10 17 7 18 6 21 C5 24 7 27 11 26 C13 25 14 23 14 21 Z"
      fill={c('shoulders')}
    />
    {/* ── Bark prawy (tył) ── */}
    <Path
      d="M42 19 C46 17 49 18 50 21 C51 24 49 27 45 26 C43 25 42 23 42 21 Z"
      fill={c('shoulders')}
    />

    {/* ── Najszerszy grzbietu lewy ── */}
    <Path
      d="M14 22 C12 28 12 36 14 43 C16 46 20 47 23 45 C25 43 25 35 23 28 C21 22 17 20 14 22 Z"
      fill={c('back_lat')}
    />
    {/* ── Najszerszy grzbietu prawy ── */}
    <Path
      d="M42 22 C44 28 44 36 42 43 C40 46 36 47 33 45 C31 43 31 35 33 28 C35 22 39 20 42 22 Z"
      fill={c('back_lat')}
    />

    {/* ── Triceps lewy ── */}
    <Path
      d="M6 24 C4 27 4 33 5 37 C6 40 9 41 11 40 C13 38 13 33 12 29 C11 25 8 23 6 24 Z"
      fill={c('triceps')}
    />
    {/* ── Triceps prawy ── */}
    <Path
      d="M50 24 C52 27 52 33 51 37 C50 40 47 41 45 40 C43 38 43 33 44 29 C45 25 48 23 50 24 Z"
      fill={c('triceps')}
    />

    {/* ── Przedramię lewe ── */}
    <Path
      d="M5 38 C4 43 4 50 5 54 C6 56 9 57 11 56 C13 54 13 47 12 41 C11 38 7 37 5 38 Z"
      fill={c('forearms')}
    />
    {/* ── Przedramię prawe ── */}
    <Path
      d="M51 38 C52 43 52 50 51 54 C50 56 47 57 45 56 C43 54 43 47 44 41 C45 38 49 37 51 38 Z"
      fill={c('forearms')}
    />

    {/* ── Prostowniki pleców (dolna część) ── */}
    <Path
      d="M21 28 Q24 29 28 29 Q32 29 35 28 L35 50 Q32 52 28 52 Q24 52 21 50 Z"
      fill={c('back_lat')}
      opacity="0.7"
    />

    {/* ── Pas biodrowy ── */}
    <Path d="M17 50 Q28 54 39 50 L39 56 Q28 60 17 56 Z" fill={NEUTRAL} />

    {/* ── Pośladki lewy ── */}
    <Path
      d="M17 55 C15 58 15 64 17 67 C19 70 23 71 26 69 C28 67 28 61 26 57 C24 54 20 53 17 55 Z"
      fill={c('glutes')}
    />
    {/* ── Pośladki prawy ── */}
    <Path
      d="M39 55 C41 58 41 64 39 67 C37 70 33 71 30 69 C28 67 28 61 30 57 C32 54 36 53 39 55 Z"
      fill={c('glutes')}
    />

    {/* ── Dwugłowy uda (tył) lewy ── */}
    <Path
      d="M17 68 C15 72 15 79 16 75 C17 78 20 79 22 78 C24 76 24 69 23 65 C22 62 19 61 17 63 Z"
      fill={c('hamstrings')}
    />
    {/* ── Dwugłowy uda (tył) prawy ── */}
    <Path
      d="M39 68 C41 72 41 79 40 75 C39 78 36 79 34 78 C32 76 32 69 33 65 C34 62 37 61 39 63 Z"
      fill={c('hamstrings')}
    />

    {/* ── Kolano lewe ── */}
    <Ellipse cx="19" cy="78" rx="4" ry="3" fill={NEUTRAL} />
    {/* ── Kolano prawe ── */}
    <Ellipse cx="37" cy="78" rx="4" ry="3" fill={NEUTRAL} />

    {/* ── Łydka lewa (tył – bardziej wypukła) ── */}
    <Path
      d="M14 81 C12 86 12 95 15 100 C16 103 20 104 22 102 C25 100 24 91 23 85 C21 80 16 79 14 81 Z"
      fill={c('calves')}
    />
    {/* ── Łydka prawa ── */}
    <Path
      d="M42 81 C44 86 44 95 41 100 C40 103 36 104 34 102 C31 100 32 91 33 85 C35 80 40 79 42 81 Z"
      fill={c('calves')}
    />

    {/* ── Kostki i stopy (widok z tyłu) ── */}
    <Ellipse cx="19" cy="101" rx="4"  ry="2.5" fill={NEUTRAL} />
    <Ellipse cx="37" cy="101" rx="4"  ry="2.5" fill={NEUTRAL} />
    <Path d="M15 103 Q19 107 23 105 L23 108 Q19 109 15 107 Z" fill={NEUTRAL} />
    <Path d="M41 103 Q37 107 33 105 L33 108 Q37 109 41 107 Z" fill={NEUTRAL} />
  </Svg>
);

// ─── Komponent główny ──────────────────────────────────────────────────────────
const LiveMuscleMap = ({ activeMuscles }) => {
  // Normalizacja i memoizacja mapy wartości – re-render tylko gdy zmienią się ćwiczenia
  const muscleMap = useMemo(() => normalize(activeMuscles), [activeMuscles]);

  // Getter koloru dla regionu – przekazywany do FrontView i BackView
  const c = (region) => intensityColor(muscleMap[region]);

  return (
    <View style={styles.container}>
      <FrontView c={c} />
      <View style={styles.gap} />
      <BackView c={c} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gap: {
    width: 4,
  },
});

export default LiveMuscleMap;