import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { REGION_KEYS, INTENSITY_CAPS, LEGACY_KEY_MAP } from '../constants/muscleConstants';

// ─── LiveMuscleMap ─────────────────────────────────────────────────────────────
// Używa react-native-body-highlighter (realistyczna sylwetka SVG).
// Silnik animacji RAF 60 fps, easeInOutCubic — animuje float 0-1 per region,
// mapuje do slug/color library i odświeża <Body> na każdej klatce animacji.
// ─────────────────────────────────────────────────────────────────────────────

// Kolor nieaktywnych mięśni musi być identyczny z defaultFill
const INACTIVE = '#2A2A2E';

// ─── Silnik kolorów ────────────────────────────────────────────────────────────
const COLOR_STOPS = [
  { at: 0,    r: 0x2A, g: 0x2A, b: 0x2E },
  { at: 0.25, r: 0x7B, g: 0x1B, b: 0x1B },
  { at: 0.55, r: 0xD3, g: 0x2F, b: 0x2F },
  { at: 0.85, r: 0xFF, g: 0x3D, b: 0x00 },
  { at: 1.0,  r: 0xFF, g: 0x6E, b: 0x40 },
];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

const intensityToHex = (v) => {
  v = Math.max(0, Math.min(1, v));
  if (v <= 0) return INACTIVE;
  if (v >= 1) return '#FF6E40';
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const lo = COLOR_STOPS[i], hi = COLOR_STOPS[i + 1];
    if (v >= lo.at && v <= hi.at) {
      const t = (v - lo.at) / (hi.at - lo.at);
      return `#${lerp(lo.r,hi.r,t).toString(16).padStart(2,'0')}${lerp(lo.g,hi.g,t).toString(16).padStart(2,'0')}${lerp(lo.b,hi.b,t).toString(16).padStart(2,'0')}`;
    }
  }
  return '#FF6E40';
};

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ─── Silnik animacji RAF — zwraca float intensities (0–1) ──────────────────────
const ANIM_DURATION = 450;

const useAnimatedIntensities = (targetMap) => {
  const [intensities, setIntensities] = useState(() => {
    const init = {};
    REGION_KEYS.forEach((k) => { init[k] = 0; });
    return init;
  });
  const fromRef   = useRef({});
  const rafRef    = useRef(null);
  const startRef  = useRef(null);
  const targetRef = useRef(targetMap);

  useEffect(() => {
    targetRef.current = targetMap;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = { ...fromRef.current };
    startRef.current = performance.now();

    const step = (now) => {
      const t     = Math.min((now - startRef.current) / ANIM_DURATION, 1);
      const eased = easeInOutCubic(t);
      const ni    = {};
      REGION_KEYS.forEach((k) => {
        ni[k] = (from[k] ?? 0) + ((targetRef.current[k] ?? 0) - (from[k] ?? 0)) * eased;
      });
      fromRef.current = ni;
      setIntensities({ ...ni });
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(targetMap)]);

  return intensities;
};

// ─── Mapowanie region keys → body-highlighter slugs ───────────────────────────
// Wiele naszych sub-regionów mapuje na jeden slug — bierze max intensywność.
const mx = (intensities, keys) => Math.max(...keys.map((k) => intensities[k] ?? 0));

const buildBodyData = (intensities) => [
  { slug: 'chest',       color: intensityToHex(mx(intensities, ['chest_upper', 'chest_lower'])) },
  { slug: 'deltoids',    color: intensityToHex(mx(intensities, ['shoulders_front', 'shoulders_side', 'shoulders_rear'])) },
  { slug: 'trapezius',   color: intensityToHex(mx(intensities, ['back_upper'])) },
  { slug: 'upper-back',  color: intensityToHex(mx(intensities, ['back_lat', 'back_upper'])) },
  { slug: 'lower-back',  color: intensityToHex(mx(intensities, ['back_lat'])) },
  { slug: 'biceps',      color: intensityToHex(mx(intensities, ['biceps'])) },
  { slug: 'triceps',     color: intensityToHex(mx(intensities, ['triceps'])) },
  { slug: 'forearm',     color: intensityToHex(mx(intensities, ['forearms'])) },
  { slug: 'abs',         color: intensityToHex(mx(intensities, ['abs'])) },
  { slug: 'obliques',    color: intensityToHex(mx(intensities, ['abs'])) },
  { slug: 'quadriceps',  color: intensityToHex(mx(intensities, ['quads'])) },
  { slug: 'hamstring',   color: intensityToHex(mx(intensities, ['hamstrings'])) },
  { slug: 'gluteal',     color: intensityToHex(mx(intensities, ['glutes'])) },
  { slug: 'calves',      color: intensityToHex(mx(intensities, ['calves'])) },
];

// ─── Normalizacja wejścia ──────────────────────────────────────────────────────
const resolveIntensityMap = (heatmap, activeMuscles) => {
  const raw = heatmap ?? activeMuscles;
  if (!raw) return {};
  if (raw instanceof Set || Array.isArray(raw)) {
    const result = {};
    [...(Array.isArray(raw) ? raw : [...raw])].forEach((key) => {
      if (REGION_KEYS.includes(key)) {
        result[key] = 0.7;
      } else if (LEGACY_KEY_MAP[key]) {
        Object.entries(LEGACY_KEY_MAP[key]).forEach(([sub, ratio]) => {
          result[sub] = Math.max(result[sub] ?? 0, 0.7 * ratio);
        });
      }
    });
    return result;
  }
  const result = {};
  Object.entries(raw).forEach(([key, val]) => {
    const rawInt = val === true ? 0.7 : typeof val === 'number' ? val : 0;
    if (rawInt === 0) return;
    if (REGION_KEYS.includes(key)) {
      const intensity = rawInt > 1 ? Math.min(rawInt / (INTENSITY_CAPS[key] ?? 5), 1.0) : rawInt;
      result[key] = Math.max(result[key] ?? 0, intensity);
    } else if (LEGACY_KEY_MAP[key]) {
      const intensity = rawInt > 1 ? Math.min(rawInt / 5, 1.0) : rawInt;
      Object.entries(LEGACY_KEY_MAP[key]).forEach(([sub, ratio]) => {
        result[sub] = Math.max(result[sub] ?? 0, intensity * ratio);
      });
    }
  });
  return result;
};

// ─── Komponent główny ──────────────────────────────────────────────────────────
const LiveMuscleMap = ({ heatmap, activeMuscles, scale = 1 }) => {
  const intensityMap = resolveIntensityMap(heatmap, activeMuscles);
  const intensities  = useAnimatedIntensities(intensityMap);
  const bodyData     = buildBodyData(intensities);

  return (
    <View style={styles.container}>
      <Body
        data={bodyData}
        side="front"
        scale={scale}
        gender="male"
        defaultFill={INACTIVE}
        border="#3A3A3C"
      />
      <View style={[styles.gap, { width: 16 * scale }]} />
      <Body
        data={bodyData}
        side="back"
        scale={scale}
        gender="male"
        defaultFill={INACTIVE}
        border="#3A3A3C"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  gap:       { width: 16 },
});

export default LiveMuscleMap;
