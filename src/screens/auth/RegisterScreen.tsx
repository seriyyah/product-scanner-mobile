import React, { useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '@/constants/theme';
import { checkPassword, isPasswordAcceptable } from '@/utils/passwordPolicy';
import { persistRegistrationPreferences } from '@/utils/registrationPreferences';
import TextInput from '@/components/forms/TextInput';
import Button from '@/components/common/Button';
import { SUPPORTED_LANGUAGES } from '@/i18n';

const CURRENCY_OPTIONS = ['EUR', 'CZK', 'USD', 'GBP', 'PLN', 'HUF', 'RON', 'SEK', 'DKK', 'CHF'];

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
}

/** i18n key and English fallback for each policy rule. */
const RULE_LABELS: Record<
  'length' | 'uppercase' | 'lowercase' | 'digit' | 'special',
  { key: string; fallback: string }
> = {
  length: { key: 'auth.ruleLength', fallback: 'At least 12 characters' },
  uppercase: { key: 'auth.ruleUppercase', fallback: 'An uppercase letter' },
  lowercase: { key: 'auth.ruleLowercase', fallback: 'A lowercase letter' },
  digit: { key: 'auth.ruleDigit', fallback: 'A number' },
  special: { key: 'auth.ruleSpecial', fallback: 'A special character (!@#$…)' },
};

// Built from the translator rather than at module load, so a validation
// message appears in the language the user is actually reading.
type Translate = (key: string, fallback: string) => string;

const buildRegisterSchema = (t: Translate) => yup.object().shape({
  firstName: yup
    .string()
    .min(2, t('auth.firstNameMin', 'First name must be at least 2 characters'))
    .required(t('auth.firstNameRequired', 'First name is required')),
  lastName: yup
    .string()
    .min(2, t('auth.lastNameMin', 'Last name must be at least 2 characters'))
    .required(t('auth.lastNameRequired', 'Last name is required')),
  email: yup
    .string()
    .email(t('auth.emailInvalid', 'Invalid email format'))
    .required(t('auth.emailRequired', 'Email is required')),
  password: yup
    .string()
    .required(t('auth.passwordRequired', 'Password is required'))
    // Mirrors auth-service exactly. Checking only the length here let a password
    // through that the server then refused.
    .test('policy', t('auth.passwordPolicy', 'Password does not meet all requirements'), (value) =>
      isPasswordAcceptable(value ?? ''),
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('auth.passwordMatch', 'Passwords must match'))
    .required(t('auth.confirmPasswordRequired', 'Please confirm your password')),
  termsAccepted: yup
    .boolean()
    .oneOf([true], t('auth.termsRequired', 'You must accept the Terms of Service'))
    .required(t('auth.termsRequired', 'You must accept the Terms of Service')),
});

