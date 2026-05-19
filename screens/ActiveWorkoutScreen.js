import { Accelerometer } from 'expo-sensors';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Stałe ────────────────────────────────────────────────────────────────────

const WORKOUT_NAME = 'Dzień 1: Upper Power';

const INITIAL_EXERCISES = [
  {
    id: 'ex1',
    name: 'Wyciskanie sztangi leżąc',
    muscleGroup: 'Klatka · Triceps · Barki',
    description: 'Połóż się na ławce, chwyć sztangę nieco szerzej niż ramiona. Opuść kontrolowanie do klatki, wypychaj eksplozywnie. Łopatki ściągnięte przez cały ruch.',
    muscles: ['Klatka piersiowa', 'Triceps', 'Przedni bark'],
    restDuration: 120,
    sets: [
      { id: 's1', prevLog: '80×8',  suggested: '82.5×8-10',  kg: '80', reps: '8',  rpe: '8', done: false },
      { id: 's2', prevLog: '80×8',  suggested: '82.5×8-10',  kg: '',   reps: '',   rpe: '',  done: false },
      { id: 's3', prevLog: '80×6',  suggested: '82.5×6-8',   kg: '',   reps: '',   rpe: '',  done: false },
    ],
  },
  {
    id: 'ex2',
    name: 'Wiosłowanie sztangą',
    muscleGroup: 'Plecy · Biceps',
    description: 'Tułów pochylony ~45°. Przyciągaj sztangę do brzucha, łokcie blisko ciała. Kontroluj ekscentrykę.',
    muscles: ['Najszerszy grzbietu', 'Biceps', 'Tylny bark'],
    restDuration: 90,
    sets: [
      { id: 's4', prevLog: '90×8',  suggested: '92.5×8-10',  kg: '', reps: '', rpe: '', done: false },
      { id: 's5', prevLog: '90×8',  suggested: '92.5×8-10',  kg: '', reps: '', rpe: '', done: false },
    ],
  },
  {
    id: 'ex3',
    name: 'Wyciskanie żołnierskie',
    muscleGroup: 'Barki · Triceps',
    description: 'Sztanga na obojczykach, uchwyt na szerokość barków. Wypychaj pionowo, głowa cofa się w tył.',
    muscles: ['Przedni bark', 'Boczny bark', 'Triceps'],
    restDuration: 90,
    sets: [
      { id: 's6', prevLog: '60×8',  suggested: '62.5×8-12',  kg: '', reps: '', rpe: '', done: false },
      { id: 's7', prevLog: '60×8',  suggested: '62.5×8-12',  kg: '', reps: '', rpe: '', done: false },
    ],
  },
  {
    id: 'ex4',
    name: 'Uginanie przedramion ze sztangą',
    muscleGroup: 'Biceps',
    description: 'Stój wyprostowany, ramiona przy tułowiu. Uginaj w łokciach do pełnego skurczu. Kontroluj opuszczanie.',
    muscles: ['Biceps', 'Ramienno-promieniowy'],
    restDuration: 60,
    sets: [
      { id: 's8',  prevLog: '40×10', suggested: '42.5×10-12', kg: '', reps: '', rpe: '', done: false },
      { id: 's9',  prevLog: '40×10', suggested: '42.5×10-12', kg: '', reps: '', rpe: '', done: false },
      { id: 's10', prevLog: '40×8',  suggested: '42.5×8-10',  kg: '', reps: '', rpe: '', done: false },
    ],
  },
  {
    id: 'ex5',
    name: 'Triceps na wyciągu',
    muscleGroup: 'Triceps',
    description: 'Stój przy wyciągu górnym, łokcie przy tułowiu. Prostuj ramiona w pełnym zakresie ruchu.',
    muscles: ['Triceps'],
    restDuration: 60,
    sets: [
      { id: 's11', prevLog: '35×12', suggested: '37.5×12-15', kg: '', reps: '', rpe: '', done: false },
      { id: 's12', prevLog: '35×12', suggested: '37.5×12-15', kg: '', reps: '', rpe: '', done: false },
    ],
  },
];

