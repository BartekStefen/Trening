// Definicje ustawień aplikacji — opisy dla użytkownika + podstawa naukowa

export const SETTING_SECTIONS = [
  {
    id: 'appearance',
    title: 'Wygląd',
    items: ['theme'],
  },
  {
    id: 'training',
    title: 'Trening',
    items: ['intensity', 'ramp', 'audio', 'survival', 'deload'],
  },
  {
    id: 'health',
    title: 'Zdrowie i regeneracja',
    items: ['weather'],
  },
  {
    id: 'rings',
    title: 'Pierścienie',
    items: [],
    custom: true,
  },
];

export const SETTING_DEFS = {
  theme: {
    id: 'theme',
    title: 'Motyw aplikacji',
    icon: 'contrast-outline',
    color: '#00E676',
    type: 'action',
    description:
      'Zmienia kolory całej aplikacji — tło, karty, akcenty. Wybór jest zapisywany lokalnie i działa od razu.',
    science: null,
  },
  intensity: {
    id: 'intensity',
    title: 'Skala intensywności (RPE / RIR)',
    icon: 'flame-outline',
    color: '#00E676',
    type: 'toggle',
    description:
      'RPE (6–10) to subiektywna ocena wysiłku w serii. RIR to „powtórzenia w zapasie” — ile powtórzeń zostawiłbyś w rezerwie. RIR jest bliższy autoregulacji opartej na gotowości (Graham & Cleather, 2021).',
    science:
      'Przełącznik zmienia sposób wyświetlania intensywności w HUD treningu i przy seriach — nie zmienia samego planu.',
    onLabel: 'RIR',
    offLabel: 'RPE',
  },
  ramp: {
    id: 'ramp',
    title: 'Rozgrzewka RAMP',
    icon: 'flame',
    color: '#EF9F27',
    type: 'toggle',
    description:
      'RAMP (Raise–Activate–Motivate–Potentiate) to progresywna rozgrzewka przed seriami roboczymi. W menu ⋯ ćwiczenia możesz podejrzeć i dodać serie rozgrzewkowe dopasowane do typu ruchu (wielostaw / izolacja / kalistenika).',
    science:
      'Protokoły progresywnej rozgrzewki przed ciężkimi seriami są zalecane przez NSCA/ACSM — aktywują układ nerwowo-mięśniowy bez nadmiernego zmęczenia przed serią roboczą.',
  },
  audio: {
    id: 'audio',
    title: 'Audio-asystent',
    icon: 'headset-outline',
    color: '#378ADD',
    type: 'cycle',
    description:
      'Odlicza końcówkę przerwy między seriami (5→2 s) i sygnalizuje koniec odpoczynku. Tryb głosowy dodaje komunikat „Koniec przerwy”.',
    science:
      'Stały sygnał czasowy pomaga utrzymać przerwy zgodne z protokołem (typowo 2–5 min między ciężkimi seriami siłowymi).',
  },
  weather: {
    id: 'weather',
    title: 'Modyfikator pogodowy nawodnienia',
    icon: 'sunny-outline',
    color: '#00E676',
    type: 'toggle',
    description:
      'Zwiększa dzienny cel wody, gdy temperatura i wilgotność wskazują na większe ryzyko odwodnienia (Open-Meteo).',
    science:
      'ACSM zaleca zwiększenie płynów w warunkach ciepła i wilgoci — aplikacja skaluje cel względem temperatury od ~12°C w górę.',
  },
  survival: {
    id: 'survival',
    title: 'Tryb Przetrwania (stres / egzamin)',
    icon: 'shield-outline',
    color: '#FF5252',
    type: 'toggle',
    description:
      'Gdy gotowość treningowa jest niska (≤4/10), przed startem treningu zaproponuje skróconą sesję: mniej serii, zachowana częstotliwość ruchów. Chroni przed dobiciem się w okresie stresu, sesji egzaminacyjnej lub chronicznego zmęczenia.',
    science:
      'Gotowość łączy wellness (Hooper), obciążenie sRPE/ACWR (Foster 2001; Gabbett 2016) i regenerację. Przy wyniku ≤4/10 redukcja objętości ~16–40% (Smith et al. 2020; Traps et al. 2024).',
  },
  deload: {
    id: 'deload',
    title: 'Auto-Deload (wykrywacz płaskowyżu)',
    icon: 'trending-down-outline',
    color: '#A78BFA',
    type: 'toggle',
    description:
      'Wykrywa stagnację 1RM (3 sesje) lub wzrost RPE przy stałym ciężarzu — reaktywny mikro-deload w planie.',
    science:
      '54% sportowców siłowych stosuje deload przy stagnacji (Traps et al., 2024). Algorytm reaguje na brak progresu siły oraz RPE creep (ten sam kg, wyższe RPE) — typowy deload: −10–20% obciążenia, mniej serii, większy zapas (RIR).',
  },
};
