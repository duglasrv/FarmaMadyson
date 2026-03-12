import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      role: { findUnique: jest.fn() },
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      twoFactorCode: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('secret') } },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'customer' });
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const result = await service.register({
        email: 'test@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com' }),
        }),
      );
    });

    it('should throw ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: 'Password123!' };

    it('should throw UnauthorizedException for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed',
        isActive: true,
        userRoles: [{ role: { name: 'customer' } }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for disabled account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'hashed',
        isActive: false,
        userRoles: [],
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid customer login', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed',
        isActive: true,
        firstName: 'Test',
        lastName: 'User',
        twoFactorEnabled: false,
        userRoles: [{ role: { name: 'customer' } }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should return 2FA response for admin with 2FA enabled', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        passwordHash: 'hashed',
        isActive: true,
        twoFactorEnabled: true,
        userRoles: [{ role: { name: 'admin' } }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');
      prisma.twoFactorCode.create.mockResolvedValue({});

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('requiresTwoFactor', true);
      expect(result).toHaveProperty('tempToken');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('some-refresh-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