// ─── Komponent: strzałka progresu ─────────────────────────────────────────────
const ProgressArrow = ({ value, suggested }) => {
  // Porównujemy tylko pierwszą liczbę z widełek (np. "82.5" z "82.5×8-10")
  const num = parseFloat(value);
  const sug = parseFloat((suggested ?? '').split('×')[0]);
  if (!value || isNaN(num) || isNaN(sug)) return <View style={{ width: 14 }} />;
  if (num > sug) return <Ionicons name="arrow-up"   size={11} color="#00E676" />;
  if (num < sug) return <Ionicons name="arrow-down" size={11} color="#FF453A" />;
  return <Ionicons name="remove" size={11} color="#636366" />;
};

// ─── Komponent: wiersz serii ───────────────────────────────────────────────────
// Duże pola TextInput (minHeight: 48) zapewniają trafienie spoconym palcem na siłowni.
// Pole "reps" przyjmuje dowolny string – umożliwia widełki "8-12" zamiast tylko cyfry
const SetRow = ({ setData, index, onUpdate, onToggle }) => {
  const { prevLog, suggested, kg, reps, rpe, done } = setData;
  const sugKg = (suggested ?? '').split('×')[0];

  return (
    <View style={rowStyles.row}>
      {/* Numer serii */}
      <View style={rowStyles.setNumWrapper}>
        <Text style={rowStyles.setNum}>{index + 1}</Text>
      </View>

      {/* Poprzednio i Sugerowane – tylko do odczytu */}
      <View style={rowStyles.prevGroup}>
        <Text style={rowStyles.prevVal} numberOfLines={1}>{prevLog}</Text>
        <Text style={rowStyles.suggVal} numberOfLines={1}>{suggested}</Text>
      </View>

      {/* RPE */}
      <TextInput
        style={[rowStyles.input, done && rowStyles.inputDone]}
        value={rpe}
        onChangeText={(v) => onUpdate('rpe', v)}
        keyboardType="numeric"
        maxLength={2}
        placeholder="—"
        placeholderTextColor="#3A3A3C"
        editable={!done}
        selectTextOnFocus
      />

      {/* kg + strzałka progresu */}
      <View style={rowStyles.inputWrap}>
        <TextInput
          style={[rowStyles.input, done && rowStyles.inputDone]}
          value={kg}
          onChangeText={(v) => onUpdate('kg', v)}
          keyboardType="decimal-pad"
          maxLength={6}
          placeholder="kg"
          placeholderTextColor="#3A3A3C"
          editable={!done}
          selectTextOnFocus
        />
        <View style={rowStyles.arrow}>
          <ProgressArrow value={kg} suggested={sugKg} />
        </View>
      </View>

      {/* Powtórzenia – keyboardType="default" pozwala wpisać "8-12" z myślnikiem */}
      <TextInput
        style={[rowStyles.input, rowStyles.inputReps, done && rowStyles.inputDone]}
        value={reps}
        onChangeText={(v) => onUpdate('reps', v)}
        keyboardType="default"
        maxLength={6}
        placeholder="—"
        placeholderTextColor="#3A3A3C"
        editable={!done}
        selectTextOnFocus
      />

      {/* Checkbox zaliczenia */}
      <TouchableOpacity
        style={[rowStyles.checkbox, done && rowStyles.checkboxDone]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {done && <Ionicons name="checkmark" size={18} color="#000" />}
      </TouchableOpacity>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  setNumWrapper: {
    width: 24,
    alignItems: 'center',
  },
  setNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#636366',
  },
  prevGroup: {
    flex: 1,
    minWidth: 0,
  },
  prevVal: {
    fontSize: 11,
    color: '#636366',
    marginBottom: 2,
  },
  suggVal: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // minHeight: 48 – minimalna zalecana wysokość elementu dotykalnego (Apple HIG / Material)
  input: {
    width: 52,
    minHeight: 48,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 4,
  },
  // Pole powt. nieco szersze – mieści widełki "10-15"
  inputReps: {
    width: 62,
  },
  inputDone: {
    color: '#3A3A3C',
    borderColor: '#1C1C1E',
  },
  inputWrap: {
    position: 'relative',
    width: 52,
  },
  arrow: {
    position: 'absolute',
    top: -7,
    right: -3,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  checkbox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
});

// ─── Modal: edycja czasu przerwy ───────────────────────────────────────────────
// Wyświetla dostępne presety – użytkownik ustawia czas przed zaliczeniem serii,
// nie po. Dzięki temu stoper odlicza dokładnie tyle, ile zaplanował
const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240];

