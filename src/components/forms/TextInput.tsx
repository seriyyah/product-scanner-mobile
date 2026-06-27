/**
 * Reusable TextInput Component
 * Supports both standalone (value/onChangeText) and react-hook-form Controller (name/control) patterns
 */

import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { Controller } from 'react-hook-form';
import theme from '@/constants/theme';

export interface TextInputProps {
  label: string;
  // Standalone mode
  value?: string;
  onChangeText?: (text: string) => void;
  // react-hook-form mode
  name?: string;
  control?: any;
  rules?: any;
  // Common
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  // Extra props accepted but ignored (for compatibility)
  rightIcon?: string;
  onRightIconPress?: () => void;
}

function InnerInput(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const {
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
    editable = true,
    multiline = false,
    numberOfLines = 1,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isDisabled = disabled || !editable;

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error ? styles.inputContainerError : null,
    isDisabled ? styles.inputContainerDisabled : null,
    multiline ? styles.inputContainerMultiline : null,
  ];

  const labelStyle = [
    styles.label,
    error ? styles.labelError : null,
  ];

  return (
    <View style={styles.container}>
      <Text style={labelStyle}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>

      <View style={inputContainerStyle}>
        <RNTextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!isDisabled}
          autoCorrect={false}
          spellCheck={false}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled, selected: isFocused }}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible((v) => !v)}
            activeOpacity={0.8}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.passwordToggleText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    name,
    control,
    rules,
    rightIcon,
    onRightIconPress,
    ...rest
  } = props;

  // Controlled (react-hook-form) path
  if (control !== undefined && name !== undefined) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value }, fieldState }) => (
          <InnerInput
            {...rest}
            value={value ?? ''}
            onChangeText={onChange}
            error={props.error || fieldState.error?.message}
          />
        )}
      />
    );
  }

  // Standalone path
  return (
    <InnerInput
      {...rest}
      value={props.value ?? ''}
      onChangeText={props.onChangeText || (() => {})}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.borderLight,
    opacity: 0.6,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    minHeight: 96,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  passwordToggle: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.primary,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontWeight: '700' as const,
  },
});

export default TextInput;
