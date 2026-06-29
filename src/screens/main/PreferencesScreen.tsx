import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { preferencesRepository, UserPreferences } from '@/services/apiService';

const DIETARY_OPTIONS = [
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'gluten-free', label: 'Gluten-free' },
  { key: 'halal', label: 'Halal' },
  { key: 'kosher', label: 'Kosher' },
  { key: 'lactose-free', label: 'Lactose-free' },
  { key: 'nut-free', label: 'Nut-free' },
  { key: 'low-sugar', label: 'Low sugar' },
];

const ALLERGEN_OPTIONS = [
  { key: 'milk', label: 'Milk' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'tree-nuts', label: 'Tree nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'wheat', label: 'Wheat' },
  { key: 'soy', label: 'Soy' },
  { key: 'sesame', label: 'Sesame' },
  { key: 'celery', label: 'Celery' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'sulphites', label: 'Sulphites' },
];

const CURRENCY_OPTIONS = ['CZK', 'EUR', 'USD'];
const LANGUAGE_OPTIONS = [
  { key: 'cs', label: 'Czech' },
  { key: 'en', label: 'English' },
];

const PreferencesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAuth();
  const userId = state.user?.id;

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await preferencesRepository.get(userId);
      setPrefs(data);
    } catch {
      Alert.alert('Error', 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const patch = (update: Partial<UserPreferences>): void => {
    setPrefs((p) => p ? { ...p, ...update } : p);
    setIsDirty(true);
  };

  const toggleChip = (field: 'dietary_restrictions' | 'allergens', key: string): void => {
    if (!prefs) return;
    const current = prefs[field];
    const next = current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
    patch({ [field]: next });
  };

  const save = async (): Promise<void> => {
    if (!userId || !prefs) return;
    setIsSaving(true);
    try {
      const updated = await preferencesRepository.update(userId, prefs);
      setPrefs(updated);
      setIsDirty(false);
      Alert.alert('Saved', 'Your preferences have been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!prefs) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Preferences</Text>
        <TouchableOpacity
          onPress={save}
          activeOpacity={0.8}
          style={[styles.navBtn, !isDirty && styles.navBtnDisabled]}
          disabled={!isDirty || isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={theme.colors.primary} />
            : <Text style={[styles.saveText, !isDirty && styles.saveTextDim]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Dietary restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionSub}>Used to personalise safety ratings and AI recommendations</Text>
          <View style={styles.chips}>
            {DIETARY_OPTIONS.map((opt) => {
              const active = prefs.dietary_restrictions.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleChip('dietary_restrictions', opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Allergens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens to Avoid</Text>
          <Text style={styles.sectionSub}>Products containing these will be flagged with a warning</Text>
          <View style={styles.chips}>
            {ALLERGEN_OPTIONS.map((opt) => {
              const active = prefs.allergens.includes(opt.key);
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipAllergen, active && styles.chipActive]}
                  onPress={() => toggleChip('allergens', opt.key)}
                  activeOpacity={0.7}
                >
                  {active && <Ionicons name="warning" size={12} color="#fff" />}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Language</Text>
            <View style={styles.segmented}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  style={[styles.segmentBtn, prefs.language === lang.key && styles.segmentBtnActive]}
                  onPress={() => patch({ language: lang.key })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, prefs.language === lang.key && styles.segmentTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Currency</Text>
            <View style={styles.segmented}>
              {CURRENCY_OPTIONS.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.segmentBtn, prefs.default_currency === cur && styles.segmentBtnActive]}
                  onPress={() => patch({ default_currency: cur })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, prefs.default_currency === cur && styles.segmentTextActive]}>
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.row}>
            <View style={styles.rowLabelCol}>
              <Text style={styles.rowLabel}>Analytics</Text>
              <Text style={styles.rowSub}>Help improve the app with anonymous usage data</Text>
            </View>
            <Switch
              value={prefs.privacy_analytics}
              onValueChange={(v) => patch({ privacy_analytics: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLabelCol}>
              <Text style={styles.rowLabel}>Marketing</Text>
              <Text style={styles.rowSub}>Receive personalised offers and news</Text>
            </View>
            <Switch
              value={prefs.privacy_marketing}
              onValueChange={(v) => patch({ privacy_marketing: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  navBtn: { width: 48, height: 40, justifyContent: 'center', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navTitle: { fontSize: theme.typography.fontSizes.lg, fontWeight: '700' as const, color: theme.colors.text },
  saveText: { fontSize: theme.typography.fontSizes.md, fontWeight: '600' as const, color: theme.colors.primary },
  saveTextDim: { color: theme.colors.textSecondary },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  section: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.md,
  },
  sectionTitle: { fontSize: theme.typography.fontSizes.md, fontWeight: '700' as const, color: theme.colors.text },
  sectionSub: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: -8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipAllergen: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  chipText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' as const },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  rowLabelCol: { flex: 1, marginRight: theme.spacing.md },
  rowLabel: { fontSize: theme.typography.fontSizes.md, color: theme.colors.text },
  rowSub: { fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: 2 },
  segmented: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: theme.colors.background },
  segmentBtnActive: { backgroundColor: theme.colors.primary },
  segmentText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary },
  segmentTextActive: { color: '#fff', fontWeight: '600' as const },
});

export default PreferencesScreen;
