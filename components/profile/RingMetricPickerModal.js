import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  RING_METRICS,
  getMetricDescription,
  getRingPickerSections,
} from '../../utils/ringMetrics';

const RING_PICKER_TITLES = [
  { title: 'Pierścień Dzień', sub: 'Wybierz metrykę dla łuku aktywności' },
  { title: 'Pierścień Makro', sub: 'Jeden łuk = jedno makro (nie powtarzaj)' },
  { title: 'Pierścień Rytm', sub: 'Regeneracja, nawyki i postęp' },
];


export default function RingMetricPickerModal({
  visible,
  ringIndex = 0,
  slotIndex,
  currentMetricId,
  usedMetricIds = [],
  allowedMetricIds = null,
  onSelect,
  onClose,
}) {
  const { colors } = useTheme();
  const allowedSet = allowedMetricIds ? new Set(allowedMetricIds) : null;
  const sections = getRingPickerSections(ringIndex);
  const header = RING_PICKER_TITLES[ringIndex] ?? RING_PICKER_TITLES[0];
  const arcName = `Łuk ${(slotIndex ?? 0) + 1}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: colors.card }]}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <Text style={[s.title, { color: colors.textPrimary }]}>{header.title}</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>{header.sub}</Text>
        {slotIndex != null ? (
          <Text style={[s.arcHint, { color: colors.accent }]}>
            Edytujesz: {arcName}
          </Text>
        ) : null}

        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            const items = section.metricIds
              .map((id) => RING_METRICS[id])
              .filter((m) => m && (!allowedSet || allowedSet.has(m.id)));

            if (!items.length) return null;

            return (
              <View key={section.title} style={s.group}>
                <Text style={[s.groupTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                <Text style={[s.groupSub, { color: colors.textSecondary }]}>{section.subtitle}</Text>
                {items.map((m) => {
                  const active = m.id === currentMetricId;
                  const usedElsewhere = usedMetricIds.includes(m.id) && !active;
                  const desc = getMetricDescription(m.id);

                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        s.row,
                        { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                        active && { borderColor: m.color, backgroundColor: `${m.color}18` },
                        usedElsewhere && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (usedElsewhere) return;
                        onSelect(m.id);
                        onClose();
                      }}
                      disabled={usedElsewhere}
                      activeOpacity={0.75}
                    >
                      <View style={[s.dot, { backgroundColor: m.color }]} />
                      <View style={s.rowText}>
                        <Text style={[s.rowLabel, { color: colors.textPrimary }]}>{m.label}</Text>
                        {desc ? (
                          <Text style={[s.rowDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {desc}
                          </Text>
                        ) : null}
                        {usedElsewhere ? (
                          <Text style={[s.usedTag, { color: colors.textTertiary }]}>
                            Już na innym łuku tego pierścienia
                          </Text>
                        ) : null}
                      </View>
                      {active ? (
                        <Ionicons name="checkmark-circle" size={22} color={m.color} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 4 },
  sub: { fontSize: 12, paddingHorizontal: 20, marginBottom: 6, lineHeight: 17 },
  arcHint: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16 },
  group: { marginBottom: 18 },
  groupTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2, paddingHorizontal: 4 },
  groupSub: { fontSize: 11, marginBottom: 10, paddingHorizontal: 4, lineHeight: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowDesc: { fontSize: 12, lineHeight: 16 },
  usedTag: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
