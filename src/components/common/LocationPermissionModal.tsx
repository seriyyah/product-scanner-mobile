import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import theme from '@/constants/theme';
import { useApp, UserLocation } from '@/contexts/AppContext';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const LocationPermissionModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const { t } = useTranslation();
  const { setLocation, markLocationAsked } = useApp();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async (): Promise<void> => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await markLocationAsked();

      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const parts = [place?.city, place?.country].filter(Boolean);
        const label = parts.length > 0 ? parts.join(', ') : undefined;
        const locData: UserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (label) locData.label = label;
        await setLocation(locData);
      } else {
        Alert.alert(t('common.error'), t('onboarding.locationDenied'));
      }
    } catch {
      // Permission dialog dismissed or location unavailable — not fatal
    } finally {
      setRequesting(false);
      onDismiss();
    }
  };

  const handleSkip = async (): Promise<void> => {
    await markLocationAsked();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            <Ionicons name="location" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>
          <Text style={styles.body}>{t('onboarding.locationBody')}</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAllow}
            disabled={requesting}
            activeOpacity={0.8}
          >
            {requesting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.primaryBtnText}>{t('onboarding.locationAllow')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
            <Text style={styles.skipText}>{t('onboarding.locationSkip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700' as const,
    fontSize: theme.typography.fontSizes.md,
  },
  skipBtn: {
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
  },
});

export default LocationPermissionModal;
