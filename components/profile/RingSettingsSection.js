import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useStrengthRings } from '../../context/StrengthRingsContext';
import RingPreviewCard from './RingPreviewCard';
import RingEditModal from './RingEditModal';

const RINGS = [
  { index: 0, title: 'Dzień', sub: 'aktywność' },
  { index: 1, title: 'Makro', sub: 'kcal · makra' },
  { index: 2, title: 'Rytm', sub: 'regeneracja' },
];

export default function RingSettingsSection() {
  const { colors } = useTheme();
  const { ring1, ring2, ring3, ring1Progress, hydrated } = useStrengthRings();
  const [expanded, setExpanded] = useState(false);
  const [editRingIndex, setEditRingIndex] = useState(null);

  const segmentsList = [ring1, ring2, ring3];
  const centers = useMemo(() => [
    { label: `${Math.round(ring1Progress * 100)}%`, sub: 'dzień' },
    {
      label: ring2.find((s) => s.key === 'calories')?.display ?? '—',
      sub: 'kcal',
    },
    {
      label: `${ring3.find((s) => s.key === 'readiness')?.display ?? '—'}/10`,
      sub: 'got.',
    },
  ], [ring1Progress, ring2, ring3]);

  if (!hydrated) return null;

  const openEdit = (index) => setEditRingIndex(index);

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.accordionHead, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[s.iconBox, { backgroundColor: `${colors.accent}22` }]}>
          <Ionicons name="ellipse-outline" size={22} color={colors.accent} />
        </View>
        <View style={s.headText}>
          <Text style={[s.headTitle, { color: colors.textPrimary }]}>Pierścienie</Text>
          <Text style={[s.headSub, { color: colors.textSecondary }]}>
            {expanded ? 'Stuknij pierścień, aby edytować łuki' : 'Rozwiń, aby skonfigurować łuki'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={[s.list, { borderColor: colors.border }]}>
          {RINGS.map((ring, i) => (
            <View
              key={ring.index}
              style={[
                s.ringRow,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                i === RINGS.length - 1 && s.ringRowLast,
              ]}
            >
              <RingPreviewCard
                title={ring.title}
                subtitle={ring.sub}
                segments={segmentsList[ring.index]}
                trackColor={colors.border}
                textColor={colors.textPrimary}
                centerLabel={centers[ring.index].label}
                centerSub={centers[ring.index].sub}
                onPressRing={() => openEdit(ring.index)}
                compactLegend
              />
            </View>
          ))}
        </View>
      ) : null}

      <RingEditModal
        visible={editRingIndex != null}
        ringIndex={editRingIndex}
        onClose={() => setEditRingIndex(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12 },
  accordionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headText: { flex: 1 },
  headTitle: { fontSize: 16, fontWeight: '700' },
  headSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  list: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  ringRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  ringRowLast: { borderBottomWidth: 0 },
});
