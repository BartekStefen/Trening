import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { computeReadinessScore } from '../../utils/profileAnalytics';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

export default function ReadinessScore({ habits = [] }) {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();

  const sleepOk    = habits.some((h) => h.name.toLowerCase().includes('sen') && h.done);
  const creatineOk = habits.some((h) => h.name.toLowerCase().includes('kreatyna') && h.done);

  const data = useMemo(
    () => computeReadinessScore(workoutHistory, { sleepOk, creatineOk }),
    [workoutHistory, sleepOk, creatineOk],
  );

  const pct = (data.score / 10) * 100;

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Gotowość treningowa"
        subtitle="Ready-to-Lift Score — ocena przed salą"
        infoBody={PROFILE_INFO.readiness}
        compact
      />

      <View style={s.scoreRow}>
        <View style={s.gaugeWrap}>
          <View style={[s.gaugeTrack, { borderColor: colors.border }]}>
            <View
              style={[
                s.gaugeFill,
                {
                  width: `${pct}%`,
                  backgroundColor: data.color,
                },
              ]}
            />
          </View>
          <Text style={[s.scoreBig, { color: data.color }]}>{data.score}</Text>
          <Text style={[s.scoreOf, { color: colors.textSecondary }]}>/ 10</Text>
        </View>
        <View style={s.metaCol}>
          <View style={[s.badge, { backgroundColor: `${data.color}22` }]}>
            <Text style={[s.badgeText, { color: data.color }]}>{data.label}</Text>
          </View>
          <Text style={[s.metaLine, { color: colors.textSecondary }]}>
            ACWR: {data.acwr ?? '—'}
          </Text>
          <Text style={[s.metaLine, { color: colors.textSecondary }]}>
            Dni od treningu: {data.daysSince ?? '—'}
          </Text>
        </View>
      </View>

      {data.factors.length > 0 && (
        <View style={s.factors}>
          {data.factors.slice(0, 4).map((f, i) => (
            <View key={i} style={s.factorRow}>
              <Text style={[s.factorImpact, { color: f.impact >= 0 ? colors.accent : '#FF5252' }]}>
                {f.impact >= 0 ? '+' : ''}{f.impact}
              </Text>
              <Text style={[s.factorText, { color: colors.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  gaugeWrap: { flex: 1 },
  gaugeTrack: { height: 10, borderRadius: 5, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  gaugeFill: { height: '100%', borderRadius: 5 },
  scoreBig: { fontSize: 42, fontWeight: '800', lineHeight: 46 },
  scoreOf: { fontSize: 14, marginTop: -4 },
  metaCol: { gap: 6, minWidth: 110 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  metaLine: { fontSize: 11 },
  factors: { marginTop: 14, gap: 6 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorImpact: { fontSize: 12, fontWeight: '700', width: 32 },
  factorText: { fontSize: 12, flex: 1 },
});
