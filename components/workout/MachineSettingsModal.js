import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const STORAGE_KEY = (name) => `machine_settings_${name.toLowerCase().replace(/\s+/g, '_')}`;

// ─── Opcje fotela 1-12 ────────────────────────────────────────────────────────
const SEAT_OPTIONS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

// ─── Typowe oznaczenia PIN ─────────────────────────────────────────────────────
const PIN_PRESETS = ['A','B','C','D','E','F','1','2','3','4','5','6','7','8','9','10'];

const MachineSettingsModal = ({ isVisible, exerciseName, onClose }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [seat, setSeat]         = useState('');
  const [pin, setPin]           = useState('');
  const [backrest, setBackrest] = useState('');
  const [notes, setNotes]       = useState('');
  const [saved, setSaved]       = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible || !exerciseName) return;
    setSaved(false);
    AsyncStorage.getItem(STORAGE_KEY(exerciseName)).then((raw) => {
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        setSeat(data.seat ?? '');
        setPin(data.pin ?? '');
        setBackrest(data.backrest ?? '');
        setNotes(data.notes ?? '');
        setLastSaved(data.savedAt ?? null);
      } catch {}
    });
  }, [isVisible, exerciseName]);

  const handleSave = async () => {
    const data = { seat, pin, backrest, notes, savedAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY(exerciseName), JSON.stringify(data));
    setLastSaved(data.savedAt);
    setSaved(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSaved(false));
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY(exerciseName));
    setSeat(''); setPin(''); setBackrest(''); setNotes('');
    setLastSaved(null);
  };

  const fmtDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.handle} />

        <View style={styles.topBar}>
          <View style={styles.iconCircle}>
            <Ionicons name="settings-outline" size={20} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ustawienia maszyny</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {lastSaved && (
            <View style={styles.savedBanner}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
              <Text style={styles.savedBannerText}>Zapisano: {fmtDate(lastSaved)}</Text>
            </View>
          )}

          {/* Fotel */}
          <Text style={styles.sectionLabel}>Pozycja fotela</Text>
          <View style={styles.chipRow}>
            {SEAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, seat === opt && styles.chipActive]}
                onPress={() => setSeat((v) => v === opt ? '' : opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, seat === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={seat}
            onChangeText={setSeat}
            placeholder="lub wpisz ręcznie (np. 3.5)"
            placeholderTextColor={colors.borderMuted}
            keyboardType="default"
          />

          {/* PIN */}
          <Text style={styles.sectionLabel}>Pozycja uchwytu / PIN</Text>
          <View style={styles.chipRow}>
            {PIN_PRESETS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, pin === opt && styles.chipActiveWarning]}
                onPress={() => setPin((v) => v === opt ? '' : opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, pin === opt && { color: '#000' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="lub wpisz ręcznie (np. 7 lub C3)"
            placeholderTextColor={colors.borderMuted}
            keyboardType="default"
          />

          {/* Oparcie */}
          <Text style={styles.sectionLabel}>Kąt oparcia / plecy</Text>
          <TextInput
            style={styles.input}
            value={backrest}
            onChangeText={setBackrest}
            placeholder="np. pionowo, 45°, poziomo"
            placeholderTextColor={colors.borderMuted}
          />

          {/* Notatki */}
          <Text style={styles.sectionLabel}>Dodatkowe uwagi</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="np. szeroki chwyt, łokcie przed tułowiem"
            placeholderTextColor={colors.borderMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Podgląd karty */}
          {(seat || pin || backrest || notes) && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>📋 Aktualne ustawienia</Text>
              <View style={styles.previewGrid}>
                {seat     && <View style={styles.previewItem}><Text style={styles.previewLabel}>Fotel</Text><Text style={styles.previewVal}>{seat}</Text></View>}
                {pin      && <View style={styles.previewItem}><Text style={styles.previewLabel}>PIN</Text><Text style={styles.previewVal}>{pin}</Text></View>}
                {backrest && <View style={styles.previewItem}><Text style={styles.previewLabel}>Oparcie</Text><Text style={styles.previewVal}>{backrest}</Text></View>}
              </View>
              {notes && <Text style={styles.previewNotes}>{notes}</Text>}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {(seat || pin || backrest || notes) && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name="save-outline" size={17} color={colors.accentText} />
            <Text style={styles.saveBtnText}>Zapisz ustawienia</Text>
          </TouchableOpacity>
        </View>

        {/* Animowany komunikat sukcesu */}
        {saved && (
          <Animated.View style={[styles.toastSuccess, { opacity: fadeAnim }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={styles.toastText}>Zapisano! ✓</Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (c) => StyleSheet.create({
  screen:      { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:      { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  topBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  iconCircle:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239,159,39,0.12)', justifyContent: 'center', alignItems: 'center' },
  title:       { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  subtitle:    { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },

  content:     { paddingHorizontal: 20, paddingBottom: 20, gap: 4 },

  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.accentSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  savedBannerText: { fontSize: 12, color: c.accent, fontWeight: '500' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    minWidth: 36, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10, backgroundColor: c.background,
    borderWidth: 1, borderColor: c.border,
    alignItems: 'center',
  },
  chipActive:        { backgroundColor: c.accent, borderColor: c.accent },
  chipActiveWarning: { backgroundColor: c.warning, borderColor: c.warning },
  chipText:          { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  chipTextActive:    { color: c.accentText },

  input: {
    backgroundColor: c.background,
    borderRadius: 12, borderWidth: 1, borderColor: c.border,
    color: c.textPrimary, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 4,
  },
  inputMulti: { minHeight: 72 },

  previewCard:  { backgroundColor: c.card, borderRadius: 14, borderWidth: 0.5, borderColor: c.border, padding: 14, marginTop: 16, gap: 8 },
  previewTitle: { fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.5 },
  previewGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewItem:  { alignItems: 'center', backgroundColor: c.backgroundSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: c.border },
  previewLabel: { fontSize: 9, color: c.textTertiary, letterSpacing: 0.5 },
  previewVal:   { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginTop: 2 },
  previewNotes: { fontSize: 12, color: c.textSecondary, lineHeight: 18, fontStyle: 'italic' },

  footer:      { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 0.5, borderTopColor: c.border },
  clearBtn:    { width: 46, height: 46, borderRadius: 12, backgroundColor: c.dangerSoft, justifyContent: 'center', alignItems: 'center' },
  saveBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent, borderRadius: 14, height: 46 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: c.accentText },

  toastSuccess: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.card, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: c.accent,
    shadowColor: c.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10,
    elevation: 10,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: c.accent },
});

export default MachineSettingsModal;
