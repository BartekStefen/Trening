const REPS_RANGE_RE = /^(\d+)\s*-\s*(\d+)$/;

export function isRepsRange(reps) {
  return REPS_RANGE_RE.test((reps ?? '').trim());
}

export function parseRepsString(reps) {
  const str = (reps ?? '').trim();
  const m = str.match(REPS_RANGE_RE);
  if (m) return { mode: 'range', min: m[1], max: m[2], display: `${m[1]}–${m[2]}` };
  return { mode: 'single', value: str, display: str };
}

export function formatRepsString(min, max) {
  if (min && max) return `${min}-${max}`;
  if (min) return min;
  if (max) return max;
  return '';
}

export function resolveRepsMode(repsMode, reps) {
  if (repsMode === 'range') return 'range';
  if (isRepsRange(reps)) return 'range';
  return 'single';
}

export function repsForVolume(reps) {
  const parsed = parseRepsString(reps);
  if (parsed.mode === 'range') {
    const max = parseInt(parsed.max, 10);
    const min = parseInt(parsed.min, 10);
    return max || min || 0;
  }
  return parseInt(parsed.value, 10) || 0;
}
