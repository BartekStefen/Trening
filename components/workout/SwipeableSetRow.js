import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useWorkoutContext } from '../../context/WorkoutContext';
import { repsForVolume, formatPlannedRepsDisplay } from '../../utils/repsUtils';

const GYM_KEYWORDS = [
  'kg','kilo','powt','rep','rpe','rir','zapas','seri','max','maksa','pr','rekord',
  'wycisk','sztang','hantl','law','maszyn','wyciag','suwnic','gryf','talerz',
  'ciezar','obciazeni','gum','siad','ciag','martwy','pomp','podciag',
  'brzuch','klat','plec','biceps','triceps','nog','lekko','ciezko','git',
  'okej','ok','izi','izzi','luz','luzno','upadek','smierc','masakra',
  'gladko','opor','zajechany','zrobion','poszlo','wzia','dorzuc','odejmij',
  'zaloz','okolo','czuj','nastepn',
];

const normalize = (str) =>
  (str ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const analyzeWorkoutNote = async ({ note, uiKg, uiReps }) => {
  const raw        = (note ?? '').trim();
  const normalized = normalize(raw);
  if (!raw && !uiKg) return { type: 'empty', message: 'Opisz serię lub uzupełnij pola kg / RPE.' };
  const hasGymKw = GYM_KEYWORDS.some((kw) => normalized.includes(kw));
  if (raw && !hasGymKw) return { type: 'blocked', message: '❌ Odrzucono: temat niezwiązany z treningiem.' };
  const kgMatch       = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo(?:gram)?)/);
  const extractedKg   = kgMatch ? parseFloat(kgMatch[1].replace(',', '.')) : null;
  const repsMatch     = normalized.match(/(?:na|x)\s*(\d+)|(\d+)\s*powt/);
  const extractedReps = repsMatch ? parseInt(repsMatch[1] ?? repsMatch[2]) : null;
  const currentKg     = extractedKg   ?? parseFloat(uiKg)  ?? null;
  const currentReps   = extractedReps ?? parseInt(uiReps)   ?? null;
  if (!currentKg) return { type: 'error', message: '❌ Nie znaleziono ciężaru.' };
  const rirMatch = normalized.match(/(?:zapas(?:u|em)?|zostalo)\s*(?:na\s*)?(\d+)/i);
  const rpeMatch = normalized.match(/rpe\s*(\d+(?:[.,]\d+)?)/i);
  let rir = null;
  if (rirMatch)                                    rir = parseInt(rirMatch[1]);
  else if (rpeMatch)                               rir = Math.max(0, 10 - parseFloat(rpeMatch[1].replace(',', '.')));
  else if (/\b(?:max|upadek)\b/.test(normalized))  rir = 0;
  if (rir !== null) {
    let deltaKg, findings, decision;
    if (rir >= 3)      { deltaKg = 5;   findings = `Duży zapas (RIR ${rir})`;        decision = '+5 kg'; }
    else if (rir >= 1) { deltaKg = 2.5; findings = `Umiarkowany zapas (RIR ${rir})`; decision = '+2.5 kg'; }
    else               { deltaKg = 0;   findings = 'RIR 0 – limit';                  decision = 'Utrzymaj'; }
    const newKg = Math.round(Math.max(0, currentKg + deltaKg) * 2) / 2;
    return { type: 'math', status: 'Analiza lokalna (RIR)', findings, decision, suggestedKg: newKg, suggestedReps: currentReps };
  }
  const EASY = ['lekko','git','izzi','okej','ok','izi','luz','luzno','gladko','poszlo'];
  const HARD = ['ciezko','smierc','masakra','opor','zajechany'];
  if (EASY.some((kw) => normalized.includes(kw))) {
    const newKg = Math.round(Math.max(0, currentKg + 2.5) * 2) / 2;
    return { type: 'keyword', status: 'Analiza lokalna', findings: 'Niskie RPE', decision: '+2.5 kg', suggestedKg: newKg, suggestedReps: currentReps };
  }
  if (HARD.some((kw) => normalized.includes(kw))) {
    return { type: 'keyword', status: 'Analiza lokalna', findings: 'Przeciążenie', decision: 'Utrzymaj', suggestedKg: currentKg, suggestedReps: currentReps };
  }
  try {
    await new Promise((res) => setTimeout(res, 1500));
    return { type: 'cloud', status: 'Cloud AI', findings: 'Złożony wzorzec', decision: 'Deload -5 kg', suggestedKg: currentKg, suggestedReps: currentReps };
  } catch {
    return { type: 'offline', message: '⚠️ Brak sieci. Wpisz "zapas X" lub "rpe X".' };
  }
};

