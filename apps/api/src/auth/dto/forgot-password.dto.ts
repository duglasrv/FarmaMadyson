import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'cliente@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
