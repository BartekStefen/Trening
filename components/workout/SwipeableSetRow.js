import { useEffect, useRef, useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DropSetButton from './DropSetButton';

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
  if (raw && !hasGymKw) return { type: 'blocked', message: '❌ Odrzucono: Komunikat niezwiązany z treningiem.' };

  const kgMatch       = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo(?:gram)?)/);
  const extractedKg   = kgMatch ? parseFloat(kgMatch[1].replace(',', '.')) : null;
  const repsMatch     = normalized.match(/(?:na|x)\s*(\d+)|(\d+)\s*powt/);
  const extractedReps = repsMatch ? parseInt(repsMatch[1] ?? repsMatch[2]) : null;

  const currentKg   = extractedKg   ?? parseFloat(uiKg)  ?? null;
  const currentReps = extractedReps ?? parseInt(uiReps)   ?? null;
  if (!currentKg) return { type: 'error', message: '❌ Nie znaleziono ciężaru.' };

  const rirMatch = normalized.match(/(?:zapas(?:u|em)?|zostalo)\s*(?:na\s*)?(\d+)/i);
  const rpeMatch = normalized.match(/rpe\s*(\d+(?:[.,]\d+)?)/i);
  let rir = null;
  if (rirMatch)                                    rir = parseInt(rirMatch[1]);
  else if (rpeMatch)                               rir = Math.max(0, 10 - parseFloat(rpeMatch[1].replace(',', '.')));
  else if (/\b(?:max|upadek)\b/.test(normalized))  rir = 0;

  if (rir !== null) {
    let deltaKg, findings, decision;
    if (rir >= 3)      { deltaKg = 5;   findings = `Duży zapas (RIR ${rir})`;        decision = `+5 kg`; }
    else if (rir >= 1) { deltaKg = 2.5; findings = `Umiarkowany zapas (RIR ${rir})`; decision = `+2.5 kg`; }
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

const SmartInsightCard = ({ progression, uiKg, uiReps, onCascadeUpdate }) => {
  const [note, setNote]       = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef(null);

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
      if (r.suggestedKg != null && r.type !== 'blocked') {
        onCascadeUpdate?.(r.suggestedKg, r.suggestedReps);
      }
    };
    if (isInstant) run(); else debounceRef.current = setTimeout(run, 400);
    return () => clearTimeout(debounceRef.current);
  }, [note, uiKg, uiReps]);

  return (
    <View style={insightStyles.card}>
      <TextInput
        style={insightStyles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder='np. "80kg na 8, zapas 2" lub "lekko"'
        placeholderTextColor="#3A3A3C"
        multiline
        numberOfLines={2}
        keyboardType="default"
      />
      {loading && <Text style={insightStyles.loadingText}>🤖 Analizuję...</Text>}
      {!loading && !result && (
        <Text style={insightStyles.defaultHint}>
          APRE: <Text style={{ color: '#A78BFA', fontWeight: '700' }}>{progression?.label ?? '—'}</Text>
        </Text>
      )}
      {!loading && result && ['error','spam','offline','empty','blocked'].includes(result.type) && (
        <Text style={insightStyles.errorText}>{result.message}</Text>
      )}
      {!loading && result?.status && (
        <View style={insightStyles.resultBlock}>
          <Text style={insightStyles.resultLine}>
            <Text style={insightStyles.resultLabel}>Wnioski: </Text>
            <Text style={insightStyles.resultValue}>{result.findings}</Text>
          </Text>
          <Text style={insightStyles.resultLine}>
            <Text style={insightStyles.resultLabel}>Decyzja: </Text>
            <Text style={[insightStyles.resultValue, { color: '#A78BFA', fontWeight: '600' }]}>{result.decision}</Text>
          </Text>
          {result.suggestedKg != null && (
            <Text style={insightStyles.suggLine}>
              → <Text style={{ color: '#00E676', fontWeight: '700' }}>{result.suggestedKg} kg x {result.suggestedReps ?? '—'}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const insightStyles = StyleSheet.create({
  card:        { backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 0.5, borderColor: '#00E676', padding: 10, marginTop: 6, marginBottom: 4 },
  noteInput:   { backgroundColor: '#0A0A0A', borderRadius: 9, borderWidth: 1, borderColor: '#2C2C2E', color: '#FFFFFF', fontSize: 13, padding: 9, minHeight: 46, textAlignVertical: 'top', marginBottom: 6 },
  loadingText: { fontSize: 11, color: '#378ADD', fontStyle: 'italic' },
  defaultHint: { fontSize: 11, color: '#636366' },
  errorText:   { fontSize: 11, color: '#FF453A' },
  resultBlock: { gap: 3 },
  resultLine:  { fontSize: 11, lineHeight: 16 },
  resultLabel: { color: '#636366' },
  resultValue: { color: '#EBEBEB' },
  suggLine:    { fontSize: 12, marginTop: 2 },
});

// ─── SwipeableSetRow ──────────────────────────────────────────────────────────
// Nowe propsy:
//   onDropSetPress()         – tworzy drop-set pod bieżącą serię
//   onWeightPress(kg)        – otwiera kalkulator krążków dla podanego ciężaru
const SwipeableSetRow = ({
  setData,
  index,
  progression,
  onUpdate,
  onToggleComplete,
  onDeleteSet,
  onCascadeUpdate,
  onDropSetPress,
  onWeightPress,
}) => {
  const { prevLog, kg, reps, rpe, done, suggested, aiSuggested, isDropSet } = setData;
  const [aiOpen, setAiOpen] = useState(false);
  const swipeRef = useRef(null);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.swipeDeleteBtn}
      onPress={() => { swipeRef.current?.close(); onDeleteSet(); }}
      activeOpacity={0.8}
    >
      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      <View style={[styles.wrapper, isDropSet && styles.wrapperDropSet]}>
        {isDropSet && (
          <View style={styles.dropSetBadge}>
            <Text style={styles.dropSetBadgeText}>⚡ drop-set</Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.setNumWrapper}>
            <Text style={styles.setNum}>{index + 1}</Text>
          </View>

          <View style={styles.prevGroup}>
            <Text style={styles.prevText} numberOfLines={1}>{prevLog}</Text>
          </View>

          <TextInput
            style={[styles.input, done && styles.inputDone]}
            value={rpe}
            onChangeText={(v) => onUpdate('rpe', v)}
            keyboardType="numeric"
            maxLength={3}
            placeholder="RPE"
            placeholderTextColor="#3A3A3C"
            editable={!done}
            selectTextOnFocus
          />

          {/* kg – długie przytrzymanie otwiera kalkulator krążków */}
          <TouchableOpacity
            style={styles.inputWrap}
            onLongPress={() => onWeightPress?.(kg)}
            activeOpacity={1}
            delayLongPress={400}
          >
            <TextInput
              style={[styles.input, done && styles.inputDone]}
              value={kg}
              onChangeText={(v) => onUpdate('kg', v)}
              keyboardType="decimal-pad"
              maxLength={10}
              placeholder="kg"
              placeholderTextColor="#3A3A3C"
              editable={!done}
              selectTextOnFocus
            />
            <View style={styles.arrow}>
              <ProgressArrow value={kg} suggestedKg={progression?.suggestedKg} />
            </View>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.inputReps, done && styles.inputDone]}
            value={reps}
            onChangeText={(v) => onUpdate('reps', v)}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Powt."
            placeholderTextColor="#3A3A3C"
            editable={!done}
            selectTextOnFocus
          />

          {/* DropSetButton przed checkboxem */}
          <DropSetButton onPress={() => onDropSetPress?.()} />

          <TouchableOpacity
            style={[styles.checkbox, done && styles.checkboxDone]}
            onPress={onToggleComplete}
            activeOpacity={0.7}
          >
            {done && <Ionicons name="checkmark" size={18} color="#000" />}
          </TouchableOpacity>
        </View>

        <View style={styles.suggRow}>
          <Text style={styles.suggLabel}>Sugerowane: </Text>
          <Text style={styles.suggVal}>{suggested ?? progression?.label ?? '—'}</Text>

          {aiSuggested && (
            <TouchableOpacity
              onLongPress={() =>
                Alert.alert(
                  'AI Insight',
                  'AI przeliczyło ciężar na podstawie zapasu z poprzedniej serii.',
                  [{ text: 'OK' }],
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.aiBrainIcon}>🧠</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => setAiOpen((v) => !v)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.aiEmoji}>🤖</Text>
            <Text style={styles.aiLabel}>{aiOpen ? 'Ukryj' : 'AI'}</Text>
          </TouchableOpacity>
        </View>

        {aiOpen && (
          <SmartInsightCard
            progression={progression}
            uiKg={kg}
            uiReps={reps}
            onCascadeUpdate={onCascadeUpdate}
          />
        )}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  wrapper:        { backgroundColor: '#121212' },
  wrapperDropSet: { backgroundColor: '#0E0A1A', borderLeftWidth: 2, borderLeftColor: 'rgba(167,139,250,0.5)' },
  dropSetBadge:   { paddingLeft: 26, paddingBottom: 2 },
  dropSetBadgeText:{ fontSize: 9, fontWeight: '700', color: '#A78BFA', letterSpacing: 0.5 },

  row:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
  setNumWrapper: { width: 20, alignItems: 'center' },
  setNum:        { fontSize: 13, fontWeight: '700', color: '#636366' },
  prevGroup:     { flex: 1, minWidth: 0 },
  prevText:      { fontSize: 11, color: '#888888' },
  input: {
    width: 46, minHeight: 48,
    backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#2C2C2E', borderRadius: 10,
    fontSize: 15, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', paddingVertical: 4,
  },
  inputReps:    { width: 52 },
  inputDone:    { color: '#3A3A3C', borderColor: '#1C1C1E' },
  inputWrap:    { position: 'relative', width: 46 },
  arrow:        { position: 'absolute', top: -7, right: -3, backgroundColor: '#000', borderRadius: 4 },
  checkbox:     { width: 44, height: 44, minWidth: 44, borderRadius: 11, borderWidth: 1.5, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: '#00E676', borderColor: '#00E676' },
  swipeDeleteBtn: {
    backgroundColor: '#FF5252',
    justifyContent: 'center', alignItems: 'center',
    width: 68, borderRadius: 10, marginLeft: 8, marginBottom: 4,
  },
  suggRow:     { flexDirection: 'row', alignItems: 'center', paddingLeft: 26, gap: 5, marginBottom: 8 },
  suggLabel:   { fontSize: 11, color: '#636666' },
  suggVal:     { fontSize: 11, color: '#A78BFA', fontWeight: '600', flex: 1 },
  aiBrainIcon: { fontSize: 13 },
  aiBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: 'rgba(0,230,118,0.07)', borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(0,230,118,0.2)' },
  aiEmoji:     { fontSize: 11 },
  aiLabel:     { fontSize: 10, color: '#00E676', fontWeight: '600' },
});

export default SwipeableSetRow;