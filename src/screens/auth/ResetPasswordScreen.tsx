import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import TextInput from '@/components/forms/TextInput';
import Button from '@/components/common/Button';
import { authRepository } from '@/services/apiService';
import { AuthStackParamList } from '@/types';

type RouteProps = RouteProp<AuthStackParamList, 'ResetPassword'>;

const MIN_PASSWORD_LENGTH = 8;

const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const token = route.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    let valid = true;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      valid = false;
    } else {
      setPasswordError('');
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }
    return valid;
  };

  const handleSubmit = async (): Promise<void> => {
    setApiError('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await authRepository.resetPassword(token, password);
      if (res.message?.toLowerCase().includes('success') || (res as any).success !== false) {
        setDone(true);
      } else {
        setApiError('Password reset failed. The link may have expired.');
      }
    } catch {
      setApiError('Password reset failed. The link may have expired — request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          <Text style={styles.title}>{t('auth.passwordResetDone', 'Password Reset!')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.passwordResetDoneBody', 'Your password has been updated. Sign in with your new password.')}
          </Text>
          <Button
            title={t('auth.signIn', 'Sign In')}
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
          <View style={styles.header}>
            <Ionicons name="lock-open" size={48} color={theme.colors.primary} />
            <Text style={styles.title}>{t('auth.newPassword', 'New Password')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.newPasswordBody', 'Choose a strong password for your account.')}
            </Text>
          </View>

          <TextInput
            label={t('auth.newPassword', 'New Password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setApiError('');
              if (passwordError && text.length >= MIN_PASSWORD_LENGTH) setPasswordError('');
            }}
            placeholder={t('auth.passwordPlaceholderMin', 'At least 8 characters')}
            secureTextEntry
            error={passwordError}
            required
            disabled={isLoading}
          />

          <TextInput
            label={t('auth.confirmPassword', 'Confirm Password')}
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              if (confirmError && text === password) setConfirmError('');
            }}
            placeholder={t('auth.confirmPasswordPlaceholder', 'Repeat your password')}
            secureTextEntry
            error={confirmError}
            required
            disabled={isLoading}
          />

          {apiError ? (
            <Text style={styles.apiError}>{apiError}</Text>
          ) : null}

          <Button
            title={isLoading ? t('auth.resetting', 'Resetting…') : t('auth.setNewPassword', 'Set New Password')}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            size="large"
          />
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
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  apiError: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});

export default ResetPasswordScreen;
