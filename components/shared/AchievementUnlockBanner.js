import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import BadgeShield from '../profile/BadgeShield';
import { ACHIEVEMENT_TIERS } from '../../utils/achievements';

const DISMISS_MS = 5000;

export default function AchievementUnlockBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeToastBadge, dismissToast } = useAchievements();
  const slide = useRef(new Animated.Value(-140)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeToastBadge) {
      Animated.timing(slide, { toValue: -140, duration: 220, useNativeDriver: true }).start();
      return undefined;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    slide.setValue(-140);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    glowLoop.start();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismissToast(), DISMISS_MS);

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
      clearTimeout(timerRef.current);
    };
  }, [activeToastBadge, dismissToast, slide, pulse, glow]);

  if (!activeToastBadge) return null;

  const tier = ACHIEVEMENT_TIERS[activeToastBadge.tier] ?? ACHIEVEMENT_TIERS.bronze;

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slide }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={dismissToast}
        style={[s.banner, { backgroundColor: colors.card, borderColor: `${tier.color}66` }]}
      >
        <View style={[s.accentStrip, { backgroundColor: tier.color }]} />

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <View style={[s.shieldGlow, { backgroundColor: tier.color, opacity: glow }]} />
          <BadgeShield
            badge={{ ...activeToastBadge, isUnlocked: true }}
            colors={colors}
            size="sm"
            showTitle={false}
            showProgress={false}
          />
        </Animated.View>

        <View style={s.textCol}>
          <Text style={[s.kicker, { color: tier.color }]}>Nowe osiągnięcie!</Text>
          <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeToastBadge.title}
          </Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Ranga {tier.label}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  accentStrip: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 8,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  shieldGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignSelf: 'center',
    top: -4,
  },
  textCol: { flex: 1, gap: 2 },
  kicker: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, fontWeight: '600' },
});
