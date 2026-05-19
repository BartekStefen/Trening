import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// ─── Stałe konfiguracyjne ────────────────────────────────────────────────────

const DAILY_GOAL_KCAL = 3000;
const EATEN_KCAL      = 1500;

// Widełki makroskładników zamiast jednej wartości docelowej –
// bardziej realistyczne podejście do diety (tolerancja ±10–15g)
const MACRO_RANGES = {
  protein: { min: 150, max: 170, eaten: 120, color: '#00E676' },
  fat:     { min:  45, max:  55, eaten:  40, color: '#EF9F27' },
  carbs:   { min: 200, max: 230, eaten: 130, color: '#378ADD' },
};

// Każda porcja wody = 250 ml (standardowa szklanka).
// WATER_PORTIONS to łączna liczba "butelek" widocznych na ekranie.
// Cel 2500 ml = 10 porcji po 250 ml – stąd 10 kafelków
const PORTION_ML     = 250;
const WATER_GOAL_ML  = 2500;
const WATER_PORTIONS = WATER_GOAL_ML / PORTION_ML; // = 10

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
    return {
      id: String(i - 2),
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNum: date.getDate(),
      isToday,
    };
  });
};

// ─── Komponent: pasek jednego makroskładnika ─────────────────────────────────
// Przyjmuje widełki (min/max) zamiast jednej wartości – pasek wypełnia się
// proporcjonalnie do środka przedziału, żeby odzwierciedlić "cel optymalny"
const MacroBar = ({ label, eaten, min, max, color }) => {
  const target  = (min + max) / 2;
  const percent = Math.min((eaten / target) * 100, 100);

  return (
    <View style={macroStyles.wrapper}>
      <View style={macroStyles.headerRow}>
        <Text style={macroStyles.label}>{label}</Text>
        {/* Widełki jako "X–Yg" – użytkownik widzi dopuszczalny przedział, nie sztywną granicę */}
        <Text style={[macroStyles.range, { color }]}>{min}–{max}g</Text>
      </View>
      <View style={macroStyles.track}>
        <View style={[macroStyles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const macroStyles = StyleSheet.create({
  wrapper:    { flex: 1 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label:      { fontSize: 11, color: '#8E8E93' },
  range:      { fontSize: 11, fontWeight: '600' },
  track:      { height: 5, backgroundColor: '#2C2C2E', borderRadius: 5, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 5 },
});

// ─── Komponent: pojedyncza "butelka" wody ────────────────────────────────────
// Każda butelka = 250 ml. Wypełnienie (niebieskie tło) vs pustka (ciemnoszare)
// daje natychmiastowy, wizualny feedback bez czytania liczb
const WaterBottle = ({ filled }) => (
  <View style={bottleStyles.wrapper}>
    <View style={[bottleStyles.shape, filled ? bottleStyles.shapeFull : bottleStyles.shapeEmpty]}>
      {/* Wypełnienie od dołu – height: '80%' zostawia widoczną "przestrzeń powietrza" */}
      <View style={[
        bottleStyles.liquid,
        { backgroundColor: filled ? '#378ADD' : '#2C2C2E', height: filled ? '80%' : '100%' }
      ]} />
    </View>
    <Text style={bottleStyles.label}>250</Text>
  </View>
);

const bottleStyles = StyleSheet.create({
  wrapper:    { alignItems: 'center', gap: 4 },
  shape: {
    width: 26,
    height: 42,
    borderRadius: 7,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end', // liquid "leży" na dnie butelki
  },
  shapeFull:  { borderColor: '#378ADD' },
  shapeEmpty: { borderColor: '#3A3A3C' },
  liquid:     { width: '100%', borderRadius: 4 },
  label:      { fontSize: 9, color: '#8E8E93' },
});

// ─── Główny komponent ekranu ─────────────────────────────────────────────────
export default function DietScreen() {
  // filledPortions = liczba "zapełnionych" butelek (0–10).
  // Każde kliknięcie +250ml zwiększa licznik o 1, co zmienia wygląd kolejnej butelki
  const [filledPortions, setFilledPortions] = useState(0);
  const [activeDayId, setActiveDayId]       = useState('0');

  const weekDays    = generateWeekDays();
  const remaining   = DAILY_GOAL_KCAL - EATEN_KCAL;
  const kcalPercent = Math.min((EATEN_KCAL / DAILY_GOAL_KCAL) * 100, 100);
  const waterMl     = filledPortions * PORTION_ML;

  const handleAddWater = () => {
    // Math.min zapobiega przekroczeniu limitu WATER_PORTIONS (10 butelek)
    setFilledPortions((prev) => Math.min(prev + 1, WATER_PORTIONS));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Nagłówek ── */}
      <Text style={styles.appName}>[ NAZWA APLIKACJI ]</Text>
      <Text style={styles.screenTitle}>Dieta</Text>

      {/* ── Pasek dni tygodnia ── */}
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

      {/* ── Karta kalorii + makro w widełkach ── */}
      <View style={styles.kcalCard}>
        <View style={styles.kcalRow}>
          <View>
            <Text style={styles.kcalLabel}>Zjedzone</Text>
            <Text style={styles.kcalValue}>{EATEN_KCAL.toLocaleString('pl-PL')}</Text>
          </View>
          <View style={styles.kcalCenter}>
            <Text style={styles.kcalLabel}>Pozostało</Text>
            <Text style={[styles.kcalValue, remaining >= 0 ? styles.kcalGreen : styles.kcalRed]}>
              {Math.abs(remaining).toLocaleString('pl-PL')}
            </Text>
          </View>
          <View style={styles.kcalRight}>
            <Text style={styles.kcalLabel}>Cel</Text>
            <Text style={styles.kcalGoal}>{DAILY_GOAL_KCAL.toLocaleString('pl-PL')} kcal</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${kcalPercent}%`, backgroundColor: '#00E676' }]} />
        </View>

        <View style={styles.macroRow}>
          <MacroBar label="Białko"   {...MACRO_RANGES.protein} />
          <MacroBar label="Tłuszcze" {...MACRO_RANGES.fat}     />
          <MacroBar label="Węgle"    {...MACRO_RANGES.carbs}   />
        </View>
      </View>

      {/* ── Moduł nawodnienia – nowa pozycja: przed listą posiłków ── */}
      <View style={styles.waterCard}>
        {/* Górny rząd: ikona + tytuł + licznik ml + przycisk +250ml */}
        <View style={styles.waterTopRow}>
          <View style={styles.waterTitleGroup}>
            <View style={styles.waterIconWrapper}>
              <Ionicons name="water" size={20} color="#378ADD" />
            </View>
            <View>
              <Text style={styles.waterTitle}>Nawodnienie</Text>
              {/* Wyświetlamy aktualny stan w ml, wyliczony z liczby porcji */}
              <Text style={styles.waterSub}>
                {waterMl.toLocaleString('pl-PL')} / {WATER_GOAL_ML.toLocaleString('pl-PL')} ml
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.waterAddButton}
            onPress={handleAddWater}
            activeOpacity={0.7}
            // Blokujemy przycisk po osiągnięciu celu – opcjonalne, ale zapobiega
            // przypadkowemu nadpisaniu stanu po osiągnięciu 2500 ml
            disabled={filledPortions >= WATER_PORTIONS}
          >
            <Text style={[
              styles.waterAddTop,
              filledPortions >= WATER_PORTIONS && styles.waterAddDisabled
            ]}>+250</Text>
            <Text style={[
              styles.waterAddSub,
              filledPortions >= WATER_PORTIONS && styles.waterAddDisabled
            ]}>ml</Text>
          </TouchableOpacity>
        </View>

        {/* Rząd butelek – renderujemy dokładnie WATER_PORTIONS (10) elementów.
            Array.from z funkcją mapującą to czystszy zapis niż tworzenie tablicy indeksów */}
        <View style={styles.bottlesRow}>
          {Array.from({ length: WATER_PORTIONS }, (_, index) => (
            <WaterBottle key={index} filled={index < filledPortions} />
          ))}
        </View>
      </View>

      {/* ── Lista posiłków – bez zmian względem v2 ── */}
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
            <Ionicons name="add" size={22} color="#00E676" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Style ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#000000' },
  contentContainer: { paddingBottom: 36 },

  // --- Nagłówek ---
  appName: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#3A3A3C',
    letterSpacing: 2,
    paddingTop: 56,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // --- Dni tygodnia ---
  daysScroll:     { marginBottom: 16 },
  daysContainer:  { paddingHorizontal: 16, gap: 8 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    minWidth: 62,
  },
  dayChipToday:   { borderColor: '#00E676', backgroundColor: 'rgba(0, 230, 118, 0.10)' },
  dayChipActive:  { borderColor: '#00E676' },
  dayName:        { fontSize: 11, color: '#8E8E93', marginBottom: 3 },
  dayNameToday:   { color: '#00E676' },
  dayNum:         { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  dayNumToday:    { color: '#00E676' },

  // --- Karta kalorii ---
  kcalCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  kcalRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  kcalCenter: { alignItems: 'center' },
  kcalRight:  { alignItems: 'flex-end' },
  kcalLabel:  { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  kcalValue:  { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  kcalGreen:  { color: '#00E676' },
  kcalRed:    { color: '#FF453A' },
  kcalGoal:   { fontSize: 15, fontWeight: '500', color: '#8E8E93', marginTop: 4 },
  progressTrack: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 8 },
  macroRow:   { flexDirection: 'row', gap: 12 },

  // --- Karta nawodnienia ---
  waterCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  waterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(55, 138, 221, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  waterSub:   { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  waterAddButton: {
    backgroundColor: 'rgba(55, 138, 221, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  waterAddTop:     { fontSize: 15, fontWeight: '700', color: '#378ADD' },
  waterAddSub:     { fontSize: 11, color: '#378ADD', opacity: 0.7 },
  // Wizualna informacja że przycisk jest nieaktywny po osiągnięciu celu
  waterAddDisabled:{ color: '#3A3A3C' },

  // Butelki wypełniają cały wiersz równomiernie bez ręcznych marginesów
  bottlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // --- Lista posiłków ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  mealLeft:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mealIconWrapper: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mealEmoji:      { fontSize: 20 },
  mealName:       { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  mealSub:        { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});