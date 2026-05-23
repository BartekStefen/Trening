import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { hasInfo, normalizeInfo } from '../../constants/profileInfoTexts';

const DISCLAIMER = 'Informacja edukacyjna — nie zastępuje porady lekarza, dietetyka ani trenera. Przy objawach lub chorobach skonsultuj się ze specjalistą.';

const TABS = [
  { id: 'simple', label: 'Po co to?' },
  { id: 'detail', label: 'Więcej / nauka' },
];

export default function InfoTip({ title, info, body, size = 18, showDisclaimer = true }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('simple');

  const normalized = normalizeInfo(info ?? (body ? { simple: null, detail: body } : null));
  if (!hasInfo(normalized)) return null;

  const hasBoth = normalized.simple && normalized.detail;
  const activeText = tab === 'detail' && normalized.detail
    ? normalized.detail
    : (normalized.simple ?? normalized.detail);
  const showDisclaimerOnTab = showDisclaimer && tab === 'detail' && normalized.detail;

  const openModal = () => {
    setTab('simple');
    setOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={openModal}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
        accessibilityLabel={`Informacja: ${title}`}
        accessibilityRole="button"
      >
        <View style={[s.iconCircle, { borderColor: colors.borderMuted }]}>
          <Ionicons name="information" size={size - 6} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={s.centerWrap} pointerEvents="box-none">
          <View style={[s.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.sheetHeader}>
              <View style={[s.iconCircleLg, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="information" size={16} color={colors.accent} />
              </View>
              <Text style={[s.sheetTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {title}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {hasBoth && (
              <View style={[s.tabRow, { backgroundColor: colors.backgroundSecondary }]}>
                {TABS.map((t) => {
                  const active = tab === t.id;
                  const disabled = t.id === 'detail' && !normalized.detail;
                  if (disabled) return null;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        s.tab,
                        active && { backgroundColor: colors.card },
                        active && { borderColor: colors.accent },
                      ]}
                      onPress={() => setTab(t.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        s.tabText,
                        { color: active ? colors.accent : colors.textSecondary },
                        active && s.tabTextActive,
                      ]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <ScrollView style={s.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={[s.body, { color: colors.textSecondary }]}>{activeText}</Text>
              {showDisclaimerOnTab && (
                <Text style={[s.disclaimer, { color: colors.textTertiary }]}>{DISCLAIMER}</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[s.okBtn, { backgroundColor: colors.accent }]}
              onPress={() => setOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[s.okText, { color: colors.accentText ?? '#000' }]}>Rozumiem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    maxHeight: '82%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircleLg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: { fontSize: 12, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  bodyScroll: { maxHeight: 320, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22 },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: 14, fontStyle: 'italic' },
  okBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  okText: { fontSize: 15, fontWeight: '700' },
});
