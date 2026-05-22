import { useEffect, useRef, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const REST_PRESETS  = Array.from({ length: 55 }, (_, i) => 30 + i * 5);
const PRESET_ITEM_H = 62;

const fmt = (s) =>
  s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`;

const RestPickerModal = ({ isVisible, currentRest, onSelectTime, onClose }) => {
  const scrollRef     = useRef(null);
  const [sel, setSel] = useState(currentRest ?? 90);
  const { colors }    = useTheme();

  useEffect(() => {
    if (!isVisible) return;
    const safeRest = currentRest ?? 90;
    setSel(safeRest);
    const idx = REST_PRESETS.indexOf(safeRest);
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, idx) * PRESET_ITEM_H,
        animated: false,
      });
    }, 80);
  }, [isVisible, currentRest]);

  const handleConfirm = () => {
    onSelectTime(sel);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.screen, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[s.handle, { backgroundColor: colors.borderMuted }]} />
        <Text style={[s.title, { color: colors.textPrimary }]}>Czas przerwy</Text>
        <Text style={[s.sub, { color: colors.textTertiary }]}>30 s – 5:00 min · krok co 5 s</Text>

        <View style={[s.drum, { backgroundColor: colors.card }]}>
          {/* Linie podświetlające aktywną pozycję — kolor akcentu motywu */}
          <View style={[s.lineTop,    { backgroundColor: colors.accent }]} pointerEvents="none" />
          <View style={[s.lineBottom, { backgroundColor: colors.accent }]} pointerEvents="none" />

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={PRESET_ITEM_H}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: PRESET_ITEM_H * 2 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.max(
                0,
                Math.min(
                  Math.round(e.nativeEvent.contentOffset.y / PRESET_ITEM_H),
                  REST_PRESETS.length - 1,
                ),
              );
              setSel(REST_PRESETS[idx]);
            }}
          >
            {REST_PRESETS.map((sec) => (
              <TouchableOpacity
                key={sec}
                style={s.item}
                onPress={() => {
                  setSel(sec);
                  scrollRef.current?.scrollTo({
                    y: REST_PRESETS.indexOf(sec) * PRESET_ITEM_H,
                    animated: true,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.itemText,
                  { color: colors.borderMuted },
                  sec === sel && { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
                ]}>
                  {fmt(sec)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, { backgroundColor: colors.accent }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={[s.confirmText, { color: colors.accentText }]}>Zatwierdź · {fmt(sel)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={[s.cancelText, { color: colors.textTertiary }]}>Anuluj</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen:      { flex: 1 },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: '700', paddingHorizontal: 24, marginBottom: 6 },
  sub:         { fontSize: 13, paddingHorizontal: 24, marginBottom: 20 },
  drum: {
    height: PRESET_ITEM_H * 5,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  lineTop:     { position: 'absolute', top: PRESET_ITEM_H * 2, left: 0, right: 0, height: 1, zIndex: 10 },
  lineBottom:  { position: 'absolute', top: PRESET_ITEM_H * 3 - 1, left: 0, right: 0, height: 1, zIndex: 10 },
  item:        { height: PRESET_ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText:    { fontSize: 19, fontWeight: '500' },
  confirmBtn:  { borderRadius: 16, margin: 20, marginTop: 24, padding: 17, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700' },
  cancelBtn:   { marginHorizontal: 20, padding: 12, alignItems: 'center' },
  cancelText:  { fontSize: 15 },
});

export default RestPickerModal;
