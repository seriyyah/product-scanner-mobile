import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { scannerRepository } from '@/services/apiService';
import { ScanHistoryItem } from '@/types';
import { gradeColor } from '@/utils/safetyColors';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { state } = useAuth();
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = state.user?.first_name || state.user?.firstName || '';

  const loadRecentScans = useCallback(async () => {
    try {
      const history = await scannerRepository.getScanHistory(1, 3);
      setRecentScans(history.items);
    } catch {
      setRecentScans([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      setIsLoading(true);
      loadRecentScans();
    }
  }, [isFocused, loadRecentScans]);

  const handleRefresh = (): void => {
    setIsRefreshing(true);
    loadRecentScans();
  };

  const handleScanPress = (): void => {
    navigation.navigate('Scanner');
  };

  const handleViewAll = (): void => {
    navigation.navigate('History');
  };

  const handleItemPress = (item: ScanHistoryItem): void => {
    navigation.navigate('ProductDetail', { barcode: item.barcode });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScanItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.gradeCircle, { backgroundColor: gradeColor(item.safety_grade) }]}>
        <Text style={styles.gradeText}>{item.safety_grade}</Text>
      </View>
      <View style={styles.scanItemInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
        {item.brand ? (
          <Text style={styles.brandName} numberOfLines={1}>{item.brand}</Text>
        ) : null}
        <Text style={styles.scanDate}>{formatDate(item.scanned_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={recentScans}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={() => (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  {firstName ? `Hello, ${firstName}!` : 'Hello!'}
                </Text>
                <Text style={styles.headerSubtitle}>What would you like to scan today?</Text>
              </View>
              <View style={styles.logoIcon}>
                <Ionicons name="scan" size={28} color={theme.colors.primary} />
              </View>
            </View>

            {/* Scan button */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-circle" size={48} color={theme.colors.text} />
              <Text style={styles.scanButtonText}>Scan Product</Text>
              <Text style={styles.scanButtonSubtext}>Point your camera at any barcode</Text>
            </TouchableOpacity>

            {/* Recent scans header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {recentScans.length > 0 && (
                <TouchableOpacity onPress={handleViewAll} activeOpacity={0.8}>
                  <Text style={styles.viewAll}>View all</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loader}
              />
            )}
          </>
        )}
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "Scan Product" to get started
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.large,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  scanButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    marginTop: theme.spacing.sm,
  },
  scanButtonSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: theme.typography.fontSizes.sm,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  viewAll: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '500' as const,
  },
  loader: {
    marginVertical: theme.spacing.lg,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
  },
  gradeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  gradeText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '700' as const,
  },
  scanItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  brandName: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scanDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;
