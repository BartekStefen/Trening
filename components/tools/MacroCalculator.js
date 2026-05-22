import { useState, useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRESETS = [
  {
    id: 'classic',
    label: 'Klasyczny',
    desc: 'Zbilansowany podział dla ogólnej populacji',
    protein: 0.30, fat: 0.30, carbs: 0.40,
  },
  {
    id: 'highprotein',
    label: 'High Protein',
    desc: 'Budowa mięśni, redukcja z zachowaniem masy',
    protein: 0.40, fat: 0.25, carbs: 0.35,
  },
  {
    id: 'lowcarb',
    label: 'Low Carb',
    desc: 'Redukcja, stabilny poziom insuliny',
    protein: 0.35, fat: 0.45, carbs: 0.20,
  },
  {
    id: 'keto',
    label: 'Keto',
    desc: 'Ketoza, minimalne węglowodany',
    protein: 0.25, fat: 0.70, carbs: 0.05,
  },
  {
    id: 'athletic',
    label: 'Sportowy',
    desc: 'Wysoka wydajność, dużo węgli na trening',
    protein: 0.30, fat: 0.20, carbs: 0.50,
  },
];

// Kalorie na gram makroskładnika
const KCAL = { protein: 4, carbs: 4, fat: 9 };

const MACRO_COLORS = {
  protein: '#00E676',
  carbs:   '#378ADD',
  fat:     '#EF9F27',
};

const MacroCalculator = ({ isVisible, onClose }) => {
  const [kcal, setKcal]     = useState(2500);
  const [weight, setWeight] = useState(80);
  const [preset, setPreset] = useState('highprotein');

  const results = useMemo(() => {
    const p = PRESETS.find((pr) => pr.id === preset) ?? PRESETS[1];
    const proteinG = Math.round((kcal * p.protein) / KCAL.protein);
    const fatG     = Math.round((kcal * p.fat)     / KCAL.fat);
    const carbsG   = Math.round((kcal * p.carbs)   / KCAL.carbs);
    const perKg    = (proteinG / weight).toFixed(1);
    return { proteinG, fatG, carbsG, perKg, preset: p };
  }, [kcal, weight, preset]);

  const MacroBar = ({ label, grams, pct, color }) => (
    <View style={s.macroRow}>
      <View style={s.macroLeft}>
        <View style={[s.macroDot, { backgroundColor: color }]} />
        <Text style={s.macroLabel}>{label}</Text>
      </View>
      <View style={s.macroTrack}>
        <View style={[s.macroFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.macroGrams}>{grams}g</Text>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
        <Text style={s.title}>Kalkulator makro</Text>
        <Text style={s.subtitle}>Podział białka, tłuszczu i węglowodanów</Text>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Kalorie */}
          <Text style={s.label}>Kalorie dzienne</Text>
          <View style={s.kcalRow}>
            <TouchableOpacity style={s.adjBtn} onPress={() => setKcal((v) => Math.max(1000, v - 50))} activeOpacity={0.7}>
              <Ionicons name="remove" size={22} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={s.kcalValue}>{kcal}</Text>
            <Text style={s.kcalUnit}>kcal</Text>
            <TouchableOpacity style={s.adjBtn} onPress={() => setKcal((v) => Math.min(6000, v + 50))} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Waga */}
          <Text style={s.label}>Masa ciała</Text>
          <View style={s.kcalRow}>
            <TouchableOpacity style={s.adjBtn} onPress={() => setWeight((v) => Math.max(40, v - 1))} activeOpacity={0.7}>
              <Ionicons name="remove" size={22} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={s.kcalValue}>{weight}</Text>
            <Text style={s.kcalUnit}>kg</Text>
            <TouchableOpacity style={s.adjBtn} onPress={() => setWeight((v) => Math.min(200, v + 1))} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Presety */}
          <Text style={s.label}>Podział makro</Text>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.presetRow, preset === p.id && s.presetRowActive]}
              onPress={() => setPreset(p.id)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.presetLabel, preset === p.id && { color: '#FFFFFF' }]}>{p.label}</Text>
                <Text style={s.presetDesc}>{p.desc}</Text>
              </View>
              <View style={s.presetPcts}>
                <Text style={[s.presetPct, { color: MACRO_COLORS.protein }]}>{Math.round(p.protein * 100)}%B</Text>
                <Text style={[s.presetPct, { color: MACRO_COLORS.fat }]}>{Math.round(p.fat * 100)}%T</Text>
                <Text style={[s.presetPct, { color: MACRO_COLORS.carbs }]}>{Math.round(p.carbs * 100)}%W</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Wynik */}
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>{results.preset.label} · {kcal} kcal</Text>

            <MacroBar label="Białko"   grams={results.proteinG} pct={results.preset.protein} color={MACRO_COLORS.protein} />
            <MacroBar label="Tłuszcze" grams={results.fatG}     pct={results.preset.fat}     color={MACRO_COLORS.fat}     />
            <MacroBar label="Węgle"    grams={results.carbsG}   pct={results.preset.carbs}   color={MACRO_COLORS.carbs}   />

            <View style={s.perKgRow}>
              <Ionicons name="barbell-outline" size={14} color="#636366" />
              <Text style={s.perKgText}>
                Białko: <Text style={{ color: MACRO_COLORS.protein, fontWeight: '700' }}>{results.perKg}g / kg</Text> masy ciała
                {parseFloat(results.perKg) >= 1.6
                  ? '  ✓ Optymalne dla mięśni'
                  : '  ⚠ Rozważ zwiększenie'}
              </Text>
            </View>
          </View>

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

  kcalRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 6, borderWidth: 0.5, borderColor: '#2C2C2E', gap: 4 },
  adjBtn:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  kcalValue: { flex: 1, fontSize: 32, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  kcalUnit:  { fontSize: 14, color: '#636366', marginRight: 8 },

  presetRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 0.5, borderColor: '#2C2C2E' },
  presetRowActive: { borderColor: 'rgba(0,230,118,0.4)', backgroundColor: 'rgba(0,230,118,0.05)' },
  presetLabel:     { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 2 },
  presetDesc:      { fontSize: 11, color: '#636366' },
  presetPcts:      { flexDirection: 'row', gap: 6 },
  presetPct:       { fontSize: 11, fontWeight: '700' },

  resultCard:  { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 0.5, borderColor: '#2C2C2E', gap: 14 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },

  macroRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, width: 80 },
  macroDot:   { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { fontSize: 13, color: '#8E8E93' },
  macroTrack: { flex: 1, height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden' },
  macroFill:  { height: '100%', borderRadius: 4 },
  macroGrams: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', width: 44, textAlign: 'right' },

  perKgRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#121212', borderRadius: 10, padding: 10, marginTop: 4 },
  perKgText: { fontSize: 12, color: '#636366', flex: 1, lineHeight: 18 },
});

export default MacroCalculator;