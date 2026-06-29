import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionRepository, SubscriptionStatus } from '@/services/apiService';
import { UserRole } from '@/types';

interface TierFeature {
  text: string;
  included: boolean;
}

const FREE_FEATURES: TierFeature[] = [
  { text: '20 scans per hour', included: true },
  { text: '30-day scan history', included: true },
  { text: 'Basic safety ratings', included: true },
  { text: 'Unlimited scans', included: false },
  { text: 'Full 2-year history', included: false },
  { text: 'No ads', included: false },
  { text: 'AI recommendations', included: false },
];

const PREMIUM_FEATURES: TierFeature[] = [
  { text: '20 scans per hour', included: true },
  { text: 'Unlimited scans', included: true },
  { text: 'Full 2-year history', included: true },
  { text: 'No ads', included: true },
  { text: 'Full safety ratings', included: true },
  { text: 'AI recommendations', included: false },
  { text: 'Marketplace price comparison', included: false },
];

const AI_PREMIUM_FEATURES: TierFeature[] = [
  { text: 'Unlimited scans', included: true },
  { text: 'Full 2-year history', included: true },
  { text: 'No ads', included: true },
  { text: 'Full safety ratings', included: true },
  { text: 'AI-powered recommendations', included: true },
  { text: 'Marketplace price comparison', included: true },
  { text: 'Price alerts', included: true },
];

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { state } = useAuth();
  const role = (state.user?.role || 'free_user') as UserRole;

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const status = await subscriptionRepository.getStatus();
      setSubscriptionStatus(status);
    } catch {
      // Fall back to role from JWT — status call is non-critical
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) loadStatus();
  }, [isFocused, loadStatus]);

  const currentTier = subscriptionStatus?.tier ?? (
    role === 'premium_user' ? 'premium' :
    role === 'ai_premium' ? 'ai_premium' : 'free'
  );

  const handleSubscribe = async (tier: 'premium' | 'ai_premium'): Promise<void> => {
    setLoadingTier(tier);
    try {
      const session = await subscriptionRepository.createCheckout(tier, 'month', 'eur');
      await Linking.openURL(session.checkout_url);
    } catch (err: any) {
      const msg = err?.message?.includes('503')
        ? 'Payments are not available yet. Check back soon!'
        : 'Could not start checkout. Please try again.';
      Alert.alert('Checkout failed', msg);
    } finally {
      setLoadingTier(null);
    }
  };

  if (role === 'admin' || role === 'super_admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Subscription</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.adminContainer}>
          <Ionicons name="shield-checkmark" size={72} color={theme.colors.primary} />
          <Text style={styles.adminTitle}>Admin Account</Text>
          <Text style={styles.adminSubtitle}>Full Access — No Subscription Needed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tiers = [
    { id: 'free' as const, title: 'Free', price: '€0 / month', features: FREE_FEATURES, badge: null },
    { id: 'premium' as const, title: 'Premium', price: '€10 / month', features: PREMIUM_FEATURES, badge: 'Most Popular' },
    { id: 'ai_premium' as const, title: 'AI Premium', price: '€28 / month', features: AI_PREMIUM_FEATURES, badge: 'Best Value' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>ProductScanner Premium</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Unlock the full power of ProductScanner</Text>

        {isLoadingStatus && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginBottom: 16 }} />
        )}

        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.id;
          const isLoading = loadingTier === tier.id;
          const canUpgrade = !isCurrent && tier.id !== 'free';

          return (
            <View
              key={tier.id}
              style={[styles.card, isCurrent && styles.cardCurrent]}
            >
              {tier.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tier.badge}</Text>
                </View>
              ) : null}

              <View style={styles.cardHeader}>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierPrice}>{tier.price}</Text>
              </View>

              {tier.features.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Ionicons
                    name={f.included ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={f.included ? theme.colors.success : theme.colors.textLight}
                  />
                  <Text style={[styles.featureText, !f.included && styles.featureTextDim]}>
                    {f.text}
                  </Text>
                </View>
              ))}

              {isCurrent ? (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Your current plan</Text>
                </View>
              ) : canUpgrade ? (
                <TouchableOpacity
                  style={[styles.upgradeButton, isLoading && styles.upgradeButtonLoading]}
                  onPress={() => handleSubscribe(tier.id as 'premium' | 'ai_premium')}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.text} />
                  ) : (
                    <Text style={styles.upgradeButtonText}>Upgrade to {tier.title}</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Payments processed securely by Stripe. Cancel anytime from your account settings.
          {'\n'}Test mode active — use card 4242 4242 4242 4242.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: theme.typography.fontSizes.lg, fontWeight: '700' as const, color: theme.colors.text },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  subtitle: {
    fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary,
    textAlign: 'center', marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  cardCurrent: { borderColor: theme.colors.primary, borderWidth: 2 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: theme.colors.primary,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4,
  },
  badgeText: { color: theme.colors.text, fontSize: 11, fontWeight: '700' as const },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  tierTitle: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text },
  tierPrice: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  featureText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text, flex: 1 },
  featureTextDim: { color: theme.colors.textLight },
  currentBadge: {
    marginTop: theme.spacing.md, backgroundColor: theme.colors.primary + '22',
    borderRadius: theme.borderRadius.medium, padding: theme.spacing.sm, alignItems: 'center',
  },
  currentBadgeText: { color: theme.colors.primary, fontWeight: '600' as const, fontSize: theme.typography.fontSizes.sm },
  upgradeButton: {
    marginTop: theme.spacing.md, backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium, padding: theme.spacing.md, alignItems: 'center',
  },
  upgradeButtonLoading: { opacity: 0.7 },
  upgradeButtonText: { color: theme.colors.text, fontWeight: '700' as const, fontSize: theme.typography.fontSizes.md },
  disclaimer: {
    fontSize: 11, color: theme.colors.textLight, textAlign: 'center',
    marginTop: theme.spacing.md, lineHeight: 16,
  },
  adminContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md },
  adminTitle: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text },
  adminSubtitle: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
});

export default SubscriptionScreen;
