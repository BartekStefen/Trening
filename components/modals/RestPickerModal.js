import { useEffect, useRef, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';

// ─── Stałe ────────────────────────────────────────────────────────────────────
// 55 presetów: 30 s – 300 s co 5 s
const REST_PRESETS  = Array.from({ length: 55 }, (_, i) => 30 + i * 5);
const PRESET_ITEM_H = 62;

const fmt = (s) =>
  s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`;

// ─── RestPickerModal ──────────────────────────────────────────────────────────
// Drum-roller: snapToInterval + decelerationRate="fast" daje efekt bębna
// bez zewnętrznych bibliotek. Dwie zielone linie podświetlają aktywną pozycję.
//
// Props:
//   isVisible        – boolean
//   currentRest      – aktualnie ustawiony czas (sekundy)
//   onSelectTime(sec)– callback wywoływany po zatwierdzeniu
//   onClose()        – callback zamknięcia bez zapisu
const RestPickerModal = ({ isVisible, currentRest, onSelectTime, onClose }) => {
  const scrollRef      = useRef(null);
  const [sel, setSel]  = useState(currentRest ?? 90);

  // Przy każdym otwarciu przewijamy do aktualnie ustawionej wartości
  useEffect(() => {
    if (!isVisible) return;
    const safeRest = currentRest ?? 90;
    setSel(safeRest);
    const idx = REST_PRESETS.indexOf(safeRest);
    // Timeout 80ms pozwala modalu się zamontować przed scrollTo
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
      <View style={styles.screen}>
        <View style={styles.handle} />
        <Text style={styles.title}>Czas przerwy</Text>
        <Text style={styles.sub}>30 s – 5:00 min · krok co 5 s</Text>

        {/* ── Drum-roller ── */}
        <View style={styles.drum}>
          {/* Górna linia selekcji */}
          <View style={styles.lineTop}    pointerEvents="none" />
          {/* Dolna linia selekcji */}
          <View style={styles.lineBottom} pointerEvents="none" />

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
                style={styles.item}
                onPress={() => {
                  setSel(sec);
                  scrollRef.current?.scrollTo({
                    y: REST_PRESETS.indexOf(sec) * PRESET_ITEM_H,
                    animated: true,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.itemText, sec === sel && styles.itemActive]}>
                  {fmt(sec)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.confirmText}>Zatwierdź · {fmt(sel)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#111111' },
  handle:      { width: 36, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 24, marginBottom: 6 },
  sub:         { fontSize: 13, color: '#636366', paddingHorizontal: 24, marginBottom: 20 },
  drum: {
    height: PRESET_ITEM_H * 5,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  // Dwie poziome linie podświetlające środkową (aktywną) pozycję
  lineTop:     { position: 'absolute', top: PRESET_ITEM_H * 2, left: 0, right: 0, height: 1, backgroundColor: '#00E676', zIndex: 10 },
  lineBottom:  { position: 'absolute', top: PRESET_ITEM_H * 3 - 1, left: 0, right: 0, height: 1, backgroundColor: '#00E676', zIndex: 10 },
  item:        { height: PRESET_ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText:    { fontSize: 19, color: '#3A3A3C', fontWeight: '500' },
  itemActive:  { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
  confirmBtn:  { backgroundColor: '#00E676', borderRadius: 16, margin: 20, marginTop: 24, padding: 17, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#000000' },
  cancelBtn:   { marginHorizontal: 20, padding: 12, alignItems: 'center' },
  cancelText:  { fontSize: 15, color: '#636366' },
});

export default RestPickerModal;