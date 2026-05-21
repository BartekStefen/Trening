import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { StyleSheet, Text } from 'react-native';

// ─── WorkoutTimerHUD ──────────────────────────────────────────────────────────
// Izolowany timer treningu – tyka wyłącznie wewnętrznie.
// Montuj go jeden raz; aktualizuje TYLKO swój własny Text, zero re-renderów rodzica.
//
// Ref API (dla ActiveWorkoutScreen):
//   timerRef.current.getSeconds()  → odczyt sekund przy minimize/finish
//   timerRef.current.pause()       → zatrzymanie przy Zakończ
//
// Props:
//   initialSec  – startowy czas (odtworzenie po minimize, domyślnie 0)
const WorkoutTimerHUD = forwardRef(({ initialSec = 0 }, ref) => {
  const [sec, setSec]   = useState(initialSec);
  const secRef          = useRef(initialSec); // odczyt bez dodatkowego setState
  const intervalRef     = useRef(null);
  const pausedRef       = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        secRef.current += 1;
        setSec((s) => s + 1);
      }
    }, 1000);
    // Cleanup: interwał ZAWSZE niszczony przy odmontowaniu
    return () => clearInterval(intervalRef.current);
  }, []); // [] – uruchamia się tylko raz

  // Imperative handle – rodzic może odczytać/zatrzymać timer bez setState w górę
  useImperativeHandle(ref, () => ({
    getSeconds: () => secRef.current,
    pause: () => {
      pausedRef.current = true;
      clearInterval(intervalRef.current);
    },
  }));

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  return <Text style={styles.timerText}>{fmt(sec)}</Text>;
});

const styles = StyleSheet.create({
  // Zielony, monospaced – pasuje bezpośrednio do komórki HUD obok Tonaż/RPE/Woda
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E676',
    fontVariant: ['tabular-nums'],
  },
});

export default WorkoutTimerHUD;