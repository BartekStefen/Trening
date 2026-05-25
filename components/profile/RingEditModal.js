import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useStrengthRings } from '../../context/StrengthRingsContext';
import { getMetricDef, getMetricDescription } from '../../utils/ringMetrics';
import MultiArcRing from '../shared/MultiArcRing';
import RingMetricPickerModal from './RingMetricPickerModal';

const RING_META = [
  { index: 0, title: 'Pierścień Dzień', desc: 'Tonaż, woda, treningi — bez duplikowania kcal' },
  { index: 1, title: 'Pierścień Makro', desc: 'Kalorie, białko, tłuszcz, węgle' },
  { index: 2, title: 'Pierścień Rytm', desc: 'Regeneracja, wellness, nawyki, postęp' },
];

const arcLabel = (ringIndex, slotIndex) => {
  const n = slotIndex + 1;
  if (ringIndex === 1) {
    const hints = ['zwykle kalorie', 'zwykle białko', 'zwykle tłuszcz', 'zwykle węgle'];
    return `Łuk ${n} (${hints[slotIndex] ?? 'makro'})`;
  }
  return `Łuk ${n}`;
};

export default function RingEditModal({ visible, ringIndex, onClose }) {
  const { colors } = useTheme();
  const {
    ring1,
    ring2,
    ring3,
    ring1Slots,
    ring2Slots,
    ring3Slots,
    ring1Allowed,
    ring2Allowed,
    ring3Allowed,
    updateRingSlot,
  } = useStrengthRings();

  const [pickSlot, setPickSlot] = useState(null);

  if (ringIndex == null || ringIndex < 0 || ringIndex > 2) return null;

  const meta = RING_META[ringIndex];
  const segments = [ring1, ring2, ring3][ringIndex];
  const slots = [ring1Slots, ring2Slots, ring3Slots][ringIndex];
  const allowed = [ring1Allowed, ring2Allowed, ring3Allowed][ringIndex];

  const avgProgress = segments.length
    ? Math.round((segments.reduce((a, s) => a + s.progress, 0) / segments.length) * 100)
    : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>{meta.title}</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]}>{meta.desc}</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.previewWrap}>
            <MultiArcRing
              size={140}
              strokeWidth={11}
              segments={segments}
              trackColor={colors.border}
              centerLabel={`${avgProgress}%`}
              centerSub="podgląd"
              centerColor={colors.textPrimary}
            />
          </View>

          <Text style={[s.hint, { color: colors.textSecondary }]}>
            Stuknij łuk, aby zmienić metrykę. Każdy łuk musi być inny.
          </Text>

          {slots.map((metricId, slotIndex) => {
            const def = getMetricDef(metricId);
            const seg = segments[slotIndex];
            const label = arcLabel(ringIndex, slotIndex);
            const desc = getMetricDescription(metricId);
            return (
              <TouchableOpacity
                key={slotIndex}
                style={[s.slotRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setPickSlot(slotIndex)}
                activeOpacity={0.75}
              >
                <View style={[s.slotDot, { backgroundColor: def.color }]} />
                <View style={s.slotInfo}>
                  <Text style={[s.slotLabel, { color: colors.textTertiary }]}>{label}</Text>
                  <Text style={[s.slotName, { color: colors.textPrimary }]}>{def.label}</Text>
                  {desc ? (
                    <Text style={[s.slotDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {desc}
                    </Text>
                  ) : null}
                </View>
                <View style={s.slotRight}>
                  <Text style={[s.slotPct, { color: def.color }]}>
                    {Math.round((seg?.progress ?? 0) * 100)}%
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.borderMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <RingMetricPickerModal
          visible={pickSlot != null}
          ringIndex={ringIndex}
          slotIndex={pickSlot}
          currentMetricId={pickSlot != null ? slots[pickSlot] : null}
          usedMetricIds={slots}
          allowedMetricIds={allowed}
          onSelect={(id) => updateRingSlot(ringIndex, pickSlot, id)}
          onClose={() => setPickSlot(null)}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  content: { padding: 20, paddingBottom: 40 },
  previewWrap: { alignItems: 'center', marginBottom: 20 },
  hint: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  slotDot: { width: 12, height: 12, borderRadius: 6 },
  slotInfo: { flex: 1 },
  slotLabel: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  slotName: { fontSize: 16, fontWeight: '600' },
  slotDesc: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  slotRight: { alignItems: 'flex-end', gap: 4 },
  slotPct: { fontSize: 14, fontWeight: '700' },
});
