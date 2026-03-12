import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class UpsertSettingDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsNotEmpty()
  value!: any;

  @IsOptional()
  @IsString()
  group?: string;
}
