import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: {} }),
}));

// Mock hoisting-safe pattern: define jest.fn() inside factory
jest.mock('../../../src/services/apiService', () => ({
  authRepository: {
    requestPasswordReset: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ForgotPasswordScreen from '../../../src/screens/auth/ForgotPasswordScreen';
import { authRepository } from '../../../src/services/apiService';

const mockRequestPasswordReset = authRepository.requestPasswordReset as jest.Mock;

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    expect(getByText('Reset Password')).toBeTruthy();
  });

  it('shows email input', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    // Required label has nested asterisk — use regex
    expect(getByText(/Email Address/)).toBeTruthy();
  });

  it('shows send reset link button', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    expect(getByText('Send Reset Link')).toBeTruthy();
  });

  it('shows validation error on empty submit', async () => {
    const { getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Send Reset Link'));
    const error = await findByText('Email is required');
    expect(error).toBeTruthy();
  });

  it('calls requestPasswordReset on valid submit', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({ message: 'sent' });
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);

    const input = getByPlaceholderText('Enter your email');
    fireEvent.changeText(input, 'test@example.com');
    fireEvent.press(getByText('Send Reset Link'));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success state after submission', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({ message: 'sent' });
    const { getByText, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@email.com');
    fireEvent.press(getByText('Send Reset Link'));

    const successText = await findByText(/Check your email/);
    expect(successText).toBeTruthy();
  });

  it('shows success even on API error (security)', async () => {
    mockRequestPasswordReset.mockRejectedValueOnce(new Error('Not found'));
    const { getByText, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@email.com');
    fireEvent.press(getByText('Send Reset Link'));

    const successText = await findByText(/Check your email/);
    expect(successText).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
