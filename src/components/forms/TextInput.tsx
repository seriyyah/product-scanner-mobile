/**
 * Reusable TextInput Component with Validation
 * Includes error handling and accessibility features
 */

import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { IInputProps } from '@/types';
import theme from '@/constants/theme';

const TextInput: React.FC<IInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  required = false,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = (): void => {
    setIsFocused(true);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = (): void => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer];
    
    if (isFocused) {
      baseStyle.push(styles.inputContainerFocused);
    }
    
    if (error) {
      baseStyle.push(styles.inputContainerError);
    }
    
    if (disabled) {
      baseStyle.push(styles.inputContainerDisabled);
    }
    
    return baseStyle;
  };

  const getLabelStyle = () => {
    const baseStyle = [styles.label];
    
    if (required) {
      baseStyle.push(styles.labelRequired);
    }
    
    if (error) {
      baseStyle.push(styles.labelError);
    }
    
    return baseStyle;
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={getLabelStyle()}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      
      {/* Input Container */}
      <View style={getInputContainerStyle()}>
        <RNTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoCorrect={false}
          spellCheck={false}
          // Accessibility props
          accessibilityLabel={label}
          accessibilityHint={error || placeholder}
          accessibilityState={{
            disabled,
            selected: isFocused,
          }}
        />
        
        {/* Password visibility toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error Message */}
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  
  label: {
    fontSize: theme.typography.fontSizes.sm,
        fontWeight: '500' as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  
  labelRequired: {
    // Additional styles for required fields if needed
  },
  
  labelError: {
    color: theme.colors.error,
  },
  
  requiredAsterisk: {
    color: theme.colors.error,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
  },
  
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  
  inputContainerDisabled: {
    backgroundColor: theme.colors.borderLight,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.fontSizes.md,
  },
  
  passwordToggle: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  passwordToggleText: {
    fontSize: theme.typography.fontSizes.lg,
  },
  
  errorText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
      fontWeight: '700' as any,
  },
});

export default TextInput;