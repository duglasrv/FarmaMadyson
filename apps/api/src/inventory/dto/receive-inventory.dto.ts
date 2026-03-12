import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  Min,
} from 'class-validator';

export class ReceiveInventoryDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsDateString()
  expirationDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
