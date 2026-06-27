/**
 * Login Screen Component
 * Implements form validation with react-hook-form and yup
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { StackScreenProps } from '@react-navigation/stack';

// Components and Context
import TextInput from '@/components/forms/TextInput';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList, ILoginForm } from '@/types';
import theme from '@/constants/theme';

type LoginScreenProps = StackScreenProps<AuthStackParamList, 'Login'>;

// Validation Schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(255, 'Email must be less than 255 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { state, login, clearError } = useAuth();

  // Form setup with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ILoginForm>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Clear any auth errors when component mounts
  useEffect(() => {
    clearError();
  }, []);

  // Clear form when there's an auth error
  useEffect(() => {
    if (state.error) {
      // Clear password field for security
      reset(undefined, { keepValues: true });
    }
  }, [state.error]);

  // Handle form submission
  const onSubmit = async (data: ILoginForm): Promise<void> => {
    try {
      await login({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });
      
      // Navigation will be handled automatically by AuthContext
      // when authentication state changes
    } catch (error) {
      // Error handling is managed by AuthContext
      // Show additional user-friendly feedback if needed
      console.error('Login error:', error);
    }
  };

  // Handle navigation to register screen
  const handleNavigateToRegister = (): void => {
    clearError();
    navigation.navigate('Register');
  };

  // Handle navigation to forgot password screen
  const handleNavigateToForgotPassword = (): void => {
    clearError();
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue scanning and discovering products
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email Address"
                value={value}
                onChangeText={onChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                required
                disabled={state.isLoading}
              />
            )}
          />

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password?.message}
                required
                disabled={state.isLoading}
              />
            )}
          />

          {/* Auth Error Display */}
          {state.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleNavigateToForgotPassword}
            disabled={state.isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={state.isLoading}
            disabled={state.isLoading}
            variant="primary"
            size="large"
          />

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={handleNavigateToRegister}
            disabled={state.isLoading}
          >
            <Text style={styles.footerLinkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl * 2,
    paddingBottom: theme.spacing.xl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  
  title: {
    fontSize: theme.typography.fontSizes.xxl,
        fontWeight: '700' as any,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.md,
  },
  
  form: {
    marginBottom: theme.spacing.xl,
  },
  
  errorContainer: {
    backgroundColor: theme.colors.error + '20', // 20% opacity
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  
  errorText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeights.medium,
  },
  
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  
  forgotPasswordText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  
  footerText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  
  footerLinkText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
      fontWeight: '600' as any,
  },
});

export default LoginScreen;