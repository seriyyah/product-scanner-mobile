import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text as RNText,
} from 'react-native';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import theme from '@/constants/theme';
import TextInput from '@/components/forms/TextInput';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

const registerSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  termsAccepted: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
});

const RegisterScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { register: registerUser } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        termsAccepted: data.termsAccepted,
      });
      navigation.navigate('Login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RNText style={styles.title}>Create Account</RNText>
      <RNText style={styles.subtitle}>Join Product Scanner today</RNText>

      <View style={styles.form}>
        <TextInput
          name="firstName"
          control={control}
          label="First Name"
          placeholder="John"
          editable={!isLoading}
          error={errors.firstName?.message}
        />

        <TextInput
          name="lastName"
          control={control}
          label="Last Name"
          placeholder="Doe"
          editable={!isLoading}
          error={errors.lastName?.message}
        />

        <TextInput
          name="email"
          control={control}
          label="Email"
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          error={errors.email?.message}
        />

        <TextInput
          name="password"
          control={control}
          label="Password"
          placeholder="Enter a strong password"
          secureTextEntry={!showPassword}
          editable={!isLoading}
          error={errors.password?.message}
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <TextInput
          name="confirmPassword"
          control={control}
          label="Confirm Password"
          placeholder="Re-enter your password"
          secureTextEntry={!showConfirmPassword}
          editable={!isLoading}
          error={errors.confirmPassword?.message}
          rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </View>

      <TouchableOpacity
        style={[styles.registerButton, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <RNText style={styles.registerButtonText}>Create Account</RNText>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <RNText style={styles.footerText}>Already have an account? </RNText>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
          <RNText style={styles.footerLink}>Sign In</RNText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as any,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600' as any,
  },
});

export default RegisterScreen;
