import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';

import { theme } from '@/constants/theme';
import {
  ATTRIBUTIONS,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  type LegalDocument,
} from '@/constants/legal';

// Registered in both the auth and main stacks, so the route type is the shape
// of the params rather than a position in one navigator.
type LegalRoute = RouteProp<
  { Legal: { document: 'privacy' | 'terms' | 'attributions' } },
  'Legal'
>;

// English is the source of truth and lives in constants/legal.ts; the other
// languages live under `legalDocs` in their locale file. A translation is used
// only when it is actually there and structurally intact — a half-translated or
// malformed document falls back to English rather than rendering a legal notice
// with holes in it, which is the one failure mode worse than English text.
const DOCUMENTS: Record<string, LegalDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  attributions: ATTRIBUTIONS,
};

const isLegalDocument = (value: unknown): value is LegalDocument => {
  const doc = value as LegalDocument | undefined;
  return (
    !!doc &&
    typeof doc.title === 'string' &&
    typeof doc.intro === 'string' &&
    Array.isArray(doc.sections) &&
    doc.sections.length > 0 &&
    doc.sections.every(
      (s) => typeof s?.heading === 'string' && Array.isArray(s?.body) && s.body.length > 0,
    )
  );
};

interface Props {
  readonly route: LegalRoute;
}

/**
 * Renders the privacy notice or the terms.
 *
 * One screen for both, because they are the same shape and Apple wants both
 * reachable from inside the app — Guideline 5.1.1(i), which is the most common
 * rejection reason there is.
 */
export const LegalScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const key = route.params?.document ?? 'privacy';
  const fallback = DOCUMENTS[key] ?? PRIVACY_POLICY;
  const translated = t(`legalDocs.${key}`, { returnObjects: true, defaultValue: '' });
  const chosen = isLegalDocument(translated) ? translated : fallback;

  // Translations carry {{email}} rather than the address itself, so changing
  // LEGAL_CONTACT_EMAIL does not silently leave twenty locale files pointing at
  // an address that no longer exists.
  const document: LegalDocument = {
    ...chosen,
    sections: chosen.sections.map((section) => ({
      ...section,
      body: section.body.map((line) => line.replace(/{{email}}/g, LEGAL_CONTACT_EMAIL)),
    })),
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{document.title}</Text>
        <Text style={styles.updated}>
          {t('legal.lastUpdated', 'Last updated')} {LEGAL_LAST_UPDATED}
        </Text>
        <Text style={styles.intro}>{document.intro}</Text>

        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body.map((paragraph, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.body}>{paragraph}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: '700' as const,
  },
  updated: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
    marginTop: 4,
  },
  intro: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  section: { marginTop: theme.spacing.lg },
  heading: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.sm,
  },
  bulletRow: { flexDirection: 'row', marginBottom: theme.spacing.sm },
  bullet: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.md,
    marginRight: theme.spacing.sm,
    lineHeight: 22,
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
    lineHeight: 22,
    flex: 1,
  },
});

export default LegalScreen;
