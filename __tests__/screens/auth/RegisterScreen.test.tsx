import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockRegister = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    },
    login: jest.fn(),
    logout: jest.fn(),
    register: mockRegister,
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/contexts/AppContext', () => ({
  useApp: () => ({
    location: null,
    locationAsked: true,
    locationLoaded: true,
    setLocation: jest.fn(),
    markLocationAsked: jest.fn(),
    currencyRates: null,
    convertPrice: (amount: number) => amount,
    refreshRates: jest.fn(),
    setLanguage: jest.fn(),
  }),
  AppProvider: ({ children }: any) => children,
}));


import RegisterScreen from '../../../src/screens/auth/RegisterScreen';

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getAllByText } = render(<RegisterScreen />);
    // "Create Account" appears in both title and button
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
  });

  it('shows all required form fields', () => {
    const { getByText, getAllByText } = render(<RegisterScreen />);
    // Labels have required asterisk so use regex; use getAllByText for duplicate patterns
    expect(getByText(/First Name/)).toBeTruthy();
    expect(getByText(/Last Name/)).toBeTruthy();
    expect(getByText(/Email/)).toBeTruthy();
    // "Password" appears in both Password and Confirm Password fields
    expect(getAllByText(/Password/).length).toBeGreaterThanOrEqual(2);
    // The consent line is no longer one text node: the two documents are
    // separately tappable, so it renders as prefix + link + joiner + link.
    // Asserting the pieces is what checks the thing that matters — that a user
    // can read both documents before agreeing to them.
    expect(getByText(/I agree to the/)).toBeTruthy();
    expect(getByText('Terms of Service')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('shows sign in link', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('navigates to Login when sign in is pressed', () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('shows subtitle text', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Join Product Scanner today')).toBeTruthy();
  });
});
