/**
 * Main Navigation Structure for Product Scanner Mobile App
 * Implements React Navigation with Auth Flow and Main App Flow
 * Following Clean Architecture principles with proper type safety
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Context and Types
import { useAuth } from '@/contexts/AuthContext';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  ProductStackParamList,
} from '@/types';
import theme from '@/constants/theme';

// Screens (will be implemented)
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import HomeScreen from '@/screens/main/HomeScreen';
import ScannerScreen from '@/screens/main/ScannerScreen';
import HistoryScreen from '@/screens/main/HistoryScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import ProductDetailScreen from '@/screens/product/ProductDetailScreen';
import ScanResultScreen from '@/screens/product/ScanResultScreen';

// Navigation Stacks
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ProductStack = createStackNavigator<ProductStackParamList>();

// Tab Bar Icon Component with Ionicons
const TabBarIcon: React.FC<{ 
  name: string; 
  color: string; 
  size: number; 
}> = ({ name, color, size }) => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    scan: 'scan',
    history: 'time',
    profile: 'person',
  };
  const mapped = iconMap[name] || 'home';
  return <Ionicons name={mapped} size={size} color={color} />;
};

// Loading Component
const LoadingScreen: React.FC = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  }}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

// Authentication Stack Navigator
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }),
    }}
  >
    <AuthStack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ title: 'Sign In' }}
    />
    <AuthStack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Create Account' }}
    />
    <AuthStack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordScreen}
      options={{ title: 'Reset Password' }}
    />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainNavigator: React.FC = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;
        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Scanner':
            iconName = focused ? 'scan' : 'scan-outline';
            break;
          case 'History':
            iconName = focused ? 'time' : 'time-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'home';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 65,
      },
      tabBarLabelStyle: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: '500' as any,
      },
      headerStyle: {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
      },
      headerTitleStyle: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: '600' as any,
      },
      headerTintColor: theme.colors.text,
    })}
  >
    <MainTab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        title: 'Home',
        headerTitle: 'Product Scanner',
      }}
    />
    <MainTab.Screen 
      name="Scanner" 
      component={ScannerScreen}
      options={{
        title: 'Scan',
        headerShown: false, // Scanner needs full screen
      }}
    />
    <MainTab.Screen 
      name="History" 
      component={HistoryScreen}
      options={{
        title: 'History',
        headerTitle: 'Scan History',
      }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        title: 'Profile',
        headerTitle: 'My Profile',
      }}
    />
  </MainTab.Navigator>
);

// Product Stack Navigator (for product detail views)
const ProductNavigator: React.FC = () => (
  <ProductStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
      },
      headerTitleStyle: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: '600' as any,
      },
      headerTintColor: theme.colors.primary,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }),
    }}
  >
    <ProductStack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen}
      options={{ 
        title: 'Product Details',
        headerBackTitleVisible: false,
      }}
    />
    <ProductStack.Screen 
      name="ScanResult" 
      component={ScanResultScreen}
      options={{ 
        title: 'Scan Result',
        headerBackTitleVisible: false,
      }}
    />
  </ProductStack.Navigator>
);

// Root Navigator - Handles Auth/Main flow switching
const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  // Show loading screen while checking auth status
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable gesture for root level
        animationEnabled: true,
      }}
    >
      {state.isAuthenticated ? (
        // User is authenticated - show main app
        <>
          <RootStack.Screen 
            name="Main" 
            component={MainNavigator}
            options={{
              animationTypeForReplace: state.isAuthenticated ? 'push' : 'pop',
            }}
          />
          {/* Add product screens as modals */}
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen 
              name="ProductModal" 
              component={ProductNavigator}
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            />
          </RootStack.Group>
        </>
      ) : (
        // User not authenticated - show auth flow
        <RootStack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationTypeForReplace: !state.isAuthenticated ? 'push' : 'pop',
          }}
        />
      )}
    </RootStack.Navigator>
  );
};

// Main App Navigator Component
const AppNavigator: React.FC = () => {
  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <NavigationContainer fallback={<LoadingScreen />}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;