import { useEffect, useRef, useState } from 'react';
import {
  Modal, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// Modal wywoływany przez kliknięcie pola kg w wierszu.
// Cel: szybkie przepisanie ciężaru z klawiatury bez otwierania pełnego kalkulatora.
// Pokazuje sugestię APRE dla następnej serii jako skrót jednego tapnięcia.
//
// Props:
//   isVisible
//   currentKg       – aktualna wartość pola (string)
//   suggestionLabel – tekst z APRE, np. "82.5 kg x 8" (z progression.label)
//   suggestionKg    – liczba z progression.suggestedKg
//   onConfirm(kg)   – callback z nową wartością
//   onClose()
const WeightInputModal = ({
  isVisible,
  currentKg,
  suggestionLabel,
  suggestionKg,
  onConfirm,
  onClose,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const { colors } = useTheme();
  const s = makeStyles(colors);

  useEffect(() => {
    if (isVisible) {
      setValue(currentKg ?? '');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isVisible]);

  const handleConfirm = (v) => {
    const str = (v ?? value).toString().replace(',', '.');
    if (str && !isNaN(parseFloat(str))) {
      onConfirm(str);
    }
    onClose();
  };

  const quickValues = [
    currentKg && parseFloat(currentKg) > 0 ? String(Math.round((parseFloat(currentKg) - 2.5) * 2) / 2) : null,
    currentKg,
    currentKg && parseFloat(currentKg) > 0 ? String(Math.round((parseFloat(currentKg) + 2.5) * 2) / 2) : null,
  ].filter(Boolean).filter((v) => parseFloat(v) > 0);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={s.box}>
            <Text style={s.title}>Ustaw ciężar</Text>

            {/* Sugestia APRE */}
            {suggestionKg != null && (
              <TouchableOpacity
                style={s.suggBtn}
                onPress={() => handleConfirm(String(suggestionKg))}
                activeOpacity={0.7}
              >
                <View style={s.suggLeft}>
                  <Text style={s.suggIcon}>🧠</Text>
                  <View>
                    <Text style={s.suggTitle}>Sugestia następnej serii</Text>
                    <Text style={s.suggValue}>{suggestionLabel ?? `${suggestionKg} kg`}</Text>
                  </View>
                </View>
                <View style={s.suggApply}>
                  <Text style={s.suggApplyText}>Użyj</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Szybkie wartości ±2.5 */}
            {quickValues.length > 0 && (
              <View style={s.quickRow}>
                {quickValues.map((v, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.quickBtn, value === v && s.quickBtnActive]}
                    onPress={() => handleConfirm(v)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.quickBtnText, value === v && s.quickBtnTextActive]}>
                      {v} kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Pole tekstowe */}
            <View style={s.inputRow}>
              <TextInput
                ref={inputRef}
                style={s.input}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder="wpisz kg"
                placeholderTextColor={colors.borderMuted}
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={() => handleConfirm()}
              />
              <Text style={s.unit}>kg</Text>
            </View>

            <View style={s.footer}>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={s.cancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirm()} activeOpacity={0.8}>
                <Text style={s.confirmText}>Zatwierdź</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const makeStyles = (c) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: c.card,
    borderRadius: 22,
    padding: 20,
    width: 320,
    borderWidth: 0.5,
    borderColor: c.border,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },

  suggBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.accentSoft,
    borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: c.accentSoft,
  },
  suggLeft:      { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  suggIcon:      { fontSize: 20 },
  suggTitle:     { fontSize: 11, color: c.textSecondary, marginBottom: 2 },
  suggValue:     { fontSize: 16, fontWeight: '700', color: c.accent },
  suggApply:     { backgroundColor: c.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  suggApplyText: { fontSize: 13, fontWeight: '600', color: c.accent },

  quickRow:          { flexDirection: 'row', gap: 8 },
  quickBtn:          { flex: 1, backgroundColor: c.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: c.borderMuted },
  quickBtnActive:    { backgroundColor: c.accentSoft, borderColor: c.accent },
  quickBtnText:      { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  quickBtnTextActive:{ color: c.accent },

  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.background, borderRadius: 14, borderWidth: 1, borderColor: c.borderMuted, paddingHorizontal: 16 },
  input:    { flex: 1, fontSize: 28, fontWeight: '700', color: c.textPrimary, paddingVertical: 14, textAlign: 'center' },
  unit:     { fontSize: 16, color: c.textTertiary, fontWeight: '500' },

  footer:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:  { flex: 1, backgroundColor: c.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  confirmBtn: { flex: 2, backgroundColor: c.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  confirmText:{ fontSize: 15, fontWeight: '700', color: c.accentText },
});

export default WeightInputModal;
