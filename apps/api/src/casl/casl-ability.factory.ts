import { Injectable, Logger } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type AbilityTuple,
  type MongoQuery,
} from '@casl/ability';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type AppAbility = MongoAbility<AbilityTuple, MongoQuery>;

@Injectable()
export class CaslAbilityFactory {
  private readonly logger = new Logger(CaslAbilityFactory.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createForUser(userId: string): Promise<AppAbility> {
    // Try cache first
    const cacheKey = `abilities:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const rules = JSON.parse(cached);
        return createMongoAbility<AppAbility>(rules);
      } catch {
        // Corrupted cache, rebuild
      }
    }

    // Load permissions from DB
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user) {
      // Check if super_admin — gets all permissions
      const isSuperAdmin = user.userRoles.some(
        (ur) => ur.role.name === 'super_admin',
      );

      if (isSuperAdmin) {
        can('manage', 'all');
      } else {
        for (const userRole of user.userRoles) {
          for (const rp of userRole.role.rolePermissions) {
            can(rp.permission.action, rp.permission.resource);
          }
        }
      }
    }

    const ability = build();

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(ability.rules), 300);

    return ability;
  }

  async invalidateCache(userId: string): Promise<void> {
    await this.redis.del(`abilities:${userId}`);
  }
}
