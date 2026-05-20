import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Baza ćwiczeń ──────────────────────────────────────────────────────────────
// Każde ćwiczenie ma pole `thumbnail` – URL placeholdera zastąpiony docelowo
// assetami z Firebase Storage lub bundlowanymi obrazkami lokalnymi
const EXERCISE_DATABASE = [
  {
    title: 'Klatka piersiowa',
    icon:   'body-outline',
    accent: '#00E676',
    data: [
      { id: 'c1', name: 'Wyciskanie sztangi leżąc',        difficulty: 'Średni',        equipment: 'Sztanga',          muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'],        synergists: ['Zębaty przedni', 'Kruczo-ramienny'],  thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=K',  description: 'Połóż się na ławce poziomej, chwyć sztangę nachwytem nieco szerzej niż szerokość barków. Opuść sztangę kontrolowanie do klatki piersiowej, następnie wypchnij eksplozywnie. Łopatki ściągnięte i dociśnięte do ławki przez cały czas.' },
      { id: 'c2', name: 'Wyciskanie na skosie dodatnim',   difficulty: 'Średni',        equipment: 'Sztanga',          muscles: ['Górna klatka', 'Triceps', 'Przedni bark'],           synergists: ['Zębaty przedni'],                      thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=K',  description: 'Ławka ustawiona pod kątem 30–45°. Ruch analogiczny do wyciskania poziomego, jednak kładzie większy nacisk na górną część klatki. Łokcie pod kątem ~75° względem tułowia.' },
      { id: 'c3', name: 'Rozpiętki z hantlami',            difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Klatka piersiowa'],                                  synergists: ['Przedni bark', 'Kruczo-ramienny'],      thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=K',  description: 'Połóż się na ławce trzymając hantle nad klatką, łokcie lekko ugięte. Opuszczaj ramiona w łuku do rozciągnięcia, przyciągnij po tej samej trajektorii. Ruch wyłącznie w stawie ramiennym.' },
      { id: 'c4', name: 'Pompki na poręczach (Dipy)',      difficulty: 'Średni',        equipment: 'Drążki',           muscles: ['Dolna klatka', 'Triceps'],                           synergists: ['Przedni bark'],                         thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=K',  description: 'Lekki pochył tułowia aktywuje klatke zamiast tricepsa. Opuszczaj do kąta ~90° w łokciach, wypychaj do pełnego wyprostu.' },
      { id: 'c5', name: 'Wyciskanie hantlami leżąc',       difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Klatka piersiowa', 'Triceps'],                       synergists: ['Zębaty przedni', 'Przedni bark'],       thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=K',  description: 'Większy zakres ruchu niż ze sztangą. Hantle mogą zbliżać się do siebie na szczycie ruchu. Pomaga w korekcji dysbalansu siłowego.' },
    ],
  },
  {
    title: 'Plecy',
    icon:   'arrow-back-outline',
    accent: '#378ADD',
    data: [
      { id: 'b1', name: 'Wiosłowanie sztangą',             difficulty: 'Średni',        equipment: 'Sztanga',          muscles: ['Najszerszy grzbietu', 'Trapez', 'Romboid'],          synergists: ['Tylny bark', 'Biceps'],                 thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=P',  description: 'Tułów pochylony ~45°, plecy płaskie. Przyciągaj do brzucha prowadząc łokcie blisko tułowia. Kontroluj ekscentrykę – nie pozwól sztandze opadać swobodnie.' },
      { id: 'b2', name: 'Martwy ciąg',                     difficulty: 'Zaawansowany',  equipment: 'Sztanga',          muscles: ['Prostowniki pleców', 'Pośladki', 'Czworogłowy'],     synergists: ['Trapez', 'Romboid', 'Biceps'],          thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=P',  description: 'Stopy na szerokość bioder, sztanga nad środkiem stopy. Prostuj nogi i biodra jednocześnie utrzymując kręgosłup neutralny. Napięcie core przed zdjęciem ciężaru z podłoża.' },
      { id: 'b3', name: 'Podciąganie na drążku',           difficulty: 'Średni',        equipment: 'Drążek',           muscles: ['Najszerszy grzbietu', 'Biceps'],                     synergists: ['Tylny bark', 'Trapez dolny'],            thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=P',  description: 'Chwyć nachwytem na szerokość barków. Podciągaj do brody nad drążkiem prowadząc łokcie w dół i do tyłu. Powolna ekscentryka wzmacnia siłę relatywną.' },
      { id: 'b4', name: 'Wiosłowanie hantlem',             difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Najszerszy grzbietu', 'Romboid'],                    synergists: ['Tylny bark', 'Biceps'],                 thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=P',  description: 'Oprzyj kolano i rękę na ławce. Przyciągaj hantel do biodra prowadząc łokieć ku górze. Izolacja jednostronna eliminuje kompensacje.' },
      { id: 'b5', name: 'Ściąganie drążka wyciągu górnego', difficulty: 'Łatwy',        equipment: 'Wyciąg',           muscles: ['Najszerszy grzbietu'],                               synergists: ['Biceps', 'Tylny bark'],                 thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=P',  description: 'Ściągaj drążek do obojczyków prowadząc łokcie w dół i do tyłu. Nie odchylaj tułowia.' },
    ],
  },
  {
    title: 'Nogi',
    icon:   'walk-outline',
    accent: '#EF9F27',
    data: [
      { id: 'l1', name: 'Przysiad ze sztangą',             difficulty: 'Zaawansowany',  equipment: 'Sztanga',          muscles: ['Czworogłowy', 'Pośladki', 'Dwugłowy uda'],          synergists: ['Prostowniki pleców', 'Łydki'],          thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=N',  description: 'Sztanga na mięśniach czworobocznych. Zniżaj biodra do co najmniej równoległości ud z podłożem utrzymując kręgosłup neutralny i kolana nad palcami.' },
      { id: 'l2', name: 'Wykrok z hantlami',               difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Czworogłowy', 'Pośladki'],                           synergists: ['Dwugłowy uda', 'Łydki'],                thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=N',  description: 'Kolano tylnej nogi zbliża się do podłoża. Kolano przedniej nogi nie przekracza palców. Wróć odpychając się piętą.' },
      { id: 'l3', name: 'Uginanie nóg leżąc',              difficulty: 'Łatwy',         equipment: 'Maszyna',          muscles: ['Dwugłowy uda'],                                      synergists: ['Półścięgnisty', 'Łydki'],               thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=N',  description: 'Uginaj do maksymalnego skurczu, unikając unoszenia bioder. Ekscentryka 3–4 sekundy.' },
      { id: 'l4', name: 'Wspięcia na palce',               difficulty: 'Łatwy',         equipment: 'Maszyna / Schodek', muscles: ['Łydki'],                                           synergists: ['Piszczelowy tylny'],                    thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=N',  description: 'Pełen zakres ruchu – piętę opuść poniżej poziomu stopnia. Pełny zakres jest kluczowy dla hipertrofii.' },
      { id: 'l5', name: 'Hip Thrust',                      difficulty: 'Średni',        equipment: 'Sztanga / Maszyna', muscles: ['Pośladki', 'Dwugłowy uda'],                        synergists: ['Czworogłowy', 'Prostowniki pleców'],    thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=N',  description: 'Łopatki na ławce. Pchnij biodra do pełnego wyprostu. Mocno napnij pośladki w szczytowym punkcie.' },
    ],
  },
  {
    title: 'Barki',
    icon:   'fitness-outline',
    accent: '#FF6B6B',
    data: [
      { id: 's1', name: 'Wyciskanie żołnierskie',          difficulty: 'Średni',        equipment: 'Sztanga',          muscles: ['Przedni bark', 'Boczny bark', 'Triceps'],            synergists: ['Trapez górny', 'Zębaty przedni'],       thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=B',  description: 'Sztanga na obojczykach, uchwyt na szerokość barków. Głowa cofa się w tył, by przepuścić sztangę na szczycie.' },
      { id: 's2', name: 'Unoszenie ramion bokiem',         difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Boczny bark'],                                       synergists: ['Przedni bark', 'Trapez górny'],          thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=B',  description: 'Łokcie lekko ugięte przez cały ruch. Unoś do linii barków. Błąd: zbyt duży ciężar i angażowanie trapezów.' },
      { id: 's3', name: 'Unoszenie ramion przodem',        difficulty: 'Łatwy',         equipment: 'Hantle / Talerz',  muscles: ['Przedni bark'],                                      synergists: ['Górna klatka', 'Boczny bark'],           thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=B',  description: 'Ruch powolny bez dynamiki tułowia. Przedni bark zazwyczaj dostatecznie stymulowany przez ćwiczenia wielostawowe.' },
      { id: 's4', name: 'Wznosy ramion w opadzie (Rear Delt)', difficulty: 'Łatwy',    equipment: 'Hantle / Wyciąg',  muscles: ['Tylny bark'],                                        synergists: ['Romboid', 'Trapez środkowy'],            thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=B',  description: 'Tułów do pozycji poziomej. Tylna głowa barku kluczowa dla zdrowia stawu ramiennego i sylwetki.' },
    ],
  },
  {
    title: 'Ramiona',
    icon:   'hand-left-outline',
    accent: '#A78BFA',
    data: [
      { id: 'a1', name: 'Uginanie ze sztangą (Curl)',      difficulty: 'Łatwy',         equipment: 'Sztanga',          muscles: ['Biceps'],                                            synergists: ['Ramienno-promieniowy', 'Ramienny'],     thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=R',  description: 'Ramiona przy tułowiu przez cały ruch. Ruch wyłącznie w stawach łokciowych – nie chybocz tułowiem.' },
      { id: 'a2', name: 'Triceps na wyciągu (Pushdown)',   difficulty: 'Łatwy',         equipment: 'Wyciąg',           muscles: ['Triceps'],                                           synergists: ['Łokciowy'],                             thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=R',  description: 'Łokcie przy tułowiu – punkt podparcia, nie przemieszczają się. Pełny wyprost, mocne napięcie tricepsa na dole.' },
      { id: 'a3', name: 'Uginanie na modlitewniku',        difficulty: 'Łatwy',         equipment: 'Sztanga / Hantle', muscles: ['Biceps (głowa krótka)'],                            synergists: ['Ramienny'],                             thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=R',  description: 'Modlitewnik eliminuje kompensacje tułowia. Preferuje krótką głowę bicepsa.' },
      { id: 'a4', name: 'Francuz (Skull Crusher)',         difficulty: 'Średni',        equipment: 'Sztanga EZ / Hantle', muscles: ['Triceps (wszystkie głowy)'],                    synergists: ['Łokciowy'],                             thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=R',  description: 'Uginaj wyłącznie w stawach łokciowych opuszczając do czoła lub za głowę. Nie rozchylaj łokci.' },
      { id: 'a5', name: 'Uginanie młotkowe (Hammer)',      difficulty: 'Łatwy',         equipment: 'Hantle',           muscles: ['Ramienno-promieniowy', 'Biceps'],                    synergists: ['Ramienny'],                             thumbnail: 'https://via.placeholder.com/50/1C1C1E/636366?text=R',  description: 'Neutralny chwyt przez cały ruch. Aktywuje ramienno-promieniowy odpowiedzialny za grubość ramienia z profilu.' },
    ],
  },
];

const ALL_MUSCLES_LABEL = 'Wszystkie partie';
const MUSCLE_OPTIONS    = [ALL_MUSCLES_LABEL, ...EXERCISE_DATABASE.map((s) => s.title)];

// ─── Modal: szczegóły ćwiczenia ────────────────────────────────────────────────
const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;

  const diffColor = {
    'Łatwy':        '#00E676',
    'Średni':       '#EF9F27',
    'Zaawansowany': '#FF453A',
  }[exercise.difficulty] ?? '#8E8E93';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={detailStyles.screen}>
        <View style={detailStyles.handle} />
        <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={detailStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={detailStyles.name}>{exercise.name}</Text>
          <View style={detailStyles.badgeRow}>
            <View style={[detailStyles.badge, { backgroundColor: `${diffColor}20` }]}>
              <Text style={[detailStyles.badgeText, { color: diffColor }]}>{exercise.difficulty}</Text>
            </View>
            <View style={detailStyles.badge}>
              <Ionicons name="barbell-outline" size={13} color="#8E8E93" />
              <Text style={detailStyles.badgeText}>{exercise.equipment}</Text>
            </View>
          </View>
          <View style={detailStyles.imagePlaceholder}>
            <Ionicons name="body-outline" size={56} color="#2C2C2E" />
            <Text style={detailStyles.imagePlaceholderText}>Animacja techniki</Text>
          </View>
          <Text style={detailStyles.sectionLabel}>Opis techniki</Text>
          <Text style={detailStyles.description}>{exercise.description}</Text>
          <Text style={detailStyles.sectionLabel}>Mięśnie główne</Text>
          {exercise.muscles.map((m, i) => (
            <View key={i} style={detailStyles.muscleRow}>
              <View style={[detailStyles.muscleDot, { backgroundColor: '#00E676' }]} />
              <Text style={detailStyles.muscleText}>{m}</Text>
            </View>
          ))}
          <Text style={[detailStyles.sectionLabel, { marginTop: 16 }]}>Mięśnie synergistyczne</Text>
          {exercise.synergists.map((m, i) => (
            <View key={i} style={detailStyles.muscleRow}>
              <View style={[detailStyles.muscleDot, { backgroundColor: '#636366' }]} />
              <Text style={[detailStyles.muscleText, { color: '#8E8E93' }]}>{m}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const detailStyles = StyleSheet.create({
  screen:               { flex: 1, backgroundColor: '#0A0A0A' },
  handle:               { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:             { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  content:              { padding: 24, paddingTop: 20, paddingBottom: 48 },
  name:                 { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, paddingRight: 36 },
  badgeRow:             { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge:                { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText:            { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  imagePlaceholder:     { height: 180, backgroundColor: '#121212', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 28, gap: 10, borderWidth: 0.5, borderColor: '#2C2C2E' },
  imagePlaceholderText: { fontSize: 13, color: '#3A3A3C' },
  sectionLabel:         { fontSize: 11, fontWeight: '700', color: '#636366', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  description:          { fontSize: 15, color: '#DEDEDE', lineHeight: 24, marginBottom: 24 },
  muscleRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  muscleDot:            { width: 7, height: 7, borderRadius: 4 },
  muscleText:           { fontSize: 15, color: '#FFFFFF' },
});

// ─── Modal: filtr partii mięśniowej ───────────────────────────────────────────
const MuscleFilterModal = ({ visible, selected, onSelect, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <TouchableOpacity style={filterStyles.backdrop} activeOpacity={1} onPress={onClose}>
      <View style={filterStyles.sheet}>
        <Text style={filterStyles.title}>Filtruj po partii</Text>
        {MUSCLE_OPTIONS.map((opt) => {
          const isActive = opt === selected;
          const section  = EXERCISE_DATABASE.find((s) => s.title === opt);
          const accent   = section?.accent ?? '#8E8E93';
          return (
            <TouchableOpacity
              key={opt}
              style={[filterStyles.option, isActive && { borderColor: accent, borderWidth: 1 }]}
              onPress={() => { onSelect(opt); onClose(); }}
              activeOpacity={0.7}
            >
              {section && (
                <Ionicons name={section.icon} size={16} color={isActive ? accent : '#636366'} />
              )}
              <Text style={[filterStyles.optionText, isActive && { color: accent }]}>
                {opt}
              </Text>
              {isActive && <Ionicons name="checkmark" size={16} color={accent} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </TouchableOpacity>
  </Modal>
);

const filterStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#111111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  title:    { fontSize: 13, fontWeight: '700', color: '#636366', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  option:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: '#2C2C2E' },
  optionText:{ fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
});

// ─── Główny komponent ──────────────────────────────────────────────────────────
export default function ExercisesLibraryScreen({ navigation }) {
  const [query, setQuery]                   = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(ALL_MUSCLES_LABEL);
  const [filterModalVisible, setFilterModal]= useState(false);
  const [selectedExercise, setSelected]     = useState(null);

  // Filtrowanie w czasie rzeczywistym: partia + query tekstowe
  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sections = selectedMuscle === ALL_MUSCLES_LABEL
      ? EXERCISE_DATABASE
      : EXERCISE_DATABASE.filter((s) => s.title === selectedMuscle);

    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, data: s.data.filter((ex) => ex.name.toLowerCase().includes(q)) }))
      .filter((s) => s.data.length > 0);
  }, [query, selectedMuscle]);

  const isFiltered = selectedMuscle !== ALL_MUSCLES_LABEL;
  const activeSection = EXERCISE_DATABASE.find((s) => s.title === selectedMuscle);

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={libStyles.exerciseRow}
      onPress={() => setSelected(item)}
      activeOpacity={0.7}
    >
      {/* Miniatura ćwiczenia – docelowo lokalne assety lub Firebase Storage */}
      <Image
        source={{ uri: item.thumbnail }}
        style={libStyles.thumbnail}
        resizeMode="cover"
      />
      <View style={libStyles.exerciseRowContent}>
        <Text style={libStyles.exerciseName}>{item.name}</Text>
        <Text style={libStyles.exerciseMeta}>{item.equipment} · {item.muscles[0]}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#3A3A3C" />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={libStyles.sectionHeader}>
      <Ionicons name={section.icon} size={15} color={section.accent} />
      <Text style={[libStyles.sectionTitle, { color: section.accent }]}>{section.title}</Text>
    </View>
  );

  return (
    <View style={libStyles.screen}>

      {/* ── Górny pasek ── */}
      <View style={libStyles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={libStyles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={libStyles.topBarTitle}>Baza ćwiczeń</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Przycisk "Stwórz własny plan" – CTA nad wyszukiwarką ── */}
      <TouchableOpacity style={libStyles.createPlanBtn} activeOpacity={0.85} onPress={() => {}}>
        <View style={libStyles.createPlanIconWrap}>
          <Ionicons name="add" size={22} color="#000" />
        </View>
        <View style={libStyles.createPlanText}>
          <Text style={libStyles.createPlanTitle}>Stwórz własny plan</Text>
          <Text style={libStyles.createPlanSub}>Dobierz ćwiczenia i zapisz jako szablon</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.4)" />
      </TouchableOpacity>

      {/* ── Pasek wyszukiwania ── */}
      <View style={libStyles.searchWrapper}>
        <Ionicons name="search" size={17} color="#636366" style={libStyles.searchIcon} />
        <TextInput
          style={libStyles.searchInput}
          placeholder="Szukaj ćwiczenia..."
          placeholderTextColor="#636366"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={libStyles.searchClear} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={17} color="#636366" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Dropdown filtra partii mięśniowej ── */}
      <TouchableOpacity
        style={[libStyles.filterChip, isFiltered && { borderColor: activeSection?.accent ?? '#00E676' }]}
        onPress={() => setFilterModal(true)}
        activeOpacity={0.7}
      >
        {isFiltered && activeSection && (
          <Ionicons name={activeSection.icon} size={15} color={activeSection.accent} />
        )}
        <Text style={[libStyles.filterChipText, isFiltered && { color: activeSection?.accent ?? '#00E676' }]}>
          {selectedMuscle}
        </Text>
        <Ionicons name="chevron-down" size={14} color={isFiltered ? activeSection?.accent : '#636366'} />
      </TouchableOpacity>

      {/* ── Lista ćwiczeń ── */}
      {filteredSections.length === 0 ? (
        <View style={libStyles.emptyState}>
          <Ionicons name="search-outline" size={40} color="#3A3A3C" />
          <Text style={libStyles.emptyText}>Brak wyników dla "{query}"</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={libStyles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={libStyles.separator} />}
        />
      )}

      {/* Modals */}
      <MuscleFilterModal
        visible={filterModalVisible}
        selected={selectedMuscle}
        onSelect={setSelectedMuscle}
        onClose={() => setFilterModal(false)}
      />
      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const libStyles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#000000' },

  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  // CTA "Stwórz własny plan" – zielone tło jak przycisk startowy w TrainingScreen,
  // spójna paleta kolorystyczna w całym module treningowym
  createPlanBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#00E676',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 16, gap: 14,
  },
  createPlanIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  createPlanText:  { flex: 1 },
  createPlanTitle: { fontSize: 15, fontWeight: '700', color: '#000000' },
  createPlanSub:   { fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 2 },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#121212',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: '#2C2C2E', height: 44,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#FFFFFF', paddingVertical: 0 },
  searchClear: { padding: 4 },

  // Klikalny chip filtra – jedyna interaktywna kontrolka wyboru partii
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#121212',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 0.5, borderColor: '#2C2C2E',
  },
  filterChipText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },

  listContent: { paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#000000',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 0.5, borderColor: '#1C1C1E',
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },

  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#000000', gap: 14,
  },
  // Miniatura ćwiczenia: kwadratowy kafelek z zaokrąglonymi rogami.
  // Docelowo zastąpiony lokalnymi assetami (require('./assets/exercises/bench.jpg'))
  thumbnail: {
    width: 50, height: 50,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
  },
  exerciseRowContent: { flex: 1, minWidth: 0 },
  exerciseName:       { fontSize: 15, fontWeight: '500', color: '#FFFFFF', marginBottom: 3 },
  exerciseMeta:       { fontSize: 12, color: '#636366' },

  separator:   { height: 0.5, backgroundColor: '#1C1C1E', marginLeft: 80 },
  emptyState:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 80 },
  emptyText:   { fontSize: 15, color: '#3A3A3C' },
});