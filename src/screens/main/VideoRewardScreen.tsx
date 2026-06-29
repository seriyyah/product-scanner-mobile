import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { subscriptionRepository } from '@/services/apiService';

const AD_DURATION = 5; // seconds — swap for a real ad SDK later

type Phase = 'watching' | 'claiming' | 'done' | 'already_claimed';

const VideoRewardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [phase, setPhase] = useState<Phase>('watching');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          claimReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const claimReward = async (): Promise<void> => {
    setPhase('claiming');
    try {
      const result = await subscriptionRepository.claimVideoReward();
      setPhase(result.granted ? 'done' : 'already_claimed');
    } catch {
      Alert.alert('Error', 'Could not claim reward. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const progressPct = ((AD_DURATION - countdown) / AD_DURATION) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topNav}>
        <View style={styles.navSpacer} />
        <Text style={styles.navTitle}>Watch & Earn</Text>
        <View style={styles.navSpacer} />
      </View>

      <View style={styles.body}>
        {phase === 'watching' && (
          <>
            <View style={styles.adBox}>
              <Ionicons name="play-circle" size={64} color={theme.colors.primary} />
              <Text style={styles.adLabel}>Ad playing…</Text>
              <Text style={styles.countdown}>{countdown}s</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
              </View>
            </View>
            <Text style={styles.hint}>Watch the full ad to earn 5 extra scans this hour.</Text>
          </>
        )}

        {phase === 'claiming' && (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.hint}>Claiming your reward…</Text>
          </>
        )}

        {phase === 'done' && (
          <>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
            <Text style={styles.successTitle}>+5 Scans Granted!</Text>
            <Text style={styles.hint}>
              You have 5 extra scans for this hour. Keep scanning or upgrade to Premium for unlimited.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Back to Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Subscription')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'already_claimed' && (
          <>
            <Ionicons name="time-outline" size={80} color={theme.colors.textSecondary} />
            <Text style={styles.successTitle}>Already Claimed</Text>
            <Text style={styles.hint}>
              You already watched a video this hour. Come back later or upgrade to Premium for unlimited scans.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Back to Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Subscription')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  navTitle: { fontSize: theme.typography.fontSizes.lg, fontWeight: '700' as const, color: theme.colors.text },
  navSpacer: { width: 40 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg },
  adBox: {
    width: '100%', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  adLabel: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
  countdown: { fontSize: 48, fontWeight: '700' as const, color: theme.colors.text },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: theme.colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  hint: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  successTitle: { fontSize: theme.typography.fontSizes.xxl ?? 28, fontWeight: '700' as const, color: theme.colors.text },
  primaryBtn: {
    width: '100%', backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium, padding: theme.spacing.md, alignItems: 'center',
  },
  primaryBtnText: { color: theme.colors.text, fontWeight: '700' as const, fontSize: theme.typography.fontSizes.md },
  secondaryBtn: {
    width: '100%', borderWidth: 1, borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium, padding: theme.spacing.md, alignItems: 'center',
  },
  secondaryBtnText: { color: theme.colors.primary, fontWeight: '600' as const, fontSize: theme.typography.fontSizes.md },
});

export default VideoRewardScreen;
