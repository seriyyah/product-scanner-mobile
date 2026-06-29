import React, { useEffect, useState } from 'react';
import {
  Linking,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { MainStackParamList, ScanResult, RatingBreakdown, DiscoveryResult, DiscoveryAlternative, DiscoveryPrice } from '@/types';
import {
  scannerRepository,
  mlRepository,
  discoveryRepository,
  behaviorRepository,
  RecommendationResponse,
  ApiError,
} from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { preferencesRepository } from '@/services/apiService';
import { gradeColor, gradeLabel, novaLabel } from '@/utils/safetyColors';

type ProductDetailRouteProp = RouteProp<MainStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { barcode, scanResult: initialScanResult } = route.params;
  const { state: authState } = useAuth();
  const { location } = useApp();
  const userRole = authState.user?.role ?? 'free_user';
  const isAIPremium = userRole === 'ai_premium' || userRole === 'admin';
  const userId = authState.user?.id ?? '';
  const [userCurrency, setUserCurrency] = useState('EUR');

  useEffect(() => {
    if (userId) {
      preferencesRepository.get(userId)
        .then((p) => { if (p.default_currency) setUserCurrency(p.default_currency); })
        .catch(() => {});
    }
  }, [userId]);

  const [scanResult, setScanResult] = useState<ScanResult | null>(initialScanResult || null);
  const [isLoading, setIsLoading] = useState(!initialScanResult);
  const [error, setError] = useState('');
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const INGREDIENT_PREVIEW = 5;

  // AI Premium — unified discovery data
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  // Free/Premium — ML alternatives only
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [recsStatus, setRecsStatus] = useState<'idle' | 'loading' | 'done' | '403' | '503'>('idle');

  useEffect(() => {
    if (!initialScanResult) {
      fetchProduct();
    } else {
      loadPhase2Data(barcode);
    }
  }, [barcode]);

  // Track product view for personalization
  useEffect(() => {
    if (userId) {
      behaviorRepository.track(barcode, 'view');
    }
  }, [barcode, userId]);

  const fetchProduct = async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const result = await scannerRepository.getProductDetails(barcode);
      setScanResult(result);
      loadPhase2Data(barcode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhase2Data = async (bc: string): Promise<void> => {
    if (isAIPremium) {
      setDiscoveryStatus('loading');
      try {
        const result = await discoveryRepository.getDiscovery(
          bc,
          location?.lat,
          location?.lng,
          userCurrency,
        );
        setDiscovery(result);
        setDiscoveryStatus('done');
      } catch {
        setDiscoveryStatus('error');
      }
    } else {
      setRecsStatus('loading');
      try {
        const result = await mlRepository.getAlternatives(bc);
        setRecommendations(result);
        setRecsStatus('done');
      } catch (err) {
        const code = err instanceof ApiError ? err.statusCode : 0;
        setRecsStatus(code === 403 ? '403' : '503');
      }
    }
  };

  const handleShare = (): void => {
    Alert.alert('Share', 'Sharing coming soon!');
  };

  const handlePriceClick = async (price: DiscoveryPrice): Promise<void> => {
    await behaviorRepository.track(barcode, 'click_price', { shop: price.shop_name });
  };

  const handleAlternativeClick = async (alt: DiscoveryAlternative): Promise<void> => {
    await behaviorRepository.track(barcode, 'click_alternative', { alt_barcode: alt.barcode });
    navigation.navigate('ProductDetail', { barcode: alt.barcode });
  };

  const handleSearchClick = async (url: string, title: string): Promise<void> => {
    await behaviorRepository.track(barcode, 'click_search', { url, title });
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !scanResult) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity onPress={fetchProduct} style={styles.retryButton} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { product, rating_breakdown, warnings = [] } = scanResult;
  const safety_score: number = scanResult.safety_score ?? 0;
  const safety_grade: string = scanResult.safety_grade ?? '?';
  const scoreColor = gradeColor(safety_grade);
  const dataQuality = scanResult.data_quality ?? 'full';
  const confidence = scanResult.confidence ?? 1;
  const showDisclaimer = dataQuality !== 'full' || confidence < 0.4;

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
      <Text style={styles.cardTitle}>Rating Breakdown</Text>
      {rb.nutriscore && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>NutriScore</Text>
          <View style={[styles.gradeChip, { backgroundColor: gradeColor(rb.nutriscore.grade) }]}>
            <Text style={styles.gradeChipText}>{rb.nutriscore.grade?.toUpperCase()}</Text>
          </View>
          <Text style={styles.breakdownScore}>{(rb.nutriscore.score ?? 0).toFixed(0)}</Text>
        </View>
      )}
      {rb.nova && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>NOVA</Text>
          <Text style={styles.breakdownValue}>Group {rb.nova.group}</Text>
          <Text style={styles.breakdownMeta}>{novaLabel(rb.nova.group)}</Text>
        </View>
      )}
      {rb.additives && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Additives</Text>
          <Text style={styles.breakdownValue}>{rb.additives.count} total</Text>
          <Text style={[styles.breakdownMeta, rb.additives.high_risk_count > 0 && styles.riskText]}>
            High risk: {rb.additives.high_risk_count}
          </Text>
        </View>
      )}
      {rb.ecoscore && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>EcoScore</Text>
          <View style={[styles.gradeChip, { backgroundColor: gradeColor(rb.ecoscore.grade) }]}>
            <Text style={styles.gradeChipText}>{rb.ecoscore.grade?.toUpperCase() || '?'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderDiscoveryAlternatives = () => {
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
              onPress={() => handleAlternativeClick(alt)}
              activeOpacity={0.8}
            >
              <View style={[styles.altGrade, { backgroundColor: gradeColor(alt.grade) }]}>
                <Text style={styles.altGradeText}>{alt.grade.toUpperCase()}</Text>
              </View>
              <View style={styles.altInfo}>
                <Text style={styles.altName}>{alt.name}</Text>
                {alt.prices.length > 0 && (() => {
                    const p0 = alt.prices[0]!;
                    return (
                      <Text style={styles.altPrice}>
                        From {p0.price.toFixed(2)} {p0.currency} · {p0.shop_name}
                      </Text>
                    );
                  })()}
              </View>
              <View style={styles.altRight}>
                <Text style={styles.altScore}>{alt.safety_score.toFixed(0)}</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </>
      );
    }
    if (discoveryStatus === 'done' && discovery && discovery.alternatives.length === 0) {
      return (
        <>
          <Text style={styles.explanationText}>{discovery.explanation}</Text>
          <Text style={styles.emptyNote}>Scan more products — alternatives improve as the database grows.</Text>
        </>
      );
    }
    if (discoveryStatus === 'error') {
      return <Text style={styles.emptyNote}>Could not load alternatives. Please try again.</Text>;
    }
    return null;
  };

  const renderFreeAlternatives = () => {
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
      return <Text style={styles.emptyNote}>No safer alternatives found for this product.</Text>;
    }
    if (recsStatus === '403' || recsStatus === '503') {
      return <Text style={styles.emptyNote}>Recommendations unavailable.</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={styles.navButton}>
          <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          <Text style={styles.barcode}>{product.barcode}</Text>
        </View>

        {/* Safety Score */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>{safety_score.toFixed(0)}</Text>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>{safety_grade}</Text>
          </View>
          <Text style={[styles.scoreLabelText, { color: scoreColor }]}>
            Grade {safety_grade} — {gradeLabel(safety_grade)}
          </Text>
          {showDisclaimer && (
            <View style={styles.disclaimerBadge}>
              <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.disclaimerText}>
                {dataQuality === 'minimal'
                  ? 'Estimated rating — limited product data available'
                  : 'Based on partial data — some values derived from ingredient text'}
              </Text>
            </View>
          )}
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Warnings</Text>
            {warnings.map((w, i) => (
              <View key={i} style={styles.warningChip}>
                <Ionicons name="warning" size={14} color={theme.colors.error} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {rating_breakdown && renderBreakdown(rating_breakdown)}

        {/* Nutrition */}
        {product.nutrition && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition per 100g</Text>
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
            <Text style={styles.cardTitle}>Ingredients</Text>
            {(showAllIngredients ? product.ingredients : product.ingredients.slice(0, INGREDIENT_PREVIEW)).map((ing, i) => (
              <Text key={i} style={styles.ingredientText}>• {ing}</Text>
            ))}
            {product.ingredients.length > INGREDIENT_PREVIEW && (
              <TouchableOpacity onPress={() => setShowAllIngredients((v) => !v)} activeOpacity={0.8}>
                <Text style={styles.showMoreText}>
                  {showAllIngredients ? 'Show less' : `Show all ${product.ingredients.length} ingredients`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Allergens */}
        {(product.allergens ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Allergens</Text>
            <View style={styles.chipsRow}>
              {product.allergens.map((a, i) => (
                <View key={i} style={styles.allergenChip}>
                  <Text style={styles.allergenChipText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Origin & Geography */}
        {((product.origins ?? []).length > 0 || (product.manufacturing_places ?? []).length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Origin & Distribution</Text>
            {(product.origins ?? []).length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ingredient Origin</Text>
                <Text style={styles.infoValue}>{product.origins.join(', ')}</Text>
              </View>
            )}
            {(product.manufacturing_places ?? []).length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Made in</Text>
                <Text style={styles.infoValue}>{product.manufacturing_places.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Ingredients Analysis */}
        {(product.ingredients_analysis ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingredients Analysis</Text>
            <View style={styles.chipsRow}>
              {product.ingredients_analysis.map((a, i) => (
                <View key={i} style={styles.analysisChip}>
                  <Text style={styles.analysisChipText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Images */}
        {(product.images ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {product.images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.productImage} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Safer Alternatives */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Safer Alternatives</Text>
            {!isAIPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>AI Premium</Text>
              </View>
            )}
          </View>
          {isAIPremium
            ? renderDiscoveryAlternatives()
            : renderFreeAlternatives()
          }
          {!isAIPremium && (
            <TouchableOpacity style={styles.upgradeTeaser} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
              <View style={styles.teaserText}>
                <Text style={styles.teaserTitle}>Upgrade to AI Premium</Text>
                <Text style={styles.teaserSub}>AI-powered alternatives with real prices and vector similarity matching</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Where to Buy */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="cart-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Where to Buy</Text>
            {!isAIPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>AI Premium</Text>
              </View>
            )}
          </View>

          {isAIPremium && discoveryStatus === 'loading' && (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />
          )}

          {isAIPremium && discoveryStatus === 'done' && discovery && (
            <>
              {/* Crowd-sourced prices */}
              {discovery.prices.length > 0 && (
                <>
                  <Text style={styles.sectionSubtitle}>Reported Prices</Text>
                  {discovery.prices.map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.listingRow}
                      onPress={() => handlePriceClick(p)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.listingInfo}>
                        <Text style={styles.shopName}>{p.shop_name}</Text>
                        {p.distance_km != null && (
                          <Text style={styles.distanceText}>{p.distance_km} km away</Text>
                        )}
                      </View>
                      <Text style={styles.listingPrice}>{p.price.toFixed(2)} {p.currency}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Web search results */}
              {discovery.search_results.length > 0 && (
                <>
                  <Text style={[styles.sectionSubtitle, discovery.prices.length > 0 && { marginTop: 12 }]}>Find Online</Text>
                  {discovery.search_results.map((r, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.searchResultRow}
                      onPress={() => handleSearchClick(r.url, r.title)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultTitle} numberOfLines={1}>{r.title}</Text>
                        {r.snippet ? (
                          <Text style={styles.searchResultSnippet} numberOfLines={2}>{r.snippet}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {discovery.prices.length === 0 && discovery.search_results.length === 0 && (
                <Text style={styles.emptyNote}>No price data available yet for this product.</Text>
              )}
            </>
          )}

          {isAIPremium && discoveryStatus === 'error' && (
            <Text style={styles.emptyNote}>Could not load price data. Please try again.</Text>
          )}

          {!isAIPremium && (
            <TouchableOpacity style={styles.upgradeTeaser} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
              <View style={styles.teaserText}>
                <Text style={styles.teaserTitle}>Upgrade to AI Premium</Text>
                <Text style={styles.teaserSub}>Real prices from Czech shops + web search, all in one place</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md },
  loadingText: { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizes.md },
  topNav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  navButton: { padding: theme.spacing.sm },
  navTitle: {
    flex: 1, textAlign: 'center', color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const,
    marginHorizontal: theme.spacing.sm,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  backText: { color: theme.colors.primary, fontSize: theme.typography.fontSizes.md },
  content: { paddingBottom: theme.spacing.xxl },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 4 },
  productName: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const, color: theme.colors.text },
  brand: { fontSize: theme.typography.fontSizes.md, color: theme.colors.textSecondary },
  barcode: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textLight },
  scoreSection: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  scoreNumber: { fontSize: theme.typography.fontSizes.xxl, fontWeight: '700' as const },
  scoreGrade: { fontSize: theme.typography.fontSizes.xl, fontWeight: '700' as const },
  scoreLabelText: { fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const },
  disclaimerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.small, paddingHorizontal: theme.spacing.sm, paddingVertical: 4, marginTop: theme.spacing.xs, gap: 4, maxWidth: 280 },
  disclaimerText: { fontSize: 11, color: theme.colors.textSecondary, flexShrink: 1 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.large, padding: theme.spacing.md, marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  cardTitle: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.text, marginBottom: theme.spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.sm },
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
  showMoreText: { color: theme.colors.primary, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const, marginTop: theme.spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  allergenChip: { backgroundColor: theme.colors.error + '22', borderRadius: theme.borderRadius.round, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  allergenChipText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const },
  analysisChip: { backgroundColor: theme.colors.warning + '22', borderRadius: theme.borderRadius.round, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  analysisChipText: { color: theme.colors.warning, fontSize: theme.typography.fontSizes.sm, fontWeight: '500' as const },
  productImage: { width: 140, height: 140, borderRadius: theme.borderRadius.medium, marginRight: theme.spacing.sm },
  infoRow: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 4 },
  infoLabel: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  infoValue: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl },
  errorText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.md, textAlign: 'center' },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.medium },
  retryText: { color: theme.colors.text, fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const },
  premiumBadge: { backgroundColor: '#9C27B022', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  premiumBadgeText: { color: '#9C27B0', fontSize: 10, fontWeight: '700' as const },
  upgradeTeaser: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary + '11', borderRadius: theme.borderRadius.medium, padding: theme.spacing.md, marginTop: theme.spacing.sm },
  teaserText: { flex: 1 },
  teaserTitle: { fontSize: theme.typography.fontSizes.sm, fontWeight: '700' as const, color: theme.colors.text },
  teaserSub: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 2 },
  explanationText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, fontStyle: 'italic' },
  altCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  altGrade: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  altGradeText: { color: '#fff', fontWeight: '700' as const, fontSize: 14 },
  altInfo: { flex: 1 },
  altName: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  altReason: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 2 },
  altPrice: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.primary, marginTop: 2, fontWeight: '500' as const },
  altRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  altScore: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.textSecondary },
  emptyNote: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
  sectionSubtitle: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: theme.spacing.xs },
  listingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  listingInfo: { gap: 2 },
  shopName: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  distanceText: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary },
  listingPrice: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.primary },
  searchResultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  searchResultInfo: { flex: 1 },
  searchResultTitle: { fontSize: theme.typography.fontSizes.sm, fontWeight: '600' as const, color: theme.colors.text },
  searchResultSnippet: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 2 },
});

export default ProductDetailScreen;
