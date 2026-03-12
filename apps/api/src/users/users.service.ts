import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private readonly userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatarUrl: true,
    isActive: true,
    isVerified: true,
    lastLoginAt: true,
    createdAt: true,
    userRoles: {
      include: { role: { select: { id: true, name: true, displayName: true } } },
    },
    _count: { select: { orders: true } },
  } as const;

  async findAll(query: ListUsersQueryDto) {
    const { page = 1, limit = 20, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.userRoles = { some: { role: { name: role } } };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(this.formatUser),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.userSelect,
        emailVerifiedAt: true,
        googleId: true,
        twoFactorEnabled: true,
        addresses: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.formatUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updated = await this.prisma.user.update({
      where: { id },
      select: this.userSelect,
      data: dto,
    });

    return this.formatUser(updated);
  }

  async getUserOrders(id: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const skip = (page - 1) * limit;
    const where = { userId: id };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async assignRole(userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!role) throw new NotFoundException('Rol no encontrado');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (existing) throw new BadRequestException('El usuario ya tiene este rol');

    await this.prisma.userRole.create({
      data: { userId, roleId },
    });

    // Invalidate CASL cache
    await this.redis.del(`abilities:${userId}`);

    return this.findOne(userId);
  }

  async removeRole(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!userRole) throw new NotFoundException('El usuario no tiene este rol');

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    // Invalidate CASL cache
    await this.redis.del(`abilities:${userId}`);

    return this.findOne(userId);
  }

  private formatUser(user: any) {
    const { userRoles, _count, ...rest } = user;
    return {
      ...rest,
      roles: userRoles?.map((ur: any) => ur.role) ?? [],
      orderCount: _count?.orders ?? 0,
    };
  }
}
