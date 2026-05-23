import { useMemo, useRef } from 'react';
import { Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import useBodyWeight from '../../hooks/useBodyWeight';
import { useProfileGoals } from '../../context/ProfileGoalsContext';
import { buildShareSummary, computeLevelSystem } from '../../utils/profileAnalytics';

function ShareCardContent({ summary, colors }) {
  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[card.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.accent }]}>
      <Text style={[card.brand, { color: colors.accent }]}>FITNESS APP</Text>
      <Text style={[card.headline, { color: colors.textPrimary }]}>
        Poziom {summary.level} · {summary.levelTitle}
      </Text>

      <View style={card.statsGrid}>
        <View style={card.statBox}>
          <Text style={[card.statNum, { color: colors.accent }]}>{summary.sessions}</Text>
          <Text style={[card.statLbl, { color: colors.textSecondary }]}>Treningi</Text>
        </View>
        <View style={card.statBox}>
          <Text style={[card.statNum, { color: colors.textPrimary }]}>
            {summary.tonnage >= 1000 ? `${(summary.tonnage / 1000).toFixed(1)}t` : summary.tonnage}
          </Text>
          <Text style={[card.statLbl, { color: colors.textSecondary }]}>Tonaż</Text>
        </View>
        <View style={card.statBox}>
          <Text style={[card.statNum, { color: '#FAC775' }]}>{summary.xp}</Text>
          <Text style={[card.statLbl, { color: colors.textSecondary }]}>XP</Text>
        </View>
      </View>

      {(summary.wilks || summary.dots) && (
        <View style={card.coeffLine}>
          {summary.wilks != null && (
            <Text style={[card.coeff, { color: colors.textSecondary }]}>Wilks {summary.wilks}</Text>
          )}
          {summary.dots != null && (
            <Text style={[card.coeff, { color: colors.textSecondary }]}>Dots {summary.dots}</Text>
          )}
        </View>
      )}

      <Text style={[card.footer, { color: colors.textSecondary }]}>
        Ostatni: {summary.lastWorkout} · {fmtDate(summary.lastDate)}
      </Text>
    </View>
  );
}

export default function SocialShareCard({ visible, onClose }) {
  const { workoutHistory } = useWorkoutContext();
  const { colors } = useTheme();
  const [bodyWeightFromWorkout] = useBodyWeight(80);
  const { gender, currentWeight } = useProfileGoals();
  const bodyWeight = currentWeight || bodyWeightFromWorkout;
  const cardRef = useRef(null);

  const levelData = useMemo(
    () => computeLevelSystem(workoutHistory, bodyWeight, gender),
    [workoutHistory, bodyWeight, gender],
  );

  const summary = useMemo(
    () => buildShareSummary(workoutHistory, levelData),
    [workoutHistory, levelData],
  );

  const handleShare = async () => {
    const tonStr = summary.tonnage >= 1000
      ? `${(summary.tonnage / 1000).toFixed(1)}t`
      : `${summary.tonnage} kg`;

    const lines = [
      '🏋️ Moje podsumowanie treningowe',
      `Poziom ${summary.level} — ${summary.levelTitle}`,
      `${summary.sessions} treningów · ${tonStr} tonażu · ${summary.xp} XP`,
    ];
    if (summary.wilks) lines.push(`Wilks: ${summary.wilks}`);
    if (summary.dots) lines.push(`Dots: ${summary.dots}`);
    lines.push('#FitnessApp #Trening');

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[s.sheet, { backgroundColor: colors.card }]}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
          <Text style={[s.title, { color: colors.textPrimary }]}>Podsumowanie Social</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Infografika gotowa do udostępnienia
          </Text>

          <View ref={cardRef} collapsable={false}>
            <ShareCardContent summary={summary} colors={colors} />
          </View>

          <TouchableOpacity
            style={[s.shareBtn, { backgroundColor: colors.accent }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.accentText ?? '#000'} />
            <Text style={[s.shareBtnText, { color: colors.accentText ?? '#000' }]}>Udostępnij</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={[s.closeText, { color: colors.textSecondary }]}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const card = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, borderWidth: 2, marginVertical: 16 },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  headline: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLbl: { fontSize: 10, marginTop: 2 },
  coeffLine: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  coeff: { fontSize: 12, fontWeight: '600' },
  footer: { fontSize: 11, marginTop: 4 },
});

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 4 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14, marginTop: 8 },
  shareBtnText: { fontSize: 16, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 14 },
  closeText: { fontSize: 15 },
});
