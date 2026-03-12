import { IsArray, ValidateNested, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CalculateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsOptional()
  @IsString()
  couponCode?: string;
}
