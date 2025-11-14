/**
 * Provides abstraction for all backend communication
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  IUser,
  IUserCredentials,
  IUserRegistration,
  IProduct,
  IScanRequest,
  IScanHistory,
  IApiResponse,
  IApiError as IApiErrorType,
} from '@/types';

// API Configuration
class ApiConfig {
  // iOS simulator connects to Docker via machine IP (not localhost)
  public static readonly BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.105:8300';
  public static readonly TIMEOUT = 30000;
  public static readonly TOKEN_KEY = 'auth_token';
  public static readonly REFRESH_TOKEN_KEY = 'refresh_token';
}

// Custom API Error Class
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Base API Client (Singleton Pattern)
class BaseApiClient {
  private static instance: BaseApiClient;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: ApiConfig.BASE_URL,
      timeout: ApiConfig.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): BaseApiClient {
    if (!BaseApiClient.instance) {
      BaseApiClient.instance = new BaseApiClient();
    }
    return BaseApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request Interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(ApiConfig.TOKEN_KEY);
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor - Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest) {
          try {
            const refreshToken = await SecureStore.getItemAsync(ApiConfig.REFRESH_TOKEN_KEY);
            if (refreshToken) {
              const newToken = await this.refreshToken(refreshToken);
              await SecureStore.setItemAsync(ApiConfig.TOKEN_KEY, newToken);
              
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              }
              
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed, logout user
            await this.clearTokens();
            throw this.transformError(error);
          }
        }
        
        throw this.transformError(error);
      }
    );
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    const response = await axios.post(`${ApiConfig.BASE_URL}/api/v1/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data.access_token;
  }

  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ApiConfig.TOKEN_KEY);
    await SecureStore.deleteItemAsync(ApiConfig.REFRESH_TOKEN_KEY);
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response) {
      const responseData = error.response.data as any;
      const apiError: IApiErrorType = {
        message: responseData?.message || error.message || 'API request failed',
        code: responseData?.code || 'API_ERROR',
        statusCode: error.response.status,
        details: responseData?.details,
      };
      return new ApiError(
        apiError.message,
        apiError.statusCode,
        apiError.code,
        apiError.details
      );
    }
    
    if (error.request) {
      const apiError: IApiErrorType = {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
      return new ApiError(
        apiError.message,
        apiError.statusCode,
        apiError.code
      );
    }
    
    const apiError: IApiErrorType = {
      message: error.message || 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 0,
    };
    return new ApiError(
      apiError.message,
      apiError.statusCode,
      apiError.code
    );
  }

  public async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response: AxiosResponse<IApiResponse<T>> = await this.axiosInstance.get(url, { params });
    return this.handleResponse(response);
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<IApiResponse<T>> = await this.axiosInstance.post(url, data);
    return this.handleResponse(response);
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<IApiResponse<T>> = await this.axiosInstance.put(url, data);
    return this.handleResponse(response);
  }

  public async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<IApiResponse<T>> = await this.axiosInstance.delete(url);
    return this.handleResponse(response);
  }

  private handleResponse<T>(response: AxiosResponse<IApiResponse<T>>): T {
    const { data } = response;
    
    if (!data.success) {
      throw new ApiError(
        data.error?.message || 'API request failed',
        data.error?.statusCode || response.status,
        data.error?.code || 'API_ERROR',
        data.error?.details
      );
    }
    
    if (data.data === undefined) {
      throw new ApiError('No data received from API', response.status, 'NO_DATA');
    }
    
    return data.data;
  }
}

// Authentication Repository
export class AuthRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async login(credentials: IUserCredentials): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    const loginPayload = {
      email: credentials.email,
      password: credentials.password,
      remember_me: false,
      device_info: {
        device_type: 'mobile',
        os: 'ios',
        app_version: '1.0.0',
      },
    };

    // Make direct axios call since backend returns data directly, not wrapped in IApiResponse
    const response = await BaseApiClient.getInstance()['axiosInstance'].post<any>(
      '/api/v1/auth/login',
      loginPayload
    );

    const data = response.data;
    if (!data.tokens || !data.user) {
      throw new ApiError('Invalid response format', 400, 'INVALID_RESPONSE');
    }

    // Store tokens securely
    await SecureStore.setItemAsync(ApiConfig.TOKEN_KEY, data.tokens.access_token);
    await SecureStore.setItemAsync(ApiConfig.REFRESH_TOKEN_KEY, data.tokens.refresh_token);

    return {
      user: data.user,
      tokens: {
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
      },
    };
  }

  public async register(userData: IUserRegistration): Promise<IUser> {
    const registerPayload = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      terms_accepted: userData.termsAccepted,
      marketing_consent: userData.marketingConsent || false,
    };
    return this.apiClient.post<IUser>('/api/v1/auth/register', registerPayload);
  }

  public async logout(logoutAllSessions: boolean = false): Promise<void> {
    try {
      // Logout endpoint doesn't return data, just status code
      const axiosInstance = (BaseApiClient.getInstance() as any).axiosInstance;
      await axiosInstance.post('/api/v1/auth/logout', {
        logout_all_sessions: logoutAllSessions,
      });
    } catch (error) {
      // Logout API might fail but we still clear tokens
      // Don't rethrow - we want logout to always succeed locally
    } finally {
      // Always clear local tokens, even if API call fails
      await SecureStore.deleteItemAsync(ApiConfig.TOKEN_KEY);
      await SecureStore.deleteItemAsync(ApiConfig.REFRESH_TOKEN_KEY);
    }
  }

  public async getCurrentUser(): Promise<IUser> {
    return this.apiClient.get<IUser>('/api/v1/auth/me');
  }

  public async updateProfile(updates: Partial<IUser>): Promise<IUser> {
    return this.apiClient.put<IUser>('/api/v1/auth/profile', updates);
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.apiClient.put('/api/v1/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  public async forgotPassword(email: string): Promise<void> {
    await this.apiClient.post('/api/v1/auth/forgot-password', { email });
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(ApiConfig.TOKEN_KEY);
    return Boolean(token);
  }

  public async getUserProfile(userId: string): Promise<any> {
    try {
      const axiosInstance = (BaseApiClient.getInstance() as any).axiosInstance;
      const response = await axiosInstance.get(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async createUserProfile(profileData: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    bio?: string;
    phone_number?: string;
    avatar_url?: string;
  }): Promise<any> {
    try {
      const axiosInstance = (BaseApiClient.getInstance() as any).axiosInstance;
      const response = await axiosInstance.post('/api/v1/users', profileData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async updateUserProfile(userId: string, updates: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    phone_number?: string;
  }): Promise<any> {
    try {
      const axiosInstance = (BaseApiClient.getInstance() as any).axiosInstance;
      const response = await axiosInstance.put(`/api/v1/users/${userId}`, updates);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async deleteUserProfile(userId: string): Promise<void> {
    try {
      const axiosInstance = (BaseApiClient.getInstance() as any).axiosInstance;
      await axiosInstance.delete(`/api/v1/users/${userId}`);
    } catch (error: any) {
      throw error;
    }
  }
}

// Product Repository
export class ProductRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async scanProduct(scanRequest: IScanRequest): Promise<IProduct> {
    return this.apiClient.post<IProduct>('/api/v1/scan/barcode', scanRequest);
  }

  public async getProduct(productId: string): Promise<IProduct> {
    return this.apiClient.get<IProduct>(`/api/v1/products/${productId}`);
  }

  public async getProductByBarcode(barcode: string): Promise<IProduct> {
    return this.apiClient.get<IProduct>(`/api/v1/products/barcode/${barcode}`);
  }

  public async searchProducts(query: string, filters?: Record<string, unknown>): Promise<readonly IProduct[]> {
    return this.apiClient.get<readonly IProduct[]>('/api/v1/products/search', {
      q: query,
      ...filters,
    });
  }

  public async rateProduct(productId: string, rating: number, review?: string): Promise<void> {
    await this.apiClient.post(`/api/v1/products/${productId}/rate`, {
      rating,
      review,
    });
  }

  public async getScanHistory(): Promise<readonly IScanHistory[]> {
    return this.apiClient.get<readonly IScanHistory[]>('/api/v1/scan/history');
  }

  public async deleteScanFromHistory(scanId: string): Promise<void> {
    await this.apiClient.delete(`/api/v1/scan/history/${scanId}`);
  }
}

// User Preferences Repository
export class UserPreferencesRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async getUserPreferences(): Promise<any> {
    return this.apiClient.get('/api/v1/user/preferences');
  }

  public async updateUserPreferences(preferences: any): Promise<any> {
    return this.apiClient.put('/api/v1/user/preferences', preferences);
  }
}

// Recommendations Repository
export class RecommendationsRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async getRecommendations(): Promise<readonly IProduct[]> {
    return this.apiClient.get<readonly IProduct[]>('/api/v1/recommendations/user');
  }

  public async getSimilarProducts(productId: string): Promise<readonly IProduct[]> {
    return this.apiClient.get<readonly IProduct[]>(`/api/v1/recommendations/similar/${productId}`);
  }
}

// Marketplace Repository
export class MarketplaceRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async getProductPrices(barcode: string): Promise<any[]> {
    return this.apiClient.get<any[]>(`/api/v1/marketplace/prices/${barcode}`);
  }

  public async getShops(): Promise<any[]> {
    return this.apiClient.get<any[]>('/api/v1/marketplace/shops');
  }

  public async trackProduct(productId: string): Promise<void> {
    await this.apiClient.post(`/api/v1/marketplace/track/${productId}`);
  }
}

// API Service Factory (Factory Pattern)
export class ApiServiceFactory {
  private static authRepository: AuthRepository;
  private static productRepository: ProductRepository;
  private static userPreferencesRepository: UserPreferencesRepository;
  private static recommendationsRepository: RecommendationsRepository;
  private static marketplaceRepository: MarketplaceRepository;

  public static getAuthRepository(): AuthRepository {
    if (!this.authRepository) {
      this.authRepository = new AuthRepository();
    }
    return this.authRepository;
  }

  public static getProductRepository(): ProductRepository {
    if (!this.productRepository) {
      this.productRepository = new ProductRepository();
    }
    return this.productRepository;
  }

  public static getUserPreferencesRepository(): UserPreferencesRepository {
    if (!this.userPreferencesRepository) {
      this.userPreferencesRepository = new UserPreferencesRepository();
    }
    return this.userPreferencesRepository;
  }

  public static getRecommendationsRepository(): RecommendationsRepository {
    if (!this.recommendationsRepository) {
      this.recommendationsRepository = new RecommendationsRepository();
    }
    return this.recommendationsRepository;
  }

  public static getMarketplaceRepository(): MarketplaceRepository {
    if (!this.marketplaceRepository) {
      this.marketplaceRepository = new MarketplaceRepository();
    }
    return this.marketplaceRepository;
  }
}

// Export default instances for easy usage
export const authRepository = ApiServiceFactory.getAuthRepository();
export const productRepository = ApiServiceFactory.getProductRepository();
export const userPreferencesRepository = ApiServiceFactory.getUserPreferencesRepository();
export const recommendationsRepository = ApiServiceFactory.getRecommendationsRepository();
export const marketplaceRepository = ApiServiceFactory.getMarketplaceRepository();