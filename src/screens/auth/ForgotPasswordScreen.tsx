import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '@/constants/theme';

const ForgotPasswordScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Forgot Password Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.lg,
  },
});

export default ForgotPasswordScreen;
