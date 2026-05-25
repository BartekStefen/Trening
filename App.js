import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WorkoutProvider }        from './context/WorkoutContext';
import { ThemeProvider }          from './context/ThemeContext';
import { ProfileGoalsProvider }   from './context/ProfileGoalsContext';
import { DietProvider }           from './context/DietContext';
import { AchievementsProvider }   from './context/AchievementsContext';
import { StrengthRingsProvider }  from './context/StrengthRingsContext';
import AchievementUnlockBanner    from './components/shared/AchievementUnlockBanner';
import { useTheme }               from './context/ThemeContext';
import OnboardingScreen           from './screens/OnboardingScreen';
import TrainingScreen             from './screens/TrainingScreen';
import ActiveWorkoutScreen        from './screens/ActiveWorkoutScreen';
import ExercisesLibraryScreen     from './screens/ExercisesLibraryScreen';
import DietScreen                 from './screens/DietScreen';
import ProfileScreen              from './screens/ProfileScreen';
import ToolsScreen                from './screens/ToolsScreen';
import WorkoutHistoryScreen       from './screens/WorkoutHistoryScreen';
import PlanCreatorScreen          from './screens/PlanCreatorScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Stack2 = createNativeStackNavigator();

function ProfileStack() {
  return (
    <Stack2.Navigator screenOptions={{ headerShown: false }}>
      <Stack2.Screen name="ProfileHome"    component={ProfileScreen} />
      <Stack2.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
    </Stack2.Navigator>
  );
}

function TrainingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingHome"     component={TrainingScreen} />
      <Stack.Screen name="ExercisesLibrary" component={ExercisesLibraryScreen} />
      <Stack.Screen name="PlanCreator"     component={PlanCreatorScreen} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

// Wydzielony komponent, żeby mógł korzystać z useTheme() wewnątrz ThemeProvider
function AppNavigator() {
  const { colors } = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   colors.accent,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor:  colors.border,
            borderTopWidth:  1,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={{ Trening: 'barbell-outline', Dieta: 'nutrition-outline', Narzędzia: 'construct-outline', Profil: 'person-outline' }[route.name]}
              size={size}
              color={color}
            />
          ),
        })}
      >
        <Tab.Screen name="Trening"   component={TrainingStack} />
        <Tab.Screen name="Dieta"     component={DietScreen} />
        <Tab.Screen name="Narzędzia" component={ToolsScreen} />
        <Tab.Screen name="Profil"    component={ProfileStack} />
      </Tab.Navigator>
      <StatusBar style={colors.statusBar} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <ThemeProvider>
          <ProfileGoalsProvider>
            <DietProvider>
              <StrengthRingsProvider>
                <AchievementsProvider>
                  <AppNavigator />
                  <OnboardingScreen />
                  <AchievementUnlockBanner />
                </AchievementsProvider>
              </StrengthRingsProvider>
            </DietProvider>
          </ProfileGoalsProvider>
        </ThemeProvider>
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}
