import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text as RNText,
  Alert,
} from 'react-native';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/contexts/AuthContext';
import { authRepository } from '@/services/apiService';
import theme from '@/constants/theme';
import TextInput from '@/components/forms/TextInput';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
}

const profileSchema = yup.object().shape({
  firstName: yup.string().min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters'),
  email: yup.string().email('Invalid email'),
  phoneNumber: yup.string(),
  bio: yup.string(),
});

const ProfileScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const { state, logout } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userId = (state.user as any)?.id;
    if (!userId) {
      setIsLoading(false);
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await authRepository.getUserProfile(userId);
      setProfileData(profile);
      reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phoneNumber: profile.phone_number || '',
        bio: profile.bio || '',
      });
    } catch (error: any) {
      // If profile doesn't exist (404), create it from login data
      if (error.response?.status === 404 || error.statusCode === 404) {
        try {
          const user = state.user as any;
          const newProfile = await authRepository.createUserProfile({
            user_id: userId,
            email: user?.email || '',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            bio: '',
            phone_number: '',
            avatar_url: user?.avatar_url || '',
          });
          setProfileData(newProfile);
          reset({
            firstName: newProfile.first_name || '',
            lastName: newProfile.last_name || '',
            email: newProfile.email || '',
            phoneNumber: newProfile.phone_number || '',
            bio: newProfile.bio || '',
          });
        } catch (createErr) {
          Alert.alert('Error', 'Failed to create profile');
        }
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!state.user?.id) return;
    setIsSaving(true);
    try {
      await authRepository.updateUserProfile(state.user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        bio: data.bio,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      await loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <RNText style={styles.initials}>
            {profileData?.first_name?.[0]}{profileData?.last_name?.[0]}
          </RNText>
        </View>
        <RNText style={styles.fullName}>
          {profileData?.full_name}
        </RNText>
        <RNText style={styles.email}>{profileData?.email}</RNText>
      </View>

      {isEditing ? (
        <View style={styles.form}>
          <TextInput
            name="firstName"
            control={control}
            label="First Name"
            editable={!isSaving}
            error={errors.firstName?.message}
          />

          <TextInput
            name="lastName"
            control={control}
            label="Last Name"
            editable={!isSaving}
            error={errors.lastName?.message}
          />

          <TextInput
            name="email"
            control={control}
            label="Email"
            editable={false}
          />

          <TextInput
            name="phoneNumber"
            control={control}
            label="Phone Number"
            placeholder="+1234567890"
            editable={!isSaving}
            error={errors.phoneNumber?.message}
          />

          <TextInput
            name="bio"
            control={control}
            label="Bio"
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            editable={!isSaving}
            error={errors.bio?.message}
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              <RNText style={styles.buttonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </RNText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
              disabled={isSaving}
            >
              <RNText style={styles.cancelButtonText}>Cancel</RNText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <RNText style={styles.label}>Phone</RNText>
            <RNText style={styles.value}>
              {profileData?.phone_number || 'Not set'}
            </RNText>
          </View>

          <View style={styles.infoRow}>
            <RNText style={styles.label}>Bio</RNText>
            <RNText style={styles.value}>
              {profileData?.bio || 'No bio added'}
            </RNText>
          </View>

          <View style={styles.infoRow}>
            <RNText style={styles.label}>Member Since</RNText>
            <RNText style={styles.value}>
              {new Date(profileData?.created_at).toLocaleDateString()}
            </RNText>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <RNText style={styles.buttonText}>Edit Profile</RNText>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <RNText style={styles.logoutButtonText}>Logout</RNText>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarPlaceholder: {
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
    fontWeight: '700' as any,
    color: theme.colors.text,
  },
  fullName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoSection: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as any,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as any,
  },
  logoutButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as any,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});

export default ProfileScreen;
