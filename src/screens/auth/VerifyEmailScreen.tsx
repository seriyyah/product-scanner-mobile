import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import Button from '@/components/common/Button';
import { authRepository } from '@/services/apiService';
import { AuthStackParamList } from '@/types';

type RouteProps = RouteProp<AuthStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const token = route.params?.token;

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no_token'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('no_token');
      return;
    }
    authRepository.verifyEmail(token)
      .then((res) => setStatus(res.success ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Verifying your email…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSuccess = status === 'success';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Ionicons
          name={isSuccess ? 'checkmark-circle' : 'close-circle'}
          size={80}
          color={isSuccess ? theme.colors.success : theme.colors.error}
        />
        <Text style={styles.title}>
          {isSuccess ? 'Email Verified!' : 'Verification Failed'}
        </Text>
        <Text style={styles.subtitle}>
          {isSuccess
            ? 'Your email address has been confirmed. You can now sign in.'
            : status === 'no_token'
              ? 'No verification token found. Please use the link from your email.'
              : 'This link may have expired or already been used. Request a new verification email after signing in.'}
        </Text>
        <Button
          title="Go to Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
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
});

export default VerifyEmailScreen;
