import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const WorkoutTimerHUD = forwardRef(({ initialSec = 0 }, ref) => {
  const [sec, setSec]   = useState(initialSec);
  const secRef          = useRef(initialSec);
  const intervalRef     = useRef(null);
  const pausedRef       = useRef(false);
  const { colors }      = useTheme();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        secRef.current += 1;
        setSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    getSeconds: () => secRef.current,
    pause: () => {
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
