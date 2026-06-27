/**
 * Reusable Button Component
 * Supports multiple variants, sizes, and states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { IButtonProps } from '@/types';
import theme from '@/constants/theme';

const Button: React.FC<IButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon: _icon,
}) => {
  // Determine button styles based on variant
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      ...styles.base,
      ...styles[size],
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles.disabled,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          ...styles.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          ...styles.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          ...styles.outline,
        };
      case 'ghost':
        return {
          ...baseStyle,
          ...styles.ghost,
        };
      default:
        return {
          ...baseStyle,
          ...styles.primary,
        };
    }
  };

  // Determine text styles based on variant
  const getTextStyle = (): TextStyle => {
    const baseTextStyle = {
      ...styles.textBase,
      ...styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    };

    if (disabled) {
      return {
        ...baseTextStyle,
        color: theme.colors.textLight,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: theme.colors.text,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: theme.colors.text,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: theme.colors.primary,
        };
      default:
        return {
          ...baseTextStyle,
          color: theme.colors.text,
        };
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.text}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.small,
  },
  
  // Size variants
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56,
  },
  
  // Color variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: theme.colors.borderLight,
    opacity: 0.6,
  },
  
  // Text styles
  textBase: {
    fontWeight: theme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: theme.typography.fontSizes.sm,
  },
  textMedium: {
    fontSize: theme.typography.fontSizes.md,
  },
  textLarge: {
    fontSize: theme.typography.fontSizes.lg,
  },
});

export default Button;