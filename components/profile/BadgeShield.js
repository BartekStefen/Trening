import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENT_TIERS } from '../../utils/achievements';

export default function BadgeShield({
  badge,
  colors,
  size = 'md',
  showTitle = true,
  showProgress = true,
}) {
  const tier = ACHIEVEMENT_TIERS[badge.tier] ?? ACHIEVEMENT_TIERS.bronze;
  const borderColor = badge.isUnlocked ? tier.color : colors.borderMuted;
  const bg = badge.isUnlocked ? `${tier.color}22` : colors.backgroundSecondary;
  const iconColor = badge.isUnlocked ? tier.color : colors.textTertiary;
  const progressPct = badge.progress != null ? Math.round(badge.progress * 100) : 0;

  const dims = size === 'sm'
    ? { shield: 36, icon: 18, title: 9 }
    : { shield: 44, icon: 22, title: 10 };

  return (
    <View style={s.wrap}>
      <View style={[s.shield, { width: dims.shield, height: dims.shield, borderRadius: dims.shield / 2, borderColor, backgroundColor: bg }]}>
        <Ionicons
          name={badge.isUnlocked ? badge.icon : 'lock-closed'}
          size={dims.icon}
          color={iconColor}
        />
      </View>
      {showTitle && (
        <Text
          style={[s.title, { fontSize: dims.title, color: badge.isUnlocked ? colors.textPrimary : colors.textTertiary }]}
          numberOfLines={2}
        >
          {badge.title}
        </Text>
      )}
      {showProgress && !badge.isUnlocked && badge.progress != null && badge.progress > 0 && (
        <View style={[s.track, { backgroundColor: colors.border }]}>
          <View style={[s.fill, { width: `${progressPct}%`, backgroundColor: tier.color }]} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, flex: 1 },
  shield: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
    minHeight: 26,
  },
  track: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
