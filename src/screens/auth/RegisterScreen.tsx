import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import theme from '@/constants/theme';
import TextInput from '@/components/forms/TextInput';
import Button from '@/components/common/Button';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .min(12, 'Password must be at least 12 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  termsAccepted: yup
    .boolean()
    .oneOf([true], 'You must accept the Terms of Service')
    .required('You must accept the Terms of Service'),
});

const RegisterScreen: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigation = useNavigation<any>();
  const { register: registerUser } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const termsAccepted = watch('termsAccepted');
  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        termsAccepted: data.termsAccepted,
      });
      setRegistered(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Ionicons name="mail" size={64} color={theme.colors.primary} />
          <Text style={styles.successTitle}>Check your email!</Text>
          <Text style={styles.successText}>
            We sent a verification link to your email address. Please verify your account to continue.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Product Scanner today</Text>

          <TextInput
            label="First Name"
            name="firstName"
            control={control}
            placeholder="John"
            autoCapitalize="words"
            error={errors.firstName?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label="Last Name"
            name="lastName"
            control={control}
            placeholder="Doe"
            autoCapitalize="words"
            error={errors.lastName?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label="Email"
            name="email"
            control={control}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label="Password"
            name="password"
            control={control}
            placeholder="At least 12 characters"
            secureTextEntry
            error={errors.password?.message}
            required
            disabled={isSubmitting}
          />
          <View style={styles.passwordHint}>
            <Text style={[
              styles.passwordCount,
              passwordValue.length >= 12
                ? styles.passwordCountOk
                : styles.passwordCountWarn,
            ]}>
              {passwordValue.length}/12 characters
            </Text>
          </View>

          <TextInput
            label="Confirm Password"
            name="confirmPassword"
            control={control}
            placeholder="Re-enter your password"
            secureTextEntry
            error={errors.confirmPassword?.message}
            required
            disabled={isSubmitting}
          />

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setValue('termsAccepted', !termsAccepted)}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && (
                <Ionicons name="checkmark" size={14} color={theme.colors.text} />
              )}
            </View>
            <Text style={styles.termsText}>I agree to the Terms of Service</Text>
          </TouchableOpacity>
          {errors.termsAccepted && (
            <Text style={styles.errorText}>{errors.termsAccepted.message}</Text>
          )}

          <Button
            title={isSubmitting ? 'Creating Account...' : 'Create Account'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            size="large"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.small,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.xs,
    marginBottom: theme.spacing.md,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600' as const,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  passwordHint: {
    alignItems: 'flex-end',
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  passwordCount: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: '500' as const,
  },
  passwordCountWarn: {
    color: theme.colors.error,
  },
  passwordCountOk: {
    color: '#4CAF50',
  },
});

export default RegisterScreen;
