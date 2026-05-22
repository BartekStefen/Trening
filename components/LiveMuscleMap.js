import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Line } from 'react-native-svg';
import { REGION_KEYS, INTENSITY_CAPS, LEGACY_KEY_MAP } from '../constants/muscleConstants';

// ─── LiveMuscleMap ─────────────────────────────────────────────────────────────
// viewBox 100×200 — anatomicznie poprawna sylwetka atletyczna (przód + tył).
// Silnik animacji RAF 60 fps, 5-stopniowa interpolacja kolorów.
// ─────────────────────────────────────────────────────────────────────────────

const N  = '#3A3A3C';   // neutralne obszary (głowa, kolana, stopy)
const B  = '#2A2A2E';   // baza sylwetki ciała
const GR = '#1A1A1E';   // rowki / cienie mięśni
const HI = 'white';     // highlight (symulacja światła z góry-lewej)

// ─── Silnik kolorów ────────────────────────────────────────────────────────────
const COLOR_STOPS = [
  { at: 0,    r: 0x1C, g: 0x1C, b: 0x1E },
  { at: 0.25, r: 0x7B, g: 0x1B, b: 0x1B },
  { at: 0.55, r: 0xD3, g: 0x2F, b: 0x2F },
  { at: 0.85, r: 0xFF, g: 0x3D, b: 0x00 },
  { at: 1.0,  r: 0xFF, g: 0x6E, b: 0x40 },
];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

