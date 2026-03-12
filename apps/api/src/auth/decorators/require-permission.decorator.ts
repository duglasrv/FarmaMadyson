import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  action: string;
  subject: string;
}

export const PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (subject: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { action, subject } as RequiredPermission);
