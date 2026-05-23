import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import useBodyWeight from '../../hooks/useBodyWeight';
import { useProfileGoals } from '../../context/ProfileGoalsContext';
import { computeLevelSystem } from '../../utils/profileAnalytics';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

export default function LevelSystem({ onGenderToggle }) {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const [bodyWeightFromWorkout] = useBodyWeight(80);
  const { gender, setGender, currentWeight } = useProfileGoals();
  const bodyWeight = currentWeight || bodyWeightFromWorkout;

  const data = useMemo(
    () => computeLevelSystem(workoutHistory, bodyWeight, gender),
    [workoutHistory, bodyWeight, gender],
  );

  const toggleGender = () => {
    const next = gender === 'male' ? 'female' : 'male';
    setGender(next);
    onGenderToggle?.(next);
  };

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="System poziomów"
        infoBody={PROFILE_INFO.levels}
        right={
          <TouchableOpacity onPress={toggleGender} style={[s.genderBtn, { backgroundColor: colors.border }]}>
            <Text style={[s.genderText, { color: colors.textSecondary }]}>
              {gender === 'male' ? '♂ M' : '♀ K'}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={s.levelRow}>
        <View style={[s.levelCircle, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
          <Text style={[s.levelNum, { color: colors.accent }]}>{data.level}</Text>
        </View>
        <View style={s.levelInfo}>
          <Text style={[s.levelTitle, { color: colors.textPrimary }]}>{data.levelTitle}</Text>
          <Text style={[s.xpText, { color: colors.textSecondary }]}>
            {data.xp.toLocaleString('pl-PL')} XP · tonaż {Math.round(data.totalTonnage).toLocaleString('pl-PL')} kg
          </Text>
        </View>
      </View>

      <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[s.progressFill, { width: `${data.progress * 100}%`, backgroundColor: colors.accent }]} />
      </View>
      <Text style={[s.nextXp, { color: colors.textSecondary }]}>
        Do następnego poziomu: {Math.max(0, data.nextXp - data.xp).toLocaleString('pl-PL')} XP
      </Text>

      {(data.wilks || data.dots) && (
        <View style={s.coeffRow}>
          {data.wilks != null && (
            <View style={[s.coeffCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[s.coeffVal, { color: '#FAC775' }]}>{data.wilks}</Text>
              <Text style={[s.coeffLbl, { color: colors.textSecondary }]}>Wilks</Text>
            </View>
          )}
          {data.dots != null && (
            <View style={[s.coeffCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[s.coeffVal, { color: '#378ADD' }]}>{data.dots}</Text>
              <Text style={[s.coeffLbl, { color: colors.textSecondary }]}>Dots</Text>
            </View>
          )}
          {data.hasSbd && (
            <View style={[s.coeffCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[s.coeffVal, { color: colors.textPrimary }]}>{Math.round(data.sbdTotal)}</Text>
              <Text style={[s.coeffLbl, { color: colors.textSecondary }]}>SBD (kg)</Text>
            </View>
          )}
        </View>
      )}

      {!data.hasSbd && (
        <Text style={[s.hint, { color: colors.textSecondary }]}>
          Wilks/Dots pojawią się po treningach z przysiadami, wyciskaniem i martwym ciągiem.
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  genderBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  genderText: { fontSize: 12, fontWeight: '600' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  levelCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  levelNum: { fontSize: 24, fontWeight: '800' },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 18, fontWeight: '700' },
  xpText: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  nextXp: { fontSize: 11, marginBottom: 12 },
  coeffRow: { flexDirection: 'row', gap: 10 },
  coeffCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  coeffVal: { fontSize: 20, fontWeight: '800' },
  coeffLbl: { fontSize: 10, marginTop: 2 },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
