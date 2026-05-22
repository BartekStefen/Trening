import { useMemo, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BARBELL_OPTIONS = [
  { label: 'Olimpijski 20 kg', value: 20 },
  { label: 'Damski 15 kg',     value: 15 },
  { label: 'EZ 10 kg',         value: 10 },
];

const PLATE_DEFS = [
  { weight: 25,   color: '#E53935', label: '25'   },
  { weight: 20,   color: '#1565C0', label: '20'   },
  { weight: 15,   color: '#F9A825', label: '15'   },
  { weight: 10,   color: '#2E7D32', label: '10'   },
  { weight: 5,    color: '#6A1B9A', label: '5'    },
  { weight: 2.5,  color: '#37474F', label: '2.5'  },
  { weight: 1.25, color: '#455A64', label: '1.25' },
];

const plateWidth  = (w) => w >= 25 ? 30 : w >= 20 ? 25 : w >= 15 ? 21 : w >= 10 ? 17 : w >= 5 ? 13 : w >= 2.5 ? 10 : 7;
const plateHeight = (w) => w >= 25 ? 90 : w >= 20 ? 80 : w >= 15 ? 70 : w >= 10 ? 60 : w >= 5 ? 50 : w >= 2.5 ? 38 : 28;

const calcPlates = (perSideKg) => {
  const result = [];
  let remaining = Math.round(perSideKg * 1000) / 1000;
  for (const { weight, color, label } of PLATE_DEFS) {
    const count = Math.floor(remaining / weight + 0.001);
    if (count > 0) {
      result.push({ weight, color, label, count });
      remaining = Math.round((remaining - count * weight) * 1000) / 1000;
    }
  }
  return { plates: result, remainder: remaining };
};

// Props:
//   isVisible
//   initialWeight  – startowy ciężar całkowity (kg), np. z ostatniej serii
//   onClose()
const PlateCalculatorModal = ({ isVisible, initialWeight = 20, onClose }) => {
  const [inputText, setInputText] = useState(String(initialWeight));
  const [barbellKg, setBarbellKg] = useState(20);

  // Synchronizuj input z initialWeight przy otwarciu
  const handleVisible = () => {
    if (isVisible) setInputText(String(initialWeight));
  };

  const targetWeight = parseFloat(inputText.replace(',', '.')) || 0;

  const { plates, remainder, perSide } = useMemo(() => {
    const total = Math.max(0, targetWeight - barbellKg);
    const ps    = total / 2;
    const { plates: p, remainder: r } = calcPlates(ps);
    return { plates: p, remainder: r, perSide: ps };
  }, [targetWeight, barbellKg]);

  const flatPlates = plates.flatMap(({ weight, color, count }) =>
    Array.from({ length: count }, (_, i) => ({ weight, color, key: `${weight}-${i}` }))
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleVisible}
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={s.title}>Wizualizacja sztangi</Text>

        {/* Input ciężaru całkowitego — reaguje live */}
        <View style={s.inputSection}>
          <Text style={s.inputLabel}>Ciężar całkowity</Text>
          <View style={s.inputRow}>
            <TouchableOpacity
              style={s.inputAdj}
              onPress={() => setInputText(String(Math.max(barbellKg, (parseFloat(inputText) || 0) - 2.5)))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color="#8E8E93" />
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={inputText}
              onChangeText={setInputText}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor="#3A3A3C"
            />
            <Text style={s.inputUnit}>kg</Text>
            <TouchableOpacity
              style={s.inputAdj}
              onPress={() => setInputText(String(Math.round(((parseFloat(inputText) || 0) + 2.5) * 2) / 2))}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wybór gryfu */}
        <View style={s.barbellRow}>
          {BARBELL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[s.barbellChip, barbellKg === opt.value && s.barbellChipActive]}
              onPress={() => setBarbellKg(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[s.barbellChipText, barbellKg === opt.value && s.barbellChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Wizualizacja gryfu */}
          <View style={s.barbellWrapper}>
            {flatPlates.length === 0 && perSide === 0 ? (
              <View style={s.barOnly}>
                <View style={s.sleeve} />
                <View style={s.collar} />
                <View style={s.tip} />
                <Text style={s.barOnlyText}>Sam gryf</Text>
              </View>
            ) : (
              <>
                <View style={s.sleeve} />
                {[...flatPlates].reverse().map(({ weight, color, key }) => (
                  <View
                    key={key}
                    style={[s.plate, {
                      width:           plateWidth(weight),
                      height:          plateHeight(weight),
                      backgroundColor: color,
                    }]}
                  />
                ))}
                <View style={s.collar} />
                <View style={s.tip} />
              </>
            )}
          </View>

          {/* Statystyki */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLbl}>Na stronę</Text>
              <Text style={s.statVal}>
                {perSide % 1 === 0 ? perSide : perSide.toFixed(2)} kg
              </Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLbl}>Gryf</Text>
              <Text style={s.statVal}>{barbellKg} kg</Text>
            </View>
            {remainder > 0.01 && (
              <View style={[s.statBox, s.statBoxWarn]}>
                <Text style={s.statLbl}>Brakuje</Text>
                <Text style={[s.statVal, { color: '#FF9800' }]}>
                  {remainder.toFixed(2)} kg
                </Text>
              </View>
            )}
          </View>

          {/* Lista krążków */}
          {plates.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Krążki na jedną stronę</Text>
              {plates.map(({ weight, color, label, count }) => (
                <View key={weight} style={s.plateRow}>
                  <View style={[s.plateSwatch, { backgroundColor: color }]}>
                    <Text style={s.plateSwatchText}>{label}</Text>
                  </View>
                  <Text style={s.plateName}>{weight} kg</Text>
                  <View style={s.plateCountBadge}>
                    <Text style={s.plateCountText}>×{count}</Text>
                  </View>
                  <Text style={s.plateSubtotal}>
                    {(weight * count).toFixed(2).replace(/\.00$/, '')} kg
                  </Text>
                </View>
              ))}
            </>
          )}

          {plates.length === 0 && targetWeight > 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>
                {targetWeight <= barbellKg
                  ? 'Ciężar równy lub mniejszy od gryfu — brak krążków'
                  : 'Brak krążków dla tego ciężaru'}
              </Text>
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
  title:    { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },

  inputSection: { paddingHorizontal: 20, marginBottom: 14 },
  inputLabel:   { fontSize: 12, color: '#8E8E93', marginBottom: 8, fontWeight: '500' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 0.5, borderColor: '#2C2C2E', paddingHorizontal: 4 },
  inputAdj:     { width: 44, height: 54, justifyContent: 'center', alignItems: 'center' },
  input:        { flex: 1, fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', paddingVertical: 12 },
  inputUnit:    { fontSize: 16, color: '#636366', fontWeight: '500', marginRight: 8 },

  barbellRow:            { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  barbellChip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  barbellChipActive:     { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  barbellChipText:       { fontSize: 12, color: '#636366', fontWeight: '500' },
  barbellChipTextActive: { color: '#00E676', fontWeight: '600' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  barbellWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 18,
    paddingVertical: 24, paddingHorizontal: 20,
    marginBottom: 20, borderWidth: 0.5, borderColor: '#2C2C2E',
    minHeight: 130, overflow: 'hidden',
  },
  barOnly:     { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  barOnlyText: { fontSize: 13, color: '#636366', marginLeft: 8 },
  sleeve:  { width: 56, height: 44, backgroundColor: '#555555', borderRadius: 4 },
  plate:   { marginLeft: 2, borderRadius: 3 },
  collar:  { width: 10, height: 52, backgroundColor: '#888888', borderRadius: 3, marginLeft: 2 },
  tip:     { width: 6,  height: 20, backgroundColor: '#444444', borderRadius: 2, marginLeft: 2 },

  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox:     { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#2C2C2E', alignItems: 'center' },
  statBoxWarn: { borderColor: 'rgba(255,152,0,0.4)' },
  statLbl:     { fontSize: 10, color: '#636366', marginBottom: 4 },
  statVal:     { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  sectionLabel:    { fontSize: 11, fontWeight: '700', color: '#636366', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  plateRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 12, marginBottom: 8, gap: 12, borderWidth: 0.5, borderColor: '#2C2C2E' },
  plateSwatch:     { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  plateSwatchText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  plateName:       { flex: 1, fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  plateCountBadge: { backgroundColor: '#2C2C2E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  plateCountText:  { fontSize: 14, fontWeight: '700', color: '#A78BFA' },
  plateSubtotal:   { fontSize: 13, color: '#636366', minWidth: 50, textAlign: 'right' },

  emptyBox:  { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  emptyText: { fontSize: 13, color: '#636366', textAlign: 'center' },
});

export default PlateCalculatorModal;