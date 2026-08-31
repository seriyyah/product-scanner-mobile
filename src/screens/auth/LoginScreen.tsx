/**
 * Login Screen Component
 * Implements form validation with react-hook-form and yup
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
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
//
// Built from the translator rather than at module load, so the message a user
// sees when their email is malformed is in the language they are reading.
type Translate = (key: string, fallback: string) => string;

const buildLoginSchema = (t: Translate) => yup.object({
  email: yup
    .string()
    .email(t('auth.emailInvalidLong', 'Please enter a valid email address'))
    .required(t('auth.emailRequired', 'Email is required'))
    .max(255, t('auth.emailTooLong', 'Email must be less than 255 characters')),
  password: yup
    .string()
    .required(t('auth.passwordRequired', 'Password is required'))
    // Sign-in deliberately does not apply the strength policy: the server does not
    // either, and an existing password may predate a policy change.
    .max(128, t('auth.passwordTooLong', 'Password must be less than 128 characters')),
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { state, login, clearError } = useAuth();
  const { t } = useTranslation();
  const loginSchema = useMemo(() => buildLoginSchema(t), [t]);

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
  const [failedEmail, setFailedEmail] = useState<string | null>(null);

  const onSubmit = async (data: ILoginForm): Promise<void> => {
    try {
      await login({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });
      
      // Navigation will be handled automatically by AuthContext
      // when authentication state changes
    } catch (error) {
      // A rejected sign-in is an expected outcome, not a programming fault.
      // console.error surfaces it as a full-screen LogBox overlay in development,
      // which buries the form and looks like a crash — the message belongs inline.
      const status = (error as { statusCode?: number })?.statusCode;
      setFailedEmail(status === 401 ? data.email.toLowerCase().trim() : null);
    }
  };

  /**
   * Offered after any rejected sign-in.
   *
   * The server deliberately gives the same answer whether the address is unknown or
   * the password is wrong — telling them apart would let anyone test which emails
   * are registered. So rather than guess, both cases get the same honest message and
   * a way forward: someone without an account taps through to register with their
   * address already filled in, and someone who mistyped simply tries again.
   */
  const handleRegisterWithEmail = (): void => {
    navigation.navigate('Register', failedEmail ? { email: failedEmail } : undefined);
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
          <Text style={styles.title}>{t('auth.welcomeBack', 'Welcome Back')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.loginSubtitle', 'Sign in to continue scanning and discovering products')}
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
                label={t('auth.emailLabel', 'Email Address')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.emailPlaceholder', 'Enter your email')}
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
                label={t('auth.password', 'Password')}
                value={value}
                onChangeText={onChange}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
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
              {failedEmail && (
                <TouchableOpacity onPress={handleRegisterWithEmail} activeOpacity={0.8}>
                  <Text style={styles.errorAction}>
                    {t('auth.noAccountRegister', 'No account yet? Create one with this email')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleNavigateToForgotPassword}
            disabled={state.isLoading}
          >
            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title={t('auth.signIn', 'Sign In')}
            onPress={handleSubmit(onSubmit)}
            loading={state.isLoading}
            disabled={state.isLoading}
            variant="primary"
            size="large"
          />

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount', "Don't have an account?")}</Text>
          <TouchableOpacity
            onPress={handleNavigateToRegister}
            disabled={state.isLoading}
          >
            <Text style={styles.footerLinkText}>{t('auth.signUp', 'Sign Up')}</Text>
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
  
  errorAction: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
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