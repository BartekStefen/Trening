import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  calcTDEE,
  calorieAdjustmentFromPace,
  GOAL_INTENTS,
  suggestTargetWeight,
} from '../utils/tdee';

const KEY_ONBOARDING   = '@onboarding_completed';
const KEY_TARGET       = '@profile_target_weight_kg';
const KEY_ADJUSTMENT   = '@profile_daily_deficit_kcal';
const KEY_GENDER       = '@profile_gender';
const KEY_HEIGHT       = '@profile_height_cm';
const KEY_AGE          = '@profile_age';
const KEY_ACTIVITY     = '@profile_activity';
const KEY_INTENT       = '@profile_goal_intent';
const KEY_PACE         = '@profile_goal_pace';
const KEY_TDEE         = '@profile_tdee';
const BW_STORAGE_KEY   = '@user_body_weight_kg';

const ProfileGoalsContext = createContext(null);

const defaultState = {
  onboardingCompleted: false,
  goalIntent: 'maintain',
  goalPace: 'maintain',
  targetWeight: 75,
  currentWeight: 80,
  dailyCalorieAdjustment: 0,
  gender: 'male',
  height: 178,
  age: 25,
  activityLevel: 'moderate',
  tdee: null,
};

export function ProfileGoalsProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const keys = [
          KEY_ONBOARDING, KEY_TARGET, KEY_ADJUSTMENT, KEY_GENDER,
          KEY_HEIGHT, KEY_AGE, KEY_ACTIVITY, KEY_INTENT, KEY_PACE, KEY_TDEE,
          BW_STORAGE_KEY,
        ];
        const vals = await AsyncStorage.multiGet(keys);
        const map = Object.fromEntries(vals);

        const completed = map[KEY_ONBOARDING] === 'true';
        const currentWeight = parseFloat(map[BW_STORAGE_KEY]) || defaultState.currentWeight;

        setState({
          onboardingCompleted: completed,
          goalIntent: map[KEY_INTENT] || defaultState.goalIntent,
          goalPace: map[KEY_PACE] || defaultState.goalPace,
          targetWeight: parseFloat(map[KEY_TARGET]) || defaultState.targetWeight,
          currentWeight,
          dailyCalorieAdjustment: parseFloat(map[KEY_ADJUSTMENT]) ?? defaultState.dailyCalorieAdjustment,
          gender: map[KEY_GENDER] === 'female' ? 'female' : 'male',
          height: parseFloat(map[KEY_HEIGHT]) || defaultState.height,
          age: parseFloat(map[KEY_AGE]) || defaultState.age,
          activityLevel: map[KEY_ACTIVITY] || defaultState.activityLevel,
          tdee: map[KEY_TDEE] ? parseFloat(map[KEY_TDEE]) : null,
        });
        // Onboarding tylko ręcznie z profilu — nie przy każdym uruchomieniu
      } catch {}
      setHydrated(true);
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setState(next);
    try {
      await AsyncStorage.multiSet([
        [KEY_ONBOARDING, String(next.onboardingCompleted)],
        [KEY_TARGET, String(next.targetWeight)],
        [KEY_ADJUSTMENT, String(next.dailyCalorieAdjustment)],
        [KEY_GENDER, next.gender],
        [KEY_HEIGHT, String(next.height)],
        [KEY_AGE, String(next.age)],
        [KEY_ACTIVITY, next.activityLevel],
        [KEY_INTENT, next.goalIntent],
        [KEY_PACE, next.goalPace],
        [KEY_TDEE, next.tdee != null ? String(next.tdee) : ''],
        [BW_STORAGE_KEY, String(next.currentWeight)],
      ]);
    } catch {}
  }, []);

  const completeOnboarding = useCallback(async (data) => {
    const intentMeta = GOAL_INTENTS.find((g) => g.id === data.goalIntent) ?? GOAL_INTENTS[2];
    const pace = data.goalPace ?? intentMeta.defaultPace;
    const tdee = calcTDEE({
      weight: data.currentWeight,
      height: data.height,
      age: data.age,
      sex: data.gender,
      activityId: data.activityLevel,
    });
    const adjustment = calorieAdjustmentFromPace(pace);
    const target = intentMeta.needsTarget
      ? (data.targetWeight ?? suggestTargetWeight(data.currentWeight, data.goalIntent))
      : data.currentWeight;

    const next = {
      onboardingCompleted: true,
      goalIntent: data.goalIntent,
      goalPace: pace,
      targetWeight: target,
      currentWeight: data.currentWeight,
      dailyCalorieAdjustment: adjustment,
      gender: data.gender,
      height: data.height,
      age: data.age,
      activityLevel: data.activityLevel,
      tdee,
    };

    await persist(next);
    setShowOnboarding(false);
    return next;
  }, [persist]);

  const updateGoals = useCallback(async (partial) => {
    const merged = { ...state, ...partial };
    if (
      partial.currentWeight != null ||
      partial.height != null ||
      partial.age != null ||
      partial.gender != null ||
      partial.activityLevel != null
    ) {
      merged.tdee = calcTDEE({
        weight: merged.currentWeight,
        height: merged.height,
        age: merged.age,
        sex: merged.gender,
        activityId: merged.activityLevel,
      });
    }
    if (partial.goalPace != null) {
      merged.dailyCalorieAdjustment = calorieAdjustmentFromPace(partial.goalPace);
    }
    await persist(merged);
  }, [state, persist]);

  const openOnboarding = useCallback(() => setShowOnboarding(true), []);
  const closeOnboarding = useCallback(() => setShowOnboarding(false), []);

  return (
    <ProfileGoalsContext.Provider value={{
      ...state,
      hydrated,
      showOnboarding,
      completeOnboarding,
      updateGoals,
      openOnboarding,
      closeOnboarding,
      setShowOnboarding,
      // kompatybilność wsteczna z hookiem
      targetWeight: state.targetWeight,
      dailyCalorieAdjustment: state.dailyCalorieAdjustment,
      gender: state.gender,
      updateTargetWeight: (v) => updateGoals({ targetWeight: parseFloat(v) }),
      updateDailyCalorieAdjustment: (v) => updateGoals({ dailyCalorieAdjustment: parseFloat(v) }),
      setGender: (g) => updateGoals({ gender: g === 'female' ? 'female' : 'male' }),
    }}>
      {children}
    </ProfileGoalsContext.Provider>
  );
}

export const useProfileGoals = () => {
  const ctx = useContext(ProfileGoalsContext);
  if (!ctx) throw new Error('useProfileGoals poza ProfileGoalsProvider');
  return ctx;
};
