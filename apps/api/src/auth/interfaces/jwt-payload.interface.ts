export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh' | '2fa';
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
