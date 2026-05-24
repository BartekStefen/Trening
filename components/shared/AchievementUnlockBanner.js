import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAchievements } from '../../context/AchievementsContext';
import { ACHIEVEMENT_TIERS } from '../../utils/achievements';

const DISMISS_MS = 4500;

export default function AchievementUnlockBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeToastBadge, dismissToast } = useAchievements();
  const slide = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeToastBadge) {
      Animated.timing(slide, { toValue: -120, duration: 220, useNativeDriver: true }).start();
      return undefined;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }).start();

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismissToast(), DISMISS_MS);

    return () => clearTimeout(timerRef.current);
  }, [activeToastBadge, dismissToast, slide]);

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
        activeOpacity={0.9}
        onPress={dismissToast}
        style={[s.banner, { backgroundColor: colors.card, borderColor: tier.color }]}
      >
        <View style={[s.iconWrap, { backgroundColor: `${tier.color}33`, borderColor: tier.color }]}>
          <Ionicons name={activeToastBadge.icon} size={24} color={tier.color} />
        </View>
        <View style={s.textCol}>
          <Text style={[s.kicker, { color: tier.color }]}>Odblokowano osiągnięcie!</Text>
          <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeToastBadge.title}
          </Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            Ranga: {tier.label}
          </Text>
        </View>
        <Ionicons name="close" size={20} color={colors.textTertiary} />
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
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  kicker: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12 },
});
