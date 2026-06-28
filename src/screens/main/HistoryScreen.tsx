import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { scannerRepository } from '@/services/apiService';
import { ScanHistoryItem } from '@/types';
import { gradeColor } from '@/utils/safetyColors';

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const PER_PAGE = 20;

  const loadHistory = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setError('');
    try {
      const data = await scannerRepository.getScanHistory(pageNum, PER_PAGE);
      const newItems = data.scans ?? [];
      if (reset || pageNum === 1) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }
      setHasMore(data.total > pageNum * PER_PAGE);
      setPage(pageNum);
    } catch {
      setError('Failed to load history. Tap to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(1, true);
  }, [loadHistory]);

  const handleRefresh = (): void => {
    setIsRefreshing(true);
    loadHistory(1, true);
  };

  const handleLoadMore = (): void => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      loadHistory(page + 1);
    }
  };

  const handleItemPress = (item: ScanHistoryItem): void => {
    navigation.navigate('ProductDetail', { barcode: item.barcode });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.gradeCircle, { backgroundColor: gradeColor(item.safety_grade) }]}>
        <Text style={styles.gradeText}>{item.safety_grade}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
        {item.brand ? (
          <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
        ) : null}
        <Text style={styles.date}>{formatDate(item.scanned_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.errorContainer} onPress={() => loadHistory(1, true)} activeOpacity={0.8}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>Your scan history will appear here</Text>
          </View>
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
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
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  brand: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.md,
    textAlign: 'center',
  },
  retryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;
