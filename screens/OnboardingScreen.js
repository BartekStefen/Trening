import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useProfileGoals } from '../context/ProfileGoalsContext';
import {
  ACTIVITY_LEVELS,
  GOAL_INTENTS,
  GOAL_PACES,
  calcTDEE,
  calorieAdjustmentFromPace,
  suggestTargetWeight,
  targetCalories,
} from '../utils/tdee';
import { estimateGoalDate, getGoalMode } from '../utils/profileAnalytics';

const NumPad = ({ label, value, unit, onInc, onDec, colors }) => (
  <View style={[np.wrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
    <Text style={[np.label, { color: colors.textSecondary }]}>{label}</Text>
    <View style={np.row}>
      <TouchableOpacity style={[np.btn, { backgroundColor: colors.border }]} onPress={onDec} activeOpacity={0.7}>
        <Ionicons name="remove" size={18} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[np.val, { color: colors.textPrimary }]}>{value}<Text style={[np.unit, { color: colors.textSecondary }]}> {unit}</Text></Text>
      <TouchableOpacity style={[np.btn, { backgroundColor: colors.border }]} onPress={onInc} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  </View>
);

const np = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 0.5, minWidth: 100 },
  label: { fontSize: 11, marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  val: { fontSize: 22, fontWeight: '800' },
  unit: { fontSize: 12, fontWeight: '500' },
});

