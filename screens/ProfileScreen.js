import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import VolumeChart from '../components/profile/VolumeChart';
import AnalyticsDashboard from '../components/profile/AnalyticsDashboard';
import AchievementBadges from '../components/profile/AchievementBadges';
import StrengthRingsPanel from '../components/profile/StrengthRingsPanel';
import SettingsModal from '../components/profile/SettingsModal';
import { SectionHeader } from '../components/profile/CardHeader';
import { PROFILE_INFO } from '../constants/profileInfoTexts';

const fmtDur = (s) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ─── Karta podglądu motywu ────────────────────────────────────────────────────
function ThemeCard({ theme, isActive, onSelect }) {
  const [bg, card, accent] = theme.preview;
  return (
    <TouchableOpacity
      style={[
        themeCardStyles.wrapper,
        { backgroundColor: card, borderColor: isActive ? accent : 'transparent' },
      ]}
      onPress={() => onSelect(theme.id)}
      activeOpacity={0.8}
    >
      {/* Miniaturowy podgląd kolorów */}
      <View style={[themeCardStyles.preview, { backgroundColor: bg }]}>
        <View style={[themeCardStyles.dot, { backgroundColor: card }]} />
        <View style={[themeCardStyles.dot, { backgroundColor: accent }]} />
        <View style={[themeCardStyles.bar,  { backgroundColor: accent, opacity: 0.4 }]} />
      </View>

      <View style={themeCardStyles.info}>
        <Text style={[themeCardStyles.name, { color: isActive ? accent : '#FFFFFF' }]}>
          {theme.label}
        </Text>
        <Text style={themeCardStyles.desc}>{theme.description}</Text>
      </View>

      {isActive && (
        <View style={[themeCardStyles.check, { backgroundColor: accent }]}>
          <Ionicons name="checkmark" size={13} color="#000000" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const themeCardStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    minHeight: 130,
  },
  preview: {
    height: 64,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  dot:  { width: 14, height: 14, borderRadius: 7 },
  bar:  { flex: 1, height: 6, borderRadius: 3 },
  info: { padding: 12, paddingTop: 10, flex: 1 },
  name: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  desc: { fontSize: 10, color: '#8E8E93', lineHeight: 14 },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Modal wyboru motywu ──────────────────────────────────────────────────────
function ThemePickerModal({ visible, onClose }) {
  const { themeId, setTheme, themes, colors } = useTheme();

  const handleSelect = (id) => {
    setTheme(id);
    onClose();
  };

  const themeList = Object.values(themes);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={pickerStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[pickerStyles.sheet, { backgroundColor: colors.card }]}>
        {/* Uchwyt */}
        <View style={[pickerStyles.handle, { backgroundColor: colors.border }]} />

        <Text style={[pickerStyles.title, { color: colors.textPrimary }]}>
          Wybierz motyw
        </Text>
        <Text style={[pickerStyles.subtitle, { color: colors.textSecondary }]}>
          Zmiana jest natychmiastowa i zapamiętana
        </Text>

        {/* Siatka 2 kolumny — działa dla dowolnej liczby motywów */}
        <View style={pickerStyles.grid}>
          {Array.from({ length: Math.ceil(themeList.length / 2) }, (_, i) =>
            themeList.slice(i * 2, i * 2 + 2)
          ).map((row, rowIdx) => (
            <View key={rowIdx} style={pickerStyles.row}>
              {row.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={themeId === theme.id}
                  onSelect={handleSelect}
                />
              ))}
              {/* Wypełniacz gdy rząd ma tylko 1 element (nieparzysty ostatni) */}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title:    { fontSize: 20, fontWeight: '700', marginBottom: 4, paddingHorizontal: 4 },
  subtitle: { fontSize: 13, marginBottom: 20, paddingHorizontal: 4 },
  grid:     { gap: 10 },
  row:      { flexDirection: 'row', gap: 10 },
});

// ─── Główny ekran profilu ─────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { workoutHistory, dailyHabits, toggleDailyHabit } = useWorkoutContext();
  const { colors } = useTheme();

  const styles = makeStyles(colors);

  const totalTonnage  = workoutHistory.reduce((a, w) => a + (w.tonnage ?? 0), 0);
  const totalSessions = workoutHistory.length;
  const lastWorkout   = workoutHistory[0];

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => setSettingsOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Statystyki zbiorcze */}
        <Text style={styles.sectionTitle}>Podsumowanie</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{totalSessions}</Text>
            <Text style={styles.statLbl}>Treningi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {totalTonnage > 0 ? `${Math.round(totalTonnage / 1000)}t` : '—'}
            </Text>
            <Text style={styles.statLbl}>Tonaż</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {lastWorkout ? fmtDur(lastWorkout.timerSec) : '—'}
            </Text>
            <Text style={styles.statLbl}>Ostatni</Text>
          </View>
        </View>

        <AchievementBadges />
        <StrengthRingsPanel />

        {/* Historia treningów */}
        <TouchableOpacity
          style={styles.historyBtn}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('WorkoutHistory')}
        >
          <View style={styles.historyLeft}>
            <View style={styles.historyIconBox}>
              <Ionicons name="time-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.historyTextBlock}>
              <Text style={styles.historyTitle}>Historia treningów</Text>
              <Text style={styles.historySub}>
                {totalSessions > 0
                  ? `${totalSessions} ${totalSessions === 1 ? 'sesja' : totalSessions < 5 ? 'sesje' : 'sesji'} · ostatnia ${lastWorkout ? new Date(lastWorkout.savedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''}`
                  : 'Brak zapisanych treningów'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.borderMuted} />
        </TouchableOpacity>

        {/* Wykresy objętości */}
        {totalSessions > 0 && (
          <View style={styles.chartSection}>
            <SectionHeader title="Statystyki objętości" infoBody={PROFILE_INFO.volume} />
            <VolumeChart />
          </View>
        )}

        {/* Moduł Profil i Analityka */}
        <AnalyticsDashboard />

        {/* Nawyki */}
        <SectionHeader title="Codzienne nawyki" infoBody={PROFILE_INFO.habits} />
        {dailyHabits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={styles.habitCard}
            onPress={() => toggleDailyHabit(habit.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, habit.done && styles.checkboxDone]}>
              {habit.done && <Ionicons name="checkmark" size={16} color={colors.accentText} />}
            </View>
            <View style={styles.habitTextWrapper}>
              <Text style={[styles.habitName, habit.done && styles.habitNameDone]}>
                {habit.name}
              </Text>
              <Text style={styles.habitSub}>
                {habit.done ? 'Dzisiaj: odhaczone ✓' : 'Dzisiaj: jeszcze nie'}
              </Text>
            </View>
            <Ionicons name={habit.icon} size={22} color={habit.done ? colors.borderMuted : colors.textSecondary} />
          </TouchableOpacity>
        ))}

      </ScrollView>

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenTheme={() => setThemePickerOpen(true)}
      />
      <ThemePickerModal
        visible={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
      />
    </>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen:           { flex: 1, backgroundColor: c.background },
  contentContainer: { paddingBottom: 40 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 32, fontWeight: '700', color: c.textPrimary, letterSpacing: 0.3 },
  gearBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: c.card, borderWidth: 0.5, borderColor: c.border,
    justifyContent: 'center', alignItems: 'center',
  },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: c.border },
  statVal:  { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 3 },
  statLbl:  { fontSize: 11, color: c.textSecondary },

  historyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.backgroundSecondary,
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: c.accentSoft,
  },
  historyLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  historyTextBlock: { flex: 1 },
  historyIconBox: { width: 44, height: 44, borderRadius: 13, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center' },
  historyTitle:   { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  historySub:     { fontSize: 12, color: c.textSecondary, marginTop: 3 },

  chartSection: { marginBottom: 24 },

  sectionTitle:       { fontSize: 20, fontWeight: '600', color: c.textPrimary, paddingHorizontal: 20, marginBottom: 12 },

  habitCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 18, padding: 16, borderWidth: 0.5, borderColor: c.border, gap: 14 },
  checkbox:        { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: c.borderMuted, justifyContent: 'center', alignItems: 'center' },
  checkboxDone:    { backgroundColor: c.accent, borderColor: c.accent },
  habitTextWrapper:{ flex: 1 },
  habitName:       { fontSize: 16, fontWeight: '500', color: c.textPrimary },
  habitNameDone:   { color: c.textSecondary },
  habitSub:        { fontSize: 12, color: c.textSecondary, marginTop: 3 },
});
