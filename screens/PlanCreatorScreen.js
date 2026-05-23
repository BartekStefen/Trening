import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutContext } from '../context/WorkoutContext';
import ExercisePickerSheet from '../components/workout/ExercisePickerSheet';
import RestPickerModal from '../components/modals/RestPickerModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SUPERSET_COLORS = ['#A78BFA', '#38BDF8', '#FB923C', '#34D399', '#F472B6'];
const ssColor = (groupId) => {
  if (!groupId) return null;
  const h = [...(groupId ?? '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return SUPERSET_COLORS[h % SUPERSET_COLORS.length];
};

const DIFF_COLORS = { 'Łatwy': '#34D399', 'Średni': '#EF9F27', 'Zaawansowany': '#FF453A' };

const fmtRest = (v) => {
  if (!v) return 'WYŁ.';
  if (v < 60) return `${v} s`;
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')} min`;
};

const newSet  = () => ({ id: uid(), weight: '', reps: '' });
const defData = () => ({ sets: [newSet(), newSet(), newSet()], rest: null, notes: '' });

// ─── RepsPickerModal ─────────────────────────────────────────────────────────
function RepsPickerModal({ visible, currentReps, onSave, onClose, colors }) {
  const [mode,     setMode]     = useState('single');
  const [single,   setSingle]   = useState('');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');

  useEffect(() => {
    if (!visible) return;
    const r = currentReps ?? '';
    if (r.includes('-')) {
      const [a, b] = r.split('-');
      setMode('range');
      setRangeMin(a.trim());
      setRangeMax(b.trim());
    } else {
      setMode('single');
      setSingle(r);
    }
  }, [visible, currentReps]);

  const handleSave = () => {
    if (mode === 'single') {
      onSave(single.trim());
    } else {
      const mn = rangeMin.trim();
      const mx = rangeMax.trim();
      onSave(mn && mx ? `${mn}-${mx}` : mn || mx);
    }
    onClose();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const rs = makeRepsStyles(colors);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={rs.backdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={rs.sheet}>
              <View style={rs.handle} />
              <Text style={rs.title}>Powtórzenia</Text>

              {/* Przełącznik trybu */}
              <View style={rs.segment}>
                {['single', 'range'].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[rs.segBtn, mode === m && { backgroundColor: colors.accent }]}
                    onPress={() => { setMode(m); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[rs.segTxt, { color: mode === m ? colors.accentText : colors.textSecondary }]}>
                      {m === 'single' ? 'Stała liczba' : 'Zakres'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === 'single' ? (
                <View style={rs.row}>
                  <TextInput
                    style={rs.bigInput}
                    value={single}
                    onChangeText={v => setSingle(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.borderMuted}
                    maxLength={3}
                    autoFocus
                    selectTextOnFocus
                  />
                  <Text style={rs.unit}>powt.</Text>
                </View>
              ) : (
                <View style={rs.rangeRow}>
                  <View style={rs.rangeBlock}>
                    <TextInput
                      style={rs.bigInput}
                      value={rangeMin}
                      onChangeText={v => setRangeMin(v.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={colors.borderMuted}
                      maxLength={3}
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={rs.unit}>MIN</Text>
                  </View>
                  <Text style={rs.dash}>—</Text>
                  <View style={rs.rangeBlock}>
                    <TextInput
                      style={rs.bigInput}
                      value={rangeMax}
                      onChangeText={v => setRangeMax(v.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={colors.borderMuted}
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={rs.unit}>MAX</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={rs.confirmBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={rs.confirmTxt}>Zatwierdź</Text>
              </TouchableOpacity>
              <TouchableOpacity style={rs.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={rs.cancelTxt}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal: szczegóły ćwiczenia ──────────────────────────────────────────────
function ExerciseDetailModal({ exercise, visible, onClose, onRemove, colors }) {
  if (!exercise) return null;
  const s   = makeDetailStyles(colors);
  const dfc = DIFF_COLORS[exercise.difficulty] ?? colors.textTertiary;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.handle} />
        <View style={s.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.name}>{exercise.name}</Text>
            <View style={s.badges}>
              <View style={[s.badge, { backgroundColor: dfc + '22' }]}>
                <Text style={[s.badgeText, { color: dfc }]}>{exercise.difficulty}</Text>
              </View>
              {exercise.equipment && (
                <View style={s.badge}>
                  <Ionicons name="barbell-outline" size={11} color={colors.textTertiary} />
                  <Text style={s.badgeText}>{exercise.equipment}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.videoBox}>
            <View style={s.playCircle}>
              <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
            </View>
            <Text style={s.videoLabel}>Film instruktażowy · Premium</Text>
          </View>
          <Text style={s.sectionLabel}>Technika wykonania</Text>
          <Text style={s.description}>{exercise.description ?? '—'}</Text>
          <Text style={s.sectionLabel}>Mięśnie główne</Text>
          {(exercise.muscles ?? []).map((m, i) => (
            <View key={i} style={s.muscleRow}>
              <View style={[s.muscleDot, { backgroundColor: colors.accent }]} />
              <Text style={s.muscleText}>{m}</Text>
            </View>
          ))}
          {(exercise.synergists ?? []).length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 16 }]}>Synergistyczne</Text>
              {exercise.synergists.map((m, i) => (
                <View key={i} style={s.muscleRow}>
                  <View style={[s.muscleDot, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[s.muscleText, { color: colors.textSecondary }]}>{m}</Text>
                </View>
              ))}
            </>
          )}
          <View style={s.tipBox}>
            <Ionicons name="bulb-outline" size={14} color="#EF9F27" />
            <Text style={s.tipText}>
              Zadbaj o pełny zakres ruchu i kontrolowaną ekscentrykę. Ciężar jest narzędziem, technika priorytetem.
            </Text>
          </View>
        </ScrollView>
        {onRemove && (
          <View style={s.footer}>
            <TouchableOpacity style={s.removeBtn} onPress={onRemove} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[s.removeBtnText, { color: colors.danger }]}>Usuń z planu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Modal: picker super-serii ───────────────────────────────────────────────
function SupersetPickerModal({ visible, fromIdx, items, supersets, onConnect, onDisconnect, onClose, colors }) {
  const fromEx      = items[fromIdx];
  const fromGroupId = fromEx ? supersets[fromEx.id] : null;
  const s           = makePickerStyles(colors);
  if (!fromEx) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.handle} />
        <View style={s.header}>
          <View style={[s.chainIcon, { backgroundColor: '#A78BFA22' }]}>
            <Text style={{ fontSize: 20 }}>⛓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Zarządzaj super-serią</Text>
            <Text style={s.subtitle} numberOfLines={1}>{fromEx.name}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={s.hint}>
          Zaznacz ćwiczenia, które mają tworzyć super-serię razem z powyższym. Odznacz, by rozłączyć.
        </Text>
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {items.map((ex, idx) => {
            if (idx === fromIdx) return null;
            const isLinked = !!(fromGroupId && supersets[ex.id] === fromGroupId);
            const color    = isLinked ? (ssColor(fromGroupId) ?? '#A78BFA') : colors.textSecondary;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[s.row, isLinked && { borderColor: color, backgroundColor: color + '10' }]}
                onPress={() => { isLinked ? onDisconnect(fromIdx, ex.id) : onConnect(fromIdx, ex.id); }}
                activeOpacity={0.75}
              >
                <Image source={{ uri: ex.image ?? 'https://via.placeholder.com/44' }} style={s.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowName, isLinked && { color }]}>{ex.name}</Text>
                  <Text style={s.rowMuscles} numberOfLines={1}>{(ex.muscles ?? []).join(' · ')}</Text>
                </View>
                <View style={[s.check, isLinked && { backgroundColor: color, borderColor: color }]}>
                  {isLinked && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={s.footer}>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: colors.library }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>Gotowe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── ActionSheet per ćwiczenie ───────────────────────────────────────────────
function ExerciseActionsSheet({ visible, exercise, isInSuperset, supersetColor: ssCol, canMoveUp, canMoveDown,
  onClose, onMoveUp, onMoveDown, onDetails, onDuplicate, onSuperset, onDelete, colors }) {
  if (!exercise) return null;
  const s = makeActionsStyles(colors);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title} numberOfLines={1}>{exercise.name}</Text>

          <View style={s.moveRow}>
            <TouchableOpacity
              style={[s.moveBtn, !canMoveUp && s.moveBtnOff]}
              disabled={!canMoveUp}
              onPress={onMoveUp}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={18} color={canMoveUp ? colors.textPrimary : colors.borderMuted} />
              <Text style={[s.moveBtnTxt, !canMoveUp && { color: colors.borderMuted }]}>W górę</Text>
            </TouchableOpacity>
            <View style={s.moveDivider} />
            <TouchableOpacity
              style={[s.moveBtn, !canMoveDown && s.moveBtnOff]}
              disabled={!canMoveDown}
              onPress={onMoveDown}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down" size={18} color={canMoveDown ? colors.textPrimary : colors.borderMuted} />
              <Text style={[s.moveBtnTxt, !canMoveDown && { color: colors.borderMuted }]}>W dół</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.row} onPress={onDetails} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: 'rgba(55,138,221,0.12)' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#378ADD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Szczegóły ćwiczenia</Text>
              <Text style={s.rowSub}>Opis, mięśnie, technika</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.row} onPress={onDuplicate} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: 'rgba(52,211,153,0.12)' }]}>
              <Ionicons name="copy-outline" size={20} color="#34D399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Duplikuj ćwiczenie</Text>
              <Text style={s.rowSub}>Dodaj kopię na końcu listy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.row} onPress={onSuperset} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: isInSuperset ? ((ssCol ?? '#A78BFA') + '25') : 'rgba(167,139,250,0.12)' }]}>
              <Text style={{ fontSize: 18 }}>{isInSuperset ? '⛓' : '🔗'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, isInSuperset && { color: ssCol ?? '#A78BFA' }]}>
                {isInSuperset ? 'Zarządzaj super-serią' : 'Połącz w super-serię'}
              </Text>
              <Text style={s.rowSub}>
                {isInSuperset ? 'Edytuj połączone ćwiczenia' : 'Naprzemienne wykonanie z innym ćwiczeniem'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={onDelete} activeOpacity={0.7}>
            <View style={[s.iconBox, { backgroundColor: 'rgba(255,69,58,0.12)' }]}>
              <Ionicons name="trash-outline" size={20} color="#FF453A" />
            </View>
            <Text style={[s.rowLabel, { color: '#FF453A' }]}>Usuń z planu</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Konektor super-serii ─────────────────────────────────────────────────────
function SSConnector({ color }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ alignItems: 'flex-start', paddingLeft: 20, paddingVertical: 2 }}>
      <Animated.View style={{
        width: 2, height: 20, borderRadius: 1, backgroundColor: color, opacity,
        shadowColor: color, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
      }} />
    </View>
  );
}

// ─── Główny ekran ────────────────────────────────────────────────────────────
export default function PlanCreatorScreen({ navigation, route }) {
  const { colors }        = useTheme();
  const { addCustomPlan, updateCustomPlan } = useWorkoutContext();
  const editPlanId      = route.params?.editPlanId ?? null;
  const initial         = route.params?.exercises ?? [];

  // Inicjalizacja exerciseData z istniejących planConfig gdy edytujemy
  const buildInitialExData = (exercises) => {
    const data = {};
    exercises.forEach(ex => {
      const cfg = ex.planConfig;
      if (cfg?.setRows?.length) {
        data[ex.id] = {
          sets:  cfg.setRows.map(row => ({ id: uid(), weight: row.weight ?? '', reps: row.reps ?? '' })),
          rest:  cfg.rest ?? null,
          notes: cfg.notes ?? '',
        };
      }
    });
    return data;
  };

  const [items,         setItems]         = useState(initial);
  const [planName,      setPlanName]      = useState(route.params?.initialPlanName ?? '');
  const [nameError,     setNameError]     = useState(false);
  const [supersets,     setSupersets]     = useState(route.params?.initialSupersets ?? {});
  const [exerciseData,  setExerciseData]  = useState(() => buildInitialExData(initial));

  // Modals
  const [detailEx,       setDetailEx]       = useState(null);
  const [detailIdx,      setDetailIdx]      = useState(-1);
  const [ssPickerIdx,    setSsPickerIdx]    = useState(-1);
  const [actionsIdx,     setActionsIdx]     = useState(-1);
  const [pickerVisible,  setPickerVisible]  = useState(false);
  const [restPickerExId, setRestPickerExId] = useState(null);
  const [repsPickerInfo, setRepsPickerInfo] = useState(null);

  // Animacja shake dla błędu nazwy
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeAnim]);

  // ── Dane per ćwiczenie ───────────────────────────────────────────────────
  const getExData = useCallback((exId) => exerciseData[exId] ?? defData(), [exerciseData]);

  const patchExData = useCallback((exId, patch) => {
    setExerciseData(prev => ({
      ...prev,
      [exId]: { ...(prev[exId] ?? defData()), ...patch },
    }));
  }, []);

  const addSet = useCallback((exId) => {
    setExerciseData(prev => {
      const data = prev[exId] ?? defData();
      return { ...prev, [exId]: { ...data, sets: [...data.sets, newSet()] } };
    });
    Haptics.selectionAsync();
  }, []);

  const removeSet = useCallback((exId, setId) => {
    setExerciseData(prev => {
      const data = prev[exId] ?? defData();
      if (data.sets.length <= 1) return prev;
      return { ...prev, [exId]: { ...data, sets: data.sets.filter(s => s.id !== setId) } };
    });
    Haptics.selectionAsync();
  }, []);

  const updateSetField = useCallback((exId, setId, field, value) => {
    setExerciseData(prev => {
      const data = prev[exId] ?? defData();
      return {
        ...prev,
        [exId]: { ...data, sets: data.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) },
      };
    });
  }, []);

  // ── Kolejność ────────────────────────────────────────────────────────────
  const moveItem = useCallback((idx, dir) => {
    const to = idx + dir;
    setItems(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const a = [...prev];
      [a[idx], a[to]] = [a[to], a[idx]];
      return a;
    });
    setActionsIdx(-1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Super-serie ──────────────────────────────────────────────────────────
  const handleSSConnect = useCallback((fromIdx, toExId) => {
    const fromEx = items[fromIdx];
    if (!fromEx) return;
    setSupersets(prev => {
      const groupId = prev[fromEx.id] ?? `ss_${fromEx.id}_${Date.now()}`;
      return { ...prev, [fromEx.id]: groupId, [toExId]: groupId };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [items]);

  const handleSSDisconnect = useCallback((fromIdx, toExId) => {
    const fromEx = items[fromIdx];
    if (!fromEx) return;
    setSupersets(prev => {
      const groupId = prev[fromEx.id];
      const next    = { ...prev };
      delete next[toExId];
      const stillHas = items.some(ex => ex.id !== toExId && ex.id !== fromEx.id && next[ex.id] === groupId);
      if (!stillHas) delete next[fromEx.id];
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [items]);

  const handleDeleteAtIdx = useCallback((idx) => {
    setItems(prev => {
      const exId = prev[idx]?.id;
      if (exId) {
        setSupersets(ss => { const n = { ...ss }; delete n[exId]; return n; });
        setExerciseData(d => { const n = { ...d }; delete n[exId]; return n; });
      }
      return prev.filter((_, i) => i !== idx);
    });
    setActionsIdx(-1);
    setDetailEx(null);
    setDetailIdx(-1);
  }, []);

  const handleDuplicate = useCallback((idx) => {
    const orig = items[idx];
    if (!orig) return;
    const newId = `${orig.id}_dup_${Date.now()}`;
    const newEx = { ...orig, id: newId };
    setItems(prev => [...prev, newEx]);
    setExerciseData(prev => {
      const origData = prev[orig.id];
      if (!origData) return prev;
      return { ...prev, [newId]: { ...origData, sets: origData.sets.map(s => ({ ...s, id: uid() })) } };
    });
    setActionsIdx(-1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [items]);

  // ── Zapis ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!planName.trim()) {
      setNameError(true);
      triggerShake();
      return;
    }
    const exercisesWithCfg = items.map(ex => {
      const data = exerciseData[ex.id] ?? defData();
      return {
        ...ex,
        planConfig: {
          setRows:  data.sets.map(s => ({ weight: s.weight, reps: s.reps })),
          rest:     data.rest ?? 90,
          notes:    data.notes,
          sets:     data.sets.length,
          setTypes: data.sets.map(() => 'N'),
          repsMin:  null,
          repsMax:  null,
          weight:   '',
        },
      };
    });
    if (editPlanId) {
      updateCustomPlan(editPlanId, { name: planName.trim(), exercises: exercisesWithCfg, supersetGroups: supersets });
    } else {
      addCustomPlan({ name: planName.trim(), exercises: exercisesWithCfg, supersetGroups: supersets });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.popToTop();
  }, [items, exerciseData, planName, supersets, editPlanId, addCustomPlan, updateCustomPlan, navigation, triggerShake]);

  // ── Statystyki ───────────────────────────────────────────────────────────
  const totalSets    = items.reduce((sum, ex) => sum + (exerciseData[ex.id]?.sets.length ?? 3), 0);
  const ssGroupCount = new Set(Object.values(supersets)).size;
  const s            = makeStyles(colors);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={s.screen}>

        {/* ── Nagłówek ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={[s.headerAction, { color: colors.textSecondary }]}>Anuluj</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{editPlanId ? 'Edytuj plan' : 'Kreator planu'}</Text>
          <TouchableOpacity
            style={[s.saveHeaderBtn, items.length === 0 && { opacity: 0.4 }]}
            disabled={items.length === 0}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={[s.saveHeaderText, { color: colors.accent }]}>Zapisz</Text>
          </TouchableOpacity>
        </View>

        {/* ── Nazwa planu ──────────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TextInput
            style={[
              s.nameInput,
              { borderColor: nameError && !planName.trim() ? '#FF453A' : colors.border },
            ]}
            value={planName}
            onChangeText={v => { setPlanName(v); if (v.trim()) setNameError(false); }}
            placeholder='Nazwa planu, np. "Push A" *'
            placeholderTextColor={nameError && !planName.trim() ? '#FF453A88' : colors.borderMuted}
            maxLength={40}
            returnKeyType="done"
          />
          {nameError && !planName.trim() && (
            <Text style={s.nameErrTxt}>Wpisz nazwę planu przed zapisaniem</Text>
          )}
        </Animated.View>

        {/* ── Pasek statystyk ──────────────────────────────────────────── */}
        <View style={s.statsBar}>
          <View style={s.statChip}>
            <Ionicons name="barbell-outline" size={12} color={colors.accent} />
            <Text style={s.statTxt}>{items.length} ćwiczeń</Text>
          </View>
          <View style={s.statDot} />
          <View style={s.statChip}>
            <Ionicons name="layers-outline" size={12} color={colors.library} />
            <Text style={s.statTxt}>{totalSets} serii</Text>
          </View>
          {ssGroupCount > 0 && (
            <>
              <View style={s.statDot} />
              <View style={s.statChip}>
                <Text style={{ fontSize: 10 }}>⛓</Text>
                <Text style={[s.statTxt, { color: '#A78BFA' }]}>{ssGroupCount} SS</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Lista ────────────────────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {items.length === 0 && (
            <View style={s.emptyState}>
              <Ionicons name="barbell-outline" size={44} color={colors.borderMuted} />
              <Text style={s.emptyTitle}>Brak ćwiczeń</Text>
              <Text style={s.emptyText}>Wróć do biblioteki i zaznacz ćwiczenia</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color={colors.accentText} />
                <Text style={[s.emptyBtnText, { color: colors.accentText }]}>Wybierz ćwiczenia</Text>
              </TouchableOpacity>
            </View>
          )}

          {items.map((item, idx) => {
            const groupId     = supersets[item.id];
            const nextItem    = items[idx + 1];
            const nextGroupId = nextItem ? supersets[nextItem.id] : null;
            const ssWithNext  = !!(groupId && nextGroupId && groupId === nextGroupId);
            const color       = groupId ? ssColor(groupId) : null;
            const data        = getExData(item.id);

            return (
              <View key={item.id}>
                {/* ── Karta ─────────────────────────────────────────────── */}
                <View style={[
                  s.card,
                  { backgroundColor: colors.backgroundSecondary, borderColor: color ?? colors.border, borderWidth: color ? 1.5 : 0.5 },
                ]}>
                  {color && <View style={[s.ssBar, { backgroundColor: color }]} />}

                  {/* Nagłówek: miniatura + nazwa (klikalną) + ⋯ */}
                  <View style={s.exHeader}>
                    <TouchableOpacity
                      style={s.exNameRow}
                      onPress={() => { setDetailEx(item); setDetailIdx(idx); }}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: item.image ?? 'https://via.placeholder.com/36/2C2C2E/636366?text=EX' }}
                        style={s.exThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.exName, { color: colors.accent }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {(item.muscles ?? []).length > 0 && (
                          <Text style={[s.exMuscles, { color: colors.textTertiary }]} numberOfLines={1}>
                            {item.muscles.join(' · ')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    {color && (
                      <View style={[s.ssBadge, { borderColor: color }]}>
                        <Text style={[s.ssBadgeText, { color }]}>⛓</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={s.moreBtn}
                      onPress={() => setActionsIdx(idx)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  {/* Notatki */}
                  <TextInput
                    style={[s.notesInput, { color: colors.textSecondary }]}
                    value={data.notes}
                    onChangeText={v => patchExData(item.id, { notes: v })}
                    placeholder="Dodaj notatki do rutyny"
                    placeholderTextColor={colors.borderMuted}
                    multiline
                    maxLength={200}
                  />

                  {/* Timer przerwy — pokrętło */}
                  <View style={s.restRow}>
                    <TouchableOpacity
                      style={s.restValueBtn}
                      onPress={() => setRestPickerExId(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="timer-outline" size={15} color={colors.library} />
                      <Text style={[s.restText, { color: colors.library }]}>
                        Timer przerwy: {fmtRest(data.rest)}
                      </Text>
                    </TouchableOpacity>
                    {data.rest !== null && (
                      <TouchableOpacity
                        style={s.restOffBtn}
                        onPress={() => { patchExData(item.id, { rest: null }); Haptics.selectionAsync(); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.borderMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Nagłówek kolumn */}
                  <View style={s.colHeader}>
                    <Text style={[s.colSeria, s.colLabel]}>SERIA</Text>
                    <Text style={[s.colKg,    s.colLabel]}>KG</Text>
                    <Text style={[s.colReps,  s.colLabel]}>POWT.</Text>
                    <View style={{ width: 28 }} />
                  </View>

                  {/* Wiersze serii */}
                  {data.sets.map((set, si) => (
                    <View key={set.id} style={[s.setRow, si % 2 === 1 && { backgroundColor: colors.background + '55' }]}>
                      <Text style={[s.colSeria, s.setNum, { color: colors.textSecondary }]}>{si + 1}</Text>
                      <TextInput
                        style={[s.colKg, s.setInput, { color: colors.textPrimary, borderColor: colors.border }]}
                        value={set.weight}
                        onChangeText={v => updateSetField(item.id, set.id, 'weight', v.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor={colors.borderMuted}
                        maxLength={6}
                        selectTextOnFocus
                      />
                      {/* POWT. — klikalny, otwiera RepsPickerModal */}
                      <TouchableOpacity
                        style={[s.colReps, s.repsCell, { borderColor: colors.border, backgroundColor: colors.card }]}
                        onPress={() => setRepsPickerInfo({ exId: item.id, setId: set.id, value: set.reps })}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.repsCellText, { color: set.reps ? colors.textPrimary : colors.borderMuted }]}>
                          {set.reps || '—'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.removeSetBtn}
                        onPress={() => removeSet(item.id, set.id)}
                        disabled={data.sets.length <= 1}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="close"
                          size={14}
                          color={data.sets.length <= 1 ? 'transparent' : colors.borderMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Dodaj serię */}
                  <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(item.id)} activeOpacity={0.7}>
                    <Ionicons name="add" size={16} color={colors.textSecondary} />
                    <Text style={[s.addSetText, { color: colors.textSecondary }]}>Dodaj serię</Text>
                  </TouchableOpacity>
                </View>

                {ssWithNext
                  ? <SSConnector color={color} />
                  : idx < items.length - 1 && <View style={{ height: 12 }} />
                }
              </View>
            );
          })}

          {items.length > 0 && (
            <TouchableOpacity
              style={[s.addMoreBtn, { backgroundColor: colors.librarySoft, borderColor: colors.library }]}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.library} />
              <Text style={[s.addMoreText, { color: colors.library }]}>Dodaj więcej ćwiczeń</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Stopka ───────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <View style={s.footerInfo}>
            <Text style={s.footerName} numberOfLines={1}>
              {planName.trim() ? `„${planName.trim()}"` : 'Bez nazwy'}
            </Text>
            <Text style={s.footerMeta}>
              {items.length} ćwiczeń · {totalSets} serii
            </Text>
          </View>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: colors.accent }, items.length === 0 && { opacity: 0.4 }]}
            disabled={items.length === 0}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color={colors.accentText} />
            <Text style={[s.saveBtnText, { color: colors.accentText }]}>Zapisz plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Szczegóły ćwiczenia ───────────────────────────────────────────── */}
      <ExerciseDetailModal
        visible={detailEx !== null}
        exercise={detailEx}
        colors={colors}
        onClose={() => { setDetailEx(null); setDetailIdx(-1); }}
        onRemove={detailIdx !== -1 ? () => handleDeleteAtIdx(detailIdx) : null}
      />

      {/* ── ActionSheet ──────────────────────────────────────────────────── */}
      <ExerciseActionsSheet
        visible={actionsIdx !== -1}
        exercise={actionsIdx !== -1 ? items[actionsIdx] : null}
        isInSuperset={actionsIdx !== -1 && !!supersets[items[actionsIdx]?.id]}
        supersetColor={actionsIdx !== -1 ? ssColor(supersets[items[actionsIdx]?.id]) : null}
        canMoveUp={actionsIdx > 0}
        canMoveDown={actionsIdx !== -1 && actionsIdx < items.length - 1}
        colors={colors}
        onClose={() => setActionsIdx(-1)}
        onMoveUp={() => moveItem(actionsIdx, -1)}
        onMoveDown={() => moveItem(actionsIdx, 1)}
        onDetails={() => {
          const ex  = items[actionsIdx];
          const idx = actionsIdx;
          setActionsIdx(-1);
          setDetailEx(ex);
          setDetailIdx(idx);
        }}
        onSuperset={() => {
          const idx = actionsIdx;
          setActionsIdx(-1);
          setSsPickerIdx(idx);
        }}
        onDuplicate={() => handleDuplicate(actionsIdx)}
        onDelete={() => handleDeleteAtIdx(actionsIdx)}
      />

      {/* ── Picker super-serii ────────────────────────────────────────────── */}
      <SupersetPickerModal
        visible={ssPickerIdx !== -1}
        fromIdx={ssPickerIdx}
        items={items}
        supersets={supersets}
        onConnect={handleSSConnect}
        onDisconnect={handleSSDisconnect}
        onClose={() => setSsPickerIdx(-1)}
        colors={colors}
      />

      {/* ── RestPickerModal — pokrętło przerwy ───────────────────────────── */}
      <RestPickerModal
        isVisible={restPickerExId !== null}
        currentRest={restPickerExId ? (exerciseData[restPickerExId]?.rest ?? 90) : 90}
        onSelectTime={(sec) => {
          if (restPickerExId) patchExData(restPickerExId, { rest: sec });
          setRestPickerExId(null);
        }}
        onClose={() => setRestPickerExId(null)}
      />

      {/* ── RepsPickerModal ───────────────────────────────────────────────── */}
      <RepsPickerModal
        visible={repsPickerInfo !== null}
        currentReps={repsPickerInfo?.value ?? ''}
        onSave={(val) => {
          if (repsPickerInfo) updateSetField(repsPickerInfo.exId, repsPickerInfo.setId, 'reps', val);
          setRepsPickerInfo(null);
        }}
        onClose={() => setRepsPickerInfo(null)}
        colors={colors}
      />

      {/* ── Dodaj ćwiczenia ───────────────────────────────────────────────── */}
      <ExercisePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={(newExercises) => {
          setItems(prev => [...prev, ...newExercises]);
          setPickerVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </GestureHandlerRootView>
  );
}

// ─── Style główne ────────────────────────────────────────────────────────────
const makeStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  backBtn:        { paddingVertical: 4, paddingRight: 8 },
  headerAction:   { fontSize: 16, fontWeight: '400' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  saveHeaderBtn:  { paddingVertical: 4, paddingLeft: 8 },
  saveHeaderText: { fontSize: 16, fontWeight: '700' },

  nameInput: {
    backgroundColor: c.backgroundSecondary,
    borderRadius: 14, borderWidth: 1,
    color: c.textPrimary, fontSize: 17, fontWeight: '600',
    paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 4,
  },
  nameErrTxt: {
    fontSize: 12, color: '#FF453A', marginHorizontal: 20, marginBottom: 8,
  },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTxt:  { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
  statDot:  { width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.borderMuted },

  listContent: { paddingHorizontal: 16 },

  // Karta ćwiczenia
  card:    { borderRadius: 16, overflow: 'hidden', paddingBottom: 4 },
  ssBar:   { height: 3, width: '100%' },

  exHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  exNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exThumb:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2C2C2E' },
  exName:    { fontSize: 15, fontWeight: '700' },
  exMuscles: { fontSize: 11, marginTop: 1 },
  ssBadge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 6 },
  ssBadgeText: { fontSize: 11, fontWeight: '700' },
  moreBtn:   { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  notesInput: {
    fontSize: 13, paddingHorizontal: 14, paddingVertical: 6,
    minHeight: 32, textAlignVertical: 'top',
  },

  restRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  restValueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  restText:     { fontSize: 13, fontWeight: '500' },
  restOffBtn:   { padding: 2 },

  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
    borderTopWidth: 0.5, borderTopColor: c.border,
  },
  colLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, textAlign: 'center' },
  colSeria: { width: 42, textAlign: 'left' },
  colKg:    { flex: 1 },
  colReps:  { flex: 1 },

  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  setNum:   { fontSize: 14, fontWeight: '600', width: 42 },
  setInput: {
    flex: 1, textAlign: 'center',
    fontSize: 15, fontWeight: '600',
    borderWidth: 1, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 4,
    marginHorizontal: 3,
  },
  repsCell: {
    flex: 1, marginHorizontal: 3,
    borderWidth: 1, borderRadius: 8,
    paddingVertical: 8, alignItems: 'center', justifyContent: 'center',
  },
  repsCellText: { fontSize: 15, fontWeight: '600' },
  removeSetBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },

  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginHorizontal: 14, marginTop: 4, marginBottom: 8,
    borderRadius: 12, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed',
  },
  addSetText: { fontSize: 14, fontWeight: '500' },

  addMoreBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 0.5, paddingVertical: 14, marginTop: 12 },
  addMoreText: { fontSize: 14, fontWeight: '600' },

  emptyState:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  emptyText:    { fontSize: 14, color: c.textTertiary, textAlign: 'center' },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '600' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: c.border,
  },
  footerInfo:  { flex: 1 },
  footerName:  { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  footerMeta:  { fontSize: 11, color: c.textTertiary, marginTop: 2 },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});

// ─── Style: RepsPickerModal ──────────────────────────────────────────────────
const makeRepsStyles = (c) => StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: c.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingHorizontal: 20 },
  handle:     { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 18 },

  segment:    { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  segBtn:     { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segTxt:     { fontSize: 14, fontWeight: '600' },

  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24 },
  rangeRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 },
  rangeBlock: { alignItems: 'center', gap: 8, flex: 1 },

  bigInput: {
    width: '100%', textAlign: 'center',
    fontSize: 36, fontWeight: '800', color: c.textPrimary,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    borderRadius: 14, paddingVertical: 14,
  },
  unit:  { fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8 },
  dash:  { fontSize: 28, color: c.borderMuted, fontWeight: '300', marginBottom: 24 },

  confirmBtn: { backgroundColor: c.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmTxt: { fontSize: 16, fontWeight: '700', color: c.accentText },
  cancelBtn:  { paddingVertical: 12, alignItems: 'center' },
  cancelTxt:  { fontSize: 15, color: c.textTertiary },
});

// ─── Style: szczegóły ćwiczenia ──────────────────────────────────────────────
const makeDetailStyles = (c) => StyleSheet.create({
  screen:       { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:       { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12 },
  name:         { fontSize: 22, fontWeight: '800', color: c.textPrimary, marginBottom: 8 },
  badges:       { flexDirection: 'row', gap: 8 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:    { fontSize: 12, fontWeight: '600', color: c.textSecondary },
  closeBtn:     { width: 32, height: 32, borderRadius: 10, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  content:      { paddingHorizontal: 20, paddingBottom: 32 },
  videoBox:     { height: 180, backgroundColor: c.card, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 8, borderWidth: 0.5, borderColor: c.border },
  playCircle:   { width: 60, height: 60, borderRadius: 30, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent },
  videoLabel:   { fontSize: 13, color: c.textTertiary },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  description:  { fontSize: 15, color: c.textPrimary, lineHeight: 24, marginBottom: 20 },
  muscleRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  muscleDot:    { width: 7, height: 7, borderRadius: 4 },
  muscleText:   { fontSize: 15, color: c.textPrimary },
  tipBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(239,159,39,0.08)', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: 'rgba(239,159,39,0.25)', marginTop: 20 },
  tipText:      { flex: 1, fontSize: 13, color: c.textPrimary, lineHeight: 19 },
  footer:       { padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderTopColor: c.border },
  removeBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.dangerSoft, borderRadius: 14, paddingVertical: 14 },
  removeBtnText:{ fontSize: 15, fontWeight: '600' },
});

// ─── Style: superset picker ──────────────────────────────────────────────────
const makePickerStyles = (c) => StyleSheet.create({
  screen:    { flex: 1, backgroundColor: c.backgroundSecondary },
  handle:    { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  chainIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  subtitle:  { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  closeBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center' },
  hint:      { fontSize: 12, color: c.textTertiary, paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18 },
  list:      { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.card, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: c.border,
  },
  thumb:      { width: 44, height: 44, borderRadius: 10, backgroundColor: '#2C2C2E' },
  rowName:    { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
  rowMuscles: { fontSize: 12, color: c.textTertiary },
  check:      { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: c.borderMuted, justifyContent: 'center', alignItems: 'center' },
  footer:     { padding: 16, paddingBottom: 32 },
  doneBtn:    { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  doneBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Style: action sheet ─────────────────────────────────────────────────────
const makeActionsStyles = (c) => StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: c.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, paddingHorizontal: 16 },
  handle:     { width: 36, height: 4, backgroundColor: c.borderMuted, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 14 },
  title:      { fontSize: 13, fontWeight: '600', color: c.textTertiary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 },

  moveRow:    { flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  moveBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  moveBtnOff: { opacity: 0.4 },
  moveBtnTxt: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  moveDivider:{ width: 1, backgroundColor: c.border },

  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  iconBox:    { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowLabel:   { fontSize: 16, fontWeight: '500', color: c.textPrimary },
  rowSub:     { fontSize: 12, color: c.textTertiary, marginTop: 1 },
  divider:    { height: 0.5, backgroundColor: c.border, marginVertical: 4 },
  cancelBtn:  { marginTop: 8, backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
});
