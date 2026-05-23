import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID       = 'workout_channel';
const REST_NOTIF_ID    = 'rest_end_notification';
const PROGRESS_NOTIF_ID = 'workout_progress_notification';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupWorkoutNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Trening',
      description: 'Powiadomienia o przerwie i postępie treningu',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 100, 150],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  }
  return true;
}

/**
 * Schedules a wrist / push notification that fires when the rest timer ends.
 * Appears on the lock screen and is forwarded to paired smartwatches.
 */
export async function scheduleRestEndNotification(exerciseName, durationSec) {
  await cancelRestEndNotification();

  if (durationSec <= 0) return;

  await Notifications.scheduleNotificationAsync({
    identifier: REST_NOTIF_ID,
    content: {
      title: '💪 Czas na serię!',
      body: `Przerwa skończona — wracasz do: ${exerciseName}`,
      sound: 'default',
      categoryIdentifier: 'rest_done',
      ...(Platform.OS === 'android' && {
        sticky: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: CHANNEL_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationSec,
      repeats: false,
    },
  });
}

export async function cancelRestEndNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_NOTIF_ID);
  } catch (_) { /* already cancelled */ }
}

/**
 * Shows a persistent lock-screen "widget" notification while the workout is
 * running in the background. Simulates Live Activities on iOS and a sticky
 * ongoing notification on Android.
 */
export async function showWorkoutLockScreenNotification({ workoutName, currentExercise, doneSets, restSecondsLeft }) {
  await dismissWorkoutLockScreenNotification();

  const restText = restSecondsLeft > 0 ? ` · Przerwa: ${restSecondsLeft}s` : '';
  const setsText = `Serie: ${doneSets}`;

  await Notifications.scheduleNotificationAsync({
    identifier: PROGRESS_NOTIF_ID,
    content: {
      title: `🏋️ ${workoutName || 'Trening w toku'}`,
      body: currentExercise
        ? `${currentExercise} · ${setsText}${restText}`
        : setsText,
      ...(Platform.OS === 'android' && {
        ongoing: true,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.LOW,
        channelId: CHANNEL_ID,
      }),
    },
    trigger: null,
  });
}

export async function dismissWorkoutLockScreenNotification() {
  try {
    await Notifications.dismissNotificationAsync(PROGRESS_NOTIF_ID);
  } catch (_) { /* already gone */ }
  try {
    await Notifications.cancelScheduledNotificationAsync(PROGRESS_NOTIF_ID);
  } catch (_) { /* already gone */ }
}

export async function cancelAllWorkoutNotifications() {
  await cancelRestEndNotification();
  await dismissWorkoutLockScreenNotification();
}
