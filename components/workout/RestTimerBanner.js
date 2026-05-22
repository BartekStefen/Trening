import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const RestTimerBanner = ({ label, duration, onDismiss }) => {
  const [sec, setSec]       = useState(duration);
  const [totalSec]          = useState(duration);
  const [minimized, setMin] = useState(false);
  const intervalRef         = useRef(null);
  const { colors }          = useTheme();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSec((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onDismiss?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fmt = (s) => {
    const m  = Math.floor(s / 60);
    const sc = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    onDismiss?.();
  };

  const progress = totalSec > 0 ? Math.max(0, sec / totalSec) : 0;

  if (minimized) {
    return (
      <View style={[s.miniBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <View style={[s.miniTrack, { backgroundColor: colors.border }]}>
          <View style={[s.miniFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={[s.miniTimer, { color: colors.textPrimary }]}>{fmt(sec)}</Text>
        <TouchableOpacity onPress={() => setMin(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.miniSkip, { backgroundColor: colors.accentSoft }]}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[s.miniSkipText, { color: colors.accent }]}>Pomiń</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.banner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={s.top}>
        <Text style={[s.label, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
        <View style={[s.donePill, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="checkmark" size={12} color={colors.accent} />
          <Text style={[s.doneText, { color: colors.accent }]}>Zaliczona</Text>
        </View>
        <TouchableOpacity
          onPress={() => setMin(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[s.minimizeBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={[s.track, { backgroundColor: colors.border }]}>
        <View style={[s.fill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <Text style={[s.timerValue, { color: colors.textPrimary }]}>{fmt(sec)}</Text>

      <View style={s.btns}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setSec((p) => p + 15)}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, { color: colors.textPrimary }]}>+15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }]}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, { color: colors.accent }]}>Pomiń</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setSec(totalSec)}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, { color: colors.textSecondary }]}>Resetuj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  banner:      { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, borderTopWidth: 0.5 },
  top:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  label:       { fontSize: 13, fontWeight: '500', flex: 1 },
  donePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  doneText:    { fontSize: 12, fontWeight: '600' },
  minimizeBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  track:       { height: 3, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  fill:        { height: '100%', borderRadius: 3 },
  timerValue:  { fontSize: 48, fontWeight: '700', textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: 16 },
  btns:        { flexDirection: 'row', gap: 8 },
  btn:         { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 0.5 },
  btnText:     { fontSize: 14, fontWeight: '600' },

  miniBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, gap: 10 },
  miniTrack:    { flex: 1, height: 3, borderRadius: 3, overflow: 'hidden' },
  miniFill:     { height: '100%', borderRadius: 3 },
  miniTimer:    { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 44 },
  miniSkip:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  miniSkipText: { fontSize: 12, fontWeight: '600' },
});

export default RestTimerBanner;
