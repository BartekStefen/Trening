import { useMemo, useState } from 'react';
import {
  Image, Modal, ScrollView, SectionList, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

// ─── Baza ćwiczeń ──────────────────────────────────────────────────────────────
// Emotikony partii zamiast kolorowych kropek (Krok 4)
export const EXERCISE_DATABASE = [
  {
    title: '💪 Biceps', filterKey: 'Biceps', accent: '#A78BFA',
    data: [
      { id: 'a1', name: 'Biceps Curl ze sztangą',    difficulty: 'Łatwy',        equipment: 'Sztanga',    muscles: ['Biceps'],                              synergists: ['Ramienno-promieniowy', 'Ramienny'], alternatives: ['a3', 'a2'], image: 'https://via.placeholder.com/50/2C2C2E/636366?text=BC', description: 'Chwyć sztangę podchwytem na szerokość barków. Ramiona przy tułowiu – punkt podparcia nie zmienia się przez cały ruch. Uginaj do pełnego skurczu bicepsa, ekscentryka 2–3 sekundy. Nie chybocz tułowiem.' },
      { id: 'a2', name: 'Hammer Curl',               difficulty: 'Łatwy',        equipment: 'Hantle',     muscles: ['Ramienno-promieniowy', 'Biceps'],      synergists: ['Ramienny'],                        alternatives: ['a1', 'a3'], image: 'https://via.placeholder.com/50/2C2C2E/636366?text=HC', description: 'Neutralny chwyt (kciuk ku górze) przez cały ruch. Aktywuje silnie ramienno-promieniowy – mięsień odpowiedzialny za grubość ramienia widoczną z profilu.' },
      { id: 'a3', name: 'Preacher Curl',             difficulty: 'Łatwy',        equipment: 'Sztanga EZ', muscles: ['Biceps (głowa krótka)'],               synergists: ['Ramienny'],                        alternatives: ['a1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=PC', description: 'Modlitewnik unieruchamia ramiona eliminując kompensacje tułowia. Opuść do prawie pełnego wyprostu (nie blokuj stawu), ugnij do skurczu.' },
    ],
  },
  {
    title: '🦍 Klatka', filterKey: 'Klatka', accent: '#00E676',
    data: [
      { id: 'c1', name: 'Wyciskanie sztangi leżąc',   difficulty: 'Średni',       equipment: 'Sztanga',  muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'], synergists: ['Zębaty przedni'],          alternatives: ['c3', 'c5'], image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WS', description: 'Połóż się na ławce poziomej. Łopatki ściągnięte i dociśnięte do ławki. Opuść sztangę kontrolowanie do dolnej linii klatki, wypchnij eksplozywnie. Łokcie pod kątem ~75° względem tułowia.' },
      { id: 'c2', name: 'Wyciskanie na skosie',        difficulty: 'Średni',       equipment: 'Sztanga',  muscles: ['Górna klatka', 'Triceps', 'Przedni bark'],    synergists: ['Zębaty przedni'],          alternatives: ['c1', 'c5'], image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WN', description: 'Ławka ustawiona pod kątem 30–45°. Trajektoria pracy kładzie nacisk na górną część klatki i obojczykową głowę mięśnia piersiowego większego.' },
      { id: 'c3', name: 'Rozpiętki z hantlami',        difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Klatka piersiowa'],                           synergists: ['Przedni bark'],            alternatives: ['c1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=RH', description: 'Izolacja klatki piersiowej. Ruch wyłącznie w stawie ramiennym – łokcie lekko ugięte i zablokowane w tej pozycji. Opuszczaj w szerokim łuku do rozciągnięcia klatki.' },
      { id: 'c4', name: 'Dipy na poręczach',           difficulty: 'Średni',       equipment: 'Drążki',   muscles: ['Dolna klatka', 'Triceps'],                    synergists: ['Przedni bark'],            alternatives: ['c1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=DP', description: 'Lekkie pochylenie tułowia do przodu (~30°) przenosi nacisk z tricepsa na dolną część klatki. Opuszczaj do kąta ~90° w łokciach.' },
      { id: 'c5', name: 'Wyciskanie hantlami leżąc',   difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Klatka piersiowa', 'Triceps'],                synergists: ['Zębaty przedni'],          alternatives: ['c1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WH', description: 'Większy zakres ruchu niż przy sztandze – hantle mogą zbliżyć się do siebie na szczycie. Eliminuje dysbalans obustronny.' },
    ],
  },
  {
    title: '🦇 Plecy', filterKey: 'Plecy', accent: '#378ADD',
    data: [
      { id: 'b1', name: 'Wiosłowanie sztangą',         difficulty: 'Średni',       equipment: 'Sztanga',  muscles: ['Najszerszy grzbietu', 'Trapez', 'Romboid'], synergists: ['Tylny bark', 'Biceps'],    alternatives: ['b4', 'b5'], image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WS', description: 'Tułów pochylony ~45°, plecy płaskie – neutralna krzywizna kręgosłupa. Przyciągaj do brzucha prowadząc łokcie blisko tułowia. Kontroluj ekscentrykę.' },
      { id: 'b2', name: 'Martwy ciąg',                 difficulty: 'Zaawansowany', equipment: 'Sztanga',  muscles: ['Prostowniki pleców', 'Pośladki', 'Czworogłowy'], synergists: ['Trapez', 'Biceps'],   alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=MC', description: 'Stopy na szerokość bioder, sztanga nad środkiem stopy. Napnij core i najszersze przed zdjęciem ciężaru. Prostuj nogi i biodra jednocześnie utrzymując plecy płaskie.' },
      { id: 'b3', name: 'Podciąganie na drążku',       difficulty: 'Średni',       equipment: 'Drążek',   muscles: ['Najszerszy grzbietu', 'Biceps'],             synergists: ['Tylny bark'],             alternatives: ['b5'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=PD', description: 'Chwyć nachwytem na szerokość barków. Inicjuj ruch depresją łopatek. Podciągaj aż broda przekroczy drążek, ekscentryka 2–3 sekundy.' },
      { id: 'b4', name: 'Wiosłowanie hantlem',         difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Najszerszy grzbietu', 'Romboid'],            synergists: ['Biceps'],                 alternatives: ['b1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WH', description: 'Praca jednostronna eliminuje kompensacje. Oprzyj kolano i rękę na ławce. Przyciągaj hantel do biodra łokciem ku górze.' },
      { id: 'b5', name: 'Ściąganie wyciągu górnego',   difficulty: 'Łatwy',        equipment: 'Wyciąg',   muscles: ['Najszerszy grzbietu'],                       synergists: ['Biceps', 'Tylny bark'],   alternatives: ['b3'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=SW', description: 'Ściągaj drążek do obojczyków prowadząc łokcie w dół i do tyłu. Nie odchylaj tułowia – ruch wyłącznie w stawach ramiennych.' },
    ],
  },
  {
    title: '🦵 Nogi', filterKey: 'Nogi', accent: '#EF9F27',
    data: [
      { id: 'l1', name: 'Przysiad ze sztangą',         difficulty: 'Zaawansowany', equipment: 'Sztanga',  muscles: ['Czworogłowy', 'Pośladki', 'Dwugłowy uda'],  synergists: ['Prostowniki pleców'],     alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=PS', description: 'Sztanga na mięśniach czworobocznych. Stopy na szerokość barków lub nieco szerzej. Zniżaj do co najmniej równoległości ud z podłożem utrzymując kolana nad palcami stóp.' },
      { id: 'l2', name: 'Wykrok z hantlami',           difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Czworogłowy', 'Pośladki'],                  synergists: ['Dwugłowy uda'],           alternatives: ['l1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WK', description: 'Krok do przodu, kolano tylnej nogi blisko podłoża. Kolano przedniej nie przekracza linii palców. Odpychaj się piętą przedniej stopy.' },
      { id: 'l3', name: 'Uginanie nóg leżąc',         difficulty: 'Łatwy',        equipment: 'Maszyna',  muscles: ['Dwugłowy uda'],                             synergists: ['Łydki'],                  alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=UN', description: 'Pełny zakres ruchu. Nie unoś bioder – punkt podparcia muszą być biodra, nie lędźwie. Ekscentryka 3–4 sekundy.' },
      { id: 'l4', name: 'Hip Thrust',                  difficulty: 'Średni',       equipment: 'Sztanga',  muscles: ['Pośladki', 'Dwugłowy uda'],                 synergists: ['Czworogłowy'],            alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=HT', description: 'Łopatki oparte o ławkę, sztanga nad biodrami (z gumową podkładką). Pchnij biodra ku górze do pełnego wyprostu. Mocno izometrycznie napnij pośladki w szczycie.' },
    ],
  },
  {
    title: '🏋️ Barki', filterKey: 'Barki', accent: '#FB923C',
    data: [
      { id: 's1', name: 'Wyciskanie żołnierskie',      difficulty: 'Średni',       equipment: 'Sztanga',  muscles: ['Przedni bark', 'Boczny bark', 'Triceps'],   synergists: ['Trapez górny'],           alternatives: ['s2'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=WZ', description: 'Sztanga na obojczykach, chwyt nieco szerzej niż barki. Wypychaj pionowo – głowa cofa się w tył, by przepuścić sztangę, następnie wraca pod nią. Pełny wyprost ramion na górze.' },
      { id: 's2', name: 'Unoszenie ramion bokiem',     difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Boczny bark'],                              synergists: ['Przedni bark'],           alternatives: ['s1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=UR', description: 'Łokcie lekko ugięte i zablokowane. Unoś do linii barków. Typowy błąd: zbyt duży ciężar powoduje zaangażowanie trapezów i dynamikę tułowia.' },
      { id: 's3', name: 'Rear Delt Fly',               difficulty: 'Łatwy',        equipment: 'Hantle',   muscles: ['Tylny bark'],                               synergists: ['Romboid'],                alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=RD', description: 'Tułów poziomy lub zbliżony do poziomego. Unoś ramiona na boki z lekko ugiętymi łokciami. Tylny bark jest często zaniedbywany i kluczowy dla zdrowia stawu ramiennego.' },
    ],
  },
  {
    title: '💪 Triceps', filterKey: 'Triceps', accent: '#F472B6',
    data: [
      { id: 't1', name: 'Triceps Pushdown',            difficulty: 'Łatwy',        equipment: 'Wyciąg',    muscles: ['Triceps'],                              synergists: ['Łokciowy'],               alternatives: ['t2'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=TP', description: 'Łokcie przy tułowiu – to punkt podparcia, nie mogą się przemieszczać. Prostuj do pełnego wyprostu z mocnym izometrycznym skurczem tricepsa.' },
      { id: 't2', name: 'Skull Crusher',               difficulty: 'Średni',       equipment: 'Sztanga EZ', muscles: ['Triceps (wszystkie głowy)'],            synergists: ['Łokciowy'],               alternatives: ['t1'],       image: 'https://via.placeholder.com/50/2C2C2E/636366?text=SC', description: 'Połóż się na ławce. Uginaj wyłącznie w łokciach opuszczając sztangę za głowę (większy zakres) lub do czoła. Nie rozchylaj łokci na zewnątrz.' },
    ],
  },
  {
    title: '🍫 Brzuch', filterKey: 'Brzuch', accent: '#34D399',
    data: [
      { id: 'ab1', name: 'Spięcia brzucha',            difficulty: 'Łatwy',        equipment: 'Brak',      muscles: ['Prostownik brzucha (górny)'],           synergists: ['Skośne brzucha'],         alternatives: ['ab3'],      image: 'https://via.placeholder.com/50/2C2C2E/636366?text=SB', description: 'Połóż się na plecach, kolana ugięte. Dociśnij dół pleców do podłogi. Unoś tułów ok. 30°, napinaj brzuch w szczycie, nie ciągnij za szyję.' },
      { id: 'ab2', name: 'Plank',                      difficulty: 'Łatwy',        equipment: 'Brak',      muscles: ['Poprzeczny brzucha', 'Prostownik'],     synergists: ['Pośladki', 'Plecy'],      alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=PL', description: 'Podpór na przedramionach i palcach stóp. Ciało w jednej linii – nie opuszczaj bioder, nie unoś pośladków. Napnij brzuch i pośladki przez cały czas.' },
      { id: 'ab3', name: 'Nożyce',                     difficulty: 'Łatwy',        equipment: 'Brak',      muscles: ['Prostownik brzucha (dolny)'],           synergists: ['Biodrowo-lędźwiowy'],     alternatives: ['ab1'],      image: 'https://via.placeholder.com/50/2C2C2E/636366?text=NZ', description: 'Leżąc naprzemiennie unoś wyprostowane nogi. Dół pleców musi być cały czas dociśnięty do podłogi – jeśli się unosi, zmniejsz amplitudę.' },
      { id: 'ab4', name: 'Rosyjski skręt',             difficulty: 'Średni',       equipment: 'Kettlebell', muscles: ['Skośne brzucha'],                      synergists: ['Prostownik brzucha'],     alternatives: [],           image: 'https://via.placeholder.com/50/2C2C2E/636366?text=RS', description: 'Siedź pod kątem 45°, kolana ugięte lub wyprostowane (trudniej). Skręcaj tułów na boki trzymając obciążenie oburącz. Ruch pochodzi z tułowia, nie ramion.' },
      { id: 'ab5', name: 'Spięcia na drążku',          difficulty: 'Zaawansowany', equipment: 'Drążek',    muscles: ['Prostownik brzucha (dolny)'],           synergists: ['Zębaty przedni'],         alternatives: ['ab1'],      image: 'https://via.placeholder.com/50/2C2C2E/636366?text=SD', description: 'Zawis na drążku. Unoś ugięte kolana do klatki, inicjując ruch tylnym pochyleniem miednicy (retroversja). Unikaj bujania.' },
    ],
  },
];

// Klucze filtrowania – "Wszystkie" + wszystkie partii
const ALL_FILTER_KEYS = ['Wszystkie', ...EXERCISE_DATABASE.map((s) => s.filterKey)];

// Mapa id → obiekt ćwiczenia do szybkiego wyszukiwania zamienników
export const EXERCISE_MAP = Object.fromEntries(
  EXERCISE_DATABASE.flatMap((s) => s.data).map((ex) => [ex.id, ex])
);

// ─── Modal: szczegóły ćwiczenia z placeholderem wideo ─────────────────────────
const ExerciseDetailModal = ({ exercise, onClose, onSelect, selectMode }) => {
  const { colors } = useTheme();
  const detailStyles = makeDetailStyles(colors);
  if (!exercise) return null;
  const diffColor = { 'Łatwy': '#00E676', 'Średni': '#EF9F27', 'Zaawansowany': '#FF453A' }[exercise.difficulty] ?? '#8E8E93';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={detailStyles.screen}>
        <View style={detailStyles.handle} />
        <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={detailStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={detailStyles.name}>{exercise.name}</Text>
          <View style={detailStyles.badgeRow}>
            <View style={[detailStyles.badge, { backgroundColor: `${diffColor}22` }]}>
              <Text style={[detailStyles.badgeText, { color: diffColor }]}>{exercise.difficulty}</Text>
            </View>
            <View style={detailStyles.badge}>
              <Ionicons name="barbell-outline" size={13} color="#8E8E93" />
              <Text style={detailStyles.badgeText}>{exercise.equipment}</Text>
            </View>
          </View>

          {/* Ciemny placeholder wideo z ikoną Play */}
          <TouchableOpacity style={detailStyles.videoBox} activeOpacity={0.8}>
            <View style={detailStyles.playCircle}>
              <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
            <Text style={detailStyles.videoTitle}>Odtwórz film instruktażowy HD</Text>
            <Text style={detailStyles.videoSub}>Dostępne w wersji Premium</Text>
          </TouchableOpacity>

          <Text style={detailStyles.sl}>Technika wykonania</Text>
          <Text style={detailStyles.description}>{exercise.description}</Text>

          <Text style={detailStyles.sl}>Mięśnie główne</Text>
          {exercise.muscles.map((m, i) => (
            <View key={i} style={detailStyles.muscleRow}>
              <View style={[detailStyles.dot, { backgroundColor: colors.accent }]} />
              <Text style={detailStyles.muscleText}>{m}</Text>
            </View>
          ))}

          <Text style={[detailStyles.sl, { marginTop: 16 }]}>Mięśnie synergistyczne</Text>
          {exercise.synergists.map((m, i) => (
            <View key={i} style={detailStyles.muscleRow}>
              <View style={[detailStyles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[detailStyles.muscleText, { color: colors.textSecondary }]}>{m}</Text>
            </View>
          ))}

          {/* Wskazówki i błędy – wyciągnięte z pola description uzupełnionego o ostrzeżenia */}
          <Text style={[detailStyles.sl, { marginTop: 16 }]}>Wskazówki</Text>
          <View style={detailStyles.tipBox}>
            <Ionicons name="bulb-outline" size={14} color="#EF9F27" />
            <Text style={detailStyles.tipText}>Zadbaj o pełny zakres ruchu i kontrolowaną ekscentrykę. Ciężar jest narzędziem, technika priorytetem.</Text>
          </View>
        </ScrollView>

        {/* Przycisk wyboru ćwiczenia w trybie zamiany */}
        {selectMode && (
          <View style={detailStyles.footer}>
            <TouchableOpacity style={detailStyles.selectBtn} onPress={() => onSelect(exercise)} activeOpacity={0.85}>
              <Text style={detailStyles.selectBtnText}>Wybierz to ćwiczenie</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const makeDetailStyles = (c) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:     { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:   { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  content:    { padding: 24, paddingTop: 20, paddingBottom: 48 },
  name:       { fontSize: 24, fontWeight: '800', color: c.textPrimary, marginBottom: 12, paddingRight: 36 },
  badgeRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText:  { fontSize: 12, fontWeight: '600', color: c.textSecondary },

  videoBox:   { height: 200, backgroundColor: c.card, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 28, gap: 10, borderWidth: 0.5, borderColor: c.border },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent },
  videoTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  videoSub:   { fontSize: 12, color: c.textTertiary },

  sl:          { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  description: { fontSize: 15, color: c.textPrimary, lineHeight: 24, marginBottom: 24 },
  muscleRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  muscleText:  { fontSize: 15, color: c.textPrimary },

  tipBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(239,159,39,0.08)', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: 'rgba(239,159,39,0.25)' },
  tipText: { flex: 1, fontSize: 13, color: c.textPrimary, lineHeight: 19 },

  footer:        { padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderColor: c.border },
  selectBtn:     { backgroundColor: c.accent, borderRadius: 16, padding: 17, alignItems: 'center' },
  selectBtnText: { fontSize: 16, fontWeight: '700', color: c.accentText },
});

// ─── Modal: filtr partii mięśniowej ───────────────────────────────────────────
const MuscleFilterModal = ({ visible, selected, onSelect, onClose }) => {
  const { colors } = useTheme();
  const filterStyles = makeFilterStyles(colors);
  return (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <TouchableOpacity style={filterStyles.backdrop} onPress={onClose} activeOpacity={1}>
      <View style={filterStyles.sheet}>
        <View style={filterStyles.handle} />
        <Text style={filterStyles.title}>Filtruj partię</Text>
        {ALL_FILTER_KEYS.map((key) => {
          const section = EXERCISE_DATABASE.find((s) => s.filterKey === key);
          const active  = key === selected;
          const accent  = section?.accent ?? '#00E676';
          const label   = section?.title ?? 'Wszystkie partie';
          return (
            <TouchableOpacity
              key={key}
              style={[filterStyles.row, active && { backgroundColor: `${accent}18` }]}
              onPress={() => { onSelect(key); onClose(); }}
              activeOpacity={0.7}
            >
              {active
                ? <Ionicons name="checkmark-circle" size={20} color={accent} />
                : <View style={filterStyles.emptyCircle} />}
              <Text style={[filterStyles.rowText, active && { color: accent, fontWeight: '600' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </TouchableOpacity>
  </Modal>
  );
};

const makeFilterStyles = (c) => StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: c.backgroundSecondary, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 48 },
  handle:      { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:       { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderRadius: 12, paddingHorizontal: 8 },
  rowText:     { fontSize: 16, color: c.textSecondary, fontWeight: '500' },
  emptyCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: c.borderMuted },
});

// ─── Modal: kreator nazwy planu ────────────────────────────────────────────────
const PlanNameModal = ({ visible, count, onSave, onClose }) => {
  const [name, setName] = useState('');
  const { colors } = useTheme();
  const planStyles = makePlanStyles(colors);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={planStyles.screen}>
        <View style={planStyles.handle} />
        <Text style={planStyles.title}>Nazwij swój plan</Text>
        <Text style={planStyles.sub}>Zaznaczono {count} ćwiczeń</Text>
        <TextInput
          style={planStyles.input}
          value={name}
          onChangeText={setName}
          placeholder='np. "Push A", "Full Body Pro"'
          placeholderTextColor={colors.borderMuted}
          autoFocus
          maxLength={40}
        />
        <TouchableOpacity
          style={[planStyles.saveBtn, !name.trim() && planStyles.saveBtnDisabled]}
          disabled={!name.trim()}
          onPress={() => { onSave(name.trim()); setName(''); }}
          activeOpacity={0.85}
        >
          <Text style={planStyles.saveBtnText}>Zapisz plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={planStyles.cancelBtn} onPress={() => { setName(''); onClose(); }} activeOpacity={0.7}>
          <Text style={planStyles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const makePlanStyles = (c) => StyleSheet.create({
  screen:         { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:         { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 24 },
  title:          { fontSize: 24, fontWeight: '700', color: c.textPrimary, paddingHorizontal: 24, marginBottom: 6 },
  sub:            { fontSize: 14, color: c.textSecondary, paddingHorizontal: 24, marginBottom: 24 },
  input:          { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, color: c.textPrimary, fontSize: 18, padding: 16, marginHorizontal: 20, marginBottom: 20 },
  saveBtn:        { backgroundColor: c.accent, borderRadius: 16, margin: 20, marginTop: 4, padding: 17, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.4 },
  saveBtnText:    { fontSize: 16, fontWeight: '700', color: c.accentText },
  cancelBtn:      { marginHorizontal: 20, padding: 12, alignItems: 'center' },
  cancelText:     { fontSize: 15, color: c.textTertiary },
});

// ─── Główny komponent ekranu biblioteki ───────────────────────────────────────
export default function ExercisesLibraryScreen({ navigation, route }) {
  const { addCustomPlan }   = useWorkoutContext();
  const { colors } = useTheme();

  // selectMode: tryb wyboru ćwiczenia jako zamiennika (wywołany z ActiveWorkoutScreen)
  const selectMode    = route?.params?.selectMode ?? false;
  const onExercisePick = route?.params?.onPick;

  const [query, setQuery]             = useState('');
  const [muscle, setMuscle]           = useState('Wszystkie');
  const [filterVisible, setFilter]    = useState(false);
  const [detailEx, setDetailEx]       = useState(null);
  const [creatorMode, setCreatorMode] = useState(!selectMode && false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [planModal, setPlanModal]     = useState(false);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_DATABASE
      .filter((s) => muscle === 'Wszystkie' || s.filterKey === muscle)
      .map((s) => ({
        ...s,
        data: q ? s.data.filter((ex) => ex.name.toLowerCase().includes(q)) : s.data,
      }))
      .filter((s) => s.data.length > 0);
  }, [query, muscle]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSavePlan = (planName) => {
    // Zapisujemy PEŁNE obiekty ćwiczeń – nie tylko ID – żeby ActiveWorkoutScreen
    // mógł odtworzyć dokładnie wybrany zestaw bez losowania
    const exercises = EXERCISE_DATABASE.flatMap((s) => s.data).filter((ex) => selectedIds.has(ex.id));
    addCustomPlan({ name: planName, exercises });
    setPlanModal(false);
    setCreatorMode(false);
    setSelectedIds(new Set());
    navigation.goBack();
  };

  // Obsługa wyboru ćwiczenia w trybie zamiany (selectMode)
  const handleSelectForSwap = (exercise) => {
    setDetailEx(null);
    onExercisePick?.(exercise);
    navigation.goBack();
  };

  const styles = makeStyles(colors);
  const currentSection = EXERCISE_DATABASE.find((s) => s.filterKey === muscle);
  const chipAccent     = currentSection?.accent ?? '#8E8E93';

  const renderItem = ({ item }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          if (creatorMode) { toggleSelect(item.id); return; }
          setDetailEx(item);
        }}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowMeta}>{item.equipment} · {item.muscles[0]}</Text>
        </View>
        {creatorMode ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={14} color="#000" />}
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={17} color="#3A3A3C" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { borderLeftColor: section.accent }]}>
      <Text style={[styles.sectionTitle, { color: section.accent }]}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {selectMode ? 'Wybierz ćwiczenie' : creatorMode ? 'Kreator planu' : 'Baza ćwiczeń'}
        </Text>
        {creatorMode ? (
          <TouchableOpacity onPress={() => { setCreatorMode(false); setSelectedIds(new Set()); }} style={styles.cancelCreatorBtn}>
            <Text style={styles.cancelCreatorText}>Anuluj</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 70 }} />}
      </View>

      {/* Przycisk "Stwórz plan" – ukryty w selectMode */}
      {!creatorMode && !selectMode && (
        <TouchableOpacity style={styles.createPlanBtn} activeOpacity={0.85} onPress={() => setCreatorMode(true)}>
          <View style={styles.createPlanIcon}>
            <Ionicons name="add" size={22} color="#000" />
          </View>
          <View style={styles.createPlanText}>
            <Text style={styles.createPlanTitle}>Stwórz własny plan</Text>
            <Text style={styles.createPlanSub}>Zaznacz ćwiczenia i zapisz rutynę</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.4)" />
        </TouchableOpacity>
      )}

      {creatorMode && (
        <View style={styles.creatorBanner}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.library} />
          <Text style={styles.creatorBannerText}>Zaznacz ćwiczenia, które wejdą do planu</Text>
        </View>
      )}

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj ćwiczenia..."
          placeholderTextColor="#636366"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.filterChip, muscle !== 'Wszystkie' && { borderColor: chipAccent }]}
        onPress={() => setFilter(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter-outline" size={15} color={muscle !== 'Wszystkie' ? chipAccent : '#8E8E93'} />
        <Text style={[styles.filterChipText, muscle !== 'Wszystkie' && { color: chipAccent }]}>
          {muscle !== 'Wszystkie' ? currentSection?.title : 'Wszystkie partie'} ▼
        </Text>
      </TouchableOpacity>

      {filteredSections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color={colors.borderMuted} />
          <Text style={styles.emptyText}>Brak wyników dla "{query}"</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {creatorMode && selectedIds.size > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setPlanModal(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>Dalej (Zaznaczono: {selectedIds.size})</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      )}

      <MuscleFilterModal visible={filterVisible} selected={muscle} onSelect={setMuscle} onClose={() => setFilter(false)} />
      <ExerciseDetailModal
        exercise={detailEx}
        onClose={() => setDetailEx(null)}
        onSelect={handleSelectForSwap}
        selectMode={selectMode}
      />
      <PlanNameModal visible={planModal} count={selectedIds.size} onSave={handleSavePlan} onClose={() => setPlanModal(false)} />
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: c.background },
  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  topBarTitle:       { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  cancelCreatorBtn:  { paddingHorizontal: 8, paddingVertical: 6 },
  cancelCreatorText: { fontSize: 14, color: c.danger, fontWeight: '500' },

  createPlanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.accent, marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 16, gap: 14 },
  createPlanIcon:{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  createPlanText:{ flex: 1 },
  createPlanTitle:{ fontSize: 15, fontWeight: '700', color: c.accentText },
  createPlanSub:  { fontSize: 12, color: c.accentText, opacity: 0.55, marginTop: 2 },

  creatorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.librarySoft, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: c.librarySoft },
  creatorBannerText: { fontSize: 13, color: c.library, flex: 1 },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundSecondary, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, paddingHorizontal: 14, borderWidth: 0.5, borderColor: c.border, height: 46 },
  searchInput:   { flex: 1, fontSize: 15, color: c.textPrimary, paddingVertical: 0 },

  filterChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 8, backgroundColor: c.backgroundSecondary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: c.border },
  filterChipText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },

  listContent:   { paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.background, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 0.5, borderColor: c.border, borderLeftWidth: 3 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.background, gap: 12 },
  thumbnail: { width: 50, height: 50, borderRadius: 10, backgroundColor: c.card },
  rowInfo:   { flex: 1, minWidth: 0 },
  rowName:   { fontSize: 15, fontWeight: '500', color: c.textPrimary, marginBottom: 3 },
  rowMeta:   { fontSize: 12, color: c.textTertiary },
  separator: { height: 0.5, backgroundColor: c.border, marginLeft: 78 },

  checkbox:         { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.borderMuted, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: c.library, borderColor: c.library },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 80 },
  emptyText:  { fontSize: 15, color: c.borderMuted },

  fab:     { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: c.library, borderRadius: 18, padding: 18, shadowColor: c.library, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  fabText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});