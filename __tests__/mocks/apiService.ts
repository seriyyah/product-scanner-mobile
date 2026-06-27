export const mockScanResult = {
  product: {
    barcode: '1234567890123',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Test',
    ingredients: ['Water', 'Sugar', 'Salt'],
    images: [],
    allergens: [],
    additives: [],
    ingredients_analysis: [],
  },
  safety_score: 72,
  safety_grade: 'B' as const,
  rating_breakdown: {
    nutriscore: { score: 80, grade: 'B', weighted_score: 24 },
    nova: { score: 90, group: 1, weighted_score: 18 },
    additives: { score: 100, count: 0, high_risk_count: 0, weighted_score: 20 },
  },
  warnings: [],
  saved_to_history: true,
  cached: false,
};

export const mockHistoryItems = [
  {
    id: '1',
    barcode: '1234567890123',
    product_name: 'Test Product',
    brand: 'Test Brand',
    safety_score: 72,
    safety_grade: 'B',
    scanned_at: '2026-06-01T10:00:00Z',
  },
];

export const mockScanHistory = {
  items: mockHistoryItems,
  total: 1,
  page: 1,
  per_page: 20,
};

export const mockUserProfile = {
  user_id: 'user-123',
  first_name: 'Test',
  last_name: 'User',
  bio: 'Test bio',
  phone_number: '',
  dietary_restrictions: [],
  allergens: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

export const authRepository = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  isAuthenticated: jest.fn(),
  forgotPassword: jest.fn(),
};

export const scannerRepository = {
  scanBarcode: jest.fn(),
  getScanHistory: jest.fn(),
};

export const userRepository = {
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
};

jest.mock('../../src/services/apiService', () => ({
  authRepository,
  scannerRepository,
  userRepository,
  productRepository: {},
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
