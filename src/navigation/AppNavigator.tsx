/**
 * Main Navigation Structure for Product Scanner Mobile App
 * React Navigation v6 with auth flow and main app flow
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type LinkingOptions,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { SCREEN_OPTIONS } from '@/navigation/screenOptions';
import { useProductReadyNavigation } from '@/utils/usePushNotifications';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import LocationPermissionModal from '@/components/common/LocationPermissionModal';
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
import VerifyEmailScreen from '@/screens/auth/VerifyEmailScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';

// Main tab screens
import HomeScreen from '@/screens/main/HomeScreen';
import ScannerScreen from '@/screens/main/ScannerScreen';
import HistoryScreen from '@/screens/main/HistoryScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

// Product screens
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import LegalScreen from '@/screens/legal/LegalScreen';
import ScanResultScreen from '@/screens/product/ScanResultScreen';

// Subscription screen
import SubscriptionScreen from '@/screens/subscription/SubscriptionScreen';
import VideoRewardScreen from '@/screens/main/VideoRewardScreen';
import PreferencesScreen from '@/screens/main/PreferencesScreen';

type AuthRootParamList = { Auth: undefined };
type MainRootParamList = { Main: NavigatorScreenParams<MainStackParamList> | undefined };

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
  // initialRouteName matters: without it React Navigation renders whichever screen
  // is declared first, so signing out landed on VerifyEmail with no token and showed
  // "Verification Failed". Deep links still reach VerifyEmail and ResetPassword.
  <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    {/* Reachable before an account exists: agreeing to something you cannot
        read is not agreement. */}
    <AuthStack.Screen
      name="Legal"
      component={LegalScreen}
      options={{ headerShown: true, title: '' }}
    />
  </AuthStack.Navigator>
);

// Bottom Tabs
const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
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
    <MainTab.Screen name="Home" component={HomeScreen} options={{ title: t('nav.home', 'Home') }} />
    <MainTab.Screen name="Scanner" component={ScannerScreen} options={{ title: t('nav.scan', 'Scan') }} />
    <MainTab.Screen name="History" component={HistoryScreen} options={{ title: t('nav.history', 'History') }} />
    <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile', 'Profile') }} />
    </MainTab.Navigator>
  );
};

// Main Stack (wraps tabs + modal screens)
const MainNavigator: React.FC = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="MainTabs" component={TabNavigator} />
    <MainStack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={SCREEN_OPTIONS.Subscription}
    />
    <MainStack.Screen
      name="VideoReward"
      component={VideoRewardScreen}
      options={SCREEN_OPTIONS.VideoReward}
    />
    <MainStack.Screen
      name="Preferences"
      component={PreferencesScreen}
      options={SCREEN_OPTIONS.Preferences}
    />
    <MainStack.Screen
      name="ScanResult"
      component={ScanResultScreen}
      options={SCREEN_OPTIONS.ScanResult}
    />
    <MainStack.Screen
      name="Legal"
      component={LegalScreen}
      options={{ headerShown: true, title: '' }}
    />
    <MainStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={SCREEN_OPTIONS.ProductDetail}
    />
  </MainStack.Navigator>
);

// Root Navigator
const RootNavigator: React.FC = () => {
  const { state } = useAuth();
  const { locationAsked, locationLoaded } = useApp();
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Show location prompt once after the user logs in and hasn't been asked yet.
  // Guard on locationLoaded so we don't ask again after a restart while AsyncStorage loads.
  useEffect(() => {
    if (state.isAuthenticated && locationLoaded && !locationAsked) {
      const timer = setTimeout(() => setShowLocationModal(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.isAuthenticated, locationLoaded, locationAsked]);

  if (state.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {state.isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
      <LocationPermissionModal
        visible={showLocationModal}
        onDismiss={() => setShowLocationModal(false)}
      />
    </>
  );
};

// Typed against the root param list so the screen names in `config` are checked
// against the navigator they address, rather than inferred as a bare object.
const linking: LinkingOptions<AuthRootParamList & MainRootParamList> = {
  prefixes: ['productscanner://'],
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: {
            path: 'verify-email',
            parse: { token: (token: string) => token },
          },
          ResetPassword: {
            path: 'reset-password',
            parse: { token: (token: string) => token },
          },
        },
      },
    },
  },
};

// Held outside the tree so a notification tap can navigate without being inside
// a screen. A tap that launches the app from cold arrives before any screen has
// mounted, so there is no component to route it from.
export const navigationRef = createNavigationContainerRef<
  AuthRootParamList & MainRootParamList
>();

// App Navigator
const AppNavigator: React.FC = () => {
  const pending = useRef<string | null>(null);

  const openProduct = useCallback((barcode: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', {
        screen: 'ProductDetail',
        params: { barcode },
      });
    } else {
      // Cold start: the container is not mounted yet. Hold the barcode and let
      // onReady deliver it, rather than dropping the tap that opened the app.
      pending.current = barcode;
    }
  }, []);

  useProductReadyNavigation(openProduct);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          const barcode = pending.current;
          if (barcode) {
            pending.current = null;
            navigationRef.navigate('Main', {
              screen: 'ProductDetail',
              params: { barcode },
            });
          }
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
