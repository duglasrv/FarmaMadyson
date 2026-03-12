import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { JwtPayload, TokenResponse, TwoFactorResponse } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // REGISTER
  // ============================================================
  async register(dto: RegisterDto): Promise<{ user: { id: string; email: string }; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Find default customer role
    const customerRole = await this.prisma.role.findUnique({
      where: { name: 'customer' },
    });

    if (!customerRole) {
      throw new BadRequestException('Rol de cliente no configurado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userRoles: {
          create: { roleId: customerRole.id },
        },
      },
    });

    // TODO: Send verification email (EmailJS/SendGrid) in Phase 5
    this.logger.log(`User registered: ${user.email}`);

    return {
      user: { id: user.id, email: user.email },
      message: 'Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.',
    };
  }

  // ============================================================
  // LOGIN
  // ============================================================
  async login(
    dto: LoginDto,
    ipAddress?: string,
  ): Promise<TokenResponse | TwoFactorResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    // Check if user is admin with 2FA
    const isAdmin = roles.some((r) =>
      ['super_admin', 'admin', 'pharmacist', 'warehouse', 'sales'].includes(r),
    );
    if (isAdmin && user.twoFactorEnabled) {
      return this.initiateTwoFactor(user.id, user.email);
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return this.generateTokens(user.id, user.email, roles, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });
  }

  // ============================================================
  // 2FA — Initiate
  // ============================================================
  private async initiateTwoFactor(userId: string, email: string): Promise<TwoFactorResponse> {
    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);

    // Save code to DB
    await this.prisma.twoFactorCode.create({
      data: {
        userId,
        code: codeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Generate temp token (short-lived, type '2fa')
    const tempToken = this.jwtService.sign(
      { sub: userId, email, roles: [], type: '2fa' },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: 300,
      },
    );

    // Send 2FA code via email
    await this.emailService.sendTwoFactorCode(email, code);
    this.logger.log(`2FA code sent to ${email}`);

    return { requiresTwoFactor: true, tempToken };
  }

  // ============================================================
  // 2FA — Verify
  // ============================================================
  async verifyTwoFactor(
    dto: VerifyTwoFactorDto,
    ipAddress?: string,
  ): Promise<TokenResponse> {
    // Decode temp token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.tempToken, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token temporal expirado o inválido');
    }

    if (payload.type !== '2fa') {
      throw new UnauthorizedException('Token inválido para verificación 2FA');
    }

    // Find latest unused 2FA code for this user
    const twoFactorCode = await this.prisma.twoFactorCode.findFirst({
      where: {
        userId: payload.sub,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!twoFactorCode) {
      throw new UnauthorizedException('Código expirado. Inicia sesión nuevamente.');
    }

    if (twoFactorCode.attempts >= 3) {
      // Invalidate the code
      await this.prisma.twoFactorCode.update({
        where: { id: twoFactorCode.id },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException('Demasiados intentos. Inicia sesión nuevamente.');
    }

    // Verify code
    const codeValid = await bcrypt.compare(dto.code, twoFactorCode.code);
    if (!codeValid) {
      await this.prisma.twoFactorCode.update({
        where: { id: twoFactorCode.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException(
        `Código incorrecto. Intentos restantes: ${2 - twoFactorCode.attempts}`,
      );
    }

    // Mark code as used
    await this.prisma.twoFactorCode.update({
      where: { id: twoFactorCode.id },
      data: { usedAt: new Date() },
    });

    // Get user with roles
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return this.generateTokens(user.id, user.email, roles, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles, type: 'access' },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: 900,
      },
    );

    return { accessToken };
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  // ============================================================
  // GET ME (current user profile + abilities)
  // ============================================================
  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        isVerified: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                displayName: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: { resource: true, action: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const abilities = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        action: rp.permission.action,
        subject: rp.permission.resource,
      })),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isVerified: user.isVerified,
      roles,
      abilities,
    };
  }

  // ============================================================
  // CHECK EMAIL EXISTS
  // ============================================================
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    return !!user;
  }

  // ============================================================
  // QUICK REGISTER (register + auto-login for checkout)
  // ============================================================
  async quickRegister(
    dto: RegisterDto,
    ipAddress?: string,
  ): Promise<TokenResponse & { refreshToken: string }> {
    // Generate password if not provided
    const password = dto.password || crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const customerRole = await this.prisma.role.findUnique({
      where: { name: 'customer' },
    });

    if (!customerRole) {
      throw new BadRequestException('Rol de cliente no configurado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userRoles: {
          create: { roleId: customerRole.id },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    this.logger.log(`Quick register + auto-login: ${user.email}`);

    return this.generateTokens(user.id, user.email, ['customer'], {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: ['customer'],
    });
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: { id: true, email: true },
    });

    // Always succeed silently to prevent email enumeration
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Store reset token (reuse TwoFactorCode table with a special prefix)
    await this.prisma.twoFactorCode.create({
      data: {
        userId: user.id,
        code: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.emailService.sendPasswordReset(user.email, token);
    this.logger.log(`Password reset email sent to ${user.email}`);
  }

  // ============================================================
  // RESET PASSWORD
  // ============================================================
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetCode = await this.prisma.twoFactorCode.findFirst({
      where: {
        code: tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetCode) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetCode.userId },
        data: { passwordHash },
      }),
      this.prisma.twoFactorCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetCode.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ============================================================
  // VERIFY EMAIL
  // ============================================================
  async verifyEmail(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verifyCode = await this.prisma.twoFactorCode.findFirst({
      where: {
        code: tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verifyCode) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verifyCode.userId },
        data: { isVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.twoFactorCode.update({
        where: { id: verifyCode.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  // ============================================================
  // GOOGLE OAuth
  // ============================================================
  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<TokenResponse & { refreshToken: string }> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      // Try to find by email
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email.toLowerCase() },
        include: { userRoles: { include: { role: true } } },
      });

      if (user) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatarUrl: user.avatarUrl || googleUser.avatarUrl,
            isVerified: true,
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
          },
          include: { userRoles: { include: { role: true } } },
        });
      } else {
        // Create new user
        const customerRole = await this.prisma.role.findUnique({
          where: { name: 'customer' },
        });

        user = await this.prisma.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            googleId: googleUser.googleId,
            avatarUrl: googleUser.avatarUrl,
            isVerified: true,
            emailVerifiedAt: new Date(),
            userRoles: customerRole ? { create: { roleId: customerRole.id } } : undefined,
          },
          include: { userRoles: { include: { role: true } } },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.email, roles, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    userData: TokenResponse['user'],
  ): Promise<TokenResponse & { refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, roles, type: 'access' },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: 900,
      },
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const refreshExpDays = 7;
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + refreshExpDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, user: userData, refreshToken };
  }
}
