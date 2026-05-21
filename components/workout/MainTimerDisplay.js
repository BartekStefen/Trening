import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── MainTimerDisplay ─────────────────────────────────────────────────────────
// Izolowany stoper głównego treningu.
//
// DLACZEGO OSOBNY KOMPONENT:
//   setTimerSec() co sekundę w ActiveWorkoutScreen powodowało re-render całego
//   ekranu – listy ćwiczeń, mapy SVG itd. Tu stan sekund żyje LOKALNIE.
//
// Rodzic komunikuje się przez ref (imperative handle):
//   timerRef.current.getSeconds()  – odczyt aktualnego czasu (przy minimize/finish)
//   timerRef.current.pause()       – zatrzymanie przy zakończeniu
//
// Props:
//   initialSec  – czas startowy (dla odtworzenia po minimalizacji)
//   workoutName – nazwa treningu wyświetlana nad timerem
//   doneSets    – liczba zaliczonych serii (HUD subtitle)
//   onMinimize() – callback przycisku chevron-down
//   onFinish()   – callback przycisku Zakończ
const MainTimerDisplay = forwardRef(({
  initialSec,
  workoutName,
  doneSets,
  exerciseCount,
  onMinimize,
  onFinish,
}, ref) => {
  const [sec, setSec]     = useState(initialSec ?? 0);
  const [paused, setPaused] = useState(false);
  const intervalRef         = useRef(null);
  const secRef              = useRef(initialSec ?? 0); // ref do odczytu bez re-renderu

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!paused) {
        secRef.current += 1;
        setSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  // Imperative API dla rodzica – odczyt czasu i zatrzymanie bez setState w górę
  useImperativeHandle(ref, () => ({
    getSeconds: () => secRef.current,
    pause: () => {
      clearInterval(intervalRef.current);
      setPaused(true);
    },
  }));

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
  };

  return (
    <>
      {/* ── Górny pasek z tytułem ── */}
      <View style={styles.topBar}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.workoutTitle} numberOfLines={1}>{workoutName}</Text>
          <Text style={styles.workoutSub}>{exerciseCount} ćwiczeń · {doneSets} serii</Text>
        </View>
        <TouchableOpacity style={styles.minimizeBtn} onPress={onMinimize} activeOpacity={0.7}>
          <Ionicons name="chevron-down" size={20} color="#8E8E93" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.endButton} onPress={onFinish} activeOpacity={0.8}>
          <Text style={styles.endButtonText}>Zakończ</Text>
        </TouchableOpacity>
      </View>

      {/* ── Kompaktowy stoper w HUD (mini) ── */}
      {/* Ten komponent eksportuje tylko górny pasek + typ; HUD WorkoutHUD
          dostaje timerSec jako prop tylko raz przy show/hide, bo HUD jest
          przeniesiony do osobnego bloku nie odświeżanego co sekundę.
          Czas wyświetlamy tu lokalnie. */}
      <View style={styles.timerRow}>
        <View>
          <Text style={styles.timerLabel}>Czas</Text>
          <Text style={styles.timerValue}>{fmt(sec)}</Text>
        </View>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={styles.timerBtn}
            onPress={() => setPaused((p) => !p)}
            activeOpacity={0.7}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={15} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timerBtn}
            onPress={() => { secRef.current = 0; setSec(0); }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={15} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  workoutTitle:  { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  workoutSub:    { fontSize: 10, color: '#8E8E93', marginTop: 2 },
  minimizeBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  endButton:     { backgroundColor: 'rgba(255,69,58,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  endButtonText: { fontSize: 13, fontWeight: '600', color: '#FF453A' },

  timerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(18,18,18,0.97)', borderRadius: 14, padding: 10, borderWidth: 0.5, borderColor: '#2C2C2E' },
  timerLabel:    { fontSize: 9, color: '#888888', marginBottom: 2 },
  timerValue:    { fontSize: 22, fontWeight: '700', color: '#00E676', fontVariant: ['tabular-nums'] },
  timerControls: { flexDirection: 'row', gap: 6 },
  timerBtn:      { width: 30, height: 30, borderRadius: 9, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
});

export default MainTimerDisplay;