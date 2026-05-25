import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDietContext } from '../context/DietContext';
import { useProfileGoals } from '../context/ProfileGoalsContext';
import { DEFAULT_NUTRITION } from '../constants/dietNutrition';
import { targetCalories } from '../utils/tdee';
import CalorieThermometer from '../components/diet/CalorieThermometer';

// ─── Stałe konfiguracyjne ────────────────────────────────────────────────────

// Kolory makroskładników są semantyczne (zielony=białko, pomarańczowy=tłuszcz,
// niebieski=węgle) — niezależne od motywu aplikacji.
const MACRO_RANGES = {
  protein: { min: 150, max: 170, eaten: 120, color: '#00E676' },
  fat:     { min:  45, max:  55, eaten:  40, color: '#EF9F27' },
  carbs:   { min: 200, max: 230, eaten: 130, color: '#378ADD' },
};

const PORTION_ML = 250;

const MEALS = [
  { id: '1', name: 'Śniadanie',        emoji: '🌅', iconBg: 'rgba(255, 179,  71, 0.15)' },
  { id: '2', name: 'Drugie śniadanie', emoji: '🥐', iconBg: 'rgba(  0, 230, 118, 0.10)' },
  { id: '3', name: 'Lunch',            emoji: '🥗', iconBg: 'rgba(120, 200, 120, 0.12)' },
  { id: '4', name: 'Obiad',            emoji: '☀️', iconBg: 'rgba( 55, 138, 221, 0.12)' },
  { id: '5', name: 'Kolacja',          emoji: '🌙', iconBg: 'rgba(120, 120, 200, 0.15)' },
  { id: '6', name: 'Przekąski',        emoji: '🍎', iconBg: 'rgba(255, 100, 100, 0.12)' },
];

const generateWeekDays = () => {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + (i - 2));
    const isToday = i === 2;
    const dayName = isToday
      ? 'Dzisiaj'
      : date.toLocaleDateString('pl-PL', { weekday: 'short' });
    const dateKey = date.toISOString().slice(0, 10);
    return {
      id: String(i - 2),
      dateKey,
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNum: date.getDate(),
      isToday,
    };
  });
};

