/**
 * Main Navigation Structure for Product Scanner Mobile App
 * React Navigation v6 with auth flow and main app flow
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import {
  AuthStackParamList,
  MainTabParamList,
  MainStackParamList,
} from '@/types';
import theme from '@/constants/theme';

// Auth screens
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';

// Main tab screens
import HomeScreen from '@/screens/main/HomeScreen';
import ScannerScreen from '@/screens/main/ScannerScreen';
import HistoryScreen from '@/screens/main/HistoryScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

// Product screens
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import ScanResultScreen from '@/screens/product/ScanResultScreen';

// Subscription screen
import SubscriptionScreen from '@/screens/subscription/SubscriptionScreen';
import VideoRewardScreen from '@/screens/main/VideoRewardScreen';
import PreferencesScreen from '@/screens/main/PreferencesScreen';

type AuthRootParamList = { Auth: undefined };
type MainRootParamList = { Main: undefined };

const RootStack = createStackNavigator<AuthRootParamList & MainRootParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Loading Screen
const LoadingScreen: React.FC = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}
  >
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

// Auth Stack
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// Bottom Tabs
const TabNavigator: React.FC = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Scanner') iconName = focused ? 'scan' : 'scan-outline';
        else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: '#B3B3B3',
      tabBarStyle: {
        backgroundColor: '#1E1E1E',
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 5,
      },
      tabBarLabelStyle: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: '500' as const,
      },
    })}
  >
    <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
    <MainTab.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan' }} />
    <MainTab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </MainTab.Navigator>
);

// Main Stack (wraps tabs + modal screens)
const MainNavigator: React.FC = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="MainTabs" component={TabNavigator} />
    <MainStack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{ presentation: 'card' }}
    />
    <MainStack.Screen
      name="VideoReward"
      component={VideoRewardScreen}
      options={{ presentation: 'modal' }}
    />
    <MainStack.Screen
      name="Preferences"
      component={PreferencesScreen}
      options={{ presentation: 'card' }}
    />
    <MainStack.Screen
      name="ScanResult"
      component={ScanResultScreen}
      options={{ presentation: 'modal' }}
    />
    <MainStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ presentation: 'modal' }}
    />
  </MainStack.Navigator>
);

// Root Navigator
const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  if (state.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {state.isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// App Navigator
const AppNavigator: React.FC = () => (
  <>
    <StatusBar style="light" backgroundColor={theme.colors.background} />
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </>
);

export default AppNavigator;