const RestEditModal = ({ visible, currentRest, onSelect, onClose }) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View style={restModalStyles.screen}>
      <View style={restModalStyles.handle} />
      <Text style={restModalStyles.title}>Czas przerwy</Text>
      <Text style={restModalStyles.sub}>Wybierz czas obowiązujący dla tego ćwiczenia</Text>

      <ScrollView contentContainerStyle={restModalStyles.grid}>
        {REST_PRESETS.map((sec) => {
          const active = sec === currentRest;
          const label  = sec >= 60
            ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min`
            : `${sec}s`;
          return (
            <TouchableOpacity
              key={sec}
              style={[restModalStyles.preset, active && restModalStyles.presetActive]}
              onPress={() => { onSelect(sec); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[restModalStyles.presetText, active && restModalStyles.presetTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={restModalStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
        <Text style={restModalStyles.cancelText}>Anuluj</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const restModalStyles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#111111' },
  handle:          { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:           { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 24, marginBottom: 6 },
  sub:             { fontSize: 14, color: '#8E8E93', paddingHorizontal: 24, marginBottom: 24 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  preset: {
    width: '45%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  presetActive:     { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  presetText:       { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  presetTextActive: { color: '#00E676' },
  cancelBtn:        { margin: 20, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  cancelText:       { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
});

// ─── Modal: opis techniki ćwiczenia ───────────────────────────────────────────
const ExerciseInfoModal = ({ visible, exercise, onClose }) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View style={infoStyles.screen}>
      <View style={infoStyles.handle} />
      <TouchableOpacity style={infoStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={20} color="#8E8E93" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={infoStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={infoStyles.title}>{exercise?.name}</Text>
        <Text style={infoStyles.subtitle}>{exercise?.muscleGroup}</Text>
        <View style={infoStyles.imagePlaceholder}>
          <Ionicons name="body-outline" size={52} color="#3A3A3C" />
          <Text style={infoStyles.imageText}>Animacja techniki</Text>
        </View>
        <Text style={infoStyles.sectionLabel}>Opis techniki</Text>
        <Text style={infoStyles.description}>{exercise?.description}</Text>
        <Text style={infoStyles.sectionLabel}>Zaangażowane mięśnie</Text>
        {exercise?.muscles?.map((m, i) => (
          <View key={i} style={infoStyles.muscleRow}>
            <View style={infoStyles.muscleDot} />
            <Text style={infoStyles.muscleText}>{m}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  </Modal>
);

const infoStyles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#111111' },
  handle:           { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn:         { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  content:          { padding: 24, paddingTop: 16 },
  title:            { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle:         { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  imagePlaceholder: { height: 160, backgroundColor: '#1C1C1E', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 10, borderWidth: 0.5, borderColor: '#2C2C2E' },
  imageText:        { fontSize: 13, color: '#3A3A3C' },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: '#636366', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  description:      { fontSize: 15, color: '#EBEBEB', lineHeight: 23, marginBottom: 24 },
  muscleRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  muscleDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676' },
  muscleText:       { fontSize: 15, color: '#FFFFFF' },
});

// ─── Funkcje pomocnicze podsumowania ──────────────────────────────────────────

const KG_PER_CAR = 1500;

const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const detectPRs = (exercises) =>
  exercises.reduce((acc, ex) => {
    const prs = ex.sets.filter((s) => {
      if (!s.done || !s.kg) return false;
      return parseFloat(s.kg) > parseFloat(s.prevLog.split('×')[0]);
    });
    if (prs.length > 0) {
      const best = prs.reduce((b, s) => parseFloat(s.kg) > parseFloat(b.kg) ? s : b);
      acc.push({ name: ex.name, kg: best.kg, reps: best.reps });
    }
    return acc;
  }, []);

// ─── Modal: Podsumowanie treningu ─────────────────────────────────────────────
function WorkoutSummaryModal({ visible, onClose, totalSec, totalTonnage, exercises, onSave }) {
  const cars     = Math.floor(totalTonnage / KG_PER_CAR);
  const prs      = detectPRs(exercises);
  const doneSets = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={sumStyles.screen}>
        <View style={sumStyles.handle} />
        <ScrollView contentContainerStyle={sumStyles.scroll} showsVerticalScrollIndicator={false}>

          <View style={sumStyles.hero}>
            <Text style={sumStyles.heroLabel}>TRENING UKOŃCZONY</Text>
            <Text style={sumStyles.heroTitle}>Brawo! 💪</Text>
          </View>

          <View style={sumStyles.grid}>
            <View style={sumStyles.card}>
              <Ionicons name="time-outline" size={22} color="#00E676" style={{ marginBottom: 8 }} />
              <Text style={sumStyles.cardLabel}>Czas treningu</Text>
              <Text style={sumStyles.cardValue}>{formatDuration(totalSec)}</Text>
            </View>
            <View style={sumStyles.card}>
              <Ionicons name="layers-outline" size={22} color="#378ADD" style={{ marginBottom: 8 }} />
              <Text style={sumStyles.cardLabel}>Serie łącznie</Text>
              <Text style={sumStyles.cardValue}>{doneSets}</Text>
            </View>
            <View style={[sumStyles.card, sumStyles.cardWide]}>
              <View style={sumStyles.cardRow}>
                <View>
                  <Text style={sumStyles.cardLabel}>Tonaż całkowity</Text>
                  <Text style={[sumStyles.cardValue, { fontSize: 30 }]}>
                    {totalTonnage.toLocaleString('pl-PL')} kg
                  </Text>
                  {cars > 0 && (
                    <Text style={sumStyles.cardSub}>
                      Przerzuciłeś równowartość {cars} {cars === 1 ? 'samochodu' : 'samochodów'}!
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  {Array.from({ length: Math.min(cars, 3) }).map((_, i) => (
                    <Ionicons key={i} name="car-sport-outline" size={24} color="#EF9F27" />
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={sumStyles.heatmap}>
            <Ionicons name="body-outline" size={40} color="#3A3A3C" />
            <Text style={sumStyles.heatmapTitle}>Heatmapa mięśni</Text>
            <Text style={sumStyles.heatmapSub}>Tu pojawi się mapa przetrenowanych partii ciała</Text>
          </View>

          {prs.length > 0 && (
            <>
              <Text style={sumStyles.sectionTitle}>Nowe rekordy 🏆</Text>
              {prs.map((pr, i) => (
                <View key={i} style={sumStyles.prCard}>
                  <View style={sumStyles.prTrophy}>
                    <Ionicons name="trophy" size={17} color="#FAC775" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sumStyles.prName}>{pr.name}</Text>
                    <Text style={sumStyles.prVal}>{pr.kg} kg × {pr.reps} powt.</Text>
                  </View>
                  <View style={sumStyles.prBadge}>
                    <Text style={sumStyles.prBadgeText}>Nowy PR!</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {prs.length === 0 && (
            <View style={sumStyles.noPr}>
              <Text style={sumStyles.noPrText}>Brak nowych rekordów – konsekwencja to klucz. 💪</Text>
            </View>
          )}
        </ScrollView>

        <View style={sumStyles.footer}>
          <TouchableOpacity style={sumStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <Text style={sumStyles.saveBtnText}>Zapisz do historii</Text>
            <Text style={sumStyles.saveBtnSub}>Trening trafi do Twojego profilu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sumStyles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#0A0A0A' },
  handle:       { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  scroll:       { paddingBottom: 20 },
  hero:         { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  heroLabel:    { fontSize: 12, fontWeight: '700', color: '#00E676', letterSpacing: 2, marginBottom: 6 },
  heroTitle:    { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  card: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#1C1C1E',
    borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: '#2C2C2E',
  },
  cardWide:     { flexBasis: '100%', flex: 0 },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel:    { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  cardValue:    { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  cardSub:      { fontSize: 12, color: '#636366', marginTop: 6, lineHeight: 17 },
  heatmap: {
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 18, height: 140,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center', alignItems: 'center',
    gap: 8, borderWidth: 1, borderColor: '#2C2C2E', borderStyle: 'dashed',
  },
  heatmapTitle: { fontSize: 14, fontWeight: '500', color: '#3A3A3C' },
  heatmapSub:   { fontSize: 12, color: '#3A3A3C', textAlign: 'center', paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 12 },
  prCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 0.5, borderColor: '#2C2C2E',
  },
  prTrophy:     { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,179,71,0.15)', justifyContent: 'center', alignItems: 'center' },
  prName:       { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  prVal:        { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  prBadge:      { backgroundColor: 'rgba(255,179,71,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  prBadgeText:  { fontSize: 11, fontWeight: '700', color: '#FAC775' },
  noPr:         { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#2C2C2E' },
  noPrText:     { fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 20 },
  footer:       { padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderColor: '#2C2C2E' },
  saveBtn:      { backgroundColor: '#00E676', borderRadius: 18, padding: 18, alignItems: 'center' },
  saveBtnText:  { fontSize: 17, fontWeight: '700', color: '#000000' },
  saveBtnSub:   { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 4 },
});

// ─── Komponent: karta pojedynczego ćwiczenia ──────────────────────────────────
// Wydzielona poza główny komponent – unika re-renderu wszystkich kart
// przy każdym ticku stopera głównego (co sekundę)
const ExerciseCard = ({
  exercise,
  exIndex,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onRestChange,
  onInfoPress,
}) => {
  const [restModalVisible, setRestModalVisible] = useState(false);

  const formatRest = (sec) => {
    if (sec >= 60) return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min`;
    return `${sec}s`;
  };

  return (
    <View style={cardStyles.card}>
      {/* Nagłówek karty */}
      <View style={cardStyles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={cardStyles.name}>{exercise.name}</Text>
          <Text style={cardStyles.muscles}>{exercise.muscleGroup}</Text>
        </View>
        <TouchableOpacity style={cardStyles.infoBtn} onPress={onInfoPress} activeOpacity={0.7}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Klikalny element czasu przerwy – otwiera modal wyboru przed zaliczeniem serii */}
      <TouchableOpacity
        style={cardStyles.restChip}
        onPress={() => setRestModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="timer-outline" size={14} color="#8E8E93" />
        <Text style={cardStyles.restChipText}>
          Przerwa: {formatRest(exercise.restDuration)}
        </Text>
        <Ionicons name="chevron-down" size={13} color="#3A3A3C" />
      </TouchableOpacity>

      {/* Nagłówki kolumn */}
      <View style={cardStyles.colHeaders}>
        <View style={{ width: 24 }} />
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.colH}>Poprzednio / Suger.</Text>
        </View>
        <Text style={[cardStyles.colH, { width: 52, textAlign: 'center' }]}>RPE</Text>
        <Text style={[cardStyles.colH, { width: 52, textAlign: 'center' }]}>kg</Text>
        <Text style={[cardStyles.colH, { width: 62, textAlign: 'center' }]}>Powt.</Text>
        <Text style={[cardStyles.colH, { width: 48, textAlign: 'center' }]}>✓</Text>
      </View>

      {exercise.sets.map((set, idx) => (
        <SetRow
          key={set.id}
          setData={set}
          index={idx}
          onUpdate={(field, value) => onUpdateSet(exIndex, set.id, field, value)}
          onToggle={() => onToggleSet(exIndex, set.id)}
        />
      ))}

      <View style={cardStyles.divider} />

      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.actionBtnAdd]}
          onPress={() => onAddSet(exIndex)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={15} color="#00E676" />
          <Text style={cardStyles.actionBtnAddText}>Dodaj serię</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.actionBtnSwap]}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={15} color="#8E8E93" />
          <Text style={cardStyles.actionBtnSwapText}>Zamień</Text>
        </TouchableOpacity>
      </View>

      {/* Modal edycji czasu przerwy dla tego konkretnego ćwiczenia */}
      <RestEditModal
        visible={restModalVisible}
        currentRest={exercise.restDuration}
        onSelect={(sec) => onRestChange(exIndex, sec)}
        onClose={() => setRestModalVisible(false)}
      />
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  header:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  name:    { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  muscles: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  infoBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },

  // Chip przerwy – klikalny element z ikoną stopera. Umieszczony przed seriami,
  // żeby użytkownik ustawił czas zanim zacznie zaliczać serie
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  restChipText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },

  colHeaders: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  colH:       { fontSize: 10, color: '#636366', fontWeight: '500', letterSpacing: 0.3 },

  divider: { height: 0.5, backgroundColor: '#2C2C2E', marginVertical: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 11, borderWidth: 1,
  },
  actionBtnAdd:      { backgroundColor: 'rgba(0,230,118,0.08)', borderColor: 'rgba(0,230,118,0.2)' },
  actionBtnAddText:  { fontSize: 13, fontWeight: '500', color: '#00E676' },
  actionBtnSwap:     { backgroundColor: '#0A0A0A', borderColor: '#2C2C2E' },
  actionBtnSwapText: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
});

