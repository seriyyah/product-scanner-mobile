import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../src/services/apiService', () => ({
  authRepository: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    isAuthenticated: jest.fn(),
    requestPasswordReset: jest.fn(),
    forgotPassword: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode: number, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  },
}));

import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { authRepository } from '../../src/services/apiService';

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockGetCurrentUser = authRepository.getCurrentUser as jest.Mock;

const TestConsumer = () => {
  const { state } = useAuth();
  return (
    <>
      <Text testID="loading">{state.isLoading ? 'loading' : 'done'}</Text>
      <Text testID="authenticated">{state.isAuthenticated ? 'yes' : 'no'}</Text>
      <Text testID="error">{state.error || 'none'}</Text>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue(null);
  });

  it('renders AuthProvider without crashing', async () => {
    const { findByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    const done = await findByTestId('loading');
    expect(done).toBeTruthy();
  });

  it('shows not authenticated when no token', async () => {
    mockGetItemAsync.mockResolvedValue(null);
    const { findByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    const auth = await findByTestId('authenticated');
    await waitFor(() => {
      expect(auth.props.children).toBe('no');
    });
  });

  it('sets authenticated when token exists and getCurrentUser succeeds', async () => {
    mockGetItemAsync.mockResolvedValue('valid-token');
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1', email: 'a@b.com', role: 'free_user',
    });
    const { findByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(async () => {
      const auth = await findByTestId('authenticated');
      expect(auth.props.children).toBe('yes');
    }, { timeout: 3000 });
  });

  it('shows not authenticated when token is present but getCurrentUser fails', async () => {
    mockGetItemAsync.mockResolvedValue('expired-token');
    mockGetCurrentUser.mockRejectedValue(Object.assign(new Error('Unauthorized'), { statusCode: 401 }));
    // Also mock refresh as failing
    (authRepository.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    const { findByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(async () => {
      const auth = await findByTestId('authenticated');
      expect(auth.props.children).toBe('no');
    }, { timeout: 3000 });
  });

  it('throws if useAuth used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    consoleError.mockRestore();
  });
});
