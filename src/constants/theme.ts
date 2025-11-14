/**
 * Theme constants following dark theme with warm color palette
 * Implements consistent design system across the application
 */

export interface ITheme {
  colors: {
    // Primary warm colors
    primary: string;
    primaryDark: string;
    primaryLight: string;
    
    // Secondary warm accents
    secondary: string;
    accent: string;
    
    // Background colors (dark theme)
    background: string;
    surface: string;
    card: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textLight: string;
    
    // Status colors with warm tints
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Interactive colors
    border: string;
    borderLight: string;
    shadow: string;
    overlay: string;
    
    // Safety rating colors
    safetyGood: string;
    safetyMedium: string;
    safetyPoor: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    round: number;
  };
  typography: {
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeights: {
      light: '300';
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  shadows: {
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const themeObject: ITheme = {
  colors: {
    // Primary warm orange/amber palette
    primary: '#FF6B35', // Vibrant orange-red
    primaryDark: '#D84315', // Darker orange-red
    primaryLight: '#FF8F65', // Lighter orange

    // Secondary warm colors
    secondary: '#FFA726', // Golden amber
    accent: '#FFB74D', // Light amber

    // Dark theme backgrounds
    background: '#121212', // Pure dark background
    surface: '#1E1E1E', // Card surfaces
    card: '#2A2A2A', // Interactive cards

    // Text colors optimized for dark theme
    text: '#FFFFFF', // Primary white text
    textSecondary: '#B3B3B3', // Secondary gray text
    textLight: '#999999', // Light gray text

    // Status colors with warm undertones
    success: '#4CAF50', // Green with slight warm tint
    warning: '#FF9800', // Warm orange warning
    error: '#F44336', // Warm red error
    info: '#29B6F6', // Cool blue for balance

    // Interactive elements
    border: '#404040', // Subtle borders
    borderLight: '#2A2A2A', // Lighter borders
    shadow: '#000000', // Pure black shadows
    overlay: 'rgba(0, 0, 0, 0.5)', // Dark overlay

    // Safety rating colors
    safetyGood: '#66BB6A', // Green
    safetyMedium: '#FFA726', // Amber/Orange
    safetyPoor: '#EF5350', // Red-orange
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    round: 9999,
  },

  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    fontWeights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Ensure fontWeights are plain objects for React Navigation compatibility
const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Create final theme object with explicitly defined fontWeights
const finalTheme: ITheme = {
  ...themeObject,
  typography: {
    ...themeObject.typography,
    fontWeights,
  },
};

export const theme = finalTheme;
export default finalTheme;
