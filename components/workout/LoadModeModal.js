import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export const LOAD_MODES = [
  { id: 'barbell',    icon: '🏋️', label: 'Sztanga / Maszyna',  sub: 'Standardowy ciężar w kg' },
  { id: 'bodyweight', icon: '🤸', label: 'Waga ciała (BW)',     sub: 'Podciągnięcia, pompki, dipy…' },
  { id: 'bands',      icon: '🎯', label: 'Gumy oporowe',        sub: 'Zamiast kg wybierz opór gumy' },
  { id: 'dumbbells',  icon: '💪', label: 'Hantle (para)',        sub: 'Ciężar jednego hantla w kg' },
];

const BAND_LEVELS = [
  { id: 'light',  label: 'Lekka',       color: '#FCD34D' },
  { id: 'medium', label: 'Średnia',      color: '#34D399' },
  { id: 'heavy',  label: 'Mocna',        color: '#60A5FA' },
  { id: 'xheavy', label: 'Bardzo mocna', color: '#F472B6' },
];

export const bandLabel = (level) => BAND_LEVELS.find((b) => b.id === level)?.label ?? level;
export const bandColor = (level) => BAND_LEVELS.find((b) => b.id === level)?.color ?? '#8E8E93';

export default function LoadModeModal({ isVisible, currentMode, onSelect, onClose }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Tryb obciążenia</Text>
          <Text style={s.sub}>Wybierz jak liczysz obciążenie dla tego ćwiczenia</Text>

          {LOAD_MODES.map((mode) => {
            const isActive = (currentMode ?? 'barbell') === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[s.row, isActive && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                onPress={() => { onSelect(mode.id); onClose(); }}
                activeOpacity={0.75}
              >
                <View style={s.iconBox}>
                  <Text style={{ fontSize: 22 }}>{mode.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowLabel, isActive && { color: colors.accent }]}>{mode.label}</Text>
                  <Text style={s.rowSub}>{mode.sub}</Text>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.backgroundSecondary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 36, paddingHorizontal: 16,
  },
  handle: { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  title:  { fontSize: 17, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  sub:    { fontSize: 13, color: c.textSecondary, marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: c.border,
  },
  iconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: c.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  rowLabel:  { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
  rowSub:    { fontSize: 12, color: c.textTertiary },
  cancelBtn: { marginTop: 4, backgroundColor: c.border, borderRadius: 14, padding: 16, alignItems: 'center' },
  cancelText:{ fontSize: 15, fontWeight: '600', color: c.textSecondary },
});
