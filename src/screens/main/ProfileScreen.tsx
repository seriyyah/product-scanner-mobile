import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { userRepository, subscriptionRepository, SubscriptionStatus } from '@/services/apiService';
import { UserProfile, UserRole } from '@/types';
import theme from '@/constants/theme';
import TextInput from '@/components/forms/TextInput';
import Button from '@/components/common/Button';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  bio: string;
}

const profileSchema = yup.object().shape({
  firstName: yup.string().min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: yup.string(),
  bio: yup.string(),
});

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: theme.colors.primary },
  premium_user: { label: 'Premium', color: '#FFD700' },
  ai_premium: { label: 'AI Premium', color: '#9C27B0' },
  free_user: { label: 'Free', color: theme.colors.textSecondary },
  guest: { label: 'Guest', color: theme.colors.textSecondary },
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const { state, logout } = useAuth();

  const role = (state.user?.role || 'free_user') as UserRole;
  const badge = ROLE_BADGE[role] || ROLE_BADGE.free_user;

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema) as any,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (): Promise<void> => {
    const userId = state.user?.id;
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [data, sub] = await Promise.allSettled([
        userRepository.getUserProfile(userId),
        subscriptionRepository.getStatus(),
      ]);
      if (data.status === 'fulfilled') {
        setProfile(data.value);
        reset({
          firstName: data.value.first_name || '',
          lastName: data.value.last_name || '',
          phoneNumber: data.value.phone_number || '',
          bio: data.value.bio || '',
        });
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
      if (sub.status === 'fulfilled') setSubscription(sub.value);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    if (!state.user?.id) return;
    setIsSaving(true);
    try {
      const updated = await userRepository.updateUserProfile(state.user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        bio: data.bio,
      });
      setProfile(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = (): void => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name || 'User'
    : state.user?.first_name || 'User';

  const initials = displayName
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            <View style={[styles.badge, { backgroundColor: badge.color + '22' }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={styles.email}>{state.user?.email || ''}</Text>
        </View>

        {/* Edit form or info view */}
        {isEditing ? (
          <View style={styles.section}>
            <TextInput
              label="First Name"
              name="firstName"
              control={control}
              disabled={isSaving}
              error={errors.firstName?.message}
            />
            <TextInput
              label="Last Name"
              name="lastName"
              control={control}
              disabled={isSaving}
              error={errors.lastName?.message}
            />
            <TextInput
              label="Phone Number"
              name="phoneNumber"
              control={control}
              placeholder="+1234567890"
              keyboardType="phone-pad"
              disabled={isSaving}
              error={errors.phoneNumber?.message}
            />
            <TextInput
              label="Bio"
              name="bio"
              control={control}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              disabled={isSaving}
              error={errors.bio?.message}
            />
            <View style={styles.buttonRow}>
              <Button
                title={isSaving ? 'Saving...' : 'Save'}
                onPress={handleSubmit(onSubmit)}
                loading={isSaving}
                disabled={isSaving}
                variant="primary"
                size="medium"
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Cancel"
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
                variant="outline"
                size="medium"
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile?.phone_number || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>{profile?.bio || 'No bio added'}</Text>
            </View>
            {profile?.created_at ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member since</Text>
                <Text style={styles.infoValue}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
            <Button
              title="Edit Profile"
              onPress={() => setIsEditing(true)}
              variant="primary"
              size="medium"
            />
          </View>
        )}

        {/* Settings list */}
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={22} color={theme.colors.primary} />
            <View style={styles.settingsLabelCol}>
              <Text style={styles.settingsLabel}>Subscription</Text>
              {subscription?.expires_at && subscription.tier !== 'free' ? (
                <Text style={styles.settingsSubLabel}>
                  Renews {new Date(subscription.expires_at).toLocaleDateString()}
                </Text>
              ) : subscription?.tier === 'free' ? (
                <Text style={styles.settingsSubLabel}>20 scans / hour</Text>
              ) : null}
            </View>
            <View style={styles.settingsRight}>
              {role === 'admin' || role === 'super_admin' ? (
                <Text style={styles.settingsValue}>Admin — Full Access</Text>
              ) : (
                <Text style={[styles.settingsValue, { color: badge.color }]}>{badge.label}</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            size="large"
          />
        </View>
      </ScrollView>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  initials: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  displayName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  badgeText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: '600' as const,
  },
  email: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  buttonSpacer: {
    width: theme.spacing.md,
  },
  settingsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  settingsLabelCol: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  settingsSubLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  settingsValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default ProfileScreen;
