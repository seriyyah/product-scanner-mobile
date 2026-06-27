import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface TierFeature {
  text: string;
  included: boolean;
}

interface TierCard {
  id: string;
  title: string;
  badge?: string;
  features: TierFeature[];
  isCurrent: boolean;
  price: string;
  comingSoon?: boolean;
}

const FREE_FEATURES: TierFeature[] = [
  { text: '20 scans per hour', included: true },
  { text: '30-day scan history', included: true },
  { text: 'Basic safety ratings', included: true },
  { text: 'Unlimited scans', included: false },
  { text: 'Full scan history (2 years)', included: false },
  { text: 'No ads', included: false },
  { text: 'AI recommendations', included: false },
];

const PREMIUM_FEATURES: TierFeature[] = [
  { text: 'Unlimited scans', included: true },
  { text: 'Full scan history (2 years)', included: true },
  { text: 'No ads or videos', included: true },
  { text: 'Priority support', included: true },
  { text: 'AI recommendations', included: false },
  { text: 'Better alternatives', included: false },
];

const AI_PREMIUM_FEATURES: TierFeature[] = [
  { text: 'Everything in Premium', included: true },
  { text: 'AI-powered recommendations', included: true },
  { text: '"Buy better/cheaper" suggestions', included: true },
  { text: 'Price alerts', included: true },
  { text: 'Marketplace price comparison', included: true },
];

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAuth();
  const role = (state.user?.role || 'free_user') as UserRole;

  const handleNotifyMe = (): void => {
    Alert.alert(
      'Coming Soon!',
      'Premium subscriptions are coming soon. We\'ll notify you when they\'re available.',
      [{ text: 'OK' }]
    );
  };

  const tiers: TierCard[] = [
    {
      id: 'free',
      title: 'Free',
      price: '$0 / month',
      features: FREE_FEATURES,
      isCurrent: role === 'free_user' || role === 'guest',
    },
    {
      id: 'premium',
      title: 'Premium',
      price: 'Coming Soon',
      badge: 'Most Popular',
      features: PREMIUM_FEATURES,
      isCurrent: role === 'premium_user',
      comingSoon: true,
    },
    {
      id: 'ai_premium',
      title: 'AI Premium',
      price: 'Coming Soon',
      features: AI_PREMIUM_FEATURES,
      isCurrent: role === 'ai_premium',
      comingSoon: true,
    },
  ];

  if (role === 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
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
          <Text style={styles.adminSubtitle}>Full Access</Text>
          <View style={styles.adminCard}>
            {[
              'Unlimited scans',
              'Full scan history',
              'AI recommendations',
              'Marketplace access',
              'Admin dashboard',
              'All features unlocked',
            ].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>ProductScanner Premium</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.headerSubtitle}>
          Unlock the full power of ProductScanner
        </Text>

        {tiers.map((tier) => (
          <View
            key={tier.id}
            style={[
              styles.tierCard,
              tier.isCurrent && styles.tierCardCurrent,
              tier.id === 'premium' && styles.tierCardHighlighted,
            ]}
          >
            {/* Tier Header */}
            <View style={styles.tierHeader}>
              <View>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierPrice}>{tier.price}</Text>
              </View>
              <View style={styles.tierBadges}>
                {tier.isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
                {tier.badge && !tier.isCurrent && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{tier.badge}</Text>
                  </View>
                )}
                {tier.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Features */}
            {tier.features.map((feature) => (
              <View key={feature.text} style={styles.featureRow}>
                <Ionicons
                  name={feature.included ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={feature.included ? theme.colors.success : theme.colors.textLight}
                />
                <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                  {feature.text}
                </Text>
              </View>
            ))}

            {/* CTA */}
            {!tier.isCurrent && tier.comingSoon && (
              <TouchableOpacity
                style={styles.notifyButton}
                onPress={handleNotifyMe}
                activeOpacity={0.8}
              >
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Text style={styles.comingSoonMessage}>
          Stay tuned! Premium subscriptions are coming soon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '700' as const,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  tierCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tierCardCurrent: {
    borderColor: theme.colors.primary,
  },
  tierCardHighlighted: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.surface,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  tierTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  tierPrice: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tierBadges: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  currentBadge: {
    backgroundColor: theme.colors.primary + '33',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  currentBadgeText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: '600' as const,
  },
  popularBadge: {
    backgroundColor: theme.colors.secondary + '33',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  popularBadgeText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: '600' as const,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comingSoonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    flex: 1,
  },
  featureTextDisabled: {
    color: theme.colors.textLight,
  },
  notifyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  notifyButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
  comingSoonMessage: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontStyle: 'italic',
  },
  adminContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  adminTitle: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  adminSubtitle: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.textSecondary,
  },
  adminCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    width: '100%',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});

export default SubscriptionScreen;
