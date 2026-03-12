import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum([
    'PENDING',
    'PENDING_PAYMENT',
    'PENDING_PRESCRIPTION',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ])
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
