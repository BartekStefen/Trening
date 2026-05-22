import { useState, useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Siedzący',         desc: 'Biuro, brak ćwiczeń',          factor: 1.2  },
  { id: 'light',      label: 'Lekki',             desc: '1–3 treningi / tydzień',       factor: 1.375 },
  { id: 'moderate',   label: 'Umiarkowany',       desc: '3–5 treningów / tydzień',      factor: 1.55 },
  { id: 'active',     label: 'Aktywny',           desc: '6–7 treningów / tydzień',      factor: 1.725 },
  { id: 'veryactive', label: 'Bardzo aktywny',    desc: 'Ciężka praca fizyczna + trening', factor: 1.9 },
];

const GOALS = [
  { id: 'cut',      label: 'Redukcja',    delta: -500, color: '#FF5252', desc: '~0.5 kg / tydzień' },
  { id: 'mild_cut', label: 'Lekka reduk.', delta: -250, color: '#EF9F27', desc: '~0.25 kg / tydzień' },
  { id: 'maintain', label: 'Utrzymanie',  delta: 0,    color: '#00E676', desc: 'Waga bez zmian' },
  { id: 'mild_bulk', label: 'Lekka masa', delta: 250,  color: '#378ADD', desc: '~0.25 kg / tydzień' },
  { id: 'bulk',     label: 'Masa',        delta: 500,  color: '#A78BFA', desc: '~0.5 kg / tydzień' },
];

// Mifflin-St Jeor — najdokładniejszy wzór dla ogólnej populacji
const calcBMR = ({ weight, height, age, sex }) => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
};

const NumPad = ({ value, onInc, onDec, unit, label }) => (
  <View style={s.numPad}>
    <Text style={s.numLabel}>{label}</Text>
    <View style={s.numRow}>
      <TouchableOpacity style={s.numBtn} onPress={onDec} activeOpacity={0.7}>
        <Ionicons name="remove" size={20} color="#8E8E93" />
      </TouchableOpacity>
      <View style={s.numDisplay}>
        <Text style={s.numValue}>{value}</Text>
        <Text style={s.numUnit}>{unit}</Text>
      </View>
      <TouchableOpacity style={s.numBtn} onPress={onInc} activeOpacity={0.7}>
        <Ionicons name="add" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  </View>
);

