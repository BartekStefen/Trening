import { useMemo } from 'react';
import {
  Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { useDietContext } from '../../context/DietContext';
import { getAudioModeShort, AUDIO_MODES } from '../../utils/audioAssistantConstants';
import { SETTING_DEFS, SETTING_SECTIONS } from '../../constants/appSettings';
import RingSettingsSection from './RingSettingsSection';

function SettingRow({
  def,
  colors,
  styles,
  valueLabel,
  onPress,
  onToggle,
  isOn,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${def.color}22` }]}>
          <Ionicons name={def.icon} size={20} color={def.color} />
        </View>
        <Text style={styles.cardTitle}>{def.title}</Text>
        {def.type === 'action' ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.control, styles.controlRow]}>
            <Text style={[styles.actionValue, { color: colors.accent }]}>{valueLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
          </TouchableOpacity>
        ) : def.type === 'cycle' ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.control}>
            <View style={[styles.badge, { backgroundColor: def.color }]}>
              <Text style={styles.badgeText}>{valueLabel}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Switch
            value={isOn}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: def.color }}
            thumbColor="#FFF"
            style={styles.control}
          />
        )}
      </View>

      <Text style={styles.description}>{def.description}</Text>
      {def.science ? (
        <View style={styles.scienceBox}>
          <Ionicons name="school-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.scienceText}>{def.science}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function SettingsModal({ visible, onClose, onOpenTheme }) {
  const { colors, themes, themeId } = useTheme();
  const {
    useRIR, toggleRIR,
    rampEnabled, toggleRamp,
    audioAssistantMode, cycleAudioAssistant,
    survivalModeEnabled, toggleSurvivalMode,
    autoDeloadEnabled, toggleAutoDeload,
  } = useWorkoutContext();
  const { weatherEnabled, toggleWeatherModifier } = useDietContext();

  const styles = useMemo(() => makeStyles(colors), [colors]);
  const activeThemeLabel = themes[themeId]?.label ?? 'Ciemny';

  const getValue = (id) => {
    switch (id) {
      case 'intensity': return useRIR;
      case 'ramp': return rampEnabled;
      case 'audio': return audioAssistantMode;
      case 'weather': return weatherEnabled;
      case 'survival': return survivalModeEnabled;
      case 'deload': return autoDeloadEnabled;
      default: return false;
    }
  };

  const getValueLabel = (id) => {
    if (id === 'theme') return activeThemeLabel;
    if (id === 'audio') return getAudioModeShort(audioAssistantMode);
    if (id === 'intensity') return useRIR ? 'RIR' : 'RPE';
    return getValue(id) ? 'Włączone' : 'Wyłączone';
  };

  const handleToggle = (id) => {
    switch (id) {
      case 'intensity': toggleRIR(); break;
      case 'ramp': toggleRamp(); break;
      case 'weather': toggleWeatherModifier(); break;
      case 'survival': toggleSurvivalMode(); break;
      case 'deload': toggleAutoDeload(); break;
      default: break;
    }
  };

  const handlePress = (id) => {
    if (id === 'theme') {
      onClose();
      onOpenTheme?.();
    } else if (id === 'audio') {
      cycleAudioAssistant();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.handle} />
        <View style={styles.topBar}>
          <Text style={styles.title}>Ustawienia</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Wszystkie funkcje aplikacji w jednym miejscu — z krótkim wyjaśnieniem, do czego służą.
        </Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {SETTING_SECTIONS.map((section) => (
            <View key={section.id}>
              {section.custom ? null : (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              {section.custom && section.id === 'rings' ? (
                <RingSettingsSection />
              ) : null}
              {section.items.map((itemId) => {
                const def = SETTING_DEFS[itemId];
                if (!def) return null;
                return (
                  <SettingRow
                    key={def.id}
                    def={def}
                    colors={colors}
                    styles={styles}
                    isOn={!!getValue(def.id)}
                    valueLabel={getValueLabel(def.id)}
                    onPress={() => handlePress(def.id)}
                    onToggle={() => handleToggle(def.id)}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  handle: {
    width: 36, height: 4, backgroundColor: c.borderMuted,
    borderRadius: 2, alignSelf: 'center', marginTop: 12,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: c.backgroundSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  subtitle: {
    fontSize: 13, color: c.textSecondary, lineHeight: 19,
    paddingHorizontal: 20, marginTop: 6, marginBottom: 8,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: c.textTertiary,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 10, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: c.card, borderRadius: 18, padding: 16,
    marginBottom: 10, borderWidth: 0.5, borderColor: c.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: c.textPrimary, lineHeight: 22 },
  control: { flexShrink: 0 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionValue: { fontSize: 14, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#000' },
  description: {
    fontSize: 13, color: c.textSecondary, lineHeight: 20, marginBottom: 8,
  },
  scienceBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: c.backgroundSecondary, borderRadius: 12,
    padding: 10, borderWidth: 0.5, borderColor: c.border,
  },
  scienceText: { flex: 1, fontSize: 11, color: c.textTertiary, lineHeight: 16 },
});
