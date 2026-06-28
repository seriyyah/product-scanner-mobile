/**
 * Provides abstraction for all backend communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage } from '@/utils/storage';
import {
  IUser,
  IUserCredentials,
  IUserRegistration,
  ScanResult,
  ScanHistory,
  UserProfile,
} from '@/types';

// API Configuration
class ApiConfig {
  public static readonly BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8300';
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
  public readonly axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: ApiConfig.BASE_URL,
      timeout: ApiConfig.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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
    // Request interceptor: attach access token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await storage.getItem(ApiConfig.TOKEN_KEY);
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 → refresh → retry
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = await storage.getItem(ApiConfig.REFRESH_TOKEN_KEY);
            if (refreshToken) {
              const refreshResponse = await axios.post(
                `${ApiConfig.BASE_URL}/api/v1/auth/refresh`,
                { refresh_token: refreshToken }
              );
              const newAccessToken = refreshResponse.data.tokens?.access_token || refreshResponse.data.access_token;
              await storage.setItem(ApiConfig.TOKEN_KEY, newAccessToken);

              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch {
            await this.clearTokens();
          }
        }

        throw this.transformError(error);
      }
    );
  }

  private async clearTokens(): Promise<void> {
    await storage.deleteItem(ApiConfig.TOKEN_KEY);
    await storage.deleteItem(ApiConfig.REFRESH_TOKEN_KEY);
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      const detail = data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((e: any) => e.msg ?? String(e)).join('. ')
        : detail || data?.message || error.message || 'Request failed';
      return new ApiError(message, error.response.status, 'API_ERROR', data?.details);
    }
    if (error.request) {
      return new ApiError('Network error - please check your connection', 0, 'NETWORK_ERROR');
    }
    return new ApiError(error.message || 'An unknown error occurred', 0, 'UNKNOWN_ERROR');
  }

  public async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }
}

// Authentication Repository
export class AuthRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async login(credentials: IUserCredentials): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> {
    const payload = {
      email: credentials.email,
      password: credentials.password,
      remember_me: false,
      device_info: {
        device_type: 'mobile',
        os: 'ios',
        app_version: '1.0.0',
      },
    };

    const data = await this.apiClient.post<any>('/api/v1/auth/login', payload);

    if (!data.tokens || !data.user) {
      throw new ApiError('Invalid response format', 400, 'INVALID_RESPONSE');
    }

    await storage.setItem('auth_token', data.tokens.access_token);
    await storage.setItem('refresh_token', data.tokens.refresh_token);

    return {
      user: data.user,
      tokens: {
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
      },
    };
  }

  public async register(userData: IUserRegistration): Promise<{ user: IUser; verification_sent: boolean }> {
    const payload = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      terms_accepted: userData.termsAccepted,
      marketing_consent: userData.marketingConsent || false,
    };
    return this.apiClient.post<{ user: IUser; verification_sent: boolean }>('/api/v1/auth/register', payload);
  }

  public async logout(): Promise<void> {
    try {
      await this.apiClient.post('/api/v1/auth/logout', { logout_all_sessions: false });
    } catch {
      // fire and forget — always clear local tokens
    } finally {
      await storage.deleteItem('auth_token');
      await storage.deleteItem('refresh_token');
    }
  }

  public async getCurrentUser(): Promise<IUser> {
    return this.apiClient.get<IUser>('/api/v1/auth/me');
  }

  public async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.apiClient.post<{ access_token: string; refresh_token: string }>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
  }

  public async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>('/api/v1/auth/request-password-reset', { email });
  }

  public async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>('/api/v1/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem('auth_token');
    return Boolean(token);
  }

  // Legacy method kept for compatibility
  public async forgotPassword(email: string): Promise<void> {
    await this.requestPasswordReset(email);
  }
}

// Scanner Repository
export class ScannerRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async scanBarcode(barcode: string): Promise<ScanResult> {
    return this.apiClient.post<ScanResult>('/api/v2/scan', { barcode });
  }

  // Read-only lookup — fetches product + rating WITHOUT saving to scan history.
  // Use this whenever displaying a product that was already scanned (history view, detail view).
  public async getProductDetails(barcode: string): Promise<ScanResult> {
    return this.apiClient.get<ScanResult>(`/api/v2/scan/${encodeURIComponent(barcode)}`);
  }

  public async getScanHistory(page = 1, perPage = 20): Promise<ScanHistory> {
    return this.apiClient.get<ScanHistory>('/api/v1/scan/history', { page, per_page: perPage });
  }
}

// User Repository
export class UserRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async getUserProfile(userId: string): Promise<UserProfile> {
    return this.apiClient.get<UserProfile>(`/api/v2/users/${userId}`);
  }

  public async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.apiClient.put<UserProfile>(`/api/v2/users/${userId}`, data);
  }
}

// Legacy ProductRepository kept for compatibility
export class ProductRepository {
  private readonly apiClient = BaseApiClient.getInstance();

  public async getScanHistory(): Promise<ScanHistory> {
    return this.apiClient.get<ScanHistory>('/api/v1/scan/history');
  }
}

// API Service Factory
export class ApiServiceFactory {
  private static authRepo: AuthRepository;
  private static scannerRepo: ScannerRepository;
  private static userRepo: UserRepository;
  private static productRepo: ProductRepository;

  public static getAuthRepository(): AuthRepository {
    if (!this.authRepo) this.authRepo = new AuthRepository();
    return this.authRepo;
  }

  public static getScannerRepository(): ScannerRepository {
    if (!this.scannerRepo) this.scannerRepo = new ScannerRepository();
    return this.scannerRepo;
  }

  public static getUserRepository(): UserRepository {
    if (!this.userRepo) this.userRepo = new UserRepository();
    return this.userRepo;
  }

  public static getProductRepository(): ProductRepository {
    if (!this.productRepo) this.productRepo = new ProductRepository();
    return this.productRepo;
  }
}

// Export default instances for easy usage
export const authRepository = ApiServiceFactory.getAuthRepository();
export const scannerRepository = ApiServiceFactory.getScannerRepository();
export const userRepository = ApiServiceFactory.getUserRepository();
export const productRepository = ApiServiceFactory.getProductRepository();
