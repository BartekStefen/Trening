import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import BadgeShield from './BadgeShield';
import {
  ACHIEVEMENT_TIERS,
  formatUnlockDate,
  getRemainingHint,
} from '../../utils/achievements';

/** Dolny sheet ze szczegółami odznaki (profil, katalog, podglądy). */
export default function BadgeDetailModal({ badge, visible, onClose }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { stats } = useAchievements();

  if (!badge) return null;

  const tier = ACHIEVEMENT_TIERS[badge.tier] ?? ACHIEVEMENT_TIERS.bronze;
  const progressPct = badge.progress != null ? Math.round(badge.progress * 100) : 0;
  const hint = !badge.isUnlocked ? getRemainingHint(badge, stats) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={s.backdropTap} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            s.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[s.handle, { backgroundColor: colors.borderMuted }]} />
          <View style={[s.accentBar, { backgroundColor: tier.color }]} />

          <View style={s.headerRow}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Szczegóły odznaki</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
          >
            <View style={s.hero}>
              <BadgeShield badge={badge} colors={colors} size="lg" showTitle={false} showProgress={false} />
              <Text style={[s.kicker, { color: tier.color }]}>{tier.label}</Text>
              <Text style={[s.title, { color: colors.textPrimary }]}>{badge.title}</Text>
              <Text style={[s.desc, { color: colors.textSecondary }]}>{badge.description}</Text>
            </View>

            {badge.isUnlocked ? (
              <View style={[s.statusBox, { backgroundColor: `${tier.color}18`, borderColor: tier.color }]}>
                <Ionicons name="checkmark-circle" size={20} color={tier.color} />
                <Text style={[s.statusText, { color: colors.textPrimary }]}>
                  Odblokowano · {formatUnlockDate(badge.unlockedAt)}
                </Text>
              </View>
            ) : (
              <View style={s.lockedBlock}>
                {badge.progress != null && (
                  <>
                    <View style={s.progressHead}>
                      <Text style={[s.progressLabel, { color: colors.textSecondary }]}>Postęp</Text>
                      <Text style={[s.progressVal, { color: tier.color }]}>{progressPct}%</Text>
                    </View>
                    <View style={[s.track, { backgroundColor: colors.border }]}>
                      <View style={[s.fill, { width: `${progressPct}%`, backgroundColor: tier.color }]} />
                    </View>
                  </>
                )}
                {hint ? (
                  <Text style={[s.hint, { color: colors.accent }]}>{hint}</Text>
                ) : (
                  <Text style={[s.hint, { color: colors.textTertiary }]}>
                    Kontynuuj treningi, aby odblokować
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 0.5,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  accentBar: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  hero: { alignItems: 'center', marginBottom: 16 },
  kicker: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 28,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusText: { fontSize: 14, fontWeight: '600', flex: 1 },
  lockedBlock: { gap: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressVal: { fontSize: 18, fontWeight: '800' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  hint: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
