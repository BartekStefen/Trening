import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const MainTimerDisplay = forwardRef(({
  initialSec,
  workoutName,
  doneSets,
  exerciseCount,
  onMinimize,
  onFinish,
}, ref) => {
  const [sec, setSec]       = useState(initialSec ?? 0);
  const [paused, setPaused] = useState(false);
  const intervalRef         = useRef(null);
  const secRef              = useRef(initialSec ?? 0);
  const { colors }          = useTheme();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!paused) {
        secRef.current += 1;
        setSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

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
      <View style={styles.topBar}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.workoutTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {workoutName}
          </Text>
          <Text style={[styles.workoutSub, { color: colors.textSecondary }]}>
            {exerciseCount} ćwiczeń · {doneSets} serii
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.minimizeBtn, { backgroundColor: colors.card }]}
          onPress={onMinimize}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.endButton, { backgroundColor: colors.dangerSoft }]}
          onPress={onFinish}
          activeOpacity={0.8}
        >
          <Text style={[styles.endButtonText, { color: colors.danger }]}>Zakończ</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.timerRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.timerLabel, { color: colors.textTertiary }]}>Czas</Text>
          <Text style={[styles.timerValue, { color: colors.accent }]}>{fmt(sec)}</Text>
        </View>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: colors.border }]}
            onPress={() => setPaused((p) => !p)}
            activeOpacity={0.7}
          >
            <Ionicons name={paused ? 'play' : 'pause'} size={15} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: colors.border }]}
            onPress={() => { secRef.current = 0; setSec(0); }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={15} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  workoutTitle:  { fontSize: 17, fontWeight: '700' },
  workoutSub:    { fontSize: 10, marginTop: 2 },
  minimizeBtn:   { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  endButton:     { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  endButtonText: { fontSize: 13, fontWeight: '600' },

  timerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 10, borderWidth: 0.5 },
  timerLabel:    { fontSize: 9, marginBottom: 2 },
  timerValue:    { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerControls: { flexDirection: 'row', gap: 6 },
  timerBtn:      { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
});

export default MainTimerDisplay;
