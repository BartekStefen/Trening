import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import InfoTip from './InfoTip';
import { hasInfo } from '../../constants/profileInfoTexts';

export default function CardHeader({ title, subtitle, infoBody, right, compact }) {
  const { colors } = useTheme();

  return (
    <View style={[s.row, compact && s.rowCompact]}>
      <View style={s.left}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
          {hasInfo(infoBody) ? <InfoTip title={title} info={infoBody} /> : null}
        </View>
        {subtitle ? (
          <Text style={[s.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );
}

/** Nagłówek sekcji poza kartą (np. w ProfileScreen) */
export function SectionHeader({ title, infoBody, style, spaced }) {
  const { colors } = useTheme();

  return (
    <View style={[s.sectionRow, spaced && s.sectionSpaced, style]}>
      <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {hasInfo(infoBody) ? <InfoTip title={title} info={infoBody} size={20} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  rowCompact: { marginBottom: 8 },
  left: { flex: 1, paddingRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  right: { flexShrink: 0 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSpaced: { marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
});
