import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';
import { PharmaInfoDto } from './pharma-info.dto';

export enum ProductType {
  MEDICINE = 'MEDICINE',
  SUPPLEMENT = 'SUPPLEMENT',
  PERSONAL_CARE = 'PERSONAL_CARE',
  BABY = 'BABY',
  DEVICE = 'DEVICE',
  OTHER = 'OTHER',
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PharmaInfoDto)
  pharmaInfo?: PharmaInfoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}
