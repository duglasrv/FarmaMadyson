import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  suggestedPrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  unitsPerBox?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  boxCost?: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
