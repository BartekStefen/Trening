import { useMemo, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
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

const plateWidth  = (w) => w >= 25 ? 28 : w >= 20 ? 24 : w >= 15 ? 20 : w >= 10 ? 16 : w >= 5 ? 12 : w >= 2.5 ? 9 : 7;
const plateHeight = (w) => w >= 25 ? 88 : w >= 20 ? 80 : w >= 15 ? 72 : w >= 10 ? 62 : w >= 5 ? 52 : w >= 2.5 ? 40 : 32;

const calcPlates = (perSideKg) => {
  const result = [];
  let remaining = perSideKg;
  for (const { weight, color, label } of PLATE_DEFS) {
    const count = Math.floor(remaining / weight);
    if (count > 0) {
      result.push({ weight, color, label, count });
      remaining = Math.round((remaining - count * weight) * 1000) / 1000;
    }
  }
  return { plates: result, remainder: remaining };
};

const PlateCalculatorModal = ({ isVisible, onClose, targetWeight }) => {
  const [barbellKg, setBarbellKg] = useState(20);

  const { plates, remainder, perSide } = useMemo(() => {
    const tw    = parseFloat(targetWeight) || 0;
    const total = Math.max(0, tw - barbellKg);
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
    >
      <View style={s.screen}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>

        <Text style={s.title}>Kalkulator krążków</Text>
        <Text style={s.targetLabel}>
          Cel: <Text style={s.targetVal}>{parseFloat(targetWeight) || 0} kg</Text>
        </Text>

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
          </View>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLbl}>Na stronę</Text>
              <Text style={s.statVal}>{perSide % 1 === 0 ? perSide : perSide.toFixed(2)} kg</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLbl}>Gryf</Text>
              <Text style={s.statVal}>{barbellKg} kg</Text>
            </View>
            {remainder > 0.001 && (
              <View style={[s.statBox, s.statBoxWarn]}>
                <Text style={s.statLbl}>Brakuje</Text>
                <Text style={[s.statVal, { color: '#FF9800' }]}>{remainder.toFixed(2)} kg</Text>
              </View>
            )}
          </View>

          <Text style={s.sectionLabel}>Krążki na jedną stronę</Text>
          {plates.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>Brak krążków – sam gryf</Text>
            </View>
          ) : (
            plates.map(({ weight, color, label, count }) => (
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
            ))
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

  targetLabel:   { fontSize: 13, color: '#8E8E93', paddingHorizontal: 20, marginBottom: 16 },
  targetVal:     { color: '#00E676', fontWeight: '700' },

  barbellRow:           { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  barbellChip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#1C1C1E', borderWidth: 0.5, borderColor: '#2C2C2E' },
  barbellChipActive:    { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: '#00E676' },
  barbellChipText:      { fontSize: 12, color: '#636366', fontWeight: '500' },
  barbellChipTextActive:{ color: '#00E676', fontWeight: '600' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  barbellWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 18,
    paddingVertical: 24, paddingHorizontal: 20,
    marginBottom: 20, borderWidth: 0.5, borderColor: '#2C2C2E',
    overflow: 'hidden', minHeight: 120,
  },
  sleeve: { width: 56, height: 44, backgroundColor: '#555555', borderRadius: 4 },
  plate:  { marginLeft: 2, borderRadius: 3 },
  collar: { width: 10, height: 52, backgroundColor: '#888888', borderRadius: 3, marginLeft: 2 },
  tip:    { width: 6,  height: 20, backgroundColor: '#444444', borderRadius: 2, marginLeft: 2 },

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
  emptyText: { fontSize: 14, color: '#636366' },
});

export default PlateCalculatorModal;