const RegisterScreen: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const navigation = useNavigation<any>();
  const { register: registerUser } = useAuth();
  const { setLanguage } = useApp();

  const { t } = useTranslation();
  const registerSchema = useMemo(() => buildRegisterSchema(t), [t]);
  // Arrives when someone was sent here from a rejected sign-in.
  const route = useRoute<any>();
  const prefilledEmail: string = route.params?.email ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema) as any,
    values: prefilledEmail ? ({ email: prefilledEmail } as any) : undefined,
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
      // Apply language immediately in this session
      setLanguage(selectedLanguage);
      // Persist selected language/currency so PreferencesScreen shows correct defaults
      // after email verification + login. Cannot reject: the account already exists on
      // the server by this point, so a storage failure must not report registration
      // as failed and leave the user unable to sign up again.
      await persistRegistrationPreferences(selectedLanguage, selectedCurrency);
      setRegistered(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert(t('auth.registrationFailed', 'Registration Failed'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Ionicons name="mail" size={64} color={theme.colors.primary} />
          <Text style={styles.successTitle}>{t('auth.registerCheckEmail', 'Check your email!')}</Text>
          <Text style={styles.successText}>
            {t('auth.registerCheckEmailBody', 'We sent a verification link to your email address. Please verify your account to continue.')}
          </Text>
          <Button
            title={t('auth.backToSignIn', 'Back to Sign In')}
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
          <Text style={styles.title}>{t('auth.register', 'Create Account')}</Text>
          <Text style={styles.subtitle}>{t('auth.registerSubtitle', 'Join Product Scanner today')}</Text>

          <TextInput
            label={t('auth.firstName', 'First Name')}
            name="firstName"
            control={control}
            placeholder={t('auth.firstNamePlaceholder', 'John')}
            autoCapitalize="words"
            error={errors.firstName?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label={t('auth.lastName', 'Last Name')}
            name="lastName"
            control={control}
            placeholder={t('auth.lastNamePlaceholder', 'Doe')}
            autoCapitalize="words"
            error={errors.lastName?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label={t('auth.email', 'Email')}
            name="email"
            control={control}
            placeholder={t('auth.emailExample', 'john@example.com')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label={t('auth.password', 'Password')}
            name="password"
            control={control}
            placeholder={t('auth.passwordPlaceholder12', 'At least 12 characters')}
            secureTextEntry
            error={errors.password?.message}
            required
            disabled={isSubmitting}
          />
          {/* Every rule the server enforces, shown as it is met. The form used to
              check the length only, so a password could pass here and be refused on
              submit with no indication of which rule was missing. */}
          <View style={styles.passwordHint}>
            <Text style={styles.passwordRulesTitle}>
              {t('auth.passwordRules', 'Password must contain:')}
            </Text>
            {checkPassword(passwordValue).map((rule) => (
              <View key={rule.id} style={styles.passwordRuleRow}>
                <Ionicons
                  name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={rule.met ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.passwordRuleText,
                    rule.met ? styles.passwordRuleMet : styles.passwordRuleUnmet,
                  ]}
                >
                  {t(RULE_LABELS[rule.id].key, RULE_LABELS[rule.id].fallback)}
                </Text>
              </View>
            ))}
          </View>

          <TextInput
            label={t('auth.confirmPassword', 'Confirm Password')}
            name="confirmPassword"
            control={control}
            placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')}
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
            {/* Both documents are one tap away. Agreeing to something you
                cannot read is not agreement, and Apple looks for exactly this. */}
            <Text style={styles.termsText}>
              {t('auth.termsPrefix', 'I agree to the')}{' '}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('Legal', { document: 'terms' })}
              >
                {t('legal.terms', 'Terms of Service')}
              </Text>
              {' '}{t('auth.termsAnd', 'and the')}{' '}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate('Legal', { document: 'privacy' })}
              >
                {t('legal.privacy', 'Privacy Policy')}
              </Text>
              .
            </Text>
          </TouchableOpacity>
          {errors.termsAccepted && (
            <Text style={styles.errorText}>{errors.termsAccepted.message}</Text>
          )}

          {/* Language selection */}
          <View style={styles.prefSection}>
            <Text style={styles.prefLabel}>{t('registration.languageLabel', 'App Language')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.prefChips}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.prefChip, selectedLanguage === lang.code && styles.prefChipActive]}
                    onPress={() => setSelectedLanguage(lang.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.prefChipText, selectedLanguage === lang.code && styles.prefChipTextActive]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Currency selection */}
          <View style={styles.prefSection}>
            <Text style={styles.prefLabel}>{t('registration.currencyLabel', 'Preferred Currency')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.prefChips}>
                {CURRENCY_OPTIONS.map((cur) => (
                  <TouchableOpacity
                    key={cur}
                    style={[styles.prefChip, selectedCurrency === cur && styles.prefChipActive]}
                    onPress={() => setSelectedCurrency(cur)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.prefChipText, selectedCurrency === cur && styles.prefChipTextActive]}>
                      {cur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Button
            title={isSubmitting ? t('auth.creatingAccount', 'Creating Account...') : t('auth.register', 'Create Account')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            size="large"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.haveAccount', 'Already have an account?')} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>{t('auth.signIn', 'Sign In')}</Text>
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
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600' as const,
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
  passwordRulesTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  passwordRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  passwordRuleText: {
    fontSize: 13,
    marginLeft: 6,
  },
  passwordRuleMet: {
    color: theme.colors.success,
  },
  passwordRuleUnmet: {
    color: theme.colors.textSecondary,
  },
  prefSection: {
    marginBottom: theme.spacing.md,
  },
  prefLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  prefChips: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  prefChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  prefChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  prefChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  prefChipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
});

export default RegisterScreen;
