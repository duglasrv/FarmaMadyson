import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export enum AdjustmentType {
  ADJUSTMENT = 'ADJUSTMENT',
  LOSS = 'LOSS',
}

export class AdjustInventoryDto {
  @IsString()
  @IsNotEmpty()
  batchId!: string;

  @IsInt()
  quantity!: number; // positive = add, negative = remove

  @IsEnum(AdjustmentType)
  type!: AdjustmentType;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
