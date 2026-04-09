import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';

import HomeScreen       from './src/screens/HomeScreen';
import WorkoutsScreen   from './src/screens/WorkoutsScreen';
import NutritionScreen  from './src/screens/NutritionScreen';
import ProgressScreen   from './src/screens/ProgressScreen';
import CoachScreen      from './src/screens/CoachScreen';
import LogWeightScreen  from './src/screens/LogWeightScreen';
import PlateCalcScreen  from './src/screens/PlateCalcScreen';
import HRMonitorScreen  from './src/screens/HRMonitorScreen';
import BarcodeScreen    from './src/screens/BarcodeScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import TDEEScreen       from './src/screens/TDEEScreen';
import MilScoreScreen  from './src/screens/MilScoreScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Feature flags — flip to true when ready to re-enable
const SHOW_AI_COACH = false;

const TAB_ICONS = {
  Home:      { active: 'home',             idle: 'home-outline'        },
  Workouts:  { active: 'barbell',          idle: 'barbell-outline'     },
  Nutrition: { active: 'restaurant',       idle: 'restaurant-outline'  },
  Progress:  { active: 'trending-up',      idle: 'trending-up-outline' },
  Coach:     { active: 'hardware-chip',    idle: 'hardware-chip-outline'},
};

function Tabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.idle} size={size} color={color} />;
        },
        tabBarActiveTintColor:   theme.accent,
        tabBarInactiveTintColor: theme.textSec,
        tabBarStyle: {
          backgroundColor: theme.bgNav,
          borderTopColor:  theme.border,
          borderTopWidth:  1,
          paddingBottom:   4,
          height:          60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      />
      <Tab.Screen name="Workouts"  component={WorkoutsScreen}  />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Progress"  component={ProgressScreen}  />
      {SHOW_AI_COACH && <Tab.Screen name="Coach" component={CoachScreen} />}
    </Tab.Navigator>
  );
}

function RootStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bgPage } }}>
      <Stack.Screen name="Main"       component={Tabs}           />
      <Stack.Screen name="LogWeight"  component={LogWeightScreen} />
      <Stack.Screen name="PlateCalc"  component={PlateCalcScreen} />
      <Stack.Screen name="HRMonitor"  component={HRMonitorScreen} />
      <Stack.Screen name="Barcode"    component={BarcodeScreen}   options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Settings"   component={SettingsScreen}  />
      <Stack.Screen name="TDEE"       component={TDEEScreen}      />
      <Stack.Screen name="MilScore"   component={MilScoreScreen}  />
    </Stack.Navigator>
  );
}

function AppInner() {
  const { theme } = useTheme();
  const { userData, loaded } = useApp();

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bgPage, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!userData.onboardingComplete) {
    return (
      <>
        <StatusBar style={theme.name === 'minimal' ? 'dark' : 'light'} />
        <OnboardingScreen />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.name === 'minimal' ? 'dark' : 'light'} />
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ThemeProvider>
  );
}
