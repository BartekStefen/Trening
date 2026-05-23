import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { computeAsymmetryStats } from '../../utils/profileAnalytics';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 72;

const polar = (angleDeg, radius) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
};

export default function AsymmetryRadar() {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const stats = useMemo(() => computeAsymmetryStats(workoutHistory), [workoutHistory]);

  if (!stats.hasData) {
    return (
      <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CardHeader
          title="Asymetria siły"
          infoBody={PROFILE_INFO.asymmetry}
          compact
        />
        <Text style={[s.emptyText, { color: colors.textSecondary }]}>
          Ukończ treningi, aby zobaczyć balans Push/Pull
        </Text>
      </View>
    );
  }

  const n = stats.values.length;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = stats.values.map((v, i) => {
    const angle = (360 / n) * i;
    return polar(angle, R * Math.max(v.normalized, 0.08));
  });

  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Asymetria siły"
        subtitle={stats.balanceHint}
        infoBody={PROFILE_INFO.asymmetry}
        compact
      />

      <View style={s.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          {gridLevels.map((lvl) => {
            const pts = stats.values.map((_, i) => {
              const angle = (360 / n) * i;
              return polar(angle, R * lvl);
            });
            return (
              <Polygon
                key={lvl}
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.border}
                strokeWidth={1}
              />
            );
          })}

          {stats.values.map((_, i) => {
            const angle = (360 / n) * i;
            const end = polar(angle, R);
            return (
              <Line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke={colors.border} strokeWidth={1} />
            );
          })}

          <Polygon
            points={polygonPoints}
            fill={`${colors.accent}33`}
            stroke={colors.accent}
            strokeWidth={2}
          />

          {dataPoints.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.accent} />
          ))}
        </Svg>

        <View style={s.legend}>
          {stats.values.map((v) => (
            <View key={v.key} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[s.legendLabel, { color: colors.textSecondary }]}>{v.label}</Text>
              <Text style={[s.legendVal, { color: colors.textPrimary }]}>
                {v.tonnage >= 1000 ? `${(v.tonnage / 1000).toFixed(1)}t` : `${v.tonnage} kg`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {stats.pushPullRatio !== null && (
        <View style={[s.ratioBadge, { backgroundColor: colors.accentSoft }]}>
          <Text style={[s.ratioText, { color: colors.accent }]}>
            Push : Pull = {stats.pushPullRatio} : 1
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:   { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  empty:  { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  legend: { flex: 1, marginLeft: 8, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 11, flex: 1 },
  legendVal: { fontSize: 11, fontWeight: '600' },
  ratioBadge: { marginTop: 12, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  ratioText: { fontSize: 12, fontWeight: '600' },
  chartWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
