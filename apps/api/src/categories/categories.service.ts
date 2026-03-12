import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findTree(): Promise<any> {
    const cacheKey = 'categories:tree';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(categories), CACHE_TTL);
    return categories;
  }

  async findBySlug(slug: string): Promise<any> {
    const cacheKey = `categories:slug:${slug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const category = await this.prisma.category.findUnique({
      where: { slug, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.redis.set(cacheKey, JSON.stringify(category), CACHE_TTL);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<any> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Categoría con slug "${slug}" ya existe`);

    const result = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.redis.delPattern('categories:*');
    return result;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<any> {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const data: any = { ...dto };
    if (dto.name && dto.name !== category.name) {
      data.slug = this.generateSlug(dto.name);
    }

    const result = await this.prisma.category.update({ where: { id }, data });
    await this.redis.delPattern('categories:*');
    return result;
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    await this.redis.delPattern('categories:*');
    return { message: 'Orden actualizado' };
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (category._count.products > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría con productos asociados',
      );
    }

    if (category._count.children > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría con subcategorías',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.redis.delPattern('categories:*');
    return { message: 'Categoría eliminada' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
