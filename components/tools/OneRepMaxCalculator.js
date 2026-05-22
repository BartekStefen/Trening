import { useMemo, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Wzory obliczania 1RM — każdy daje nieco inny wynik,
// zestawienie daje użytkownikowi pełen obraz
const FORMULAS = [
  {
    id: 'epley',
    name: 'Epley',
    desc: 'Najpopularniejszy, dobry dla 1–10 powt.',
    calc: (w, r) => r === 1 ? w : w * (1 + r / 30),
  },
  {
    id: 'brzycki',
    name: 'Brzycki',
    desc: 'Precyzyjny dla niskich powtórzeń (1–6)',
    calc: (w, r) => r === 1 ? w : w * (36 / (37 - r)),
  },
  {
    id: 'lander',
    name: 'Lander',
    desc: 'Konserwatywny, zalecany dla zaawansowanych',
    calc: (w, r) => r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r),
  },
  {
    id: 'lombardi',
    name: 'Lombardi',
    desc: 'Sprawdza się dobrze przy wysokich powt.',
    calc: (w, r) => w * Math.pow(r, 0.10),
  },
  {
    id: 'mayhew',
    name: 'Mayhew',
    desc: 'Przeznaczony dla sportowców wytrenowanych',
    calc: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  },
];

// Procenty 1RM — standardowa tabela Prilepin / NSCA
const PERCENT_TABLE = [100, 95, 90, 85, 80, 75, 70, 65, 60];

const fmt = (n) => (Math.round(n * 2) / 2).toFixed(1).replace('.', ',');

const OneRepMaxCalculator = ({ isVisible, onClose }) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps]     = useState('');
  const [activeFormula, setActiveFormula] = useState('epley');

  const kg = parseFloat(weight.replace(',', '.'));
  const r  = parseInt(reps);
  const valid = !isNaN(kg) && kg > 0 && !isNaN(r) && r >= 1 && r <= 30;

  const results = useMemo(() => {
    if (!valid) return null;
    return FORMULAS.map((f) => ({
      ...f,
      oneRM: f.calc(kg, r),
    }));
  }, [kg, r, valid]);

  const primary = results?.find((f) => f.id === activeFormula);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={s.title}>Kalkulator 1RM</Text>
        <Text style={s.subtitle}>Maksymalny ciężar na jedno powtórzenie</Text>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pola wejściowe */}
          <View style={s.inputRow}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Ciężar (kg)</Text>
              <TextInput
                style={s.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="np. 100"
                placeholderTextColor="#3A3A3C"
                maxLength={6}
              />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Powtórzenia</Text>
              <TextInput
                style={s.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="np. 5"
                placeholderTextColor="#3A3A3C"
                maxLength={2}
              />
            </View>
          </View>

          {!valid && (
            <View style={s.placeholderBox}>
              <Text style={s.placeholderIcon}>🏋️</Text>
              <Text style={s.placeholderText}>
                Wpisz ciężar i liczbę powtórzeń,{'\n'}aby zobaczyć szacowany 1RM
              </Text>
            </View>
          )}

          {valid && primary && (
            <>
              {/* Hero — aktywna formuła */}
              <View style={s.heroCard}>
                <Text style={s.heroLabel}>Szacowany 1RM</Text>
                <Text style={s.heroValue}>{fmt(primary.oneRM)} kg</Text>
                <Text style={s.heroFormula}>{primary.name} · {primary.desc}</Text>
              </View>

              {/* Wybór formuły */}
              <Text style={s.sectionLabel}>Formuła obliczeniowa</Text>
              <View style={s.formulaRow}>
                {FORMULAS.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[s.formulaChip, activeFormula === f.id && s.formulaChipActive]}
                    onPress={() => setActiveFormula(f.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.formulaChipText, activeFormula === f.id && s.formulaChipTextActive]}>
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Zestawienie wszystkich formuł */}
              <Text style={s.sectionLabel}>Porównanie formuł</Text>
              {results.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[s.formulaRow2, activeFormula === f.id && s.formulaRow2Active]}
                  onPress={() => setActiveFormula(f.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.formulaName, activeFormula === f.id && { color: '#00E676' }]}>
                      {f.name}
                    </Text>
                    <Text style={s.formulaDesc}>{f.desc}</Text>
                  </View>
                  <Text style={[s.formulaResult, activeFormula === f.id && { color: '#00E676' }]}>
                    {fmt(f.oneRM)} kg
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Tabela procentowa */}
              <Text style={s.sectionLabel}>Tabela obciążeń ({primary.name})</Text>
              <View style={s.percentCard}>
                {PERCENT_TABLE.map((pct) => {
                  const load = (primary.oneRM * pct) / 100;
                  return (
                    <View key={pct} style={s.percentRow}>
                      <Text style={s.percentLabel}>{pct}%</Text>
                      <View style={s.percentBarTrack}>
                        <View style={[s.percentBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={s.percentValue}>{fmt(load)} kg</Text>
                    </View>
                  );
                })}
              </View>
            </>
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

  inputRow:   { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
  },

  placeholderBox:  { alignItems: 'center', paddingVertical: 48, gap: 12 },
  placeholderIcon: { fontSize: 40 },
  placeholderText: { fontSize: 14, color: '#636366', textAlign: 'center', lineHeight: 22 },

  heroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(0,230,118,0.3)',
  },
  heroLabel:   { fontSize: 12, color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 },
  heroValue:   { fontSize: 52, fontWeight: '800', color: '#00E676', marginBottom: 6 },
  heroFormula: { fontSize: 12, color: '#636366', textAlign: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#636366', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },

  formulaRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  formulaChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  formulaChipActive:   { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  formulaChipText:     { fontSize: 13, color: '#636366', fontWeight: '500' },
  formulaChipTextActive:{ color: '#00E676', fontWeight: '600' },

  formulaRow2: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: '#2C2C2E',
  },
  formulaRow2Active: { borderColor: 'rgba(0,230,118,0.35)' },
  formulaName:   { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 3 },
  formulaDesc:   { fontSize: 11, color: '#636366' },
  formulaResult: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  percentCard: {
    backgroundColor: '#1C1C1E', borderRadius: 18,
    padding: 16, borderWidth: 0.5, borderColor: '#2C2C2E',
    gap: 10, marginBottom: 8,
  },
  percentRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  percentLabel:    { fontSize: 12, color: '#8E8E93', width: 36, fontWeight: '600' },
  percentBarTrack: { flex: 1, height: 5, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
  percentBarFill:  { height: '100%', backgroundColor: '#00E676', borderRadius: 3 },
  percentValue:    { fontSize: 13, fontWeight: '600', color: '#FFFFFF', width: 70, textAlign: 'right' },
});

export default OneRepMaxCalculator;