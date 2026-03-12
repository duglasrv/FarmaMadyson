import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
