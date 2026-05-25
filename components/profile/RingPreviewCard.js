import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MultiArcRing from '../shared/MultiArcRing';

export default function RingPreviewCard({
  title,
  subtitle,
  segments,
  trackColor,
  textColor,
  centerLabel,
  centerSub,
  onPressRing,
  compactLegend = false,
}) {
  const ringSize = compactLegend ? 96 : 108;

  return (
    <View style={s.wrap}>
      <Text
        style={[s.title, { color: textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[s.sub, { color: textColor, opacity: 0.65 }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {subtitle}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={onPressRing}
        activeOpacity={0.85}
        style={s.ringTouch}
        disabled={!onPressRing}
      >
        <MultiArcRing
          size={ringSize}
          strokeWidth={compactLegend ? 8 : 9}
          segments={segments}
          trackColor={trackColor}
          centerLabel={centerLabel}
          centerSub={centerSub}
          centerColor={textColor}
          compactCenter={compactLegend}
        />
      </TouchableOpacity>

      <View style={s.legend}>
        {segments.map((slot) => (
          <View key={slot.key} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: slot.color }]} />
            <Text
              style={[s.legendText, { color: textColor }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {slot.label ?? slot.fullLabel}
            </Text>
            <Text style={[s.legendVal, { color: textColor, opacity: 0.75 }]}>
              {Math.round(slot.progress * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  sub: {
    fontSize: 10,
    lineHeight: 13,
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
    minHeight: 26,
  },
  ringTouch: { alignItems: 'center' },
  legend: { width: '100%', gap: 5, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  legendText: { flex: 1, fontSize: 10, fontWeight: '600', lineHeight: 12 },
  legendVal: { fontSize: 10, fontWeight: '800', flexShrink: 0, minWidth: 26, textAlign: 'right' },
});
