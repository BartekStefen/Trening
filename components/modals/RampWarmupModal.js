import { useEffect, useState } from 'react';
import {
  Dimensions,
  InputAccessoryView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const WEIGHT_SOURCE_LABEL = {
  training: 'Z treningu (ostatni wpis)',
  manual: 'Ustawiony ręcznie',
  estimate: 'Szacunkowy',
};

const SHEET_MAX_RATIO = 0.94;
const SHEET_CHROME = 190;
const WEIGHT_INPUT_ACCESSORY_ID = 'rampWeightBlankAccessory';

export default function RampWarmupModal({
  isVisible,
  exerciseName,
  plan,
  onApply,
  onClose,
  onWorkingKgChange,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetMaxHeight = Dimensions.get('window').height * SHEET_MAX_RATIO;
  const scrollMaxHeight = sheetMaxHeight - SHEET_CHROME - Math.max(insets.bottom, 16);
  const styles = makeStyles(colors, insets.bottom, scrollMaxHeight);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setEditingWeight(false);
      setKeyboardHeight(0);
      return;
    }
    if (plan?.workingKg != null) {
      setWeightInput(String(plan.workingKg));
    }
  }, [isVisible, plan?.workingKg]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!plan) return null;

  const canApply = plan.applicable && !plan.alreadyApplied && plan.steps.length > 0;
  const sourceLabel = WEIGHT_SOURCE_LABEL[plan.weightSource] ?? 'Roboczy';

  const startEditWeight = () => {
    setWeightInput(plan.workingKg != null ? String(plan.workingKg) : '');
    setEditingWeight(true);
  };

  const confirmWeight = () => {
    const kg = parseFloat(weightInput.replace(',', '.'));
    if (!isNaN(kg) && kg > 0) {
      onWorkingKgChange?.(kg);
    }
    Keyboard.dismiss();
    setEditingWeight(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {!editingWeight && <Pressable style={styles.backdropPress} onPress={onClose} />}

        <View style={styles.sheet}>
          {!editingWeight && (
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          )}

          <View style={styles.headerRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239,159,39,0.15)' }]}>
              <Ionicons name="flame" size={22} color="#EF9F27" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {editingWeight ? 'Ciężar roboczy' : plan.title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {exerciseName}
              </Text>
            </View>
            {editingWeight && (
              <TouchableOpacity onPress={() => setEditingWeight(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {editingWeight ? (
            <ScrollView
              style={styles.editScroll}
              contentContainerStyle={[
                styles.editPanel,
                keyboardHeight > 0 && { paddingBottom: keyboardHeight - Math.max(insets.bottom, 0) + 12 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={[styles.livePreview, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                <Text style={[styles.livePreviewValue, { color: colors.textPrimary }]}>
                  {weightInput.length > 0 ? weightInput : '0'}
                </Text>
                <Text style={[styles.livePreviewUnit, { color: colors.accent }]}>kg</Text>
              </View>

              <Text style={[styles.rationale, { color: colors.textSecondary, textAlign: 'center' }]}>
                Wpisujesz ciężar roboczy — serie RAMP przeliczą się po zatwierdzeniu.
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.weightInput, {
                    color: colors.textPrimary,
                    borderColor: colors.accent,
                    backgroundColor: colors.background,
                  }]}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder="np. 80"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  selectTextOnFocus
                  inputAccessoryViewID={Platform.OS === 'ios' ? WEIGHT_INPUT_ACCESSORY_ID : undefined}
                />
                <Text style={[styles.unit, { color: colors.textSecondary }]}>kg</Text>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={confirmWeight} activeOpacity={0.8}>
                <Text style={styles.applyText}>Zastosuj ciężar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.border }]}
                onPress={() => setEditingWeight(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>Wróć</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
                bounces
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.rationale, { color: colors.textSecondary }]}>
                  {plan.rationale}
                </Text>

                {plan.workingKg != null ? (
                  <TouchableOpacity
                    style={[styles.workingChip, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                    onPress={startEditWeight}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.workingChipLabel, { color: colors.textSecondary }]}>
                        {sourceLabel} · kliknij, aby zmienić
                      </Text>
                      <Text style={[styles.workingChipText, { color: colors.accent }]}>
                        Ciężar roboczy: {plan.workingKg} kg
                      </Text>
                    </View>
                    <Ionicons name="create-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.workingChip, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
                    onPress={startEditWeight}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.workingChipText, { color: colors.accent }]}>
                        Wpisz ciężar roboczy
                      </Text>
                      <Text style={[styles.workingChipLabel, { color: colors.textSecondary, marginBottom: 0, marginTop: 3 }]}>
                        Wymagane do przeliczenia serii RAMP
                      </Text>
                    </View>
                    <Ionicons name="create-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                )}

                {plan.profile === 'bodyweight' && (
                  <View style={[styles.workingChip, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.workingChipText, { color: colors.accent }]}>
                      Docelowe powtórzenia: {plan.workingReps}
                    </Text>
                  </View>
                )}

                {plan.steps.map((step) => (
                  <View
                    key={step.id}
                    style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.stepTop}>
                      <Text style={[styles.stepNum, { color: '#EF9F27' }]}>Seria {step.id}</Text>
                      <Text style={[styles.stepLoad, { color: colors.textPrimary }]}>
                        {step.kg === 'BW' ? 'Masa ciała' : `${step.kg} kg`} × {step.reps} powt.
                      </Text>
                    </View>
                    <Text style={[styles.stepPct, { color: colors.textTertiary }]}>
                      {step.kg === 'BW'
                        ? `~${step.pct}% docelowych powtórzeń · przerwa ${step.restSec}s`
                        : `~${step.pct}% ciężaru roboczego · przerwa ${step.restSec}s`}
                    </Text>
                    <Text style={[styles.stepPurpose, { color: colors.textSecondary }]}>
                      {step.purpose}
                    </Text>
                  </View>
                ))}

                {plan.alreadyApplied && (
                  <View style={[styles.infoBox, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.accent }]}>
                      Rozgrzewka została już dodana do tego ćwiczenia.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                {canApply && (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={onApply}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#000" />
                    <Text style={styles.applyText}>
                      Zastosuj ({plan.steps.length}{' '}
                      {plan.steps.length === 1 ? 'seria' : plan.steps.length < 5 ? 'serie' : 'serii'})
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: colors.textPrimary }]}>Zamknij</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={WEIGHT_INPUT_ACCESSORY_ID}>
            <View style={styles.blankAccessory} />
          </InputAccessoryView>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (c, bottomInset, scrollMaxHeight) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: c.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: Math.max(bottomInset, 16),
    maxHeight: `${SHEET_MAX_RATIO * 100}%`,
    minHeight: Math.min(Dimensions.get('window').height * 0.72, Dimensions.get('window').height - 80),
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scroll: { maxHeight: Math.max(120, scrollMaxHeight) },
  scrollContent: { paddingBottom: 8 },
  editScroll: { flexGrow: 0, flexShrink: 1, maxHeight: Math.max(240, scrollMaxHeight + 40) },
  rationale: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  editPanel: { paddingBottom: Math.max(bottomInset, 12) },
  blankAccessory: { height: 0, width: 0 },
  livePreview: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  livePreviewValue: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  livePreviewUnit: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  weightInput: {
    flex: 1, borderRadius: 14, borderWidth: 2, fontSize: 32, fontWeight: '700',
    textAlign: 'center', paddingVertical: 14,
  },
  unit: { fontSize: 20, fontWeight: '600' },
  workingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    alignSelf: 'stretch', borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
  },
  workingChipLabel: { fontSize: 10, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  workingChipText: { fontSize: 15, fontWeight: '700' },
  stepCard: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  stepNum: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  stepLoad: { fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },
  stepPct: { fontSize: 11, marginBottom: 6 },
  stepPurpose: { fontSize: 12, lineHeight: 18 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginTop: 4 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { gap: 10, marginTop: 10, paddingTop: 4, flexShrink: 0 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    backgroundColor: '#EF9F27',
  },
  applyText: { fontSize: 16, fontWeight: '700', color: '#000' },
  cancelBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
});
