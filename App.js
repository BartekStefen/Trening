import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import TrainingScreen          from './screens/TrainingScreen';
import ActiveWorkoutScreen     from './screens/ActiveWorkoutScreen';
import ExercisesLibraryScreen  from './screens/ExercisesLibraryScreen';
import DietScreen              from './screens/DietScreen';
import ProfileScreen           from './screens/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppDarkTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#000000' },
};

// TrainingStack obejmuje cały moduł treningowy – Dashboard, Bibliotekę ćwiczeń
// i ekran aktywnego treningu. ActiveWorkout prezentowany jako fullScreenModal,
// co ukrywa Bottom Tabs podczas sesji – identyczny wzorzec jak Hevy / Strong
function TrainingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingHome"     component={TrainingScreen} />
      <Stack.Screen name="ExercisesLibrary" component={ExercisesLibraryScreen} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={AppDarkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   '#00E676',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor:  '#1C1C1E',
            borderTopWidth:  1,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              Trening: 'barbell-outline',
              Dieta:   'nutrition-outline',
              Profil:  'person-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Trening" component={TrainingStack} />
        <Tab.Screen name="Dieta"   component={DietScreen} />
        <Tab.Screen name="Profil"  component={ProfileScreen} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}