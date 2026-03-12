import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class CouponCartItem {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponCartItem)
  items!: CouponCartItem[];
}
