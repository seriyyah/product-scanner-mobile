export const mockAuthState = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'free_user' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  accessToken: 'fake-token',
  refreshToken: 'fake-refresh',
};

export const mockLogin = jest.fn();
export const mockLogout = jest.fn();
export const mockRegister = jest.fn();
export const mockClearError = jest.fn();

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: mockAuthState,
    login: mockLogin,
    logout: mockLogout,
    register: mockRegister,
    clearError: mockClearError,
    checkAuthStatus: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
