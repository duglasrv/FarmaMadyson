import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@farmamadyson.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'FarmaMadyson2026!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password!: string;
}
