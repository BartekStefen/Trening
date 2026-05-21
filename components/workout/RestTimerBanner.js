import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── RestTimerBanner ──────────────────────────────────────────────────────────
// Izolowany komponent timera przerwy.
//
// DLACZEGO OSOBNY KOMPONENT:
//   Poprzednio setRestSec() co sekundę wywoływało setState w ActiveWorkoutScreen,
//   co wymuszało re-render całej listy ćwiczeń, ExerciseCard × N i mapy SVG.
//   Tu stan sekund żyje LOKALNIE – rodzic nie re-renderuje się w ogóle podczas
//   odliczania przerwy.
//
// Props:
//   label       – nazwa serii (np. "Wyciskanie – s.1")
//   duration    – czas przerwy w sekundach
//   onDismiss() – wywołany gdy baner ma się schować (Pomiń lub czas minął)
const RestTimerBanner = ({ label, duration, onDismiss }) => {
  // Stan sekund izolowany lokalnie – nie powoduje re-renderu rodzica
  const [sec, setSec]           = useState(duration);
  const [totalSec]              = useState(duration);  // stała referencyjna
  const intervalRef             = useRef(null);
  const slideAnim               = useRef(new Animated.Value(220)).current;

  // Animacja wjazdu od dołu przy montowaniu
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start();

    // Odliczanie w pełni lokalne
    intervalRef.current = setInterval(() => {
      setSec((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Animacja wyjazdu, potem callback do rodzica
          Animated.timing(slideAnim, { toValue: 220, duration: 200, useNativeDriver: true })
            .start(onDismiss);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup: zawsze czyść interwał przy odmontowaniu
    return () => clearInterval(intervalRef.current);
  }, []); // [] – uruchamia się tylko raz przy montowaniu

  const fmt = (s) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => String(v).padStart(2, '0')).join(':');

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    Animated.timing(slideAnim, { toValue: 220, duration: 200, useNativeDriver: true })
      .start(onDismiss);
  };

  const handleAdd15 = () => {
    setSec((prev) => prev + 15);
  };

  const handleReset = () => {
    setSec(totalSec);
  };

  const progress = totalSec > 0 ? sec / totalSec : 0;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      {/* Nagłówek */}
      <View style={styles.top}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={styles.donePill}>
          <Ionicons name="checkmark" size={12} color="#00E676" />
          <Text style={styles.doneText}>Zaliczona</Text>
        </View>
      </View>

      {/* Pasek postępu */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Duży licznik – aktualizuje tylko ten komponent */}
      <Text style={styles.timerValue}>{fmt(sec)}</Text>

      {/* Przyciski */}
      <View style={styles.btns}>
        <TouchableOpacity style={styles.btn} onPress={handleAdd15} activeOpacity={0.7}>
          <Text style={styles.btnText}>+15s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.btnText, { color: '#00E676' }]}>Pomiń</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleReset} activeOpacity={0.7}>
          <Text style={[styles.btnText, { color: '#8E8E93' }]}>Resetuj</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,10,10,0.97)',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20,
    borderTopWidth: 0.5, borderColor: '#2C2C2E',
  },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label:    { fontSize: 13, color: '#8E8E93', fontWeight: '500', flex: 1, marginRight: 10 },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,230,118,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  doneText: { fontSize: 12, color: '#00E676', fontWeight: '600' },
  track:    { height: 3, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  fill:     { height: '100%', backgroundColor: '#00E676', borderRadius: 3 },
  timerValue: { fontSize: 46, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: 16 },
  btns:     { flexDirection: 'row', gap: 8 },
  btn:      { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 0.5, borderColor: '#2C2C2E' },
  btnSkip:  { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.25)' },
  btnText:  { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

export default RestTimerBanner;