/**
 * Core TypeScript type definitions for Product Scanner Mobile App
 * Following Domain-Driven Design principles with strict typing
 */

// Authentication Types
export interface IUser {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role: UserRole;
  readonly emailVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly preferences?: IUserPreferences;
}

export type UserRole = 'guest' | 'free_user' | 'premium_user' | 'admin';

export interface IUserCredentials {
  readonly email: string;
  readonly password: string;
}

export interface IUserRegistration extends IUserCredentials {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly termsAccepted: boolean;
  readonly marketingConsent: boolean;
}

export interface IUserPreferences {
  readonly dietaryRestrictions: readonly string[];
  readonly allergens: readonly string[];
  readonly certifications: readonly string[];
  readonly healthGoals: readonly string[];
  readonly notifications: INotificationSettings;
}

export interface INotificationSettings {
  readonly productAlerts: boolean;
  readonly safetyUpdates: boolean;
  readonly recommendations: boolean;
  readonly marketing: boolean;
}

// Authentication State
export interface IAuthState {
  readonly user: IUser | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// Product Types
export interface IProduct {
  readonly id: string;
  readonly barcode: string;
  readonly name: string;
  readonly brand?: string;
  readonly category?: string;
  readonly subCategory?: string;
  readonly images: readonly string[];
  readonly ingredients: readonly IIngredient[];
  readonly nutritionalValues: INutritionalValues;
  readonly certifications: readonly string[];
  readonly countryOfOrigin?: string;
  readonly safetyScore?: ISafetyScore;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IIngredient {
  readonly name: string;
  readonly percentage?: number;
  readonly isAllergen: boolean;
  readonly eNumber?: string;
}

export interface INutritionalValues {
  readonly energyKcal?: number;
  readonly proteins?: number;
  readonly carbohydrates?: number;
  readonly sugars?: number;
  readonly fat?: number;
  readonly saturatedFat?: number;
  readonly fiber?: number;
  readonly sodium?: number;
}

export interface ISafetyScore {
  readonly overall: number;
  readonly breakdown: {
    readonly nutriscore: number;
    readonly novaGroup: number;
    readonly additives: number;
    readonly allergens: number;
    readonly ecoScore: number;
  };
  readonly confidence: number;
  readonly lastCalculated: Date;
}

// Scanning Types
export interface IScanRequest {
  readonly barcode: string;
  readonly location?: ILocation;
  readonly scanType: ScanType;
  readonly deviceInfo?: IDeviceInfo;
}

export type ScanType = 'camera' | 'manual';

export interface ILocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly countryCode?: string;
}

export interface IDeviceInfo {
  readonly platform: string;
  readonly version: string;
  readonly deviceId: string;
}

export interface IScanHistory {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly product?: IProduct;
  readonly location?: ILocation;
  readonly scannedAt: Date;
  readonly scanDuration?: number;
}

// API Response Types
export interface IApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: IApiError;
  readonly message?: string;
}

export interface IApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly statusCode: number;
}

// Navigation Types
export type RootStackParamList = {
  readonly Auth: undefined;
  readonly Main: undefined;
};

export type AuthStackParamList = {
  readonly Login: undefined;
  readonly Register: undefined;
  readonly ForgotPassword: undefined;
};

export type MainTabParamList = {
  readonly Home: undefined;
  readonly Scanner: undefined;
  readonly History: undefined;
  readonly Profile: undefined;
};

export type ProductStackParamList = {
  readonly ProductList: undefined;
  readonly ProductDetail: { readonly productId: string };
  readonly ScanResult: { readonly product: IProduct };
};

// Form Types
export interface ILoginForm {
  readonly email: string;
  readonly password: string;
}

export interface IRegisterForm {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly termsAccepted: boolean;
  readonly marketingConsent: boolean;
}

export interface IProfileForm {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly currentPassword?: string;
  readonly newPassword?: string;
  readonly confirmNewPassword?: string;
}

// Component Props Types
export interface IButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  readonly size?: 'small' | 'medium' | 'large';
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly icon?: string;
}

export interface IInputProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly secureTextEntry?: boolean;
  readonly keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  readonly autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

export interface ICardProps {
  readonly children: React.ReactNode;
  readonly variant?: 'elevated' | 'outlined' | 'filled';
  readonly onPress?: () => void;
}

// State Management Types
export interface IAppState {
  readonly auth: IAuthState;
  readonly products: IProductState;
  readonly scanner: IScannerState;
  readonly ui: IUIState;
}

export interface IProductState {
  readonly products: readonly IProduct[];
  readonly currentProduct: IProduct | null;
  readonly scanHistory: readonly IScanHistory[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export interface IScannerState {
  readonly isScanning: boolean;
  readonly lastScannedBarcode: string | null;
  readonly cameraPermission: boolean;
  readonly flashEnabled: boolean;
  readonly error: string | null;
}

export interface IUIState {
  readonly theme: 'light' | 'dark';
  readonly language: string;
  readonly isOnline: boolean;
  readonly notifications: readonly INotification[];
}

export interface INotification {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly title: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly read: boolean;
}

// Action Types for Reducers
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: IUser; tokens: { accessToken: string; refreshToken: string } } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'CLEAR_ERROR' };

export type ProductAction =
  | { type: 'FETCH_PRODUCTS_START' }
  | { type: 'FETCH_PRODUCTS_SUCCESS'; payload: readonly IProduct[] }
  | { type: 'FETCH_PRODUCTS_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_PRODUCT'; payload: IProduct }
  | { type: 'ADD_TO_SCAN_HISTORY'; payload: IScanHistory }
  | { type: 'CLEAR_ERROR' };

export type ScannerAction =
  | { type: 'START_SCANNING' }
  | { type: 'STOP_SCANNING' }
  | { type: 'SET_BARCODE'; payload: string }
  | { type: 'SET_CAMERA_PERMISSION'; payload: boolean }
  | { type: 'TOGGLE_FLASH' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Environment Configuration Types
export interface IEnvironmentConfig {
  readonly API_BASE_URL: string;
  readonly AUTH0_DOMAIN: string;
  readonly AUTH0_CLIENT_ID: string;
  readonly AUTH0_AUDIENCE: string;
  readonly SENTRY_DSN?: string;
  readonly ANALYTICS_API_KEY?: string;
}

// External API Types (OpenFoodFacts, etc.)
export interface IOpenFoodFactsProduct {
  readonly code: string;
  readonly product_name: string;
  readonly brands?: string;
  readonly categories?: string;
  readonly ingredients?: readonly unknown[];
  readonly nutriments?: Record<string, number>;
  readonly image_url?: string;
  readonly countries?: string;
}

export default {};