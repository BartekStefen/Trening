import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function RepsModeSheet({ visible, currentMode, onSelect, onClose, colors }) {
  const s = makeStyles(colors);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>Opcje powtórzeń</Text>
            {[
              { mode: 'single', label: 'Powtórzenia' },
              { mode: 'range',  label: 'Zakres powt.' },
            ].map(({ mode, label }) => (
              <TouchableOpacity
                key={mode}
                style={s.option}
                onPress={() => { onSelect(mode); onClose(); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={s.optionText}>{label}</Text>
                {currentMode === mode && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: Platform.OS === 'ios' ? 24 : 12 }} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: c.backgroundSecondary, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle:     { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  title:      { fontSize: 15, fontWeight: '600', color: c.textTertiary, textAlign: 'center', paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: c.border },
  option:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 0.5, borderBottomColor: c.border },
  optionText: { fontSize: 16, color: c.textPrimary },
});
