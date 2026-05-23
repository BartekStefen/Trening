import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppState, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const WorkoutTimerHUD = forwardRef(({ initialSec = 0 }, ref) => {
  const startMsRef    = useRef(Date.now() - initialSec * 1000);
  const pausedRef     = useRef(false);
  const pausedSecRef  = useRef(initialSec);
  const intervalRef   = useRef(null);
  const [sec, setSec] = useState(initialSec);
  const { colors }    = useTheme();

  const computeSec = useCallback(() => {
    if (pausedRef.current) return pausedSecRef.current;
    return Math.max(0, Math.floor((Date.now() - startMsRef.current) / 1000));
  }, []);

  const syncDisplay = useCallback(() => {
    setSec(computeSec());
  }, [computeSec]);

  useEffect(() => {
    intervalRef.current = setInterval(syncDisplay, 1000);
    return () => clearInterval(intervalRef.current);
  }, [syncDisplay]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncDisplay();
    });
    return () => sub.remove();
  }, [syncDisplay]);

  useImperativeHandle(ref, () => ({
    getSeconds: computeSec,
    pause: () => {
      pausedSecRef.current = computeSec();
      pausedRef.current = true;
      clearInterval(intervalRef.current);
    },
  }));

  const fmt = (s) => {
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  return (
    <Text style={[styles.timerText, { color: colors.accent }]}>{fmt(sec)}</Text>
  );
});

const styles = StyleSheet.create({
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default WorkoutTimerHUD;