// ─── Komponent: pasek jednego makroskładnika ─────────────────────────────────
const MacroBar = ({ label, eaten, min, max, color, trackColor }) => {
  const target  = (min + max) / 2;
  const percent = Math.min((eaten / target) * 100, 100);

  return (
    <View style={macroStyles.wrapper}>
      <View style={macroStyles.headerRow}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={[macroStyles.range, { color }]}>{min}–{max}g</Text>
      </View>
      <View style={[macroStyles.track, { backgroundColor: trackColor }]}>
        <View style={[macroStyles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const macroStyles = StyleSheet.create({
  wrapper:   { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label:     { fontSize: 11, color: '#8E8E93' },
  range:     { fontSize: 11, fontWeight: '600' },
  track:     { height: 5, borderRadius: 5, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 5 },
});

// ─── Komponent: pojedyncza "butelka" wody ────────────────────────────────────
const WaterBottle = ({ filled, waterColor }) => (
  <View style={bottleStyles.wrapper}>
    <View style={[
      bottleStyles.shape,
      { borderColor: filled ? waterColor : '#3A3A3C' },
    ]}>
      <View style={[
        bottleStyles.liquid,
        { backgroundColor: filled ? waterColor : '#2C2C2E', height: filled ? '80%' : '100%' },
      ]} />
    </View>
    <Text style={bottleStyles.label}>250</Text>
  </View>
);

const bottleStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  shape: {
    width: 26, height: 42, borderRadius: 7,
    borderWidth: 1.5, overflow: 'hidden', justifyContent: 'flex-end',
  },
  liquid: { width: '100%', borderRadius: 4 },
  label:  { fontSize: 9, color: '#8E8E93' },
});

// ─── Główny komponent ekranu ─────────────────────────────────────────────────
export default function DietScreen() {
  const [activeDayId, setActiveDayId] = useState('0');
  const { colors } = useTheme();
  const {
    effectiveGoalMl, maxPortions, portionMl,
    getPortionsForDate, addWaterPortion,
    weatherBoostActive, weatherLabel, weatherHumidity, weatherLoading,
  } = useDietContext();
  const { tdee, goalPace } = useProfileGoals();
  const styles = makeStyles(colors);

  const weekDays    = generateWeekDays();
  const activeDay   = weekDays.find((d) => d.id === activeDayId) ?? weekDays[2];
  const filledPortions = getPortionsForDate(activeDay.dateKey);

  const goalKcal = useMemo(
    () => (tdee != null ? targetCalories(tdee, goalPace) : DEFAULT_NUTRITION.kcalGoal),
    [tdee, goalPace],
  );
  const eatenKcal = DEFAULT_NUTRITION.kcalEaten;
  const remaining = goalKcal - eatenKcal;
  const waterMl     = filledPortions * portionMl;

  const handleAddWater = () => {
    addWaterPortion(activeDay.dateKey);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.appName}>[ NAZWA APLIKACJI ]</Text>
      <Text style={styles.screenTitle}>Dieta</Text>

      {/* Pasek dni tygodnia */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
        style={styles.daysScroll}
      >
        {weekDays.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayChip,
              day.isToday && styles.dayChipToday,
              activeDayId === day.id && !day.isToday && styles.dayChipActive,
            ]}
            onPress={() => setActiveDayId(day.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>{day.dayName}</Text>
            <Text style={[styles.dayNum,  day.isToday && styles.dayNumToday]}>{day.dayNum}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Karta kalorii + makro */}
      <View style={styles.kcalCard}>
        <View style={styles.kcalRow}>
          <View>
            <Text style={styles.kcalLabel}>Zjedzone</Text>
            <Text style={styles.kcalValue}>{eatenKcal.toLocaleString('pl-PL')}</Text>
          </View>
          <View style={styles.kcalCenter}>
            <Text style={styles.kcalLabel}>Pozostało</Text>
            <Text style={[styles.kcalValue, remaining >= 0 ? styles.kcalGreen : styles.kcalRed]}>
              {Math.abs(remaining).toLocaleString('pl-PL')}
            </Text>
          </View>
          <View style={styles.kcalRight}>
            <Text style={styles.kcalLabel}>Cel</Text>
            <Text style={styles.kcalGoal}>{goalKcal.toLocaleString('pl-PL')} kcal</Text>
          </View>
        </View>

        <CalorieThermometer eaten={eatenKcal} goal={goalKcal} />

        <View style={styles.macroRow}>
          <MacroBar label="Białko"   {...MACRO_RANGES.protein} trackColor={colors.border} />
          <MacroBar label="Tłuszcze" {...MACRO_RANGES.fat}     trackColor={colors.border} />
          <MacroBar label="Węgle"    {...MACRO_RANGES.carbs}   trackColor={colors.border} />
        </View>
      </View>

      {/* Moduł nawodnienia */}
      <View style={styles.waterCard}>
        <View style={styles.waterTopRow}>
          <View style={styles.waterTitleGroup}>
            <View style={styles.waterIconWrapper}>
              <Ionicons name="water" size={20} color={colors.water} />
            </View>
            <View>
              <Text style={styles.waterTitle}>Nawodnienie</Text>
              <Text style={styles.waterSub}>
                {waterMl.toLocaleString('pl-PL')} / {effectiveGoalMl.toLocaleString('pl-PL')} ml
              </Text>
              {weatherBoostActive && activeDay.isToday && weatherLabel && (
                <Text style={[styles.waterHotBadge, { color: colors.water }]}>
                  {weatherLabel}
                  {weatherHumidity != null && weatherHumidity > 65 ? ` · wilg. ${Math.round(weatherHumidity)}%` : ''}
                </Text>
              )}
              {weatherLoading && activeDay.isToday && (
                <Text style={styles.waterLoading}>Sprawdzam pogodę…</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.waterAddButton}
            onPress={handleAddWater}
            activeOpacity={0.7}
            disabled={filledPortions >= maxPortions}
          >
            <Text style={[
              styles.waterAddTop,
              filledPortions >= maxPortions && styles.waterAddDisabled,
            ]}>+250</Text>
            <Text style={[
              styles.waterAddSub,
              filledPortions >= maxPortions && styles.waterAddDisabled,
            ]}>ml</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottlesRow}
        >
          {Array.from({ length: maxPortions }, (_, index) => (
            <WaterBottle key={index} filled={index < filledPortions} waterColor={colors.water} />
          ))}
        </ScrollView>
      </View>

      {/* Lista posiłków */}
      <Text style={styles.sectionTitle}>Posiłki</Text>

      {MEALS.map((meal) => (
        <TouchableOpacity key={meal.id} style={styles.mealCard} activeOpacity={0.7}>
          <View style={styles.mealLeft}>
            <View style={[styles.mealIconWrapper, { backgroundColor: meal.iconBg }]}>
              <Text style={styles.mealEmoji}>{meal.emoji}</Text>
            </View>
            <View>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealSub}>Brak wpisów</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
            <Ionicons name="add" size={22} color={colors.accent} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Style ───────────────────────────────────────────────────────────────────
const makeStyles = (c) => StyleSheet.create({
  screen:           { flex: 1, backgroundColor: c.background },
  contentContainer: { paddingBottom: 36 },

  appName: {
    textAlign: 'center', fontSize: 13, fontWeight: '500',
    color: c.borderMuted, letterSpacing: 2,
    paddingTop: 56, paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 32, fontWeight: '700', color: c.textPrimary,
    letterSpacing: 0.3, paddingHorizontal: 20, paddingBottom: 16,
  },

  daysScroll:    { marginBottom: 16 },
  daysContainer: { paddingHorizontal: 16, gap: 8 },
  dayChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', minWidth: 62,
  },
  dayChipToday:  { borderColor: c.accent, backgroundColor: c.accentSoft },
  dayChipActive: { borderColor: c.accent },
  dayName:       { fontSize: 11, color: c.textSecondary, marginBottom: 3 },
  dayNameToday:  { color: c.accent },
  dayNum:        { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  dayNumToday:   { color: c.accent },

  kcalCard: {
    backgroundColor: c.card, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, padding: 18, borderWidth: 0.5, borderColor: c.border,
  },
  kcalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kcalCenter: { alignItems: 'center' },
  kcalRight:  { alignItems: 'flex-end' },
  kcalLabel:  { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
  kcalValue:  { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  kcalGreen:  { color: c.accent },
  kcalRed:    { color: c.danger },
  kcalGoal:   { fontSize: 15, fontWeight: '500', color: c.textSecondary, marginTop: 4 },
  macroRow:     { flexDirection: 'row', gap: 12 },

  waterCard: {
    backgroundColor: c.card, marginHorizontal: 16, marginBottom: 24,
    borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: c.border,
  },
  waterTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  waterTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waterIconWrapper:{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.waterSoft, justifyContent: 'center', alignItems: 'center' },
  waterTitle:      { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  waterSub:        { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  waterHotBadge:   { fontSize: 11, fontWeight: '600', marginTop: 3 },
  waterLoading:    { fontSize: 10, color: c.textTertiary, marginTop: 2 },
  waterAddButton:  { backgroundColor: c.waterSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  waterAddTop:     { fontSize: 15, fontWeight: '700', color: c.water },
  waterAddSub:     { fontSize: 11, color: c.water, opacity: 0.7 },
  waterAddDisabled:{ color: c.borderMuted },
  bottlesRow:      { flexDirection: 'row', gap: 6, paddingVertical: 2 },

  sectionTitle: {
    fontSize: 20, fontWeight: '600', color: c.textPrimary,
    paddingHorizontal: 20, marginBottom: 12,
  },
  mealCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.card, marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: c.border,
  },
  mealLeft:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mealIconWrapper: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mealEmoji:       { fontSize: 20 },
  mealName:        { fontSize: 15, fontWeight: '500', color: c.textPrimary },
  mealSub:         { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  addButton: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center',
  },
});
