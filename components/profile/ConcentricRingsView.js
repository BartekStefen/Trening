import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const RING_META = [
  { key: 'day', label: 'Dzień', color: '#378ADD', colorEnd: '#5AC8FA' },
  { key: 'macro', label: 'Makro', color: '#00E676', colorEnd: '#69F0AE' },
  { key: 'rhythm', label: 'Rytm', color: '#A78BFA', colorEnd: '#CE93D8' },
];

function NestedRing({ cx, cy, r, progress, strokeWidth, gradId, trackColor }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [dash, setDash] = useState(0);
  const C = 2 * Math.PI * r;

  useEffect(() => {
    anim.setValue(0);
    const sub = anim.addListener(({ value }) => setDash(C * value));
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(sub);
  }, [progress, C, anim]);

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.35}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  );
}

/** Trzy koncentryczne pierścienie + legenda pod spodem (pełna szerokość). */
export default function ConcentricRingsView({
  dayProgress,
  macroProgress,
  rhythmProgress,
  trackColor,
  textColor,
  size = 132,
  onPressRing,
}) {
  const progresses = useMemo(
    () => [dayProgress, macroProgress, rhythmProgress],
    [dayProgress, macroProgress, rhythmProgress],
  );

  const stroke = 11;
  const gap = 5;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - stroke) / 2;
  const radii = [
    outerR,
    outerR - stroke - gap,
    outerR - 2 * (stroke + gap),
  ];

  const content = (
    <View style={s.wrap}>
      <View style={{ width: size, height: size, alignSelf: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            {RING_META.map((meta) => (
              <LinearGradient key={meta.key} id={`conc-${meta.key}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={meta.color} />
                <Stop offset="1" stopColor={meta.colorEnd} />
              </LinearGradient>
            ))}
          </Defs>
          {RING_META.map((meta, i) => (
            <NestedRing
              key={meta.key}
              cx={cx}
              cy={cy}
              r={radii[i]}
              progress={progresses[i]}
              strokeWidth={stroke}
              gradId={`conc-${meta.key}`}
              trackColor={trackColor}
            />
          ))}
        </Svg>
      </View>

      <View style={s.legendRow}>
        {RING_META.map((meta, i) => (
          <View key={meta.key} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: meta.color }]} />
            <Text style={[s.legendLabel, { color: textColor }]} numberOfLines={1}>
              {meta.label}
            </Text>
            <Text style={[s.legendVal, { color: textColor }]}>
              {Math.round(progresses[i] * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (onPressRing) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPressRing} style={s.touch}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const s = StyleSheet.create({
  touch: { alignItems: 'center', marginBottom: 12 },
  wrap: {
    width: '100%',
    alignItems: 'stretch',
    gap: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 8,
  },
  legendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  legendVal: { fontSize: 15, fontWeight: '800' },
});
