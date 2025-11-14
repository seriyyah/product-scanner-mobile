/**
 * Authentication Context implementation using React Context API and useReducer
 * Provides global authentication state management following SOLID principles
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { IUser, IAuthState, AuthAction, IUserCredentials, IUserRegistration } from '@/types';
import { authRepository, ApiError } from '@/services/apiService';

// Initial Auth State
const initialAuthState: IAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check existing session
  error: null,
};

// Auth Reducer implementing state transitions
const authReducer = (state: IAuthState, action: AuthAction): IAuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

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
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        accessToken: action.payload,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Auth Context Interface
interface IAuthContextValue {
  // State
  readonly state: IAuthState;
  
  // Actions
  readonly login: (credentials: IUserCredentials) => Promise<void>;
  readonly register: (userData: IUserRegistration) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly updateProfile: (updates: Partial<IUser>) => Promise<void>;
  readonly changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  readonly forgotPassword: (email: string) => Promise<void>;
  readonly clearError: () => void;
  readonly checkAuthStatus: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<IAuthContextValue | undefined>(undefined);

// Auth Provider Props
interface IAuthProviderProps {
  readonly children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Check authentication status on app launch
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const isAuthenticated = await authRepository.isAuthenticated();
      
      if (isAuthenticated) {
        // Try to get current user
        const user = await authRepository.getCurrentUser();
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            tokens: {
              accessToken: '', // Token is already stored securely
              refreshToken: '',
            },
          },
        });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      // If auth check fails, treat as logged out
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (credentials: IUserCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const result = await authRepository.login(credentials);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: result,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Login failed. Please try again.';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      throw error; // Re-throw so UI can handle it
    }
  };

  const register = async (userData: IUserRegistration): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const user = await authRepository.register(userData);
      
      // After successful registration, automatically log in
      await login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Registration failed. Please try again.';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      throw error; // Re-throw so UI can handle it
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authRepository.logout();
    } catch (error) {
      // Logout always succeeds locally even if API fails
      // Silent failure is OK here
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (updates: Partial<IUser>): Promise<void> => {
    try {
      const updatedUser = await authRepository.updateProfile(updates);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: updatedUser,
          tokens: {
            accessToken: state.accessToken || '',
            refreshToken: state.refreshToken || '',
          },
        },
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Profile update failed. Please try again.';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authRepository.changePassword(currentPassword, newPassword);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Password change failed. Please try again.';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authRepository.forgotPassword(email);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Password reset failed. Please try again.';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: IAuthContextValue = {
    state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using Auth Context
export const useAuth = (): IAuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for components that require authentication
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    const { state } = useAuth();
    
    if (!state.isAuthenticated) {
      // You might want to redirect to login screen here
      // For now, we'll just not render the component
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;