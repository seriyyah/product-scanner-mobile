import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';

import { theme } from '@/constants/theme';
import {
  ATTRIBUTIONS,
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

const DOCUMENTS: Record<string, LegalDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  attributions: ATTRIBUTIONS,
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
  const document = DOCUMENTS[route.params?.document] ?? PRIVACY_POLICY;

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
