import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'user-123', email: 'test@test.com', first_name: 'Jane', role: 'free_user' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    login: jest.fn(),
    logout: mockLogout,
    register: jest.fn(),
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  }),
}));

jest.mock('../../../src/services/apiService', () => ({
  userRepository: {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
  },
  subscriptionRepository: {
    getStatus: jest.fn().mockResolvedValue({ tier: 'free', is_active: true, features: [] }),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ProfileScreen from '../../../src/screens/main/ProfileScreen';
import { userRepository } from '../../../src/services/apiService';

const mockGetProfile = userRepository.getUserProfile as jest.Mock;

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue({
      user_id: 'user-123',
      first_name: 'Jane',
      last_name: 'Doe',
      bio: 'Test bio',
      phone_number: '+1234567890',
      dietary_restrictions: [],
      allergens: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    });
  });

  it('renders without crashing', async () => {
    const { findByText } = render(<ProfileScreen />);
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    const name = await findByText('Jane Doe');
    expect(name).toBeTruthy();
  });

  it('shows user name after profile load', async () => {
    const { findByText } = render(<ProfileScreen />);
    const name = await findByText('Jane Doe');
    expect(name).toBeTruthy();
  });

  it('shows subscription row', async () => {
    const { findByText } = render(<ProfileScreen />);
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalled());
    const sub = await findByText('Subscription');
    expect(sub).toBeTruthy();
  });

  it('shows edit profile button', async () => {
    const { findByText } = render(<ProfileScreen />);
    const editBtn = await findByText('Edit Profile');
    expect(editBtn).toBeTruthy();
  });

  it('shows logout button', async () => {
    const { findByText } = render(<ProfileScreen />);
    const logoutBtn = await findByText('Logout');
    expect(logoutBtn).toBeTruthy();
  });

  it('shows free badge for free_user role', async () => {
    const { findAllByText } = render(<ProfileScreen />);
    // 'Free' may appear multiple times (badge + subscription tier label)
    const badges = await findAllByText('Free');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});
