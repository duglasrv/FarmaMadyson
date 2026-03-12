export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyTwoFactorDto {
  tempToken: string;
  code: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface CartItemDto {
  variantId: string;
  quantity: number;
}

export interface CalculateCartDto {
  items: CartItemDto[];
  couponCode?: string;
}
