import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const W = 92;
const H = 48;
const ST = 7;
const R = (W - ST) / 2;
const CX = W / 2;
const CY = H - 2;
const ARC = Math.PI * R;
const FULL = 2 * Math.PI * R;

function gradientId(ratio) {
  if (ratio > 1) return 'arcOver';
  if (ratio >= 0.75) return 'arcHot';
  return 'arcCool';
}

/** Kompaktowy łuk kalorii (styl Cal AI / fruit tracker) — gradient, mały, bez ozdób. */
export default function CalorieThermometer({ eaten = 0, goal = 3000 }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const [dash, setDash] = useState(0);

  const ratio = goal > 0 ? eaten / goal : 0;
  const displayPct = Math.min(Math.round(ratio * 100), 150);
  const grad = gradientId(ratio);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.min(ratio, 1),
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [eaten, goal, ratio, progress]);

  useEffect(() => {
    const sub = progress.addListener(({ value }) => setDash(value * ARC));
    return () => progress.removeListener(sub);
  }, [progress]);

  return (
    <View style={s.root}>
      <View style={s.arcWrap}>
        <Svg width={W} height={H}>
          <Defs>
            <LinearGradient id="arcCool" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#378ADD" />
              <Stop offset="1" stopColor={colors.accent} />
            </LinearGradient>
            <LinearGradient id="arcHot" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.accent} />
              <Stop offset="1" stopColor="#FAC775" />
            </LinearGradient>
            <LinearGradient id="arcOver" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FF5252" />
              <Stop offset="1" stopColor="#FF8A80" />
            </LinearGradient>
          </Defs>

          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={colors.border}
            strokeWidth={ST}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${FULL}`}
            transform={`rotate(180 ${CX} ${CY})`}
          />
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={`url(#${grad})`}
            strokeWidth={ST}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${FULL}`}
            transform={`rotate(180 ${CX} ${CY})`}
          />
        </Svg>

        <View style={s.arcCenter} pointerEvents="none">
          <Text style={[s.pct, { color: ratio > 1 ? colors.danger : colors.textPrimary }]}>
            {displayPct}
            <Text style={[s.pctSign, { color: colors.textSecondary }]}>%</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  arcWrap: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  arcCenter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pct: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pctSign: {
    fontSize: 11,
    fontWeight: '700',
  },
});
