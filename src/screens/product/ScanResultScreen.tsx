import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { MainStackParamList, RatingBreakdown } from '@/types';
import { gradeColor, gradeLabel, novaLabel } from '@/utils/safetyColors';
import { countryFromLang } from '@/utils/countryFromLang';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  discoveryRepository,
  mlRepository,
  behaviorRepository,
  preferencesRepository,
  ApiError,
} from '@/services/apiService';

type ScanResultRouteProp = RouteProp<MainStackParamList, 'ScanResult'>;

// Minimal local types to avoid circular imports
interface DiscoveryPrice { shop_name: string; price: number; currency: string; distance_km?: number | null }
interface DiscoveryAlternative { barcode: string; name: string; safety_score: number; grade: string; prices: DiscoveryPrice[] }
interface SearchResult { title: string; url: string; snippet?: string }
interface DiscoveryResult { barcode: string; product_name: string; safety_score: number; grade: string; prices: DiscoveryPrice[]; alternatives: DiscoveryAlternative[]; search_results: SearchResult[]; explanation: string }
interface MLAlternative { barcode: string; name: string; safety_score: number; grade: string; reason: string }
interface RecommendationResponse { alternatives: MLAlternative[]; explanation: string }

const ScanResultScreen: React.FC = () => {
  const route = useRoute<ScanResultRouteProp>();
  const navigation = useNavigation<any>();
  const { scanResult } = route.params;
  const { state: authState } = useAuth();
  const { location } = useApp();

  const { t, i18n } = useTranslation();
  const userRole = authState.user?.role ?? 'guest';
  const userId = authState.user?.id ?? '';
  const isAIPremium = userRole === 'ai_premium' || userRole === 'admin' || userRole === 'super_admin';
  const isFreeOrGuest = userRole === 'free_user' || userRole === 'guest';

  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [recsStatus, setRecsStatus] = useState<'idle' | 'loading' | 'done' | '403' | '503'>('idle');

  const barcode = scanResult.product?.barcode ?? '';

  useEffect(() => {
    if (!barcode || scanResult.researching) return;
    let cancelled = false;

    const init = async () => {
      let currency = 'EUR';
      if (userId) {
        try {
          const prefs = await preferencesRepository.get(userId);
          if (prefs.default_currency) currency = prefs.default_currency;
        } catch {}
      }

      if (cancelled) return;

      if (isAIPremium) {
        setDiscoveryStatus('loading');
        try {
          const country = countryFromLang(i18n.language);
          const result = await discoveryRepository.getDiscovery(barcode, location?.lat, location?.lng, currency, country);
          if (!cancelled) { setDiscovery(result as any); setDiscoveryStatus('done'); }
        } catch {
          if (!cancelled) setDiscoveryStatus('error');
        }
      } else if (!isFreeOrGuest) {
        setRecsStatus('loading');
        try {
          const result = await mlRepository.getAlternatives(barcode);
          if (!cancelled) { setRecommendations(result as any); setRecsStatus('done'); }
        } catch (err) {
          const code = err instanceof ApiError ? err.statusCode : 0;
          if (!cancelled) setRecsStatus(code === 403 ? '403' : '503');
        }
      }
    };

    init();
    if (userId) behaviorRepository.track(barcode, 'view');
    return () => { cancelled = true; };
  }, [barcode, userId]);

  // Product not found
  if (scanResult.researching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.researchingContainer}>
          <Ionicons name="search-circle-outline" size={80} color={theme.colors.primary} />
          <Text style={styles.researchingTitle}>Product Not in Our Database</Text>
          <Text style={styles.researchingText}>
            {scanResult.message ??
              "We don't recognise this barcode. We're checking our sources — if found, it will appear in your history within a minute."}
          </Text>
          <Text style={styles.researchingHint}>
            Products like lighters, local brands, or items from some regions may not be in any public database yet.
          </Text>
          <TouchableOpacity style={styles.scanAgainBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Scanner' })} activeOpacity={0.8}>
            <Ionicons name="scan-outline" size={20} color={theme.colors.text} />
            <Text style={styles.scanAgainBtnText}>{t('product.scanAnother')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { product, rating_breakdown } = scanResult;
  const safety_score: number = scanResult.safety_score ?? 0;
  const safety_grade: string = scanResult.safety_grade ?? '?';
  const warnings: string[] = scanResult.warnings ?? [];
  const scoreColor = gradeColor(safety_grade);

  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const INGREDIENT_PREVIEW = 5;

  const renderNutritionRow = (label: string, value?: number, unit = 'g') => {
    if (value === undefined || value === null) return null;
    return (
      <View style={styles.nutritionRow} key={label}>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>{value.toFixed(1)} {unit}</Text>
      </View>
    );
  };

  const renderBreakdown = (rb: RatingBreakdown) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('product.ratingBreakdown')}</Text>
      {rb.nutriscore && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t('product.nutriscore')}</Text>
          <View style={[styles.gradeChip, { backgroundColor: gradeColor(rb.nutriscore.grade) }]}>
            <Text style={styles.gradeChipText}>{rb.nutriscore.grade?.toUpperCase()}</Text>
          </View>
          <Text style={styles.breakdownScore}>{(rb.nutriscore.score ?? 0).toFixed(0)}</Text>
        </View>
      )}
      {rb.nova && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t('product.nova')}</Text>
          <Text style={styles.breakdownValue}>{t('product.novaGroup', { group: rb.nova.group })}</Text>
          <Text style={styles.breakdownMeta}>{t(`nova.${rb.nova.group}`, { defaultValue: novaLabel(rb.nova.group) })}</Text>
        </View>
      )}
      {rb.additives && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t('product.additives')}</Text>
          <Text style={styles.breakdownValue}>{t('product.total', { count: rb.additives.count })}</Text>
          <Text style={[styles.breakdownMeta, rb.additives.high_risk_count > 0 && styles.riskText]}>
            {t('product.highRisk', { count: rb.additives.high_risk_count })}
          </Text>
        </View>
      )}
      {rb.ecoscore && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t('product.ecoscore')}</Text>
          <View style={[styles.gradeChip, { backgroundColor: gradeColor(rb.ecoscore.grade) }]}>
            <Text style={styles.gradeChipText}>{rb.ecoscore.grade?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.breakdownScore}>{(rb.ecoscore.score ?? 0).toFixed(0)}</Text>
        </View>
      )}
    </View>
  );

  const renderAlternatives = () => {
    if (isAIPremium) {
      if (discoveryStatus === 'loading') {
        return <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />;
      }
      if (discoveryStatus === 'done' && discovery && discovery.alternatives.length > 0) {
        return (
          <>
            <Text style={styles.explanationText}>{discovery.explanation}</Text>
            {discovery.alternatives.map((alt) => (
              <TouchableOpacity
                key={alt.barcode}
                style={styles.altCard}
                onPress={() => {
                  behaviorRepository.track(barcode, 'click_alternative', { alt_barcode: alt.barcode });
                  navigation.navigate('ProductDetail', { barcode: alt.barcode });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.altGrade, { backgroundColor: gradeColor(alt.grade) }]}>
                  <Text style={styles.altGradeText}>{alt.grade.toUpperCase()}</Text>
                </View>
                <View style={styles.altInfo}>
                  <Text style={styles.altName}>{alt.name}</Text>
                  {alt.prices.length > 0 && (
                    <Text style={styles.altPrice}>{alt.prices[0]!.price.toFixed(2)} {alt.prices[0]!.currency}</Text>
                  )}
                </View>
                <Text style={styles.altScore}>{alt.safety_score.toFixed(0)}</Text>
              </TouchableOpacity>
            ))}
          </>
        );
      }
      if (discoveryStatus === 'done') {
        return <Text style={styles.emptyNote}>{t('product.noAlternatives')}</Text>;
      }
      if (discoveryStatus === 'error') {
        return <Text style={styles.emptyNote}>{t('product.alternativesUnavailable')}</Text>;
      }
      return null;
    }

    if (isFreeOrGuest) {
      return (
        <View style={styles.unavailableBox}>
          <Ionicons name="lock-closed-outline" size={22} color={theme.colors.textSecondary} />
          <Text style={styles.unavailableTitle}>{t('product.featureNotAvailable')}</Text>
          <Text style={styles.unavailableSub}>
            {t('product.featureNotAvailableAlternatives')}
          </Text>
          <TouchableOpacity style={styles.unavailableBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
            <Text style={styles.unavailableBtnText}>{t('product.upgradeSubscription')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // premium_user — ML alternatives
    if (recsStatus === 'loading') {
      return <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />;
    }
    if (recsStatus === 'done' && recommendations && recommendations.alternatives.length > 0) {
      return (
        <>
          <Text style={styles.explanationText}>{recommendations.explanation}</Text>
          {recommendations.alternatives.map((alt) => (
            <TouchableOpacity
              key={alt.barcode}
              style={styles.altCard}
              onPress={() => navigation.navigate('ProductDetail', { barcode: alt.barcode })}
              activeOpacity={0.8}
            >
              <View style={[styles.altGrade, { backgroundColor: gradeColor(alt.grade) }]}>
                <Text style={styles.altGradeText}>{alt.grade.toUpperCase()}</Text>
              </View>
              <View style={styles.altInfo}>
                <Text style={styles.altName}>{alt.name}</Text>
                <Text style={styles.altReason}>{alt.reason}</Text>
              </View>
              <Text style={styles.altScore}>{alt.safety_score.toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </>
      );
    }
    if (recsStatus === 'done') {
      return <Text style={styles.emptyNote}>{t('product.noAlternatives')}</Text>;
    }
    return null;
  };

  const renderWhereToBuy = () => {
    if (!isAIPremium) {
      if (isFreeOrGuest) {
        return (
          <View style={styles.unavailableBox}>
            <Ionicons name="cart-outline" size={22} color={theme.colors.textSecondary} />
            <Text style={styles.unavailableTitle}>{t('product.featureNotAvailable')}</Text>
            <Text style={styles.unavailableSub}>
              {t('product.featureNotAvailableWhereToBuy')}
            </Text>
            <TouchableOpacity style={styles.unavailableBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
              <Text style={styles.unavailableBtnText}>{t('product.upgradeSubscription')}</Text>
            </TouchableOpacity>
          </View>
        );
      }
      // premium_user — teaser
      return (
        <TouchableOpacity style={styles.upgradeTeaser} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
          <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
          <View style={styles.teaserText}>
            <Text style={styles.teaserTitle}>Upgrade to AI Premium</Text>
            <Text style={styles.teaserSub}>Real prices from Czech shops + web search, all in one place</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    if (discoveryStatus === 'loading') {
      return <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />;
    }
    if (discoveryStatus === 'done' && discovery) {
      if (discovery.prices.length === 0 && discovery.search_results.length === 0) {
        return <Text style={styles.emptyNote}>{t('product.noPrices')}</Text>;
      }
      return (
        <>
          {discovery.prices.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>{t('product.reportedPrices')}</Text>
              {discovery.prices.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.listingRow}
                  onPress={() => behaviorRepository.track(barcode, 'click_price', { shop: p.shop_name })}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.shopName}>{p.shop_name}</Text>
                    {p.distance_km != null && <Text style={styles.distanceText}>{t('product.kmAway', { distance: p.distance_km })}</Text>}
                  </View>
                  <Text style={styles.listingPrice}>{p.price.toFixed(2)} {p.currency}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {discovery.search_results.length > 0 && (
            <>
              <Text style={[styles.sectionSubtitle, discovery.prices.length > 0 && { marginTop: 12 }]}>{t('product.findOnline')}</Text>
              {discovery.search_results.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.searchResultRow}
                  onPress={() => {
                    behaviorRepository.track(barcode, 'click_search', { url: r.url, title: r.title });
                    Linking.openURL(r.url).catch(() => Alert.alert('Error', 'Could not open link'));
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>{r.title}</Text>
                    {r.snippet ? <Text style={styles.searchResultSnippet} numberOfLines={2}>{r.snippet}</Text> : null}
                  </View>
                  <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      );
    }
    if (discoveryStatus === 'error') {
      return <Text style={styles.emptyNote}>{t('product.pricesUnavailable')}</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
            <Text style={styles.barcode}>{product.barcode}</Text>
          </View>
        </View>

        {/* Safety Score Circle */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>{safety_score.toFixed(0)}</Text>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>{safety_grade}</Text>
          </View>
          <Text style={[styles.gradeLabel, { color: scoreColor }]}>
            {t('product.grade', { grade: safety_grade })} — {t(`grades.${safety_grade}`, { defaultValue: gradeLabel(safety_grade) })}
          </Text>
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('product.warnings')}</Text>
            {warnings.map((w, i) => (
              <View key={i} style={styles.warningChip}>
                <Ionicons name="warning" size={14} color={theme.colors.error} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rating Breakdown */}
        {rating_breakdown && renderBreakdown(rating_breakdown)}

        {/* Safer Alternatives */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{t('product.saferAlternatives')}</Text>
            {!isAIPremium && !isFreeOrGuest && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>AI Premium</Text>
              </View>
            )}
          </View>
          {renderAlternatives()}
        </View>

        {/* Where to Buy */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="cart-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>{t('product.whereToBuy')}</Text>
            {!isAIPremium && !isFreeOrGuest && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>AI Premium</Text>
              </View>
            )}
          </View>
          {renderWhereToBuy()}
        </View>

        {/* Nutrition Facts */}
        {product.nutrition && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('product.nutritionPer100g')}</Text>
            {renderNutritionRow('Energy', product.nutrition.energy_kcal, 'kcal')}
            {renderNutritionRow('Fat', product.nutrition.fat_g)}
            {renderNutritionRow('Saturated Fat', product.nutrition.saturated_fat_g)}
            {renderNutritionRow('Carbohydrates', product.nutrition.carbohydrates_g)}
            {renderNutritionRow('Sugars', product.nutrition.sugars_g)}
            {renderNutritionRow('Fiber', product.nutrition.fiber_g)}
            {renderNutritionRow('Proteins', product.nutrition.proteins_g)}
            {renderNutritionRow('Salt', product.nutrition.salt_g)}
          </View>
        )}

        {/* Ingredients */}
        {(product.ingredients ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('product.ingredients')}</Text>
            {(showAllIngredients
              ? (product.ingredients ?? [])
              : (product.ingredients ?? []).slice(0, INGREDIENT_PREVIEW)
            ).map((ing, i) => (
              <Text key={i} style={styles.ingredientText}>• {ing}</Text>
            ))}
            {(product.ingredients ?? []).length > INGREDIENT_PREVIEW && (
              <TouchableOpacity onPress={() => setShowAllIngredients((v) => !v)} activeOpacity={0.8} style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>
                  {showAllIngredients ? t('product.showLess') : t('product.showAll', { count: product.ingredients.length })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Allergens */}
        {(product.allergens ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('product.allergens')}</Text>
            <View style={styles.chipsRow}>
              {(product.allergens ?? []).map((a, i) => (
                <View key={i} style={styles.allergenChip}>
                  <Text style={styles.allergenChipText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ingredients Analysis */}
        {(product.ingredients_analysis ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('product.ingredientsAnalysis')}</Text>
            <View style={styles.chipsRow}>
              {(product.ingredients_analysis ?? []).map((a, i) => (
                <View key={i} style={styles.analysisChip}>
                  <Text style={styles.analysisChipText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Product Images */}
        {(product.images ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(product.images ?? []).map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.productImage} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Scan Another */}
        <TouchableOpacity style={styles.scanAnotherButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Scanner' })} activeOpacity={0.8}>
          <Ionicons name="scan" size={20} color={theme.colors.text} />
          <Text style={styles.scanAnotherText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  researchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl, gap: theme.spacing.lg },
  researchingTitle: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text, textAlign: 'center' },
  researchingText: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  researchingHint: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center', opacity: 0.6, marginTop: theme.spacing.sm, paddingHorizontal: theme.spacing.xl, lineHeight: 20 },
  scanAgainBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.medium, gap: theme.spacing.sm, marginTop: theme.spacing.md },
  scanAgainBtnText: { color: theme.colors.text, fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const },
  content: { paddingBottom: theme.spacing.xxl },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTextContainer: { gap: 4 },
  productName: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text },
  brand: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
  barcode: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textLight },
  scoreSection: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  scoreNumber: { fontSize: theme.typography.fontSizes.xxl, fontWeight: '700' as const },
  scoreGrade: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const },
  gradeLabel: { fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.large, padding: theme.spacing.md, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.md },
  cardTitle: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.text, flex: 1 },
  premiumBadge: { backgroundColor: theme.colors.primary + '33', borderRadius: theme.borderRadius.round, paddingHorizontal: 8, paddingVertical: 2 },
  premiumBadgeText: { fontSize: 10, color: theme.colors.primary, fontWeight: '600' as const },
  warningChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.error + '22', borderRadius: theme.borderRadius.medium, paddingHorizontal: theme.spacing.sm, paddingVertical: 6, marginBottom: theme.spacing.xs, gap: theme.spacing.xs },
  warningText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.sm, flex: 1 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.spacing.sm },
  breakdownLabel: { width: 90, fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary },
  breakdownValue: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text, fontWeight: '500' as const },
  breakdownScore: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text, fontWeight: '500' as const },
  breakdownMeta: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, flex: 1 },
  riskText: { color: theme.colors.error },
  gradeChip: { paddingHorizontal: theme.spacing.sm, paddingVertical: 2, borderRadius: theme.borderRadius.small, minWidth: 28, alignItems: 'center' },
  gradeChipText: { color: theme.colors.text, fontSize: theme.typography.fontSizes.sm, fontWeight: '700' as const },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  nutritionLabel: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary },
  nutritionValue: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text, fontWeight: '500' as const },
  ingredientText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text, lineHeight: 22 },
  showMoreButton: { marginTop: theme.spacing.sm, alignSelf: 'flex-start' },
  showMoreText: { color: theme.colors.primary, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  allergenChip: { backgroundColor: theme.colors.error + '22', borderRadius: theme.borderRadius.round, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  allergenChipText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const },
  analysisChip: { backgroundColor: theme.colors.warning + '22', borderRadius: theme.borderRadius.round, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  analysisChipText: { color: theme.colors.warning, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const },
  productImage: { width: 140, height: 140, borderRadius: theme.borderRadius.medium, marginRight: theme.spacing.sm },
  // Alternatives
  explanationText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: theme.spacing.sm },
  altCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, padding: theme.spacing.sm, marginBottom: theme.spacing.xs, gap: theme.spacing.sm },
  altGrade: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  altGradeText: { color: '#fff', fontSize: theme.typography.fontSizes.sm, fontWeight: '700' as const },
  altInfo: { flex: 1, gap: 2 },
  altName: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  altReason: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary },
  altPrice: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.primary, fontWeight: '600' as const },
  altScore: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.textSecondary },
  // Where to buy
  sectionSubtitle: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: theme.spacing.xs },
  listingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  shopName: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  distanceText: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary },
  listingPrice: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.primary },
  searchResultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  searchResultInfo: { flex: 1, gap: 2 },
  searchResultTitle: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  searchResultSnippet: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, lineHeight: 18 },
  // Upgrade / unavailable
  upgradeTeaser: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary + '11', borderRadius: theme.borderRadius.medium, padding: theme.spacing.md, marginTop: theme.spacing.sm },
  teaserText: { flex: 1, gap: 2 },
  teaserTitle: { fontSize: theme.typography.fontSizes.sm, fontWeight: '700' as const, color: theme.colors.text },
  teaserSub: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary },
  unavailableBox: { alignItems: 'center', paddingVertical: theme.spacing.lg, gap: theme.spacing.sm },
  unavailableTitle: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.text },
  unavailableSub: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  unavailableBtn: { marginTop: theme.spacing.xs, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.medium, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  unavailableBtnText: { fontSize: theme.typography.fontSizes.sm, fontWeight: '700' as const, color: '#fff' },
  emptyNote: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
  // Scan another
  scanAnotherButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.medium, gap: theme.spacing.sm },
  scanAnotherText: { color: theme.colors.text, fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const },
});

export default ScanResultScreen;
