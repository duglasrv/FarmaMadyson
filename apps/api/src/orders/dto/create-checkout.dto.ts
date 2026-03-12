import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateCheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsEnum(['BANK_TRANSFER', 'CASH_ON_DELIVERY'])
  paymentMethod!: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
