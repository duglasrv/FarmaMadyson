import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // POST /auth/register
  // ============================================================
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Registrar nuevo cliente' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ============================================================
  // POST /auth/login
  // ============================================================
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.login(dto, ip);

    // If 2FA required, don't set cookies
    if ('requiresTwoFactor' in result) {
      return result;
    }

    // Set refresh token as HttpOnly cookie
    this.setRefreshTokenCookie(res, (result as any).refreshToken);

    // Don't send refreshToken in response body
    const { refreshToken: _, ...response } = result as any;
    return response;
  }

  // ============================================================
  // POST /auth/verify-2fa
  // ============================================================
  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código 2FA' })
  async verifyTwoFactor(
    @Body() dto: VerifyTwoFactorDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.verifyTwoFactor(dto, ip);

    this.setRefreshTokenCookie(res, (result as any).refreshToken);

    const { refreshToken: _, ...response } = result as any;
    return response;
  }

  // ============================================================
  // POST /auth/refresh
  // ============================================================
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  // ============================================================
  // POST /auth/logout
  // ============================================================
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    return { message: 'Sesión cerrada' };
  }

  // ============================================================
  // GET /auth/me
  // ============================================================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  // ============================================================
  // POST /auth/forgot-password
  // ============================================================
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // Always return success to prevent email enumeration
    // TODO: Implement email sending in Phase 5
    return { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' };
  }

  // ============================================================
  // POST /auth/reset-password
  // ============================================================
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    // TODO: Implement in Phase 5 with email tokens
    return { message: 'Contraseña restablecida exitosamente.' };
  }

  // ============================================================
  // POST /auth/verify-email
  // ============================================================
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email con token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    // TODO: Implement in Phase 5
    return { message: 'Email verificado exitosamente.' };
  }

  // ============================================================
  // POST /auth/check-email
  // ============================================================
  @Public()
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar si un email ya está registrado' })
  async checkEmail(@Body() dto: ForgotPasswordDto) {
    const exists = await this.authService.checkEmailExists(dto.email);
    return { exists };
  }

  // ============================================================
  // POST /auth/quick-register
  // ============================================================
  @Public()
  @Post('quick-register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Registro rápido con auto-login (checkout guest)' })
  async quickRegister(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.quickRegister(dto, ip);

    this.setRefreshTokenCookie(res, result.refreshToken);

    const { refreshToken: _, ...response } = result;
    return response;
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
