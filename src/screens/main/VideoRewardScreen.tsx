import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import theme from '@/constants/theme';
import { subscriptionRepository } from '@/services/apiService';

const TEST_MODE = process.env.EXPO_PUBLIC_ADMOB_TEST_MODE === 'true';
const REWARDED_ID = TEST_MODE
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS ?? TestIds.REWARDED)
    : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID ?? TestIds.REWARDED);

type Phase = 'loading' | 'ready' | 'claiming' | 'done' | 'already_claimed';

const VideoRewardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [phase, setPhase] = useState<Phase>('loading');
  // Track whether the user completed the ad — only EARNED_REWARD sets this true
  const earnedRef = useRef(false);
  const claimedRef = useRef(false);

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true, // GDPR safe default for EU users
    });

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setPhase('ready');
      ad.show();
    });

    // This fires ONLY when the user watches the full video — this is how you enforce completion
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedRef.current = true;
    });

    // Ad dismissed — check if they actually earned the reward
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (earnedRef.current && !claimedRef.current) {
        claimedRef.current = true;
        claimReward();
      } else if (!earnedRef.current) {
        // User skipped before completion — no reward, go back
        Alert.alert(
          'Video not completed',
          'Watch the full video to earn 5 extra scans.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    });

    // If ad fails to load (no fill, network issue) — don't penalise the user
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      if (!claimedRef.current) {
        claimedRef.current = true;
        claimReward();
      }
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topNav}>
        <View style={styles.navSpacer} />
        <Text style={styles.navTitle}>Watch & Earn</Text>
        <View style={styles.navSpacer} />
      </View>

      <View style={styles.body}>
        {(phase === 'loading' || phase === 'ready') && (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.hint}>Loading your ad…</Text>
            <Text style={styles.subHint}>Watch the full video to earn 5 extra scans this hour.</Text>
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
              You have 5 extra scans for this hour.{'\n'}
              Upgrade to Premium for unlimited scans with no ads.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Back to Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'already_claimed' && (
          <>
            <Ionicons name="time-outline" size={80} color={theme.colors.textSecondary} />
            <Text style={styles.successTitle}>Already Claimed</Text>
            <Text style={styles.hint}>
              You already earned extra scans this hour.{'\n'}
              Come back later or upgrade to Premium.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Back to Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
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
  hint: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  subHint: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textLight, textAlign: 'center' },
  successTitle: { fontSize: 28, fontWeight: '700' as const, color: theme.colors.text },
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
