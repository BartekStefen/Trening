import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useStrengthRings } from '../../context/StrengthRingsContext';
import CardHeader from './CardHeader';
import RingPreviewCard from './RingPreviewCard';
import RingEditModal from './RingEditModal';
import ConcentricRingsView from './ConcentricRingsView';
import { PROFILE_INFO } from '../../constants/profileInfoTexts';

const RINGS = [
  { index: 0, title: 'Dzień', sub: 'aktywność' },
  { index: 1, title: 'Makro', sub: 'kalorie i makra' },
  { index: 2, title: 'Rytm', sub: 'regeneracja' },
];

function avgProgress(segments) {
  if (!segments?.length) return 0;
  return segments.reduce((a, s) => a + s.progress, 0) / segments.length;
}

/** Skrót kcal w środku pierścienia (np. 1500 → 1,5k). */
function formatKcalCenter(display) {
  const raw = parseInt(String(display ?? '').replace(/\s/g, ''), 10);
  if (Number.isNaN(raw)) return display ?? '—';
  if (raw >= 10000) return `${Math.round(raw / 1000)}k`;
  if (raw >= 1000) {
    const k = Math.round(raw / 100) / 10;
    return `${String(k).replace('.', ',')}k`;
  }
  return String(raw);
}

export default function StrengthRingsPanel() {
  const { colors } = useTheme();
  const { ring1, ring2, ring3, ring1Progress, hydrated } = useStrengthRings();
  const [editRingIndex, setEditRingIndex] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const firedHapticRef = useRef(new Set());

  const segmentsList = [ring1, ring2, ring3];
  const macroProgress = useMemo(() => avgProgress(ring2), [ring2]);
  const rhythmProgress = useMemo(() => avgProgress(ring3), [ring3]);

  const centers = useMemo(() => [
    { label: `${Math.round(ring1Progress * 100)}%`, sub: 'dzień' },
    {
      label: formatKcalCenter(ring2.find((s) => s.key === 'calories')?.display),
      sub: 'kcal',
    },
    {
      label: `${ring3.find((s) => s.key === 'readiness')?.display ?? '—'}/10`,
      sub: 'got.',
    },
  ], [ring1Progress, ring2, ring3]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    [...ring1, ...ring2, ...ring3].forEach((seg) => {
      const key = `${today}_${seg.key}`;
      if (seg.progress >= 0.995 && !firedHapticRef.current.has(key)) {
        firedHapticRef.current.add(key);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });
  }, [ring1, ring2, ring3]);

  if (!hydrated) return null;

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CardHeader
        title="Pierścienie siły"
        subtitle="Stuknij pierścień, aby edytować · też w Ustawieniach"
        infoBody={PROFILE_INFO.strengthRings}
        compact
      />

      <ConcentricRingsView
        dayProgress={ring1Progress}
        macroProgress={macroProgress}
        rhythmProgress={rhythmProgress}
        trackColor={colors.border}
        textColor={colors.textPrimary}
        onPressRing={() => setShowDetail((v) => !v)}
      />

      <TouchableOpacity
        onPress={() => setShowDetail((v) => !v)}
        style={[s.toggle, { backgroundColor: colors.accentSoft }]}
      >
        <Text style={[s.toggleText, { color: colors.accent }]}>
          {showDetail ? 'Ukryj szczegóły' : 'Pokaż szczegóły łuków'}
        </Text>
      </TouchableOpacity>

      {showDetail && (
        <View style={s.ringsRow}>
          {RINGS.map((ring) => (
            <RingPreviewCard
              key={ring.index}
              title={ring.title}
              subtitle={ring.sub}
              segments={segmentsList[ring.index]}
              trackColor={colors.border}
              textColor={colors.textPrimary}
              centerLabel={centers[ring.index].label}
              centerSub={centers[ring.index].sub}
              onPressRing={() => setEditRingIndex(ring.index)}
              compactLegend
            />
          ))}
        </View>
      )}

      <RingEditModal
        visible={editRingIndex != null}
        ringIndex={editRingIndex}
        onClose={() => setEditRingIndex(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    marginBottom: 16,
  },
  toggle: {
    alignSelf: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
});
