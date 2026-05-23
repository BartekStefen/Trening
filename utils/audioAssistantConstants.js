export const AUDIO_MODES = {
  OFF: 'off',
  VOICE: 'voice',
  TICK: 'tick',
};

const CYCLE = [AUDIO_MODES.OFF, AUDIO_MODES.VOICE, AUDIO_MODES.TICK];

export const getNextAudioMode = (current) => {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
};

export const getAudioModeShort = (m) => {
  if (m === AUDIO_MODES.VOICE) return 'GŁOS';
  if (m === AUDIO_MODES.TICK) return 'TYK';
  return 'OFF';
};