const TDEECalculator = ({ isVisible, onClose }) => {
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(178);
  const [age, setAge]       = useState(25);
  const [sex, setSex]       = useState('male');
  const [activity, setActivity] = useState('moderate');
  const [goal, setGoal]     = useState('maintain');

  const results = useMemo(() => {
    const bmr  = calcBMR({ weight, height, age, sex });
    const act  = ACTIVITY_LEVELS.find((a) => a.id === activity);
    const tdee = Math.round(bmr * (act?.factor ?? 1.55));
    return GOALS.map((g) => ({ ...g, kcal: tdee + g.delta }));
  }, [weight, height, age, sex, activity]);

  const selected = results.find((r) => r.id === goal);

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
        <Text style={s.title}>Kalkulator TDEE</Text>
        <Text style={s.subtitle}>Całkowite dzienne zapotrzebowanie kaloryczne</Text>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Płeć */}
          <Text style={s.label}>Płeć</Text>
          <View style={s.sexRow}>
            {[{ id: 'male', label: '♂ Mężczyzna' }, { id: 'female', label: '♀ Kobieta' }].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[s.sexBtn, sex === opt.id && s.sexBtnActive]}
                onPress={() => setSex(opt.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.sexBtnText, sex === opt.id && s.sexBtnTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Parametry */}
          <View style={s.paramsGrid}>
            <NumPad label="Waga" value={weight} unit="kg"
              onInc={() => setWeight((v) => Math.min(200, v + 1))}
              onDec={() => setWeight((v) => Math.max(30, v - 1))} />
            <NumPad label="Wzrost" value={height} unit="cm"
              onInc={() => setHeight((v) => Math.min(230, v + 1))}
              onDec={() => setHeight((v) => Math.max(130, v - 1))} />
            <NumPad label="Wiek" value={age} unit="lat"
              onInc={() => setAge((v) => Math.min(80, v + 1))}
              onDec={() => setAge((v) => Math.max(10, v - 1))} />
          </View>

          {/* Aktywność */}
          <Text style={s.label}>Poziom aktywności</Text>
          {ACTIVITY_LEVELS.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[s.actRow, activity === a.id && s.actRowActive]}
              onPress={() => setActivity(a.id)}
              activeOpacity={0.7}
            >
              <View style={[s.actDot, activity === a.id && s.actDotActive]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.actLabel, activity === a.id && { color: '#FFFFFF' }]}>{a.label}</Text>
                <Text style={s.actDesc}>{a.desc}</Text>
              </View>
              <Text style={[s.actFactor, activity === a.id && { color: '#00E676' }]}>×{a.factor}</Text>
            </TouchableOpacity>
          ))}

          {/* Cel */}
          <Text style={s.label}>Cel</Text>
          <View style={s.goalsGrid}>
            {results.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.goalChip, goal === r.id && { borderColor: r.color, backgroundColor: `${r.color}18` }]}
                onPress={() => setGoal(r.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.goalChipLabel, goal === r.id && { color: r.color }]}>{r.label}</Text>
                <Text style={[s.goalChipKcal, goal === r.id && { color: r.color }]}>{r.kcal} kcal</Text>
                <Text style={s.goalChipDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Wynik */}
          {selected && (
            <View style={[s.resultCard, { borderColor: `${selected.color}55` }]}>
              <Text style={s.resultLabel}>Twój cel kaloryczny</Text>
              <Text style={[s.resultKcal, { color: selected.color }]}>{selected.kcal}</Text>
              <Text style={s.resultUnit}>kcal / dzień</Text>
              <Text style={s.resultDesc}>{selected.desc}</Text>
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#0A0A0A' },
  handle:   { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 20 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 48 },
  label:    { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 10, marginTop: 20, letterSpacing: 0.3 },

  sexRow:        { flexDirection: 'row', gap: 10 },
  sexBtn:        { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  sexBtnActive:  { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: '#00E676' },
  sexBtnText:    { fontSize: 15, color: '#636366', fontWeight: '500' },
  sexBtnTextActive: { color: '#00E676', fontWeight: '700' },

  paramsGrid: { flexDirection: 'row', gap: 10 },
  numPad:     { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  numLabel:   { fontSize: 11, color: '#8E8E93', marginBottom: 8 },
  numRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  numBtn:     { width: 28, height: 28, borderRadius: 8, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  numDisplay: { alignItems: 'center', minWidth: 44 },
  numValue:   { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  numUnit:    { fontSize: 10, color: '#636366' },

  actRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 0.5, borderColor: '#2C2C2E' },
  actRowActive: { borderColor: 'rgba(0,230,118,0.4)', backgroundColor: 'rgba(0,230,118,0.05)' },
  actDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2C2C2E', borderWidth: 1.5, borderColor: '#3A3A3C' },
  actDotActive: { backgroundColor: '#00E676', borderColor: '#00E676' },
  actLabel:     { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 2 },
  actDesc:      { fontSize: 11, color: '#636366' },
  actFactor:    { fontSize: 13, fontWeight: '700', color: '#636366' },

  goalsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalChip:        { width: '30%', flexGrow: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: '#2C2C2E', alignItems: 'center', gap: 3 },
  goalChipLabel:   { fontSize: 12, fontWeight: '700', color: '#636366' },
  goalChipKcal:    { fontSize: 16, fontWeight: '800', color: '#8E8E93' },
  goalChipDesc:    { fontSize: 9, color: '#636366', textAlign: 'center' },

  resultCard:  { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, gap: 4 },
  resultLabel: { fontSize: 12, color: '#8E8E93', letterSpacing: 0.5 },
  resultKcal:  { fontSize: 56, fontWeight: '800', lineHeight: 64 },
  resultUnit:  { fontSize: 14, color: '#8E8E93' },
  resultDesc:  { fontSize: 12, color: '#636366', marginTop: 4 },
});

export default TDEECalculator;