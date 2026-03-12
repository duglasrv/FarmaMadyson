import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { userRoles: true } },
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        userRoles: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!role) throw new NotFoundException('Rol no encontrado');

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      users: role.userRoles.map((ur) => ur.user),
    };
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new BadRequestException('Ya existe un rol con ese nombre');

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          displayName: dto.displayName,
          description: dto.description,
        },
      });

      if (dto.permissionIds?.length) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      return this.findOne(role.id);
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    if (role.isSystem && role.name !== 'admin') {
      throw new BadRequestException('No se puede editar un rol del sistema');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          displayName: dto.displayName,
          description: dto.description,
        },
      });

      if (dto.permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.isSystem) throw new BadRequestException('No se puede eliminar un rol del sistema');

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Rol eliminado' };
  }

  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped: Record<
      string,
      { id: string; action: string; description: string | null }[]
    > = {};
    for (const p of permissions) {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource]!.push({
        id: p.id,
        action: p.action,
        description: p.description,
      });
    }

    return grouped;
  }
}