const ProgressArrow = ({ value, suggestedKg }) => {
  const num = parseFloat(value);
  if (!value || isNaN(num) || suggestedKg == null) return <View style={{ width: 14 }} />;
  if (num > suggestedKg) return <Ionicons name="arrow-up"   size={12} color="#00E676" />;
  if (num < suggestedKg) return <Ionicons name="arrow-down" size={12} color="#FF453A" />;
  return <Ionicons name="remove" size={11} color="#636366" />;
};

// ─── RPE Picker inline ────────────────────────────────────────────────────────
const RPE_VALUES = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];

const rpeToRir = (rpe) => {
  const n = parseFloat(rpe);
  return isNaN(n) ? null : Math.max(0, Math.round(10 - n));
};

const RpeInlinePicker = ({ currentRpe, onSelect, onClose, colors, useRIR, isReminder }) => {
  const styles = makeStyles(colors);
  return (
    <View style={styles.rpePicker}>
      <View style={styles.rpePickerHeader}>
        <Ionicons name="flame-outline" size={13} color={colors.warning} />
        <Text style={styles.rpePickerTitle}>
          {isReminder
            ? (useRIR ? 'Potwierdź RIR po serii' : 'Potwierdź RPE po serii')
            : (useRIR ? 'RIR — powtórzenia w zapasie' : 'RPE — wybierz intensywność')}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={styles.rpePickerRow}>
        {RPE_VALUES.map((val) => {
          const rir = rpeToRir(val);
          return (
            <TouchableOpacity
              key={val}
              style={[
                styles.rpeBtn,
                currentRpe === val && styles.rpeBtnActive,
                parseFloat(val) >= 9.5 && styles.rpeBtnDanger,
              ]}
              onPress={() => { onSelect(val); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.rpeBtnText,
                currentRpe === val && styles.rpeBtnTextActive,
                parseFloat(val) >= 9.5 && styles.rpeBtnTextDanger,
              ]}>
                {useRIR ? rir : val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.rpeScale}>
        {useRIR ? (
          <>
            <Text style={styles.rpeScaleTip}>4 = bardzo lekko</Text>
            <Text style={styles.rpeScaleTip}>0 = do upadku</Text>
          </>
        ) : (
          <>
            <Text style={styles.rpeScaleTip}>6 = bardzo lekko</Text>
            <Text style={styles.rpeScaleTip}>10 = do upadku</Text>
          </>
        )}
      </View>
    </View>
  );
};

const SmartInsightCard = ({ progression, uiKg, uiReps, onCascadeUpdate }) => {
  const [note, setNote]       = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef(null);
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!note.trim()) { setResult(null); setLoading(false); return; }
    const normalized = normalize(note);
    const isInstant  = GYM_KEYWORDS.some((kw) => normalized.includes(kw));
    const run = async () => {
      if (!isInstant) setLoading(true);
      const r = await analyzeWorkoutNote({ note, uiKg, uiReps });
      setLoading(false);
      setResult(r);
      if (r.suggestedKg != null && r.type !== 'blocked') onCascadeUpdate?.(r.suggestedKg, r.suggestedReps);
    };
    if (isInstant) run(); else debounceRef.current = setTimeout(run, 400);
    return () => clearTimeout(debounceRef.current);
  }, [note, uiKg, uiReps]);

  return (
    <View style={styles.aiCard}>
      <TextInput
        style={styles.aiInput}
        value={note}
        onChangeText={setNote}
        placeholder='np. "zapas 2" lub "lekko"'
        placeholderTextColor={colors.borderMuted}
        multiline
        numberOfLines={2}
        keyboardType="default"
      />
      {loading && <Text style={styles.aiLoading}>🤖 Analizuję...</Text>}
      {!loading && !result && (
        <Text style={styles.aiHint}>
          APRE: <Text style={{ color: colors.library, fontWeight: '700' }}>{progression?.label ?? '—'}</Text>
        </Text>
      )}
      {!loading && result && ['error','spam','offline','empty','blocked'].includes(result.type) && (
        <Text style={styles.aiError}>{result.message}</Text>
      )}
      {!loading && result?.status && (
        <View style={{ gap: 2 }}>
          <Text style={styles.aiLine}>
            <Text style={styles.aiLabel}>Wnioski: </Text>
            <Text style={styles.aiValue}>{result.findings}</Text>
          </Text>
          <Text style={styles.aiLine}>
            <Text style={styles.aiLabel}>Decyzja: </Text>
            <Text style={[styles.aiValue, { color: colors.library, fontWeight: '600' }]}>{result.decision}</Text>
          </Text>
          {result.suggestedKg != null && (
            <Text style={styles.aiSugg}>
              → <Text style={{ color: colors.accent, fontWeight: '700' }}>{result.suggestedKg} kg × {result.suggestedReps ?? '—'}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ─── BW Equation Input — dla ćwiczeń bodyweight_weighted ─────────────────────
const BWEquationInput = ({ bodyWeight, extraKg, onExtraChange, done, onBWPress, colors }) => {
  const s = makeBWStyles(colors);
  return (
    <View style={s.wrapper}>
      <TouchableOpacity
        style={[s.bwChip, done && s.chipDone]}
        onPress={!done ? onBWPress : undefined}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      >
        <Text style={s.bwEmoji}>👤</Text>
        <Text style={[s.bwValue, done && s.dimText]}>{bodyWeight}</Text>
        <Ionicons
          name="lock-closed"
          size={7}
          color={done ? colors.borderMuted : colors.textTertiary}
          style={{ marginTop: 1 }}
        />
      </TouchableOpacity>
      <Text style={[s.plus, done && s.dimText]}>+</Text>
      <View style={s.extraWrap}>
        <Text style={s.gearIcon}>⚙️</Text>
        <TextInput
          style={[s.extraInput, done && s.chipDone]}
          value={extraKg ?? ''}
          onChangeText={onExtraChange}
          keyboardType="numeric"
          maxLength={5}
          placeholder="0"
          placeholderTextColor={colors.borderMuted}
          editable={!done}
          selectTextOnFocus
        />
      </View>
    </View>
  );
};

const makeBWStyles = (c) => StyleSheet.create({
  wrapper:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bwChip: {
    width: 50, minHeight: 48,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, opacity: 0.85,
  },
  chipDone:   { opacity: 0.45, borderColor: c.card },
  bwEmoji:    { fontSize: 11 },
  bwValue:    { fontSize: 13, fontWeight: '700', color: c.textSecondary },
  dimText:    { color: c.borderMuted },
  plus:       { fontSize: 13, fontWeight: '600', color: c.textTertiary },
  extraWrap:  { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  gearIcon:   { fontSize: 10, position: 'absolute', left: 4, top: 4, zIndex: 1 },
  extraInput: {
    width: 46, minHeight: 48,
    backgroundColor: c.background,
    borderWidth: 1.5, borderColor: c.accent + '88', borderRadius: 10,
    fontSize: 14, fontWeight: '700', color: c.textPrimary,
    textAlign: 'center', paddingLeft: 14, paddingRight: 4, paddingVertical: 4,
  },
});

// ─── Główny komponent wiersza serii ──────────────────────────────────────────
const SwipeableSetRow = ({
  setData,
  index,
  totalSets,        // ile serii ma to ćwiczenie — by wykryć "ostatnia seria"
  progression,
  onUpdate,
  onToggleComplete,
  onDeleteSet,      // wywołane po potwierdzeniu, BEZ dodatkowego alertu w ExerciseCard
  onDeleteExercise, // wywołane gdy to ostatnia seria
  onCascadeUpdate,
  onDropSetPress,
  isBWWeighted,     // ćwiczenie z masą własną + obciążenie (np. podciąganie z pasem)
  bodyWeight,       // waga ciała z profilu (kg)
  onUpdateBodyWeight, // callback — otwiera modal do aktualizacji wagi ciała
  openRpePicker,
  onRpePickerOpened,
}) => {
  const { prevLog, kg, reps, rpe, done, suggested, aiSuggested, isDropSet, plannedReps } = setData;
  const [aiOpen, setAiOpen]           = useState(false);
  const [rpePickerOpen, setRpePickerOpen] = useState(false);
  const swipeRef                      = useRef(null);
  const flashAnim                     = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const { useRIR } = useWorkoutContext();
  const styles = makeStyles(colors);

  const rpeDisplayLabel = rpe
    ? (useRIR ? String(rpeToRir(rpe)) : rpe)
    : (useRIR ? 'RIR' : 'RPE');

  useEffect(() => {
    if (openRpePicker && done) {
      setRpePickerOpen(true);
      onRpePickerOpened?.();
    }
  }, [openRpePicker, done, onRpePickerOpened]);

  const flashRow = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }).start();
  };

  // Swipe LEWO = usuń / spalona
  const handleSwipeDelete = () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (totalSets <= 1) {
      // Ostatnia seria — zapytaj o usunięcie całego ćwiczenia
      Alert.alert(
        'Ostatnia seria',
        'To jedyna seria w tym ćwiczeniu.\nCzy usunąć całe ćwiczenie?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Usuń ćwiczenie', style: 'destructive', onPress: onDeleteExercise },
        ],
      );
      return;
    }

    Alert.alert(
      'Usunąć serię?',
      'Seria zostanie usunięta z treningu.',
      [
        { text: 'Anuluj', style: 'cancel' },
        // Wywołujemy onDeleteSet bezpośrednio — NIE przez confirmDeleteSet w ExerciseCard
        { text: 'Usuń 🔥', style: 'destructive', onPress: onDeleteSet },
      ],
    );
  };

  // Swipe PRAWO = zaliczona
  const handleSwipeDone = () => {
    if (!done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      flashRow();
    }
    swipeRef.current?.close();
    onToggleComplete();
  };

  const renderRightActions = (progress) => {
    const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.7, 1] });
    const scale   = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
    return (
      <TouchableOpacity style={styles.swipeDeleteBtn} onPress={handleSwipeDelete} activeOpacity={0.85}>
        <Animated.View style={{ alignItems: 'center', gap: 3, opacity, transform: [{ scale }] }}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={styles.swipeLabel}>Spalona</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (progress) => {
    const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.7, 1] });
    const scale   = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
    const bg      = done ? colors.borderMuted : colors.accent;
    return (
      <TouchableOpacity
        style={[styles.swipeDoneBtn, { backgroundColor: bg }]}
        onPress={handleSwipeDone}
        activeOpacity={0.85}
      >
        <Animated.View style={{ alignItems: 'center', gap: 3, opacity, transform: [{ scale }] }}>
          <Ionicons name={done ? 'close' : 'checkmark'} size={22} color={done ? colors.textSecondary : colors.accentText} />
          <Text style={[styles.swipeLabel, { color: done ? colors.textSecondary : colors.accentText }]}>
            {done ? 'Cofnij' : 'Zaliczona'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.accentSoft],
  });

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={60}
      leftThreshold={60}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      onSwipeableOpen={(dir) => {
        // Auto-trigger po pełnym swipe (bez potrzeby tapowania w akcję)
        if (dir === 'right') handleSwipeDone();
      }}
    >
      <Animated.View style={[
        styles.wrapper,
        isDropSet && styles.wrapperDropSet,
        { backgroundColor: flashBg },
      ]}>

        <View style={styles.row}>
          <View style={styles.setNumWrapper}>
            <Text style={[styles.setNum, done && styles.dimText]}>{index + 1}</Text>
          </View>

          <View style={styles.prevGroup}>
            <Text style={styles.prevText} numberOfLines={1}>{prevLog}</Text>
          </View>

          {/* RPE/RIR — tap otwiera inline picker */}
          <TouchableOpacity
            style={[styles.input, styles.rpeTouchable, done && styles.inputDone]}
            onPress={() => !done && setRpePickerOpen((v) => !v)}
            activeOpacity={0.75}
            disabled={done}
          >
            <Text style={[styles.kgText, !rpe && styles.kgPlaceholder, done && { color: colors.borderMuted }]}>
              {rpeDisplayLabel}
            </Text>
          </TouchableOpacity>

          {/* ── Pole kg / BW equation ── */}
          {isBWWeighted ? (
            <BWEquationInput
              bodyWeight={bodyWeight ?? 80}
              extraKg={setData.extraKg}
              onExtraChange={(v) => {
                onUpdate('extraKg', v);
                const total = (bodyWeight ?? 80) + (parseFloat(v) || 0);
                onUpdate('kg', String(Math.round(total * 10) / 10));
              }}
              done={done}
              onBWPress={onUpdateBodyWeight}
              colors={colors}
            />
          ) : (
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputKg, done && styles.inputDone]}
                value={kg}
                onChangeText={(v) => onUpdate('kg', v)}
                keyboardType="numeric"
                maxLength={6}
                placeholder="kg"
                placeholderTextColor={colors.textTertiary}
                editable={!done}
                selectTextOnFocus
              />
              <View style={styles.arrow}>
                <ProgressArrow value={kg} suggestedKg={progression?.suggestedKg} />
              </View>
            </View>
          )}

          {/* Powtórzenia — zakres w polu, po kliknięciu wpis faktycznej liczby */}
          <TextInput
            style={[
              styles.input,
              styles.inputReps,
              plannedReps && !reps && !done && { backgroundColor: colors.card },
              done && styles.inputDone,
            ]}
            value={reps}
            onChangeText={(v) => onUpdate('reps', v.replace(/\D/g, ''))}
            keyboardType="numeric"
            maxLength={3}
            placeholder={plannedReps ? formatPlannedRepsDisplay(plannedReps) : '—'}
            placeholderTextColor={colors.textTertiary}
            editable={!done}
            selectTextOnFocus
          />

          {/* Checkbox */}
          <TouchableOpacity
            style={[styles.checkbox, done && styles.checkboxDone]}
            onPress={onToggleComplete}
            activeOpacity={0.7}
          >
            {done && <Ionicons name="checkmark" size={18} color={colors.accentText} />}
          </TouchableOpacity>
        </View>

        {/* RPE Picker inline */}
        {rpePickerOpen && (
          <RpeInlinePicker
            currentRpe={rpe}
            onSelect={(val) => onUpdate('rpe', val)}
            onClose={() => setRpePickerOpen(false)}
            colors={colors}
            useRIR={useRIR}
            isReminder={openRpePicker}
          />
        )}

        {!isDropSet && !rpePickerOpen && (
          <View style={styles.suggRow}>
            <Text style={styles.suggLabel}>Sugerowane: </Text>
            <Text style={styles.suggVal}>{suggested ?? progression?.label ?? '—'}</Text>

            {aiSuggested && (
              <TouchableOpacity
                onLongPress={() =>
                  Alert.alert('AI Insight', 'AI przeliczyło ciężar na podstawie zapasu z poprzedniej serii.', [{ text: 'OK' }])
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.brainIcon}>🧠</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => setAiOpen((v) => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.aiEmoji}>🤖</Text>
              <Text style={styles.aiBtnLabel}>{aiOpen ? 'Ukryj' : 'AI'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isDropSet && aiOpen && !rpePickerOpen && (
          <SmartInsightCard
            progression={progression}
            uiKg={kg}
            uiReps={String(repsForVolume(reps) || '')}
            onCascadeUpdate={onCascadeUpdate}
          />
        )}
      </Animated.View>
    </Swipeable>
  );
};

const makeStyles = (c) => StyleSheet.create({
  wrapper:        { backgroundColor: c.backgroundSecondary },
  wrapperDropSet: { backgroundColor: c.backgroundSecondary, borderLeftWidth: 2, borderLeftColor: c.librarySoft },
  dropBadge:      { paddingLeft: 26, paddingBottom: 2 },
  dropBadgeText:  { fontSize: 9, fontWeight: '700', color: c.library, letterSpacing: 0.5 },

  row:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
  setNumWrapper: { width: 20, alignItems: 'center' },
  setNum:        { fontSize: 13, fontWeight: '700', color: c.textTertiary },
  dimText:       { opacity: 0.45 },
  prevGroup:     { flex: 1, minWidth: 0 },
  prevText:      { fontSize: 11, color: c.textSecondary },

  input: {
    width: 46, minHeight: 48,
    backgroundColor: c.background, borderWidth: 1, borderColor: c.border, borderRadius: 10,
    fontSize: 15, fontWeight: '700', color: c.textPrimary, textAlign: 'center', paddingVertical: 4,
  },
  inputKg:       { width: 46 },
  rpeTouchable:  { justifyContent: 'center', alignItems: 'center' },
  kgText:        { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  kgPlaceholder: { color: c.borderMuted },
  inputReps:     { width: 56 },
  inputDone:     { color: c.borderMuted, borderColor: c.card },
  inputWrap:     { position: 'relative', width: 46 },
  arrow:         { position: 'absolute', top: -7, right: -3, backgroundColor: c.background, borderRadius: 4 },

  checkbox: {
    width: 44, height: 44, minWidth: 44,
    borderRadius: 11, borderWidth: 1.5, borderColor: c.borderMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone:   { backgroundColor: c.accent, borderColor: c.accent },

  swipeDeleteBtn: {
    backgroundColor: c.danger,
    justifyContent: 'center', alignItems: 'center',
    width: 72, borderRadius: 10, marginLeft: 8, marginBottom: 4,
  },
  swipeDoneBtn: {
    backgroundColor: c.accent,
    justifyContent: 'center', alignItems: 'center',
    width: 72, borderRadius: 10, marginRight: 8, marginBottom: 4,
  },
  swipeLabel: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  suggRow:    { flexDirection: 'row', alignItems: 'center', paddingLeft: 26, gap: 5, marginBottom: 8 },
  suggLabel:  { fontSize: 11, color: c.textTertiary },
  suggVal:    { fontSize: 11, color: c.library, fontWeight: '600', flex: 1 },
  brainIcon:  { fontSize: 13 },
  aiBtn:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: c.accentSoft, borderRadius: 8, borderWidth: 0.5, borderColor: c.accentSoft },
  aiEmoji:    { fontSize: 11 },
  aiBtnLabel: { fontSize: 10, color: c.accent, fontWeight: '600' },

  aiCard:    { backgroundColor: c.card, borderRadius: 12, borderWidth: 0.5, borderColor: c.accent, padding: 10, marginTop: 6, marginBottom: 4 },
  aiInput:   { backgroundColor: c.background, borderRadius: 9, borderWidth: 1, borderColor: c.border, color: c.textPrimary, fontSize: 13, padding: 9, minHeight: 46, textAlignVertical: 'top', marginBottom: 6 },
  aiLoading: { fontSize: 11, color: c.water, fontStyle: 'italic' },
  aiHint:    { fontSize: 11, color: c.textTertiary },
  aiError:   { fontSize: 11, color: c.danger },
  aiLine:    { fontSize: 11, lineHeight: 16 },
  aiLabel:   { fontSize: 11, color: c.textTertiary },
  aiValue:   { color: c.textPrimary },
  aiSugg:    { fontSize: 12, marginTop: 2 },

  rpePicker:       { backgroundColor: c.card, borderRadius: 12, borderWidth: 0.5, borderColor: c.warning, padding: 10, marginBottom: 8 },
  rpePickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  rpePickerTitle:  { flex: 1, fontSize: 11, fontWeight: '600', color: c.warning },
  rpePickerRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  rpeBtn:          { minWidth: 38, paddingHorizontal: 6, paddingVertical: 8, borderRadius: 9, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  rpeBtnActive:    { backgroundColor: c.warning, borderColor: c.warning },
  rpeBtnDanger:    { borderColor: c.danger },
  rpeBtnText:      { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  rpeBtnTextActive:{ color: '#000' },
  rpeBtnTextDanger:{ color: c.danger },
  rpeScale:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rpeScaleTip:     { fontSize: 9, color: c.textTertiary },
});

export default SwipeableSetRow;
