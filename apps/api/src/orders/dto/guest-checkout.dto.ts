import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class GuestShippingAddressDto {
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

export class GuestCheckoutDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ValidateNested()
  @Type(() => GuestShippingAddressDto)
  shippingAddress!: GuestShippingAddressDto;

  @IsEnum(['BANK_TRANSFER', 'CASH_ON_DELIVERY'])
  paymentMethod!: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
