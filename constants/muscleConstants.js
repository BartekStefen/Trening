// ─── muscleConstants.js ───────────────────────────────────────────────────────
// Jedyne źródło prawdy dla logiki mapy mięśni.
// Importuj stąd zamiast duplikować w ekranach i modalach.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Klucze regionów SVG ─────────────────────────────────────────────────────
// 15 adresowalnych partii (chest i shoulders rozbite na sub-regiony)
export const REGION_KEYS = [
  'chest_upper', 'chest_lower',
  'shoulders_front', 'shoulders_side', 'shoulders_rear',
  'back_upper', 'back_lat',
  'biceps', 'triceps', 'forearms',
  'abs', 'glutes',
  'quads', 'hamstrings', 'calves',
];

// ─── Backward-compat aliasy (stare klucze z historii/danych użytkownika) ─────
// Używane przez useMuscleHeatmap do rozkładania starych wartości.
export const LEGACY_KEY_MAP = {
  chest:     { chest_upper: 0.55, chest_lower: 0.45 },
  shoulders: { shoulders_front: 0.34, shoulders_side: 0.33, shoulders_rear: 0.33 },
  back:      { back_lat: 0.65, back_upper: 0.35 },
  legs:      { quads: 0.4, hamstrings: 0.35, glutes: 0.25 },
};

// ─── Mapa Polish substring → klucz SVG ───────────────────────────────────────
// Format: tablica par [keyword, region] – kolejność MA znaczenie.
// Bardziej szczegółowe (dłuższe) frazy stoją przed ogólnymi,
// żeby 'gorna klatka' miało pierwszeństwo przed samą 'klatka'.
// Normalizacja NFD (usunięcie diakrytyków) jest wykonywana w useMuscleHeatmap
// przed porównaniem – stąd klucze bez polskich znaków.
export const MUSCLE_KEYWORD_PAIRS = [
  // Klatka – subregiony (dłuższe frazy pierwsze)
  ['gorna klatka',          'chest_upper'],
  ['klatka gorna',          'chest_upper'],
  ['incline',               'chest_upper'],
  ['dolna klatka',          'chest_lower'],
  ['klatka dolna',          'chest_lower'],
  ['decline',               'chest_lower'],
  ['piersiow',              'chest_upper'],
  ['klatka',                'chest_lower'],  // ogólna klatka → dolna (najpopularniejsza)

  // Barki – subregiony (dłuższe frazy pierwsze)
  ['przedni naramienny',    'shoulders_front'],
  ['przednie bark',         'shoulders_front'],
  ['przod barku',           'shoulders_front'],
  ['boczny naramienny',     'shoulders_side'],
  ['boczne bark',           'shoulders_side'],
  ['bok barku',             'shoulders_side'],
  ['tylny naramienny',      'shoulders_rear'],
  ['tylne bark',            'shoulders_rear'],
  ['tyl barku',             'shoulders_rear'],
  ['naramienny',            'shoulders_side'],   // ogólny → bok (najczęstszy trening)
  ['bark',                  'shoulders_front'],   // ogólny → przód (wyciskanie OHP)

  // Plecy
  ['najszerszy',            'back_lat'],
  ['plec',                  'back_lat'],
  ['romboid',               'back_upper'],
  ['trapez',                'back_upper'],
  ['prostownik',            'back_upper'],

  // Ramiona
  ['biceps',                'biceps'],
  ['ramienno',              'biceps'],
  ['triceps',               'triceps'],
  ['przedramion',           'forearms'],
  ['nadgarstek',            'forearms'],

  // Tułów
  ['brzuch',                'abs'],
  ['poprzeczny',            'abs'],

  // Nogi
  ['czworoglow',            'quads'],
  ['poslad',                'glutes'],
  ['dwuglow',               'hamstrings'],
  ['lydki',                 'calves'],
  ['piszczelowy',           'calves'],
];

// ─── Progi nasycenia (ile serii = 100% intensywności) ────────────────────────
// Mniejsze partie (biceps, triceps) nasycają się szybciej.
// Duże grupy (plecy, nogi) wymagają większej objętości.
export const INTENSITY_CAPS = {
  chest_upper:      5,
  chest_lower:      5,
  shoulders_front:  4,
  shoulders_side:   4,
  shoulders_rear:   4,
  back_upper:       5,
  back_lat:         6,
  biceps:           5,
  triceps:          5,
  forearms:         4,
  abs:              6,
  glutes:           5,
  quads:            6,
  hamstrings:       5,
  calves:           4,
};

// ─── Etykiety UI dla partii (15 wpisów) ──────────────────────────────────────
export const MUSCLE_GROUPS = [
  { key: 'chest_upper',     label: 'Klatka – góra',         emoji: '🦍' },
  { key: 'chest_lower',     label: 'Klatka – dół',          emoji: '🦍' },
  { key: 'back_lat',        label: 'Plecy (najszerszy)',     emoji: '🦇' },
  { key: 'back_upper',      label: 'Plecy górne (trapez)',   emoji: '🔼' },
  { key: 'shoulders_front', label: 'Bark – przód',          emoji: '🏋️' },
  { key: 'shoulders_side',  label: 'Bark – bok',            emoji: '🏋️' },
  { key: 'shoulders_rear',  label: 'Bark – tył',            emoji: '🏋️' },
  { key: 'biceps',          label: 'Biceps',                emoji: '💪' },
  { key: 'triceps',         label: 'Triceps',               emoji: '🔱' },
  { key: 'forearms',        label: 'Przedramiona',          emoji: '🤜' },
  { key: 'abs',             label: 'Brzuch',                emoji: '🍫' },
  { key: 'glutes',          label: 'Pośladki',              emoji: '🍑' },
  { key: 'quads',           label: 'Czworogłowy',           emoji: '🦵' },
  { key: 'hamstrings',      label: 'Dwugłowy uda',          emoji: '🦿' },
  { key: 'calves',          label: 'Łydki',                 emoji: '🦶' },
];

// ─── Paleta heatmapy ─────────────────────────────────────────────────────────
export const HEATMAP_COLORS = {
  inactive: '#1C1C1E',
  low:      '#7B1B1B',
  mid:      '#D32F2F',
  high:     '#FF3D00',
  peak:     '#FF6E40',
};

// Kolor dla paska postępu (intensity 0–1)
export const intensityToBarColor = (intensity) => {
  if (intensity <= 0)   return HEATMAP_COLORS.inactive;
  if (intensity < 0.25) return HEATMAP_COLORS.low;
  if (intensity < 0.55) return HEATMAP_COLORS.mid;
  if (intensity < 0.85) return HEATMAP_COLORS.high;
  return HEATMAP_COLORS.peak;
};
