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
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { preferencesRepository, UserPreferences } from '@/services/apiService';
import { SUPPORTED_LANGUAGES } from '@/i18n';

const DIETARY_OPTIONS = [
  { key: 'vegan', i18n: 'dietary.vegan', label: 'Vegan' },
  { key: 'vegetarian', i18n: 'dietary.vegetarian', label: 'Vegetarian' },
  { key: 'gluten-free', i18n: 'dietary.glutenFree', label: 'Gluten-free' },
  { key: 'halal', i18n: 'dietary.halal', label: 'Halal' },
  { key: 'kosher', i18n: 'dietary.kosher', label: 'Kosher' },
  { key: 'lactose-free', i18n: 'dietary.lactoseFree', label: 'Lactose-free' },
  { key: 'nut-free', i18n: 'dietary.nutFree', label: 'Nut-free' },
  { key: 'low-sugar', i18n: 'dietary.lowSugar', label: 'Low sugar' },
];

const ALLERGEN_OPTIONS = [
  { key: 'milk', i18n: 'allergenOption.milk', label: 'Milk' },
  { key: 'eggs', i18n: 'allergenOption.eggs', label: 'Eggs' },
  { key: 'fish', i18n: 'allergenOption.fish', label: 'Fish' },
  { key: 'shellfish', i18n: 'allergenOption.shellfish', label: 'Shellfish' },
  { key: 'tree-nuts', i18n: 'allergenOption.treeNuts', label: 'Tree nuts' },
  { key: 'peanuts', i18n: 'allergenOption.peanuts', label: 'Peanuts' },
  { key: 'wheat', i18n: 'allergenOption.wheat', label: 'Wheat' },
  { key: 'soy', i18n: 'allergenOption.soy', label: 'Soy' },
  { key: 'sesame', i18n: 'allergenOption.sesame', label: 'Sesame' },
  { key: 'celery', i18n: 'allergenOption.celery', label: 'Celery' },
  { key: 'mustard', i18n: 'allergenOption.mustard', label: 'Mustard' },
  { key: 'sulphites', i18n: 'allergenOption.sulphites', label: 'Sulphites' },
];

// Where a person shops, which decides whether a safer alternative is one they
// can actually buy. Ordered by likelihood rather than alphabetically so the
// common answer is the first thing a thumb reaches.
const COUNTRY_OPTIONS = [
  'CZ', 'SK', 'DE', 'AT', 'PL', 'UA', 'HU', 'RO', 'HR', 'SI',
  'BG', 'GR', 'IT', 'ES', 'FR', 'NL', 'BE', 'PT', 'SE', 'DK',
  'FI', 'GB', 'IE', 'CH', 'US', 'CA',
];

const CURRENCY_OPTIONS = ['CZK', 'EUR', 'USD', 'GBP', 'PLN', 'HUF', 'RON', 'SEK', 'DKK', 'NOK', 'CHF'];

const PreferencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { state } = useAuth();
  const { setLanguage } = useApp();
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
      Alert.alert(t('common.error', 'Error'), t('preferences.loadFailed', 'Failed to load preferences'));
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
      if (prefs.language) setLanguage(prefs.language);
      Alert.alert(t('preferences.saved', 'Saved'), t('preferences.savedBody', 'Your preferences have been updated.'));
    } catch {
      Alert.alert(t('common.error', 'Error'), t('preferences.saveFailed', 'Failed to save preferences. Please try again.'));
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
        <Text style={styles.navTitle}>{t('preferences.title', 'Preferences')}</Text>
        <TouchableOpacity
          onPress={save}
          activeOpacity={0.8}
          style={[styles.navBtn, !isDirty && styles.navBtnDisabled]}
          disabled={!isDirty || isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={theme.colors.primary} />
            : <Text style={[styles.saveText, !isDirty && styles.saveTextDim]}>{t('common.save', 'Save')}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Dietary restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.dietary', 'Dietary Restrictions')}</Text>
          <Text style={styles.sectionSub}>{t('preferences.dietarySub', 'Used to personalise safety ratings and AI recommendations')}</Text>
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
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(opt.i18n, opt.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Allergens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.allergensTitle', 'Allergens to Avoid')}</Text>
          <Text style={styles.sectionSub}>{t('preferences.allergensSub', 'Products containing these will be flagged with a warning')}</Text>
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
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(opt.i18n, opt.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.appSettings', 'App Settings')}</Text>

          <View style={styles.colRow}>
            <Text style={styles.rowLabel}>{t('preferences.language', 'Language')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.chipsRow}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.segmentBtn, prefs.language === lang.code && styles.segmentBtnActive]}
                    onPress={() => patch({ language: lang.code })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, prefs.language === lang.code && styles.segmentTextActive]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.colRow}>
            <Text style={styles.rowLabel}>{t('preferences.country', 'Country')}</Text>
            <Text style={styles.rowSub}>
              {t('preferences.countrySub',
                 'So we only suggest safer products you can actually buy')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.chipsRow}>
                {COUNTRY_OPTIONS.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={[styles.segmentBtn, prefs.country === code && styles.segmentBtnActive]}
                    onPress={() => patch({ country: code })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, prefs.country === code && styles.segmentTextActive]}>
                      {code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.colRow}>
            <Text style={styles.rowLabel}>{t('preferences.currency', 'Currency')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.chipsRow}>
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
            </ScrollView>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.privacy', 'Privacy')}</Text>

          {/* Two switches, not one. Consent has to be specific: "help improve
              the app" and "be counted in figures we sell" are different
              purposes, and collecting under the first to do the second is the
              mismatch Apple rejects under Guideline 5.1.2. */}
          <View style={styles.row}>
            <View style={styles.rowLabelCol}>
              <Text style={styles.rowLabel}>{t('preferences.analytics', 'Analytics')}</Text>
              <Text style={styles.rowSub}>
                {t('preferences.analyticsSub', 'Help us improve the app. Stays with us and is never shared.')}
              </Text>
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
              <Text style={styles.rowLabel}>{t('preferences.personalisation', 'Personalised recommendations')}</Text>
              <Text style={styles.rowSub}>
                {t('preferences.personalisationSub', 'Use my scan history to learn what I buy, so the app can suggest better alternatives for me. Stays with us and is never sold.')}
              </Text>
            </View>
            <Switch
              value={prefs.privacy_personalisation ?? false}
              onValueChange={(v) => patch({ privacy_personalisation: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLabelCol}>
              <Text style={styles.rowLabel}>{t('preferences.marketing', 'Marketing')}</Text>
              <Text style={styles.rowSub}>{t('preferences.marketingSub', 'Receive personalised offers and news')}</Text>
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
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: theme.colors.background, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginRight: 6 },
  segmentBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.textSecondary },
  segmentTextActive: { color: '#fff', fontWeight: '600' as const },
  chipsRow: { flexDirection: 'row', paddingBottom: 4 },
  colRow: { paddingVertical: theme.spacing.xs },
});

export default PreferencesScreen;
