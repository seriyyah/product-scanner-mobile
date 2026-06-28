/**
 * Authentication Context implementation using React Context API and useReducer
 * Provides global authentication state management following SOLID principles
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { storage } from '@/utils/storage';
import { IAuthState, AuthAction, IUserCredentials, IUserRegistration } from '@/types';
import { authRepository, ApiError } from '@/services/apiService';

// Initial Auth State
const initialAuthState: IAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer implementing state transitions
const authReducer = (state: IAuthState, action: AuthAction): IAuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.tokens.accessToken,
        refreshToken: action.payload.tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return { ...initialAuthState, isLoading: false };

    case 'REFRESH_TOKEN_SUCCESS':
      return { ...state, accessToken: action.payload, error: null };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
};

// Auth Context Interface
interface IAuthContextValue {
  readonly state: IAuthState;
  readonly login: (credentials: IUserCredentials) => Promise<void>;
  readonly register: (userData: IUserRegistration) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly clearError: () => void;
  readonly checkAuthStatus: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<IAuthContextValue | undefined>(undefined);

interface IAuthProviderProps {
  readonly children: ReactNode;
}

export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const token = await storage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        const user = await authRepository.getCurrentUser();
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, tokens: { accessToken: token, refreshToken: '' } },
        });
      } catch (userError: unknown) {
        const apiErr = userError as ApiError;
        if (apiErr?.statusCode === 401) {
          // Try to refresh
          try {
            const refreshToken = await storage.getItem('refresh_token');
            if (refreshToken) {
              const newTokens = await authRepository.refreshToken(refreshToken);
              await storage.setItem('auth_token', newTokens.access_token);
              await storage.setItem('refresh_token', newTokens.refresh_token);
              const user = await authRepository.getCurrentUser();
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user,
                  tokens: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token,
                  },
                },
              });
            } else {
              await clearTokensAndLogout();
            }
          } catch {
            await clearTokensAndLogout();
          }
        } else {
          await clearTokensAndLogout();
        }
      }
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearTokensAndLogout = async (): Promise<void> => {
    await storage.deleteItem('auth_token');
    await storage.deleteItem('refresh_token');
    dispatch({ type: 'LOGOUT' });
  };

  const login = async (credentials: IUserCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const result = await authRepository.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : 'Login failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: IUserRegistration): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await authRepository.register(userData);
      dispatch({ type: 'LOGIN_FAILURE', payload: '' }); // reset loading
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : 'Registration failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    // Fire and forget — always clear local state
    authRepository.logout().catch(() => {});
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: IAuthContextValue = {
    state,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
