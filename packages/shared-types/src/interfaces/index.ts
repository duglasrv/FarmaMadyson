export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh' | '2fa';
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export interface TwoFactorResponse {
  requiresTwoFactor: true;
  tempToken: string;
}

export interface CartCalculation {
  items: CartCalculationItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  outOfStockItems: string[];
}

export interface CartCalculationItem {
  variantId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  taxExempt: boolean;
  subtotal: number;
}
