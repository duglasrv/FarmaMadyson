import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'cliente@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'MiPassword123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
  @Matches(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
  @Matches(/[0-9]/, { message: 'Debe contener al menos un número' })
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({ example: '+50212345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
