import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderItemId!: string;

  @IsInt()
  @Min(1)
  quantityReceived!: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsDateString()
  expirationDate!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
