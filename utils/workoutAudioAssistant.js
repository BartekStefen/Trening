import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { AUDIO_MODES } from './audioAssistantConstants';

export { AUDIO_MODES, getNextAudioMode, getAudioModeShort } from './audioAssistantConstants';

let mode = AUDIO_MODES.OFF;
let tickSound = null;
let avModule = null;
let initPromise = null;
const tickedKeys = new Set();
let audioChain = Promise.resolve();

const TICK_VOLUME_NORMAL = 0.72;
const TICK_VOLUME_FINISH = 1.0;
const COUNTDOWN_MIN_SEC = 2;
const COUNTDOWN_MAX_SEC = 5;
const FINISH_LEAD_MS = 480;
const FINISH_TICK_GAP_MS = 140;
const FINISH_TICK_COUNT = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const enqueue = (fn) => {
  audioChain = audioChain.then(fn).catch(() => {});
  return audioChain;
};

export const setAudioAssistantMode = (nextMode) => {
  mode = [AUDIO_MODES.OFF, AUDIO_MODES.VOICE, AUDIO_MODES.TICK].includes(nextMode)
    ? nextMode
    : AUDIO_MODES.OFF;
  if (mode === AUDIO_MODES.OFF) stopAudioAssistant();
};

async function loadAvModule() {
  if (avModule) return avModule;
  try {
    avModule = await import('expo-av');
    return avModule;
  } catch {
    return null;
  }
}

export async function initAudioAssistant() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const av = await loadAvModule();
    if (!av) return;
    try {
      await av.Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      if (!tickSound) {
        const { sound } = await av.Audio.Sound.createAsync(
          require('../assets/sounds/tick.wav'),
          { shouldPlay: false, volume: TICK_VOLUME_NORMAL },
        );
        tickSound = sound;
      }
    } catch {
      initPromise = null;
    }
  })();
  return initPromise;
}

export function resetRestAudioSession() {
  tickedKeys.clear();
  audioChain = Promise.resolve();
}

export function stopAudioAssistant() {
  Speech.stop();
  audioChain = Promise.resolve();
}

async function triggerHaptic(level = 'light') {
  try {
    const style = level === 'heavy'
      ? Haptics.ImpactFeedbackStyle.Heavy
      : level === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    await Haptics.impactAsync(style);
  } catch {}
}

async function playTickSound({ volume = TICK_VOLUME_NORMAL, rate = 1, haptic = 'light' } = {}) {
  let played = false;
  try {
    await initAudioAssistant();
    if (tickSound) {
      await tickSound.setVolumeAsync(volume);
      await tickSound.setRateAsync(rate, true);
      await tickSound.setPositionAsync(0);
      await tickSound.playAsync();
      played = true;
    }
  } catch {}

  if (haptic !== 'none') {
    await triggerHaptic(haptic);
  } else if (!played) {
    await triggerHaptic('light');
  }
}

async function resetTickSoundProfile() {
  try {
    if (tickSound) {
      await tickSound.setVolumeAsync(TICK_VOLUME_NORMAL);
      await tickSound.setRateAsync(1, true);
    }
  } catch {}
}

function speakAsync(text, rate = 0.92) {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'pl-PL',
      rate,
      pitch: 1.0,
      onDone: resolve,
      onStopped: resolve,
      onError: resolve,
    });
  });
}

/** Odliczanie — lekkie tykanie */
async function tickCountdownStep() {
  await playTickSound({ volume: TICK_VOLUME_NORMAL, rate: 1, haptic: 'light' });
}

/** Koniec przerwy — pauza, potem wyraźna fanfara (3× głośny tyk) */
async function tickRestFinish() {
  await sleep(FINISH_LEAD_MS);

  for (let i = 0; i < FINISH_TICK_COUNT; i++) {
    const isLast = i === FINISH_TICK_COUNT - 1;
    await playTickSound({
      volume: TICK_VOLUME_FINISH,
      rate: isLast ? 1.32 : 1.18 + i * 0.05,
      haptic: isLast ? 'heavy' : 'medium',
    });
    if (!isLast) await sleep(FINISH_TICK_GAP_MS);
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  await resetTickSoundProfile();
}

/** Koniec przerwy w trybie głos — fanfara + komunikat */
async function voiceRestFinish() {
  await sleep(FINISH_LEAD_MS);

  await playTickSound({ volume: TICK_VOLUME_FINISH, rate: 1.22, haptic: 'medium' });
  await sleep(FINISH_TICK_GAP_MS);
  await playTickSound({ volume: TICK_VOLUME_FINISH, rate: 1.32, haptic: 'heavy' });
  await sleep(280);
  await speakAsync('Koniec przerwy. Kolejna seria.', 0.86);

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  await resetTickSoundProfile();
}

export function handleRestCountdown(remaining, sessionKey) {
  if (mode === AUDIO_MODES.OFF) return;
  if (remaining < COUNTDOWN_MIN_SEC || remaining > COUNTDOWN_MAX_SEC) return;

  const key = `${sessionKey}_${remaining}`;
  if (tickedKeys.has(key)) return;
  tickedKeys.add(key);

  if (mode === AUDIO_MODES.VOICE || mode === AUDIO_MODES.TICK) {
    enqueue(() => tickCountdownStep());
  }
}

export function handleRestEnd(naturalEnd = true) {
  if (mode === AUDIO_MODES.OFF || !naturalEnd) return;

  if (mode === AUDIO_MODES.VOICE) {
    enqueue(() => voiceRestFinish());
    return;
  }

  if (mode === AUDIO_MODES.TICK) {
    enqueue(() => tickRestFinish());
  }
}

export async function unloadAudioAssistant() {
  stopAudioAssistant();
  try {
    if (tickSound) {
      await tickSound.unloadAsync();
      tickSound = null;
    }
  } catch {}
  initPromise = null;
}