// ─── Główny komponent ekranu ───────────────────────────────────────────────────
export default function ActiveWorkoutScreen({ navigation }) {
  const [exercises, setExercises]           = useState(INITIAL_EXERCISES);
  const [timerSec, setTimerSec]             = useState(0);
  const [paused, setPaused]                 = useState(false);
  const [restActive, setRestActive]         = useState(false);
  const [restSec, setRestSec]               = useState(120);
  const [restTotalSec, setRestTotalSec]     = useState(120);
  const [restLabel, setRestLabel]           = useState('');
  const [infoVisible, setInfoVisible]       = useState(false);
  const [infoExercise, setInfoExercise]     = useState(null);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const restIntervalRef = useRef(null);
  const restAnim        = useRef(new Animated.Value(200)).current;

  // Główny stoper treningu
  useEffect(() => {
    const id = setInterval(() => {
      if (!paused) setTimerSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // Akcelerometr: gwałtowne potrząśnięcie (oś Z > 1.8g) = Shake-to-Confirm
  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (Math.abs(z) > 1.8) confirmFirstPendingSet();
    });
    return () => sub.remove();
  }, [exercises]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const showRestBanner = useCallback((label, duration) => {
    setRestLabel(label);
    setRestSec(duration);
    setRestTotalSec(duration);
    setRestActive(true);
    Animated.spring(restAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    clearInterval(restIntervalRef.current);
    restIntervalRef.current = setInterval(() => {
      setRestSec((prev) => {
        if (prev <= 1) { clearInterval(restIntervalRef.current); hideRestBanner(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const hideRestBanner = useCallback(() => {
    clearInterval(restIntervalRef.current);
    Animated.timing(restAnim, { toValue: 200, duration: 220, useNativeDriver: true })
      .start(() => setRestActive(false));
  }, []);

  // Zalicza pierwszą niezaliczoną serię w całym treningu (dla Shake-to-Confirm)
  const confirmFirstPendingSet = useCallback(() => {
    setExercises((prev) => {
      let found = false;
      return prev.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => {
          if (!s.done && !found) {
            found = true;
            showRestBanner(`${ex.name} – seria`, ex.restDuration);
            return { ...s, done: true };
          }
          return s;
        }),
      }));
    });
  }, [showRestBanner]);

  const handleUpdateSet = useCallback((exIdx, setId, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx ? ex
          : { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) }
      )
    );
  }, []);

  const handleToggleSet = useCallback((exIdx, setId) => {
    setExercises((prev) => {
      const ex = prev[exIdx];
      const set = ex.sets.find((s) => s.id === setId);
      if (set?.done) return prev; // zaliczonej serii nie cofamy
      showRestBanner(
        `${ex.name} – seria ${ex.sets.findIndex((s) => s.id === setId) + 1}`,
        ex.restDuration
      );
      return prev.map((e, i) =>
        i !== exIdx ? e
          : { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, done: true } : s) }
      );
    });
  }, [showRestBanner]);

  const handleAddSet = useCallback((exIdx) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            id: Date.now().toString(),
            prevLog:   last?.prevLog   ?? '—',
            suggested: last?.suggested ?? '—',
            kg:        last?.kg        ?? '',
            reps:      last?.reps      ?? '',
            rpe:       '',
            done:      false,
          }],
        };
      })
    );
  }, []);

  // Zmiana czasu przerwy dla konkretnego ćwiczenia bez ruszania pozostałych
  const handleRestChange = useCallback((exIdx, sec) => {
    setExercises((prev) =>
      prev.map((ex, i) => i !== exIdx ? ex : { ...ex, restDuration: sec })
    );
  }, []);

  const totalTonnage = useMemo(() =>
    exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) =>
        set.done ? s + (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0) : s, 0
      ), 0
    ), [exercises]);

  // Segmentowy pasek: dla każdego ćwiczenia ułamek zaliczonych serii
  const segmentFill = (ex) => {
    const done = ex.sets.filter((s) => s.done).length;
    return ex.sets.length === 0 ? 0 : done / ex.sets.length;
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Segmentowy pasek postępu ── */}
      <View style={styles.segmentBar}>
        {exercises.map((ex) => {
          const fill = segmentFill(ex);
          return (
            <View key={ex.id} style={styles.segment}>
              {fill > 0 && <View style={[styles.segmentFill,  { flex: fill }]} />}
              {fill < 1 && <View style={[styles.segmentEmpty, { flex: 1 - fill }]} />}
            </View>
          );
        })}
      </View>

      {/* ── Górny pasek ── */}
      <View style={styles.topBar}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.workoutTitle} numberOfLines={1}>{WORKOUT_NAME}</Text>
          <Text style={styles.workoutSub}>{exercises.length} ćwiczeń</Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={() => setSummaryVisible(true)} activeOpacity={0.8}>
          <Text style={styles.endButtonText}>Zakończ</Text>
        </TouchableOpacity>
      </View>

      {/* ── Półprzezroczysty stoper ── */}
      <View style={styles.timerStrip}>
        <View>
          <Text style={styles.timerLabel}>Czas treningu</Text>
          <Text style={styles.timerValue}>{formatTime(timerSec)}</Text>
        </View>
        <View style={styles.timerControls}>
          <TouchableOpacity style={styles.timerBtn} onPress={() => setPaused((p) => !p)} activeOpacity={0.7}>
            <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timerBtn} onPress={() => setTimerSec(0)} activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Przewijalna lista wszystkich ćwiczeń – brak paginacji ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            exIndex={exIdx}
            onUpdateSet={handleUpdateSet}
            onToggleSet={handleToggleSet}
            onAddSet={handleAddSet}
            onRestChange={handleRestChange}
            onInfoPress={() => { setInfoExercise(ex); setInfoVisible(true); }}
          />
        ))}

        {/* Separator końca treningu */}
        <View style={styles.endOfWorkout}>
          <Ionicons name="flag-outline" size={24} color="#3A3A3C" />
          <Text style={styles.endOfWorkoutText}>Koniec planu treningowego</Text>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => setSummaryVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.finishBtnText}>Zakończ i podsumuj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Baner stopera przerwy ── */}
      {restActive && (
        <Animated.View style={[styles.restBanner, { transform: [{ translateY: restAnim }] }]}>
          <View style={styles.restTop}>
            <Text style={styles.restLabel} numberOfLines={1}>{restLabel}</Text>
            <View style={styles.restDonePill}>
              <Ionicons name="checkmark" size={12} color="#00E676" />
              <Text style={styles.restDoneText}>Zaliczona</Text>
            </View>
          </View>

          {/* Pasek postępu przerwy – zmniejsza się proporcjonalnie do pozostałego czasu */}
          <View style={styles.restTrack}>
            <View style={[styles.restFill, { width: `${(restSec / restTotalSec) * 100}%` }]} />
          </View>

          <Text style={styles.restTimerValue}>{formatTime(restSec)}</Text>

          <View style={styles.restBtns}>
            <TouchableOpacity style={styles.restBtn} onPress={() => setRestSec((s) => s + 15)} activeOpacity={0.7}>
              <Text style={styles.restBtnText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.restBtn, styles.restBtnSkip]} onPress={hideRestBanner} activeOpacity={0.7}>
              <Text style={[styles.restBtnText, { color: '#00E676' }]}>Pomiń</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restBtn} onPress={() => setRestSec(restTotalSec)} activeOpacity={0.7}>
              <Text style={[styles.restBtnText, { color: '#8E8E93' }]}>Resetuj</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Modals ── */}
      <ExerciseInfoModal
        visible={infoVisible}
        exercise={infoExercise}
        onClose={() => setInfoVisible(false)}
      />
      <WorkoutSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        totalSec={timerSec}
        totalTonnage={totalTonnage}
        exercises={exercises}
        onSave={() => { setSummaryVisible(false); navigation?.goBack(); }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Style głównego ekranu ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#000000' },
  scrollContent: { paddingBottom: 220 },

  segmentBar:   { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 54, paddingBottom: 10 },
  segment:      { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  segmentFill:  { backgroundColor: '#00E676' },
  segmentEmpty: { backgroundColor: '#2C2C2E' },

  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 10 },
  workoutTitle:  { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  workoutSub:    { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  endButton:     { backgroundColor: 'rgba(255,69,58,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  endButtonText: { fontSize: 14, fontWeight: '600', color: '#FF453A' },

  timerStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.85)',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 12,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
  },
  timerLabel:    { fontSize: 11, color: '#636366', marginBottom: 2 },
  timerValue:    { fontSize: 30, fontWeight: '700', color: '#00E676', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerControls: { flexDirection: 'row', gap: 8 },
  timerBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },

  endOfWorkout: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  endOfWorkoutText: { fontSize: 14, color: '#3A3A3C' },
  finishBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
    marginTop: 4,
  },
  finishBtnText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },

  restBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,10,10,0.97)',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20,
    borderTopWidth: 0.5, borderColor: '#2C2C2E',
  },
  restTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  restLabel:     { fontSize: 13, color: '#8E8E93', fontWeight: '500', flex: 1, marginRight: 10 },
  restDonePill:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  restDoneText:  { fontSize: 12, color: '#00E676', fontWeight: '600' },
  restTrack:     { height: 3, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  restFill:      { height: '100%', backgroundColor: '#00E676', borderRadius: 3 },
  restTimerValue:{ fontSize: 46, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: 16 },
  restBtns:      { flexDirection: 'row', gap: 8 },
  restBtn:       { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  restBtnSkip:   { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.25)' },
  restBtnText:   { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});