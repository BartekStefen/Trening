import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import CardHeader from './CardHeader';
import BadgeShield from './BadgeShield';
import AchievementCatalogModal from './AchievementCatalogModal';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';
import { pickPreviewBadges } from '../../utils/achievements';

export default function AchievementBadges() {
  const { colors } = useTheme();
  const { badges, unlockedCount, totalCount, hydrated } = useAchievements();
  const [catalogOpen, setCatalogOpen] = useState(false);

  const preview = useMemo(() => pickPreviewBadges(badges, 3), [badges]);

  if (!hydrated) return null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setCatalogOpen(true)}
        style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <CardHeader
          title="Osiągnięcia"
          subtitle={`${unlockedCount}/${totalCount} tarcz · stuknij, aby rozwinąć`}
          infoBody={PROFILE_INFO.badges}
          compact
          right={
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          }
        />

        <View style={s.previewRow}>
          {preview.map((badge) => (
            <View key={badge.id} style={s.previewSlot}>
              <BadgeShield badge={badge} colors={colors} />
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {catalogOpen ? (
        <AchievementCatalogModal
          visible
          onClose={() => setCatalogOpen(false)}
        />
      ) : null}
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
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewSlot: {
    flex: 1,
    alignItems: 'center',
  },
});