export default function OnboardingScreen({ forceShow = false }) {
  const { colors } = useTheme();
  const {
    showOnboarding, onboardingCompleted, completeOnboarding, closeOnboarding,
    currentWeight, height, age, gender, activityLevel, goalIntent, goalPace, targetWeight,
  } = useProfileGoals();

  const visible = forceShow || showOnboarding;
  if (!visible) return null;

  const intentMeta = GOAL_INTENTS.find((g) => g.id === goalIntent) ?? GOAL_INTENTS[0];
  const totalSteps = intentMeta.needsTarget ? 5 : 4;

  const [step, setStep] = useState(onboardingCompleted ? 0 : 0);
  const [intent, setIntent] = useState(goalIntent);
  const [weight, setWeight] = useState(currentWeight);
  const [h, setH] = useState(height);
  const [a, setA] = useState(age);
  const [sex, setSex] = useState(gender);
  const [activity, setActivity] = useState(activityLevel);
  const [target, setTarget] = useState(targetWeight);
  const [pace, setPace] = useState(goalPace);

  useEffect(() => {
    if (!showOnboarding) return;
    setStep(0);
    setIntent(goalIntent);
    setWeight(currentWeight);
    setH(height);
    setA(age);
    setSex(gender);
    setActivity(activityLevel);
    setTarget(targetWeight);
    setPace(goalPace);
  }, [showOnboarding]);

  const selectedIntent = GOAL_INTENTS.find((g) => g.id === intent) ?? GOAL_INTENTS[0];
  const needsTarget = selectedIntent.needsTarget;

  const tdee = useMemo(
    () => calcTDEE({ weight, height: h, age: a, sex, activityId: activity }),
    [weight, h, a, sex, activity],
  );

  const effectivePace = needsTarget
    ? pace
    : selectedIntent.defaultPace;

  const adj = calorieAdjustmentFromPace(effectivePace);
  const kcalTarget = targetCalories(tdee, effectivePace);
  const mode = getGoalMode(weight, needsTarget ? target : weight);
  const estimation = needsTarget && mode
    ? estimateGoalDate(weight, target, adj)
    : null;

  const intentLabel = GOAL_INTENTS.find((g) => g.id === intent)?.label ?? '';

  const paceOptions = GOAL_PACES.filter((p) => {
    if (intent === 'cut') return p.delta <= 0;
    if (intent === 'bulk') return p.delta >= 0;
    return true;
  });

  const handleSelectIntent = (id) => {
    setIntent(id);
    const meta = GOAL_INTENTS.find((g) => g.id === id);
    setPace(meta?.defaultPace ?? 'maintain');
    if (meta?.needsTarget) {
      setTarget(suggestTargetWeight(weight, id));
    }
  };

  const canNext = () => {
    if (step === 0) return !!intent;
    if (step === 1) return weight > 0 && h > 0 && a > 0;
    if (step === 2) return !!activity;
    if (step === 3 && needsTarget) {
      if (intent === 'cut') return target < weight;
      if (intent === 'bulk') return target > weight;
      return target !== weight;
    }
    return true;
  };

  const next = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else handleFinish();
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
    else if (onboardingCompleted) closeOnboarding();
  };

  const handleFinish = async () => {
    await completeOnboarding({
      goalIntent: intent,
      goalPace: effectivePace,
      currentWeight: weight,
      height: h,
      age: a,
      gender: sex,
      activityLevel: activity,
      targetWeight: needsTarget ? target : weight,
    });
  };

  const s = makeStyles(colors);

  return (
    <View style={[s.screen, s.overlay]}>
      <View style={s.topBar}>
        {step > 0 ? (
          <TouchableOpacity onPress={back} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
        <View style={s.dots}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={[s.dot, i <= step && { backgroundColor: colors.accent }]} />
          ))}
        </View>
        <TouchableOpacity onPress={closeOnboarding} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Krok 0 — cel */}
        {step === 0 && (
          <>
            <Text style={s.title}>Co chcesz osiągnąć?</Text>
            <Text style={s.sub}>Na tej podstawie dobierzemy kalorie i estymację celu.</Text>
            {GOAL_INTENTS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[s.intentCard, { borderColor: intent === g.id ? g.color : colors.border, backgroundColor: intent === g.id ? `${g.color}15` : colors.card }]}
                onPress={() => handleSelectIntent(g.id)}
                activeOpacity={0.75}
              >
                <View style={[s.intentIcon, { backgroundColor: `${g.color}22` }]}>
                  <Ionicons name={g.icon} size={24} color={g.color} />
                </View>
                <View style={s.intentText}>
                  <Text style={[s.intentLabel, { color: colors.textPrimary }]}>{g.label}</Text>
                  <Text style={[s.intentDesc, { color: colors.textSecondary }]}>{g.desc}</Text>
                </View>
                {intent === g.id && <Ionicons name="checkmark-circle" size={22} color={g.color} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Krok 1 — parametry */}
        {step === 1 && (
          <>
            <Text style={s.title}>Twoje parametry</Text>
            <Text style={s.sub}>Wyliczymy TDEE i dzienne zapotrzebowanie kaloryczne.</Text>

            <Text style={s.lbl}>Płeć</Text>
            <View style={s.sexRow}>
              {[{ id: 'male', label: '♂ Mężczyzna' }, { id: 'female', label: '♀ Kobieta' }].map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[s.sexBtn, { borderColor: colors.border, backgroundColor: sex === o.id ? colors.accentSoft : colors.card }]}
                  onPress={() => setSex(o.id)}
                >
                  <Text style={[s.sexText, { color: sex === o.id ? colors.accent : colors.textSecondary }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.numGrid}>
              <NumPad label="Waga" value={weight} unit="kg" colors={colors}
                onInc={() => setWeight((v) => Math.min(200, v + 1))}
                onDec={() => setWeight((v) => Math.max(40, v - 1))} />
              <NumPad label="Wzrost" value={h} unit="cm" colors={colors}
                onInc={() => setH((v) => Math.min(230, v + 1))}
                onDec={() => setH((v) => Math.max(130, v - 1))} />
              <NumPad label="Wiek" value={a} unit="lat" colors={colors}
                onInc={() => setA((v) => Math.min(80, v + 1))}
                onDec={() => setA((v) => Math.max(14, v - 1))} />
            </View>
          </>
        )}

        {/* Krok 2 — aktywność */}
        {step === 2 && (
          <>
            <Text style={s.title}>Poziom aktywności</Text>
            <Text style={s.sub}>Ile ruszasz się poza samym treningiem?</Text>
            {ACTIVITY_LEVELS.map((act) => (
              <TouchableOpacity
                key={act.id}
                style={[s.actRow, { borderColor: activity === act.id ? colors.accent : colors.border, backgroundColor: activity === act.id ? colors.accentSoft : colors.card }]}
                onPress={() => setActivity(act.id)}
                activeOpacity={0.75}
              >
                <View style={[s.actDot, { backgroundColor: activity === act.id ? colors.accent : colors.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.actLabel, { color: colors.textPrimary }]}>{act.label}</Text>
                  <Text style={[s.actDesc, { color: colors.textSecondary }]}>{act.desc}</Text>
                </View>
                <Text style={[s.actFactor, { color: activity === act.id ? colors.accent : colors.textSecondary }]}>×{act.factor}</Text>
              </TouchableOpacity>
            ))}
            {tdee != null && (
              <View style={[s.tdeeBox, { backgroundColor: colors.accentSoft }]}>
                <Text style={[s.tdeeLbl, { color: colors.textSecondary }]}>Szacowane TDEE</Text>
                <Text style={[s.tdeeVal, { color: colors.accent }]}>{tdee} kcal/d</Text>
              </View>
            )}
          </>
        )}

        {/* Krok 3 — cel wagowy (cut/bulk) */}
        {step === 3 && needsTarget && (
          <>
            <Text style={s.title}>Cel wagowy i tempo</Text>
            <Text style={s.sub}>
              {intent === 'cut' ? 'Ile chcesz ważyć i jak szybko redukować?' : 'Jaki jest cel wagi i tempo przyrostu?'}
            </Text>

            <NumPad label="Waga docelowa" value={target} unit="kg" colors={colors}
              onInc={() => setTarget((v) => Math.round((v + 0.5) * 10) / 10)}
              onDec={() => setTarget((v) => Math.round((v - 0.5) * 10) / 10)} />

            <Text style={[s.lbl, { marginTop: 16 }]}>Tempo</Text>
            {paceOptions.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[s.paceRow, { borderColor: pace === p.id ? colors.accent : colors.border, backgroundColor: pace === p.id ? colors.accentSoft : colors.card }]}
                onPress={() => setPace(p.id)}
              >
                <Text style={[s.paceLabel, { color: colors.textPrimary }]}>{p.label}</Text>
                <Text style={[s.paceDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Podsumowanie */}
        {step === totalSteps - 1 && (
          <>
            <Text style={s.title}>Twój plan</Text>
            <Text style={s.sub}>Podsumowanie na podstawie Twoich wyborów.</Text>

            <View style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SummaryRow label="Cel" value={intentLabel} colors={colors} />
              <SummaryRow label="TDEE" value={tdee ? `${tdee} kcal/d` : '—'} colors={colors} />
              <SummaryRow label="Kalorie docelowe" value={kcalTarget ? `${kcalTarget} kcal/d` : '—'} colors={colors} accent />
              {needsTarget && (
                <>
                  <SummaryRow label="Waga" value={`${weight} → ${target} kg`} colors={colors} />
                  <SummaryRow
                    label={mode === 'bulk' ? 'Nadwyżka' : 'Deficyt'}
                    value={`${adj} kcal/d`}
                    colors={colors}
                  />
                </>
              )}
            </View>

            {estimation?.days ? (
              <View style={[s.estBox, { backgroundColor: `${colors.accent}18` }]}>
                <Text style={[s.estTitle, { color: colors.accent }]}>Estymacja celu</Text>
                <Text style={[s.estDays, { color: colors.textPrimary }]}>~{estimation.days} dni</Text>
                <Text style={[s.estSub, { color: colors.textSecondary }]}>
                  {estimation.date?.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{estimation.weeklyChangeKg} kg/tydz.
                </Text>
              </View>
            ) : (
              <Text style={[s.maintHint, { color: colors.textSecondary }]}>
                {intent === 'strength'
                  ? 'Skupiasz się na sile — utrzymuj kalorie blisko TDEE i progresuj w treningu.'
                  : 'Utrzymujesz wagę — jedz około TDEE bez deficytu ani nadwyżki.'}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: canNext() ? colors.accent : colors.border }]}
          onPress={next}
          disabled={!canNext()}
          activeOpacity={0.85}
        >
          <Text style={[s.nextText, { color: canNext() ? (colors.accentText ?? '#000') : colors.textSecondary }]}>
            {step === totalSteps - 1 ? (onboardingCompleted ? 'Zapisz zmiany' : 'Rozpocznij') : 'Dalej'}
          </Text>
          <Ionicons name={step === totalSteps - 1 ? 'checkmark' : 'arrow-forward'} size={20} color={canNext() ? (colors.accentText ?? '#000') : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, colors, accent }) {
  return (
    <View style={sum.row}>
      <Text style={[sum.lbl, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[sum.val, { color: accent ? colors.accent : colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const sum = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  lbl: { fontSize: 14 },
  val: { fontSize: 14, fontWeight: '700' },
});

const makeStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: c.textPrimary, marginBottom: 8, marginTop: 8 },
  sub: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 24 },
  lbl: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 10 },
  intentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1.5, marginBottom: 10 },
  intentIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  intentText: { flex: 1 },
  intentLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  intentDesc: { fontSize: 12, lineHeight: 17 },
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sexBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  sexText: { fontSize: 13, fontWeight: '600' },
  numGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  actDot: { width: 10, height: 10, borderRadius: 5 },
  actLabel: { fontSize: 14, fontWeight: '600' },
  actDesc: { fontSize: 11, marginTop: 2 },
  actFactor: { fontSize: 13, fontWeight: '700' },
  tdeeBox: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  tdeeLbl: { fontSize: 12 },
  tdeeVal: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  paceRow: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  paceLabel: { fontSize: 14, fontWeight: '600' },
  paceDesc: { fontSize: 11, marginTop: 2, color: c.textSecondary },
  summaryCard: { borderRadius: 18, padding: 16, borderWidth: 0.5, marginBottom: 16 },
  estBox: { borderRadius: 16, padding: 16, alignItems: 'center' },
  estTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  estDays: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  estSub: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  maintHint: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 12 },
  footer: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: c.border },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16 },
  nextText: { fontSize: 17, fontWeight: '700' },
});
