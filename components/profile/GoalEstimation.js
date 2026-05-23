import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useProfileGoals } from '../../context/ProfileGoalsContext';
import { estimateGoalDate, getGoalMode } from '../../utils/profileAnalytics';
import { GOAL_INTENTS, targetCalories } from '../../utils/tdee';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

export default function GoalEstimation() {
  const { colors } = useTheme();
  const {
    onboardingCompleted,
    openOnboarding,
    currentWeight,
    targetWeight,
    dailyCalorieAdjustment,
    goalIntent,
    goalPace,
    tdee,
    gender,
    height,
    age,
    activityLevel,
  } = useProfileGoals();

  const displayMode = useMemo(
    () => getGoalMode(currentWeight, targetWeight),
    [currentWeight, targetWeight],
  );

  const intentMeta = GOAL_INTENTS.find((g) => g.id === goalIntent);
  const needsWeightGoal = intentMeta?.needsTarget ?? false;

  const result = useMemo(
    () => (needsWeightGoal
      ? estimateGoalDate(currentWeight, targetWeight, dailyCalorieAdjustment)
      : null),
    [needsWeightGoal, currentWeight, targetWeight, dailyCalorieAdjustment],
  );

  const kcalTarget = useMemo(
    () => (tdee != null ? targetCalories(tdee, goalPace) : null),
    [tdee, goalPace],
  );

  const isBulk = displayMode === 'bulk';
  const modeColor = isBulk ? '#378ADD' : colors.accent;
  const modeLabel = intentMeta?.label ?? (isBulk ? 'Masa' : 'Redukcja');

  const fmtDate = (d) =>
    d ? d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  if (!onboardingCompleted) {
    return (
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CardHeader title="Estymacja celu" infoBody={PROFILE_INFO.goal} />
        <Text style={[s.setupHint, { color: colors.textSecondary }]}>
          Uzupełnij profil startowy — wybierz cel (redukcja, masa, utrzymanie lub siła), parametry ciała i aktywność. Na tej podstawie wyliczymy TDEE i datę osiągnięcia celu.
        </Text>
        <TouchableOpacity style={[s.setupBtn, { backgroundColor: colors.accent }]} onPress={openOnboarding} activeOpacity={0.85}>
          <Ionicons name="rocket-outline" size={20} color={colors.accentText ?? '#000'} />
          <Text style={[s.setupBtnText, { color: colors.accentText ?? '#000' }]}>Skonfiguruj cel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Estymacja celu"
        infoBody={PROFILE_INFO.goal}
        right={
          <TouchableOpacity onPress={openOnboarding}>
            <Text style={[s.editBtn, { color: colors.accent }]}>Zmień cel</Text>
          </TouchableOpacity>
        }
      />

      <View style={[s.modeBadge, { backgroundColor: `${intentMeta?.color ?? modeColor}22`, alignSelf: 'flex-start', marginBottom: 12, marginTop: -4 }]}>
        <Text style={[s.modeBadgeText, { color: intentMeta?.color ?? modeColor }]}>{modeLabel}</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: colors.textPrimary }]}>{currentWeight} kg</Text>
          <Text style={[s.statLbl, { color: colors.textSecondary }]}>Obecna</Text>
        </View>
        {needsWeightGoal ? (
          <>
            <Text style={[s.arrow, { color: colors.borderMuted }]}>{isBulk ? '↗' : '↘'}</Text>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: modeColor }]}>{targetWeight} kg</Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Cel</Text>
            </View>
          </>
        ) : (
          <View style={s.stat}>
            <Text style={[s.statVal, { color: colors.textSecondary, fontSize: 14 }]}>bez zmian wagi</Text>
          </View>
        )}
      </View>

      {tdee != null && (
        <View style={[s.tdeeRow, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={s.tdeeItem}>
            <Text style={[s.tdeeLbl, { color: colors.textSecondary }]}>TDEE</Text>
            <Text style={[s.tdeeVal, { color: colors.textPrimary }]}>{tdee}</Text>
          </View>
          {kcalTarget != null && (
            <View style={s.tdeeItem}>
              <Text style={[s.tdeeLbl, { color: colors.textSecondary }]}>Cel kcal/d</Text>
              <Text style={[s.tdeeVal, { color: colors.accent }]}>{kcalTarget}</Text>
            </View>
          )}
          {needsWeightGoal && dailyCalorieAdjustment > 0 && (
            <View style={s.tdeeItem}>
              <Text style={[s.tdeeLbl, { color: colors.textSecondary }]}>
                {isBulk ? 'Nadwyżka' : 'Deficyt'}
              </Text>
              <Text style={[s.tdeeVal, { color: modeColor }]}>{dailyCalorieAdjustment}</Text>
            </View>
          )}
        </View>
      )}

      {result?.days ? (
        <View style={[s.resultBox, { backgroundColor: `${modeColor}18` }]}>
          <Text style={[s.resultDays, { color: modeColor }]}>~{result.days} dni</Text>
          <Text style={[s.resultDate, { color: colors.textPrimary }]}>
            Szacowana data: {fmtDate(result.date)}
          </Text>
          <Text style={[s.resultSub, { color: colors.textSecondary }]}>
            {result.weeklyChangeKg} kg/tydz. · na podstawie onboardingu
          </Text>
        </View>
      ) : (
        <Text style={[s.hint, { color: colors.textSecondary }]}>
          {goalIntent === 'strength'
            ? 'Cel: siła i moc — utrzymuj kalorie blisko TDEE i progresuj w treningu.'
            : goalIntent === 'maintain'
              ? 'Cel: utrzymanie wagi — jedz około TDEE bez deficytu ani nadwyżki.'
              : 'Zmień cel w onboardingu, aby zaktualizować estymację.'}
        </Text>
      )}

      <Text style={[s.meta, { color: colors.textTertiary }]}>
        {gender === 'female' ? '♀' : '♂'} · {height} cm · {age} lat · aktywność z profilu startowego
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  modeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  modeBadgeText: { fontSize: 11, fontWeight: '700' },
  editBtn: { fontSize: 14, fontWeight: '600' },
  setupHint: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  setupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  setupBtnText: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2 },
  arrow: { fontSize: 20 },
  tdeeRow: { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 },
  tdeeItem: { flex: 1, alignItems: 'center' },
  tdeeLbl: { fontSize: 10, marginBottom: 2 },
  tdeeVal: { fontSize: 16, fontWeight: '800' },
  resultBox: { borderRadius: 14, padding: 14, alignItems: 'center' },
  resultDays: { fontSize: 28, fontWeight: '800' },
  resultDate: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  resultSub: { fontSize: 11, marginTop: 4 },
  hint: { fontSize: 12, lineHeight: 17 },
  meta: { fontSize: 10, marginTop: 12, textAlign: 'center' },
});
