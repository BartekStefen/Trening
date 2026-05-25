import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ACHIEVEMENT_TIERS } from '../../utils/achievements';

const SHIELD_PATH = 'M24 4 L42 10 L42 26 C42 38 34 46 24 50 C14 46 6 38 6 26 L6 10 Z';

export default function BadgeShield({
  badge,
  colors,
  size = 'md',
  showTitle = true,
  showProgress = true,
}) {
  const tier = ACHIEVEMENT_TIERS[badge.tier] ?? ACHIEVEMENT_TIERS.bronze;
  const unlocked = badge.isUnlocked;
  const borderColor = unlocked ? tier.color : colors.borderMuted;
  const progressPct = badge.progress != null ? Math.round(badge.progress * 100) : 0;

  const dims = size === 'sm'
    ? { w: 40, h: 46, icon: 16, title: 9 }
    : size === 'lg'
      ? { w: 72, h: 82, icon: 28, title: 12 }
      : { w: 48, h: 54, icon: 20, title: 10 };

  return (
    <View style={s.wrap}>
      <View style={[s.shieldWrap, { width: dims.w, height: dims.h }]}>
        {unlocked && (
          <View style={[s.glow, { backgroundColor: tier.color, width: dims.w + 12, height: dims.h + 8 }]} />
        )}
        <Svg width={dims.w} height={dims.h} viewBox="0 0 48 54">
          <Defs>
            <LinearGradient id={`shieldFill-${badge.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={unlocked ? tier.color : colors.borderMuted} stopOpacity={unlocked ? '0.35' : '0.2'} />
              <Stop offset="1" stopColor={unlocked ? tier.color : colors.backgroundSecondary} stopOpacity={unlocked ? '0.12' : '0.5'} />
            </LinearGradient>
          </Defs>
          <Path
            d={SHIELD_PATH}
            fill={`url(#shieldFill-${badge.id})`}
            stroke={borderColor}
            strokeWidth={unlocked ? 2.2 : 1.5}
          />
        </Svg>
        <View style={s.iconOverlay}>
          <Ionicons
            name={unlocked ? badge.icon : 'lock-closed'}
            size={dims.icon}
            color={unlocked ? tier.color : colors.textTertiary}
          />
        </View>
      </View>

      {showTitle && (
        <Text
          style={[s.title, { fontSize: dims.title, color: unlocked ? colors.textPrimary : colors.textTertiary }]}
          numberOfLines={2}
        >
          {badge.title}
        </Text>
      )}
      {showProgress && !unlocked && badge.progress != null && badge.progress > 0 && (
        <View style={s.progressBlock}>
          <View style={[s.track, { backgroundColor: colors.border }]}>
            <View style={[s.fill, { width: `${progressPct}%`, backgroundColor: tier.color }]} />
          </View>
          <Text style={[s.progressPct, { color: tier.color }]}>{progressPct}%</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, flex: 1 },
  shieldWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 20,
    opacity: 0.22,
    alignSelf: 'center',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
    minHeight: 26,
  },
  progressBlock: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'right',
  },
});
