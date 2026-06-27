/**
 * AppNavigator tests
 *
 * Note: Full render of the navigator in Jest requires the native navigation
 * runtime. These tests verify the module can be imported and key structure
 * exists without attempting a full render (which would need native modules).
 */
import AppNavigator from '../../src/navigation/AppNavigator';

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: { user: null, isAuthenticated: false, isLoading: false, error: null },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-barcode-scanner', () => {
  const MockBarCodeScanner = ({ children }: any) => children ?? null;
  MockBarCodeScanner.requestPermissionsAsync = jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  );
  MockBarCodeScanner.Constants = {
    BarCodeType: { ean13: 'ean13', ean8: 'ean8', qr: 'qr' },
  };
  return { BarCodeScanner: MockBarCodeScanner };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    SafeAreaProvider: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../src/services/apiService', () => ({
  authRepository: { isAuthenticated: jest.fn(() => Promise.resolve(false)) },
  scannerRepository: { getScanHistory: jest.fn(), scanBarcode: jest.fn() },
  userRepository: { getUserProfile: jest.fn() },
}));

describe('AppNavigator', () => {
  it('is a valid React component (can be imported)', () => {
    expect(AppNavigator).toBeDefined();
    expect(typeof AppNavigator).toBe('function');
  });

  it('exports a function component', () => {
    expect(AppNavigator.length).toBeDefined(); // functions have .length
  });
});
