import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class PharmaInfoDto {
  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsString()
  dosageForm?: string;

  @IsOptional()
  @IsString()
  administrationRoute?: string;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsBoolean()
  isControlled?: boolean;

  @IsOptional()
  @IsString()
  registroSanitario?: string;

  @IsOptional()
  @IsString()
  therapeuticGroup?: string;

  @IsOptional()
  @IsString()
  indications?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  sideEffects?: string;

  @IsOptional()
  @IsString()
  storageConditions?: string;
}
