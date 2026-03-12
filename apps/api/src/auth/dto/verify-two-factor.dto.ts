import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTwoFactorDto {
  @ApiProperty({ description: 'Token temporal recibido al hacer login' })
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos enviado al email' })
  @IsString()
  @Length(6, 6, { message: 'El código debe ser de 6 dígitos' })
  code!: string;
}
