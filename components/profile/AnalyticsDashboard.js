import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import LiveMuscleMap from '../LiveMuscleMap';
import useMuscleHeatmap from '../../hooks/useMuscleHeatmap';
import AsymmetryRadar from './AsymmetryRadar';
import FatigueForecast from './FatigueForecast';
import ReadinessScore from './ReadinessScore';
import GoalEstimation from './GoalEstimation';
import LevelSystem from './LevelSystem';
import ShadowRooms from './ShadowRooms';
import SocialShareCard from './SocialShareCard';
import CardHeader from './CardHeader';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

export default function AnalyticsDashboard({ habits = [] }) {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const [shareOpen, setShareOpen] = useState(false);

  const allExercises = useMemo(
    () => workoutHistory.flatMap((w) => w.exercises ?? []),
    [workoutHistory],
  );
  const heatmap = useMuscleHeatmap(allExercises);
  const hasHeatmap = Object.keys(heatmap).length > 0;

  return (
    <View style={s.wrap}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Analityka</Text>
        <TouchableOpacity
          style={[s.shareChip, { backgroundColor: colors.accentSoft }]}
          onPress={() => setShareOpen(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="share-outline" size={16} color={colors.accent} />
          <Text style={[s.shareChipText, { color: colors.accent }]}>Social</Text>
        </TouchableOpacity>
      </View>

      <ReadinessScore habits={habits} />
      <LevelSystem />
      <AsymmetryRadar />
      <FatigueForecast />
      <GoalEstimation />

      {hasHeatmap ? (
        <View style={[s.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.mapHeader}>
            <CardHeader
              title="Heatmapa sylwetki"
              subtitle="Kumulacja wszystkich treningów"
              infoBody={PROFILE_INFO.heatmap}
              compact
            />
          </View>
          <LiveMuscleMap heatmap={heatmap} />
        </View>
      ) : null}

      <ShadowRooms />

      <SocialShareCard visible={shareOpen} onClose={() => setShareOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  shareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareChipText: { fontSize: 12, fontWeight: '600' },
  mapCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    marginBottom: 16,
    alignItems: 'center',
  },
  mapHeader: { alignSelf: 'stretch', width: '100%' },
});
