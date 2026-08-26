import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
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
import type { ProductCatalogue } from '@/services/apiService';
import { purchasesService } from '@/services/purchasesService';
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
  const [catalogue, setCatalogue] = useState<ProductCatalogue | null>(null);
  const { t } = useTranslation();
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

  useEffect(() => {
    let cancelled = false;
    // Presentational only: a missing or failing catalogue must never stop the
    // paywall rendering, so this is guarded rather than assumed.
    void Promise.resolve()
      .then(() => subscriptionRepository.getProducts?.())
      .then((result) => {
        if (!cancelled && result) setCatalogue(result);
      })
      .catch(() => {
        if (!cancelled) setCatalogue(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTier = subscriptionStatus?.tier ?? (
    role === 'premium_user' ? 'premium' :
    role === 'ai_premium' ? 'ai_premium' : 'free'
  );

  const handleSubscribe = async (tier: 'premium' | 'ai_premium'): Promise<void> => {
    // Subscriptions are sold through the App Store and Play Store, so there is no
    // hosted checkout to open. Until the stores are configured the backend reports
    // purchasable: false and this explains rather than fails.
    if (!catalogue?.purchasable) {
      Alert.alert(
        t('subscription.comingSoonTitle', 'Coming soon'),
        t(
          'subscription.comingSoonBody',
          'Subscriptions will be available through the App Store and Google Play shortly.',
        ),
      );
      return;
    }
    setLoadingTier(tier);
    try {
      // The store owns the payment sheet. Entitlement state is authoritative on the
      // backend, which learns about the purchase from RevenueCat's webhook — so on
      // success we re-read the subscription rather than trusting the client.
      const entitlement = catalogue?.tiers?.[tier]?.entitlement ?? tier;
      const packages = await purchasesService.getPackages();
      const match =
        packages.find((pkg) => pkg.identifier.includes(entitlement)) ?? packages[0];

      if (!match) {
        Alert.alert(
          t('subscription.comingSoonTitle', 'Coming soon'),
          t(
            'subscription.comingSoonBody',
            'Subscriptions will be available through the App Store and Google Play shortly.',
          ),
        );
        return;
      }

      const outcome = await purchasesService.purchase(match.identifier);
      if (outcome === 'purchased') {
        await loadStatus();
        Alert.alert(
          t('subscription.purchaseCompleteTitle', 'Thank you'),
          t(
            'subscription.purchaseCompleteBody',
            'Your subscription is active. It may take a moment to appear.',
          ),
        );
      } else if (outcome === 'unavailable') {
        Alert.alert(
          t('subscription.purchaseFailedTitle', 'Purchase unavailable'),
          t(
            'subscription.purchaseFailedBody',
            'The store could not complete this purchase. Please try again later.',
          ),
        );
      }
      // A cancelled purchase is a deliberate choice — say nothing.
    } finally {
      setLoadingTier(null);
    }
  };

  const handleRestore = async (): Promise<void> => {
    const restored = await purchasesService.restore();
    if (restored) await loadStatus();
    Alert.alert(
      t('subscription.restoreTitle', 'Restore purchases'),
      restored
        ? t('subscription.restoreDone', 'Any previous purchase has been restored.')
        : t('subscription.restoreUnavailable', 'Restoring purchases is not available yet.'),
    );
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

  /**
   * "Most Popular" is a claim about what people actually bought, so it comes from the
   * catalogue rather than being pinned to a card. The backend returns null until
   * enough subscriptions exist to name a leader, and that means no badge at all.
   */
  const badgeFor = (tierId: string): string | null => {
    if (catalogue?.most_popular && catalogue.most_popular === tierId) {
      return t('subscription.mostPopular', 'Most Popular');
    }
    if (catalogue?.most_popular) {
      // Another tier earned the badge — don't dilute it with a competing claim.
      return null;
    }
    return tierId === 'ai_premium' ? t('subscription.bestValue', 'Best Value') : null;
  };

  const tiers = [
    { id: 'free' as const, title: 'Free', price: '€0 / month', features: FREE_FEATURES },
    { id: 'premium' as const, title: 'Premium', price: '€10 / month', features: PREMIUM_FEATURES },
    { id: 'ai_premium' as const, title: 'AI Premium', price: '€28 / month', features: AI_PREMIUM_FEATURES },
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
              {badgeFor(tier.id) ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeFor(tier.id)}</Text>
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
                    <Text style={styles.upgradeButtonText}>
                      {catalogue?.purchasable === false
                        ? t('subscription.comingSoon', 'Coming soon')
                        : `Upgrade to ${tier.title}`}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity onPress={handleRestore} activeOpacity={0.8}>
          <Text style={styles.restoreLink}>
            {t('subscription.restore', 'Restore purchases')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {t(
            'subscription.storeBillingNotice',
            'Subscriptions are billed through the App Store or Google Play. '
              + 'Manage or cancel anytime in your store account.',
          )}
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
  restoreLink: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 11, color: theme.colors.textLight, textAlign: 'center',
    marginTop: theme.spacing.md, lineHeight: 16,
  },
  adminContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md },
  adminTitle: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text },
  adminSubtitle: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
});

export default SubscriptionScreen;
