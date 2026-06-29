import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { MainStackParamList, RatingBreakdown } from '@/types';
import { gradeColor, gradeLabel, novaLabel } from '@/utils/safetyColors';

type ScanResultRouteProp = RouteProp<MainStackParamList, 'ScanResult'>;

const ScanResultScreen: React.FC = () => {
  const route = useRoute<ScanResultRouteProp>();
  const navigation = useNavigation<any>();
  const { scanResult } = route.params;

  // Product not found — show researching state
  if (scanResult.researching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.researchingContainer}>
          <Ionicons name="search-circle-outline" size={80} color={theme.colors.primary} />
          <Text style={styles.researchingTitle}>Product Not Found Yet</Text>
          <Text style={styles.researchingText}>
            {scanResult.message ?? "We don't recognise this barcode yet. We're researching it — check your history in a few minutes."}
          </Text>
          <TouchableOpacity style={styles.scanAgainBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Scanner' })} activeOpacity={0.8}>
            <Ionicons name="scan-outline" size={20} color={theme.colors.text} />
            <Text style={styles.scanAgainBtnText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { product, rating_breakdown } = scanResult;
  const safety_score: number = scanResult.safety_score ?? 0;
  const safety_grade: string = scanResult.safety_grade ?? '?';
  const warnings: string[] = scanResult.warnings ?? [];

  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const INGREDIENT_PREVIEW = 5;

  const handleScanAnother = (): void => {
    navigation.navigate('MainTabs', { screen: 'Scanner' });
  };

  const scoreColor = gradeColor(safety_grade);

  const renderNutritionRow = (label: string, value?: number, unit = 'g') => {
    if (value === undefined || value === null) return null;
    return (
      <View style={styles.nutritionRow} key={label}>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>
          {value.toFixed(1)} {unit}
        </Text>
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
          <Text style={styles.breakdownScore}>{(rb.ecoscore.score ?? 0).toFixed(0)}</Text>
        </View>
      )}
    </View>
  );

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
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {safety_score.toFixed(0)}
            </Text>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>{safety_grade}</Text>
          </View>
          <Text style={[styles.gradeLabel, { color: scoreColor }]}>
            Grade {safety_grade} — {gradeLabel(safety_grade)}
          </Text>
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

        {/* Rating Breakdown */}
        {rating_breakdown && renderBreakdown(rating_breakdown)}

        {/* Nutrition Facts */}
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
            {(showAllIngredients ? (product.ingredients ?? []) : (product.ingredients ?? []).slice(0, INGREDIENT_PREVIEW)).map((ing, i) => (
              <Text key={i} style={styles.ingredientText}>• {ing}</Text>
            ))}
            {(product.ingredients ?? []).length > INGREDIENT_PREVIEW && (
              <TouchableOpacity
                onPress={() => setShowAllIngredients((v) => !v)}
                activeOpacity={0.8}
                style={styles.showMoreButton}
              >
                <Text style={styles.showMoreText}>
                  {showAllIngredients
                    ? 'Show less'
                    : `Show all ${product.ingredients.length} ingredients`}
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
            <Text style={styles.cardTitle}>Ingredients Analysis</Text>
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

        {/* Scan Another Button */}
        <TouchableOpacity
          style={styles.scanAnotherButton}
          onPress={handleScanAnother}
          activeOpacity={0.8}
        >
          <Ionicons name="scan" size={20} color={theme.colors.text} />
          <Text style={styles.scanAnotherText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  researchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  researchingTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
  },
  researchingText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  scanAgainBtnText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTextContainer: {
    gap: 4,
  },
  productName: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  brand: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  barcode: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scoreNumber: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
  },
  scoreGrade: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
  },
  gradeLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  warningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '22',
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  warningText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  breakdownLabel: {
    width: 90,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  breakdownScore: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  breakdownMeta: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  riskText: {
    color: theme.colors.error,
  },
  gradeChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.small,
    minWidth: 28,
    alignItems: 'center',
  },
  gradeChipText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '700' as const,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  nutritionLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  nutritionValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  ingredientText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 22,
  },
  showMoreButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  allergenChip: {
    backgroundColor: theme.colors.error + '22',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  allergenChipText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
  },
  analysisChip: {
    backgroundColor: theme.colors.warning + '22',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  analysisChipText: {
    color: theme.colors.warning,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
  },
  productImage: {
    width: 140,
    height: 140,
    borderRadius: theme.borderRadius.medium,
    marginRight: theme.spacing.sm,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.sm,
  },
  scanAnotherText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
});

export default ScanResultScreen;
