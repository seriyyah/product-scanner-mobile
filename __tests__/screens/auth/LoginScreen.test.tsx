import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
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
    register: jest.fn(),
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import LoginScreen from '../../../src/screens/auth/LoginScreen';

const fakeNavigation: any = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(
      <LoginScreen navigation={fakeNavigation} route={{} as any} />
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows email and password fields', () => {
    const { getByText, getAllByText } = render(
      <LoginScreen navigation={fakeNavigation} route={{} as any} />
    );
    // Labels have nested required asterisk — use regex
    expect(getByText(/Email Address/)).toBeTruthy();
    // "Password" appears in both the label and "Forgot Password?" link
    expect(getAllByText(/Password/).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to Register when sign up link pressed', () => {
    const { getByText } = render(
      <LoginScreen navigation={fakeNavigation} route={{} as any} />
    );
    fireEvent.press(getByText('Sign Up'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to ForgotPassword when link pressed', () => {
    const { getByText } = render(
      <LoginScreen navigation={fakeNavigation} route={{} as any} />
    );
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('shows welcome text', () => {
    const { getByText } = render(
      <LoginScreen navigation={fakeNavigation} route={{} as any} />
    );
    expect(getByText('Welcome Back')).toBeTruthy();
  });
});
