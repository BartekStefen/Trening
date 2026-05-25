import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { buildReadinessOpts, computeReadinessScore } from '../../utils/profileAnalytics';
import { READINESS_WEIGHTS } from '../../utils/trainingLoad';
import CardHeader from './CardHeader';
import WellnessCheckIn from './WellnessCheckIn';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

const splitColor = (score) => {
  if (score >= 8) return '#00E676';
  if (score >= 6) return '#378ADD';
  if (score >= 4) return '#FAC775';
  return '#FF5252';
};

function SplitChip({ label, split, colors }) {
  const c = splitColor(split.score);
  const heatPct = Math.round((split.heatmapLoad ?? 0) * 100);
  return (
    <View style={[s.splitChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <Text style={[s.splitLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[s.splitScore, { color: c }]}>
        {split.score}
        <Text style={[s.splitDenom, { color: colors.textSecondary }]}>/10</Text>
      </Text>
      <Text style={[s.splitMeta, { color: colors.textSecondary }]}>
        Obciążenie {heatPct}% · 7 d
      </Text>
      <Text style={[s.splitMeta, { color: colors.textSecondary }]}>
        {split.meaningfulWork && split.daysSince != null
          ? `${split.daysSince} d od pracy${split.lastRpe != null ? ` · RPE ${split.lastRpe}` : ''}`
          : 'Brak realnej pracy — strefa świeża'}
      </Text>
    </View>
  );
}

export default function ReadinessScore() {
  const { workoutHistory, dailyWellness, setWellnessValue } = useWorkoutContext();
  const { colors } = useTheme();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const readinessOpts = useMemo(
    () => buildReadinessOpts(dailyWellness),
    [dailyWellness],
  );

  const data = useMemo(
    () => computeReadinessScore(workoutHistory, readinessOpts),
    [workoutHistory, readinessOpts, tick],
  );

  const onWellnessChange = useCallback(
    (key, value) => setWellnessValue(key, value),
    [setWellnessValue],
  );

  const pct = (data.score / 10) * 100;
  const wPct = Math.round(READINESS_WEIGHTS.wellness * 100);
  const lPct = Math.round(READINESS_WEIGHTS.load * 100);
  const rPct = Math.round(READINESS_WEIGHTS.recovery * 100);

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Gotowość treningowa"
        subtitle="Upper/Lower · heatmapa + wellness"
        infoBody={PROFILE_INFO.readiness}
        compact
      />

      <View style={s.scoreRow}>
        <View style={s.gaugeWrap}>
          <View style={[s.gaugeTrack, { borderColor: colors.border }]}>
            <View
              style={[
                s.gaugeFill,
                { width: `${pct}%`, backgroundColor: data.color },
              ]}
            />
          </View>
          <Text style={[s.scoreBig, { color: data.color }]}>
            {data.score}
            <Text style={[s.scoreDenom, { color: colors.textSecondary }]}>/10</Text>
          </Text>
          <Text style={[s.scoreHint, { color: colors.textSecondary }]}>średnia Upper + Lower</Text>
        </View>
        <View style={s.metaCol}>
          <View style={[s.badge, { backgroundColor: `${data.color}22` }]}>
            <Text style={[s.badgeText, { color: data.color }]}>{data.label}</Text>
          </View>
          <Text style={[s.metaLine, { color: colors.textSecondary }]}>
            Wellness {data.wellnessSub}/10 ({wPct}%)
          </Text>
          <Text style={[s.metaLine, { color: colors.textSecondary }]}>
            Obciążenie {data.loadSub}/10 ({lPct}%)
          </Text>
          <Text style={[s.metaLine, { color: colors.textSecondary }]}>
            Regeneracja {data.recoverySub}/10 ({rPct}%)
          </Text>
        </View>
      </View>

      {data.splits && (
        <View style={s.splitRow}>
          <SplitChip label="Upper" split={data.splits.upper} colors={colors} />
          <SplitChip label="Lower" split={data.splits.lower} colors={colors} />
        </View>
      )}

      <WellnessCheckIn wellness={dailyWellness} onChange={onWellnessChange} />

      {data.acwr != null && (
        <Text style={[s.acwrLine, { color: colors.textSecondary }]}>
          ACWR: {data.acwr} · {data.acwrZone}
        </Text>
      )}

      {data.factors.length > 0 && (
        <View style={s.factors}>
          {data.factors.map((f, i) => (
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
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  gaugeWrap: { flex: 1 },
  gaugeTrack: { height: 10, borderRadius: 5, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  gaugeFill: { height: '100%', borderRadius: 5 },
  scoreBig: { fontSize: 42, fontWeight: '800', lineHeight: 46 },
  scoreDenom: { fontSize: 22, fontWeight: '600' },
  scoreHint: { fontSize: 10, marginTop: 2 },
  metaCol: { gap: 4, minWidth: 130 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 2 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  metaLine: { fontSize: 10 },
  splitRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  splitChip: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 0.5, gap: 4 },
  splitLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  splitScore: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  splitDenom: { fontSize: 14, fontWeight: '600' },
  splitMeta: { fontSize: 10, lineHeight: 14 },
  acwrLine: { fontSize: 11, marginTop: 10, textAlign: 'center' },
  factors: { marginTop: 12, gap: 6 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorImpact: { fontSize: 12, fontWeight: '700', width: 32 },
  factorText: { fontSize: 12, flex: 1 },
});
