import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { computeFatigueForecast } from '../../utils/profileAnalytics';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

export default function FatigueForecast() {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const data = useMemo(() => computeFatigueForecast(workoutHistory), [workoutHistory]);

  if (!workoutHistory?.length) return null;

  const maxStr = Math.max(...data.points.map((p) => p.strength), 1);

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Prognoza zmęczenia"
        subtitle="Indeks regeneracji · ACWR + trend sRPE"
        infoBody={PROFILE_INFO.fatigue}
        compact
      />

      <View style={s.barsRow}>
        {data.points.map((pt) => {
          const pct = pt.strength / maxStr;
          const barColor = pt.strength >= 95 ? colors.accent : pt.strength >= 85 ? '#FAC775' : '#FF5252';
          return (
            <View key={pt.label} style={s.barCol}>
              <Text style={[s.barPct, { color: barColor }]}>{pt.strength}%</Text>
              <View style={[s.barTrack, { backgroundColor: colors.border }]}>
                <View style={[s.barFill, { height: `${Math.max(pct * 100, 8)}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={[s.barLabel, { color: colors.textSecondary }]}>{pt.label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={[s.messageLine, { color: colors.textSecondary }]}>{data.message}</Text>

      <View style={[s.trendRow, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[s.trendLbl, { color: colors.textSecondary }]}>Trend obciążenia sRPE (3 tyg.)</Text>
        <Text style={[s.trendVal, { color: data.trendPct > 10 ? '#FF5252' : colors.accent }]}>
          {data.trendPct > 0 ? '+' : ''}{data.trendPct}%
        </Text>
      </View>
      {data.acwr != null && (
        <Text style={[s.acwrLine, { color: colors.textSecondary }]}>
          ACWR dziś: {data.acwr} · prognoza +2 tyg.: {data.projectedAcwr2 ?? '—'}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, marginBottom: 12 },
  barCol: { alignItems: 'center', gap: 4, flex: 1 },
  barPct: { fontSize: 11, fontWeight: '700' },
  barTrack: { width: 36, height: 70, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 10, textAlign: 'center' },
  messageLine: { fontSize: 12, marginBottom: 10, lineHeight: 17 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 12 },
  trendLbl: { fontSize: 12 },
  trendVal: { fontSize: 16, fontWeight: '800' },
  acwrLine: { fontSize: 11, marginTop: 8, textAlign: 'center' },
});