const intensityToHex = (v) => {
  v = Math.max(0, Math.min(1, v));
  if (v <= 0) return '#1C1C1E';
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

// ─── Silnik animacji RAF ───────────────────────────────────────────────────────
const ANIM_DURATION = 450;

const useAnimatedColors = (targetMap) => {
  const [colors, setColors] = useState(() => {
    const init = {};
    REGION_KEYS.forEach((k) => { init[k] = '#1C1C1E'; });
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
      const nc = {};
      REGION_KEYS.forEach((k) => { nc[k] = intensityToHex(ni[k]); });
      setColors(nc);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(targetMap)]);

  return colors;
};

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

// ─── WIDOK: PRZÓD ─────────────────────────────────────────────────────────────
const FrontView = ({ c, scale }) => (
  <Svg width={100 * scale} height={200 * scale} viewBox="0 0 100 200">

    {/* ── Baza sylwetki ── */}
    <Path fill={B} d="
      M50,19 C47,19 45,21 45,24 L45,29
      C40,30 30,33 24,37 C19,40 16,46 16,51
      L16,91 C14,95 14,101 16,105
      L16,142 C16,144 17,146 18,147
      L18,175 C18,177 20,179 23,179
      L23,181 C23,183 25,185 28,185
      L39,185 C42,185 44,183 44,181
      L44,175 L56,175 L56,181
      C56,183 58,185 61,185
      L72,185 C75,185 77,183 77,181
      L77,179 C80,179 82,177 82,175
      L82,147 C83,146 84,144 84,142
      L84,105 C86,101 86,95 84,91
      L84,51 C84,46 81,40 76,37
      C70,33 60,30 55,29
      L55,24 C55,21 53,19 50,19 Z
    " />

    {/* ── Głowa ── */}
    <Ellipse cx="50" cy="10" rx="9.5" ry="10.5" fill={N} />
    <Ellipse cx="40.5" cy="10.5" rx="2.5" ry="3.2" fill={N} />
    <Ellipse cx="59.5" cy="10.5" rx="2.5" ry="3.2" fill={N} />
    {/* dolna część twarzy — delikatne zagłębienie */}
    <Path fill={GR} fillOpacity={0.25}
      d="M43,15 Q50,20 57,15 L57,18 Q50,23 43,18 Z" />

    {/* ── Szyja ── */}
    <Path fill={N}
      d="M45,20 C44,22 44,26 45,29 L55,29 C56,26 56,22 55,20 Z" />
    {/* Mostek mostkowo-obojczykowo-sutkowy (SCM) */}
    <Path fill={GR} fillOpacity={0.22}
      d="M47,20 L48,29 L46,29 L45,20 Z" />
    <Path fill={GR} fillOpacity={0.22}
      d="M53,20 L52,29 L54,29 L55,20 Z" />

    {/* ── Bark – przedni (shoulders_front) ── */}
    <Path fill={c.shoulders_front}
      d="M27,33 C23,29 17,29 15,34 C13,39 15,43 19,44 C23,45 27,43 27,39 Z" />
    <Path fill={c.shoulders_front}
      d="M73,33 C77,29 83,29 85,34 C87,39 85,43 81,44 C77,45 73,43 73,39 Z" />
    {/* highlight górna część barku */}
    <Path fill={HI} fillOpacity={0.13}
      d="M25,33 C22,31 18,31 16,35 C15,37 15,39 16,41 L19,40 C17,38 17,35 19,33 Z" />
    <Path fill={HI} fillOpacity={0.13}
      d="M75,33 C78,31 82,31 84,35 C85,37 85,39 84,41 L81,40 C83,38 83,35 81,33 Z" />

    {/* ── Bark – boczny (shoulders_side) ── */}
    <Path fill={c.shoulders_side}
      d="M15,34 C12,38 12,44 14,48 C16,50 20,50 22,48 L20,45 C16,43 13,40 15,34 Z" />
    <Path fill={c.shoulders_side}
      d="M85,34 C88,38 88,44 86,48 C84,50 80,50 78,48 L80,45 C84,43 87,40 85,34 Z" />

    {/* ── Klatka – górna (chest_upper) ── */}
    <Path fill={c.chest_upper}
      d="M27,34 C26,30 31,28 40,28 L50,28 L50,40 C43,40 34,41 28,44 C26,41 26,37 27,34 Z" />
    <Path fill={c.chest_upper}
      d="M73,34 C74,30 69,28 60,28 L50,28 L50,40 C57,40 66,41 72,44 C74,41 74,37 73,34 Z" />
    {/* highlight góra klatki */}
    <Path fill={HI} fillOpacity={0.14}
      d="M36,29 C32,30 28,32 27,35 L50,35 C50,31 46,29 40,29 Z" />
    <Path fill={HI} fillOpacity={0.14}
      d="M64,29 C68,30 72,32 73,35 L50,35 C50,31 54,29 60,29 Z" />

    {/* ── Klatka – dolna (chest_lower) ── */}
    <Path fill={c.chest_lower}
      d="M27,40 C24,44 24,52 27,58 C30,62 37,63 45,60 L50,58 L50,40 C43,40 34,41 28,44 Z" />
    <Path fill={c.chest_lower}
      d="M73,40 C76,44 76,52 73,58 C70,62 63,63 55,60 L50,58 L50,40 C57,40 66,41 72,44 Z" />
    {/* łuk dolnej klatki */}
    <Path fill={GR} fillOpacity={0.28}
      d="M27,57 Q38,65 50,61 Q62,65 73,57 Q66,63 50,65 Q34,63 27,57 Z" />
    {/* rowek mostka */}
    <Line x1="50" y1="29" x2="50" y2="60" stroke={GR} strokeWidth="0.9" strokeOpacity="0.45" />

    {/* ── Serratus anterior (zaznaczony jako część abs) ── */}
    <Path fill={c.abs} fillOpacity={0.45}
      d="M27,56 C25,59 25,65 27,70 C29,71 31,69 31,66 L31,59 Z" />
    <Path fill={c.abs} fillOpacity={0.45}
      d="M73,56 C75,59 75,65 73,70 C71,71 69,69 69,66 L69,59 Z" />

    {/* ── Biceps ── */}
    <Path fill={c.biceps}
      d="M12,45 C10,51 9,61 10,70 C11,75 15,77 19,76 C23,74 25,68 24,60 C23,52 20,45 16,45 Z" />
    <Path fill={c.biceps}
      d="M88,45 C90,51 91,61 90,70 C89,75 85,77 81,76 C77,74 75,68 76,60 C77,52 80,45 84,45 Z" />
    {/* peak highlight */}
    <Path fill={HI} fillOpacity={0.16}
      d="M12,48 C10,54 10,62 11,68 L14,66 C13,61 13,53 14,47 Z" />
    <Path fill={HI} fillOpacity={0.16}
      d="M88,48 C90,54 90,62 89,68 L86,66 C87,61 87,53 86,47 Z" />
    {/* rowek brachialis */}
    <Path fill={GR} fillOpacity={0.18}
      d="M21,47 C21,53 21,61 22,67 L24,65 C23,60 23,52 23,47 Z" />
    <Path fill={GR} fillOpacity={0.18}
      d="M79,47 C79,53 79,61 78,67 L76,65 C77,60 77,52 77,47 Z" />

    {/* ── Przedramiona ── */}
    <Path fill={c.forearms}
      d="M10,75 C9,83 9,93 11,101 C13,105 17,106 20,105 C23,103 24,95 23,87 C22,79 18,75 14,75 Z" />
    <Path fill={c.forearms}
      d="M90,75 C91,83 91,93 89,101 C87,105 83,106 80,105 C77,103 76,95 77,87 C78,79 82,75 86,75 Z" />
    <Path fill={HI} fillOpacity={0.11}
      d="M10,78 C10,85 10,93 12,99 L15,97 C13,91 13,84 13,77 Z" />
    <Path fill={HI} fillOpacity={0.11}
      d="M90,78 C90,85 90,93 88,99 L85,97 C87,91 87,84 87,77 Z" />

    {/* ── Brzuch – rząd 1 ── */}
    <Path fill={c.abs}
      d="M36,60 L47,60 Q50,60 50,63 L50,70 Q50,73 47,73 L36,73 Q33,73 33,70 L33,63 Q33,60 36,60 Z" />
    <Path fill={c.abs}
      d="M53,60 L64,60 Q67,60 67,63 L67,70 Q67,73 64,73 L53,73 Q50,73 50,70 L50,63 Q50,60 53,60 Z" />
    {/* rząd 2 */}
    <Path fill={c.abs}
      d="M36,75 L47,75 Q50,75 50,78 L50,85 Q50,88 47,88 L36,88 Q33,88 33,85 L33,78 Q33,75 36,75 Z" />
    <Path fill={c.abs}
      d="M53,75 L64,75 Q67,75 67,78 L67,85 Q67,88 64,88 L53,88 Q50,88 50,85 L50,78 Q50,75 53,75 Z" />
    {/* rząd 3 */}
    <Path fill={c.abs}
      d="M36,90 L47,90 Q50,90 50,93 L50,100 Q50,103 47,103 L36,103 Q33,103 33,100 L33,93 Q33,90 36,90 Z" />
    <Path fill={c.abs}
      d="M53,90 L64,90 Q67,90 67,93 L67,100 Q67,103 64,103 L53,103 Q50,103 50,100 L50,93 Q50,90 53,90 Z" />
    {/* highlights segmentów */}
    <Path fill={HI} fillOpacity={0.11}
      d="M36,60 L47,60 Q50,60 50,62 L50,61 Q47,60 36,60 Z
         M53,60 L64,60 Q67,60 67,62 L67,61 Q64,60 53,60 Z
         M36,75 L47,75 Q50,75 50,77 L50,76 Q47,75 36,75 Z
         M53,75 L64,75 Q67,75 67,77 L67,76 Q64,75 53,75 Z
         M36,90 L47,90 Q50,90 50,92 L50,91 Q47,90 36,90 Z
         M53,90 L64,90 Q67,90 67,92 L67,91 Q64,90 53,90 Z" />

    {/* ── Skośne (obliques) – wizualnie jako część abs ── */}
    <Path fill={c.abs} fillOpacity={0.5}
      d="M28,58 C26,64 26,74 28,83 C29,89 32,92 35,91 C34,87 34,78 33,75 L33,73 C33,68 33,63 33,60 Z" />
    <Path fill={c.abs} fillOpacity={0.5}
      d="M72,58 C74,64 74,74 72,83 C71,89 68,92 65,91 C66,87 66,78 67,75 L67,73 C67,68 67,63 67,60 Z" />

    {/* ── Pas biodrowy ── */}
    <Path fill={N}
      d="M31,104 Q50,111 69,104 L69,112 Q50,119 31,112 Z" />
    {/* kolce biodrowe (ASIS) */}
    <Path fill={HI} fillOpacity={0.17}
      d="M31,104 Q36,106 41,105 L41,108 Q36,109 31,107 Z" />
    <Path fill={HI} fillOpacity={0.17}
      d="M69,104 Q64,106 59,105 L59,108 Q64,109 69,107 Z" />

    {/* ── Czworogłowy uda (quads) ── */}
    <Path fill={c.quads}
      d="M31,112 C28,119 26,132 28,145 C29,153 33,157 38,156 C43,155 45,149 46,140 C47,130 46,117 43,110 C41,104 35,103 31,107 Z" />
    <Path fill={c.quads}
      d="M69,112 C72,119 74,132 72,145 C71,153 67,157 62,156 C57,155 55,149 54,140 C53,130 54,117 57,110 C59,104 65,103 69,107 Z" />
    {/* VMO teardrop (przyśrodkowy zwój czworogłowego) */}
    <Path fill={c.quads} fillOpacity={0.88}
      d="M34,147 C31,152 32,158 36,159 C39,160 43,158 44,154 C45,150 43,146 40,145 Z" />
    <Path fill={c.quads} fillOpacity={0.88}
      d="M66,147 C69,152 68,158 64,159 C61,160 57,158 56,154 C55,150 57,146 60,145 Z" />
    {/* rowek rectus femoris */}
    <Path fill={GR} fillOpacity={0.16}
      d="M37,113 C36,121 36,132 37,142 L40,141 C39,131 39,120 40,112 Z" />
    <Path fill={GR} fillOpacity={0.16}
      d="M63,113 C64,121 64,132 63,142 L60,141 C61,131 61,120 60,112 Z" />
    {/* highlight boczny ud */}
    <Path fill={HI} fillOpacity={0.1}
      d="M31,115 C29,121 28,130 29,139 L32,137 C31,129 31,121 32,114 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M69,115 C71,121 72,130 71,139 L68,137 C69,129 69,121 68,114 Z" />

    {/* ── Kolana ── */}
    <Ellipse cx="37" cy="158" rx="10" ry="6" fill={N} />
    <Ellipse cx="63" cy="158" rx="10" ry="6" fill={N} />
    <Path fill={HI} fillOpacity={0.1}
      d="M28,157 Q37,154 46,157 L46,159 Q37,156 28,159 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M54,157 Q63,154 72,157 L72,159 Q63,156 54,159 Z" />

    {/* ── Łydki ── */}
    <Path fill={c.calves}
      d="M27,163 C25,171 25,183 28,190 C30,195 35,196 39,194 C43,192 45,181 44,172 C43,163 38,160 33,161 Z" />
    <Path fill={c.calves}
      d="M73,163 C75,171 75,183 72,190 C70,195 65,196 61,194 C57,192 55,181 56,172 C57,163 62,160 67,161 Z" />
    {/* highlight gastrocnemius */}
    <Path fill={HI} fillOpacity={0.15}
      d="M27,166 C26,172 26,181 28,187 L31,185 C29,179 29,172 30,165 Z" />
    <Path fill={HI} fillOpacity={0.15}
      d="M73,166 C74,172 74,181 72,187 L69,185 C71,179 71,172 70,165 Z" />
    {/* rowek tibialis anterior */}
    <Path fill={GR} fillOpacity={0.16}
      d="M39,163 C40,171 40,181 39,188 L41,187 C42,180 42,171 41,162 Z" />
    <Path fill={GR} fillOpacity={0.16}
      d="M61,163 C60,171 60,181 61,188 L59,187 C58,180 58,171 59,162 Z" />

    {/* ── Kostki i stopy ── */}
    <Ellipse cx="35" cy="191" rx="8"   ry="4.5" fill={N} />
    <Ellipse cx="65" cy="191" rx="8"   ry="4.5" fill={N} />
    <Path fill={N} d="M27,194 Q35,200 43,197 L43,200 Q35,201 27,199 Z" />
    <Path fill={N} d="M73,194 Q65,200 57,197 L57,200 Q65,201 73,199 Z" />
  </Svg>
);

// ─── WIDOK: TYŁ ───────────────────────────────────────────────────────────────
const BackView = ({ c, scale }) => (
  <Svg width={100 * scale} height={200 * scale} viewBox="0 0 100 200">

    {/* ── Baza sylwetki ── */}
    <Path fill={B} d="
      M50,19 C47,19 45,21 45,24 L45,29
      C40,30 30,33 24,37 C19,40 16,46 16,51
      L16,91 C14,95 14,101 16,105
      L16,142 C16,144 17,146 18,147
      L18,175 C18,177 20,179 23,179
      L23,181 C23,183 25,185 28,185
      L39,185 C42,185 44,183 44,181
      L44,175 L56,175 L56,181
      C56,183 58,185 61,185
      L72,185 C75,185 77,183 77,181
      L77,179 C80,179 82,177 82,175
      L82,147 C83,146 84,144 84,142
      L84,105 C86,101 86,95 84,91
      L84,51 C84,46 81,40 76,37
      C70,33 60,30 55,29
      L55,24 C55,21 53,19 50,19 Z
    " />

    {/* ── Głowa (tył) ── */}
    <Ellipse cx="50" cy="10" rx="9.5" ry="10.5" fill={N} />
    <Ellipse cx="40.5" cy="10.5" rx="2.5" ry="3.2" fill={N} />
    <Ellipse cx="59.5" cy="10.5" rx="2.5" ry="3.2" fill={N} />
    <Path fill={N} d="M45,20 C44,22 44,26 45,29 L55,29 C56,26 56,22 55,20 Z" />
    {/* rowek kręgosłup szyjny */}
    <Line x1="50" y1="20" x2="50" y2="29" stroke={GR} strokeWidth="0.9" strokeOpacity="0.4" />

    {/* ── Trapez (back_upper) ── */}
    <Path fill={c.back_upper}
      d="M26,31 Q50,24 74,31 Q70,45 50,48 Q30,45 26,31 Z" />
    {/* highlight czubka trapezu */}
    <Path fill={HI} fillOpacity={0.13}
      d="M38,25 Q50,24 62,25 Q56,30 50,30 Q44,30 38,25 Z" />
    {/* rowek środkowy trapezu */}
    <Path fill={GR} fillOpacity={0.22}
      d="M49,29 L49,48 Q50,48 50,48 L51,48 L51,29 Z" />
    {/* podział boczny trapezu */}
    <Path fill={GR} fillOpacity={0.18}
      d="M36,32 C34,36 32,40 31,45 L34,45 C35,40 37,36 38,32 Z" />
    <Path fill={GR} fillOpacity={0.18}
      d="M64,32 C66,36 68,40 69,45 L66,45 C65,40 63,36 62,32 Z" />

    {/* ── Bark – tylny (shoulders_rear) ── */}
    <Path fill={c.shoulders_rear}
      d="M27,33 C23,29 17,29 15,34 C13,39 15,43 19,44 C23,45 27,43 27,39 Z" />
    <Path fill={c.shoulders_rear}
      d="M73,33 C77,29 83,29 85,34 C87,39 85,43 81,44 C77,45 73,43 73,39 Z" />
    <Path fill={HI} fillOpacity={0.11}
      d="M24,34 C21,33 18,34 16,36 L18,38 C19,36 21,35 23,35 Z" />
    <Path fill={HI} fillOpacity={0.11}
      d="M76,34 C79,33 82,34 84,36 L82,38 C81,36 79,35 77,35 Z" />

    {/* ── Bark – boczny (shoulders_side) ── */}
    <Path fill={c.shoulders_side}
      d="M15,34 C12,38 12,44 14,48 C16,50 20,50 22,48 L20,45 C16,43 13,40 15,34 Z" />
    <Path fill={c.shoulders_side}
      d="M85,34 C88,38 88,44 86,48 C84,50 80,50 78,48 L80,45 C84,43 87,40 85,34 Z" />

    {/* ── Najszerszy grzbietu (back_lat) ── */}
    <Path fill={c.back_lat}
      d="M27,34 C22,42 19,54 21,67 C23,74 27,77 32,75 C37,73 39,64 38,53 C37,43 33,35 27,34 Z" />
    <Path fill={c.back_lat}
      d="M73,34 C78,42 81,54 79,67 C77,74 73,77 68,75 C63,73 61,64 62,53 C63,43 67,35 73,34 Z" />
    {/* highlight lat */}
    <Path fill={HI} fillOpacity={0.13}
      d="M26,37 C22,44 21,53 22,62 L25,60 C24,52 24,43 26,37 Z" />
    <Path fill={HI} fillOpacity={0.13}
      d="M74,37 C78,44 79,53 78,62 L75,60 C76,52 76,43 74,37 Z" />

    {/* ── Prostowniki grzbietu (erector spinae) – część back_lat ── */}
    <Path fill={c.back_lat}
      d="M44,47 Q47,48 47,50 L47,93 Q47,95 45,95 Q42,95 41,93 L41,50 Q41,48 44,47 Z" />
    <Path fill={c.back_lat}
      d="M56,47 Q53,48 53,50 L53,93 Q53,95 55,95 Q58,95 59,93 L59,50 Q59,48 56,47 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M44,49 L46,49 L46,93 L44,93 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M54,49 L56,49 L56,93 L54,93 Z" />
    {/* rowek kręgosłupa */}
    <Line x1="50" y1="29" x2="50" y2="97" stroke={GR} strokeWidth="1" strokeOpacity="0.5" />

    {/* ── Podgrzebieniowy + romboidalny (back_upper overlay) ── */}
    <Path fill={c.back_upper} fillOpacity={0.45}
      d="M35,46 Q40,44 45,46 Q43,55 39,56 Q34,55 34,49 Z" />
    <Path fill={c.back_upper} fillOpacity={0.45}
      d="M65,46 Q60,44 55,46 Q57,55 61,56 Q66,55 66,49 Z" />

    {/* ── Triceps ── */}
    <Path fill={c.triceps}
      d="M12,45 C10,51 9,61 10,70 C11,75 15,77 19,76 C23,74 25,68 24,60 C23,52 20,45 16,45 Z" />
    <Path fill={c.triceps}
      d="M88,45 C90,51 91,61 90,70 C89,75 85,77 81,76 C77,74 75,68 76,60 C77,52 80,45 84,45 Z" />
    {/* rowek głowy długiej / bocznej tricepsa */}
    <Path fill={GR} fillOpacity={0.2}
      d="M14,48 C14,55 14,63 15,69 L18,67 C17,62 17,54 16,48 Z" />
    <Path fill={GR} fillOpacity={0.2}
      d="M86,48 C86,55 86,63 85,69 L82,67 C83,62 83,54 84,48 Z" />
    <Path fill={HI} fillOpacity={0.12}
      d="M21,46 C22,52 23,61 22,68 L24,66 C25,60 25,52 23,47 Z" />
    <Path fill={HI} fillOpacity={0.12}
      d="M79,46 C78,52 77,61 78,68 L76,66 C75,60 75,52 77,47 Z" />

    {/* ── Przedramiona ── */}
    <Path fill={c.forearms}
      d="M10,75 C9,83 9,93 11,101 C13,105 17,106 20,105 C23,103 24,95 23,87 C22,79 18,75 14,75 Z" />
    <Path fill={c.forearms}
      d="M90,75 C91,83 91,93 89,101 C87,105 83,106 80,105 C77,103 76,95 77,87 C78,79 82,75 86,75 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M10,78 C10,85 10,93 12,99 L15,97 C13,91 13,84 13,78 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M90,78 C90,85 90,93 88,99 L85,97 C87,91 87,84 87,78 Z" />

    {/* ── Pas biodrowy (tył) ── */}
    <Path fill={N}
      d="M31,97 Q50,104 69,97 L69,105 Q50,112 31,105 Z" />

    {/* ── Pośladki (glutes) ── */}
    <Path fill={c.glutes}
      d="M31,105 C27,112 26,123 29,132 C32,138 37,140 43,138 C48,136 50,127 49,117 C48,108 42,103 36,104 Z" />
    <Path fill={c.glutes}
      d="M69,105 C73,112 74,123 71,132 C68,138 63,140 57,138 C52,136 50,127 51,117 C52,108 58,103 64,104 Z" />
    {/* highlight – górna część pośladka */}
    <Path fill={HI} fillOpacity={0.15}
      d="M31,107 C28,113 27,120 29,127 L33,125 C31,119 31,112 33,107 Z" />
    <Path fill={HI} fillOpacity={0.15}
      d="M69,107 C72,113 73,120 71,127 L67,125 C69,119 69,112 67,107 Z" />
    {/* bruzda pośladkowa */}
    <Line x1="50" y1="101" x2="50" y2="135" stroke={GR} strokeWidth="1.1" strokeOpacity="0.45" />

    {/* ── Dwugłowy uda (hamstrings) ── */}
    <Path fill={c.hamstrings}
      d="M31,133 C28,140 27,151 29,159 C31,164 35,166 40,164 C44,162 46,153 45,144 C44,136 39,132 34,133 Z" />
    <Path fill={c.hamstrings}
      d="M69,133 C72,140 73,151 71,159 C69,164 65,166 60,164 C56,162 54,153 55,144 C56,136 61,132 66,133 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M31,136 C29,142 28,150 30,157 L33,155 C31,149 31,142 32,136 Z" />
    <Path fill={HI} fillOpacity={0.1}
      d="M69,136 C71,142 72,150 70,157 L67,155 C69,149 69,142 68,136 Z" />

    {/* ── Kolana (tył) ── */}
    <Ellipse cx="37" cy="164" rx="9.5" ry="5.5" fill={N} />
    <Ellipse cx="63" cy="164" rx="9.5" ry="5.5" fill={N} />

    {/* ── Łydki (tył – bardziej wypukłe) ── */}
    <Path fill={c.calves}
      d="M26,169 C23,178 23,189 27,195 C29,198 33,199 37,197 C41,195 43,185 42,175 C41,166 36,162 31,163 Z" />
    <Path fill={c.calves}
      d="M74,169 C77,178 77,189 73,195 C71,198 67,199 63,197 C59,195 57,185 58,175 C59,166 64,162 69,163 Z" />
    {/* highlight – gastrocnemius (dwie głowy) */}
    <Path fill={HI} fillOpacity={0.16}
      d="M26,172 C24,179 24,187 27,192 L30,190 C28,185 28,178 29,170 Z" />
    <Path fill={HI} fillOpacity={0.16}
      d="M74,172 C76,179 76,187 73,192 L70,190 C72,185 72,178 71,170 Z" />
    {/* rowek między głowami gastrocnemius */}
    <Path fill={GR} fillOpacity={0.2}
      d="M36,164 C37,172 37,182 36,188 L38,187 C39,181 39,171 38,163 Z" />
    <Path fill={GR} fillOpacity={0.2}
      d="M64,164 C63,172 63,182 64,188 L62,187 C61,181 61,171 62,163 Z" />

    {/* ── Kostki i stopy (tył) ── */}
    <Ellipse cx="35" cy="191" rx="8"   ry="4.5" fill={N} />
    <Ellipse cx="65" cy="191" rx="8"   ry="4.5" fill={N} />
    {/* pięty */}
    <Path fill={N} d="M28,193 Q35,199 42,196 L42,199 Q35,200 28,198 Z" />
    <Path fill={N} d="M72,193 Q65,199 58,196 L58,199 Q65,200 72,198 Z" />
  </Svg>
);

// ─── Komponent główny ──────────────────────────────────────────────────────────
const LiveMuscleMap = ({ heatmap, activeMuscles, scale = 1 }) => {
  const intensityMap = resolveIntensityMap(heatmap, activeMuscles);
  const colors       = useAnimatedColors(intensityMap);

  return (
    <View style={styles.container}>
      <FrontView c={colors} scale={scale} />
      <View style={[styles.gap, { width: 8 * scale }]} />
      <BackView  c={colors} scale={scale} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  gap:       { width: 8 },
});

export default LiveMuscleMap;
