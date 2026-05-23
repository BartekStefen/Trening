import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

// ─── Mapa typów serii ─────────────────────────────────────────────────────────
export const SET_TYPE_MAP = {
  N: { label: 'N', title: 'Robocza',       color: '#378ADD', bg: 'rgba(55,138,221,0.18)' },
  W: { label: 'W', title: 'Rozgrzewkowa',  color: '#EF9F27', bg: 'rgba(239,159,39,0.18)' },
  D: { label: 'D', title: 'Drop-set',      color: '#FB923C', bg: 'rgba(251,146,60,0.18)' },
  F: { label: 'F', title: 'Do upadku',     color: '#FF453A', bg: 'rgba(255,69,58,0.18)' },
};

const TYPE_ORDER = ['W', 'N', 'D', 'F'];

export const cycleSetType = (current) => {
  const idx = TYPE_ORDER.indexOf(current ?? 'N');
  return TYPE_ORDER[(idx + 1) % TYPE_ORDER.length];
};

// Rozwiąż typ: jeśli setType ustawiony — użyj go; jeśli stary isDropSet = true → D
export const resolveSetType = (setType, isDropSet) => {
  if (setType) return setType;
  if (isDropSet) return 'D';
  return 'N';
};

// ─── Chip wyświetlany w wierszu serii ─────────────────────────────────────────
// index  — numer serii (0-based, wyświetlany jako index+1)
// type   — 'N' | 'W' | 'D' | 'F'
// onPress — callback (cykl W→N→D→F)
// disabled — gdy seria zaliczona (done)
export default function SetTypeButton({ type = 'N', index, onPress, disabled = false }) {
  const info = SET_TYPE_MAP[type] ?? SET_TYPE_MAP.N;

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: info.bg }, disabled && s.btnDone]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Text style={[s.idx, { color: info.color }, disabled && s.dimText]}>
        {index + 1}
      </Text>
      <Text style={[s.type, { color: info.color }, disabled && s.dimText]}>
        {info.label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 36, minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  btnDone:  { opacity: 0.4 },
  idx:      { fontSize: 10, fontWeight: '700', lineHeight: 13 },
  type:     { fontSize: 12, fontWeight: '800', lineHeight: 14 },
  dimText:  { opacity: 0.5 },
});
