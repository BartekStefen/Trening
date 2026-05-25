import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

function ArcSegment({
  cx,
  cy,
  r,
  circumference,
  sweepDeg,
  rotation,
  progress,
  color,
  strokeWidth,
  trackColor,
  gradId,
  animate,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [dashLen, setDashLen] = useState(0);
  const maxArc = circumference * (sweepDeg / 360);

  useEffect(() => {
    if (!animate) {
      setDashLen(maxArc * Math.min(Math.max(progress ?? 0, 0), 1));
      return undefined;
    }
    anim.setValue(0);
    const sub = anim.addListener(({ value }) => {
      setDashLen(maxArc * value);
    });
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress ?? 0, 0), 1),
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(sub);
  }, [progress, maxArc, anim, animate]);

  const trackArc = maxArc;

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${trackArc} ${circumference}`}
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={gradId ? `url(#${gradId})` : color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dashLen} ${circumference}`}
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
    </>
  );
}

/**
 * Pierścień z wieloma łukami — animacja wypełnienia + gradient SVG.
 */
export default function MultiArcRing({
  size = 116,
  strokeWidth = 9,
  segments = [],
  trackColor = '#2C2C2E',
  centerLabel,
  centerSub,
  centerColor = '#FFFFFF',
  animate = true,
  compactCenter = false,
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const n = Math.max(segments.length, 1);
  const gapDeg = n > 1 ? 7 : 0;
  const sweepDeg = (360 - n * gapDeg) / n;

  let rot = -90;

  const labelStr = String(centerLabel ?? '');
  const labelSize = compactCenter
    ? (labelStr.length > 5 ? 10 : labelStr.length > 4 ? 11 : 13)
    : (labelStr.length > 5 ? 12 : labelStr.length > 4 ? 13 : 15);

  return (
    <View style={[s.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {segments.map((seg) => (
            <LinearGradient
              key={`g-${seg.key}`}
              id={`grad-${seg.key}`}
              x1="0"
              y1="1"
              x2="1"
              y2="0"
            >
              <Stop offset="0" stopColor={seg.color} stopOpacity="0.85" />
              <Stop offset="1" stopColor={seg.colorEnd ?? seg.color} stopOpacity="1" />
            </LinearGradient>
          ))}
        </Defs>

        {segments.map((seg) => {
          const rotation = rot;
          rot += sweepDeg + gapDeg;
          return (
            <ArcSegment
              key={seg.key}
              cx={cx}
              cy={cy}
              r={r}
              circumference={C}
              sweepDeg={sweepDeg}
              rotation={rotation}
              progress={seg.progress}
              color={seg.color}
              strokeWidth={strokeWidth}
              trackColor={trackColor}
              gradId={`grad-${seg.key}`}
              animate={animate}
            />
          );
        })}
      </Svg>

      {(centerLabel != null || centerSub != null) && (
        <View style={[s.center, compactCenter && s.centerCompact]} pointerEvents="none">
          {centerLabel != null && (
            <Text
              style={[s.centerLabel, { color: centerColor, fontSize: labelSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {centerLabel}
            </Text>
          )}
          {centerSub != null && (
            <Text
              style={[s.centerSub, { color: centerColor, opacity: 0.65, fontSize: compactCenter ? 9 : 10 }]}
              numberOfLines={1}
            >
              {centerSub}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  centerCompact: { paddingHorizontal: 6 },
  centerLabel: { fontWeight: '800', textAlign: 'center' },
  centerSub: { fontWeight: '600', marginTop: 1, textAlign: 'center' },
});
