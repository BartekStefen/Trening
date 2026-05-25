import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import CardHeader from './CardHeader';
import BadgeShield from './BadgeShield';
import AchievementCatalogModal from './AchievementCatalogModal';
import BadgeDetailModal from './BadgeDetailModal';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';
import {
  findClosestToUnlock,
  getRemainingHint,
  pickPreviewBadges,
  ACHIEVEMENT_TIERS,
} from '../../utils/achievements';

export default function AchievementBadges() {
  const { colors } = useTheme();
  const { badges, unlockedCount, totalCount, hydrated, stats } = useAchievements();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [detailBadge, setDetailBadge] = useState(null);

  const preview = useMemo(() => pickPreviewBadges(badges, 3), [badges]);
  const closest = useMemo(() => findClosestToUnlock(badges), [badges]);
  const closestHint = closest ? getRemainingHint(closest, stats) : null;
  const closestPct = closest?.progress != null ? Math.round(closest.progress * 100) : 0;
  const closestTier = closest ? ACHIEVEMENT_TIERS[closest.tier] : null;

  if (!hydrated) return null;

  return (
    <>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => setCatalogOpen(true)}>
          <CardHeader
            title="Osiągnięcia"
            subtitle={`${unlockedCount}/${totalCount} tarcz · stuknij, aby rozwinąć`}
            infoBody={PROFILE_INFO.badges}
            compact
            right={
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            }
          />
        </TouchableOpacity>

        {closest && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setDetailBadge(closest)}
            style={[
              s.closestBox,
              {
                backgroundColor: `${closestTier?.color ?? colors.accent}14`,
                borderColor: `${closestTier?.color ?? colors.accent}44`,
              },
            ]}
          >
            <View style={s.closestLeft}>
              <Text style={[s.closestKicker, { color: closestTier?.color ?? colors.accent }]}>
                Prawie masz
              </Text>
              <Text style={[s.closestTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {closest.title}
              </Text>
              {closestHint ? (
                <Text style={[s.closestHint, { color: colors.textSecondary }]} numberOfLines={1}>
                  {closestHint}
                </Text>
              ) : null}
            </View>
            <Text style={[s.closestPct, { color: closestTier?.color ?? colors.accent }]}>
              {closestPct}%
            </Text>
          </TouchableOpacity>
        )}

        <View style={s.previewRow}>
          {preview.map((badge) => (
            <TouchableOpacity
              key={badge.id}
              style={s.previewSlot}
              activeOpacity={0.85}
              onPress={() => setDetailBadge(badge)}
            >
              <BadgeShield badge={badge} colors={colors} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {catalogOpen ? (
        <AchievementCatalogModal
          visible
          onClose={() => setCatalogOpen(false)}
          onSelectBadge={(b) => {
            setCatalogOpen(false);
            setDetailBadge(b);
          }}
        />
      ) : null}

      <BadgeDetailModal
        badge={detailBadge}
        visible={detailBadge != null}
        onClose={() => setDetailBadge(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    marginBottom: 16,
  },
  closestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  closestLeft: { flex: 1, gap: 2 },
  closestKicker: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  closestTitle: { fontSize: 14, fontWeight: '700' },
  closestHint: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  closestPct: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewSlot: {
    flex: 1,
    alignItems: 'center',
  },
});
