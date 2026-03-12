import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any> {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async create(dto: CreateBrandDto): Promise<any> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Laboratorio "${dto.name}" ya existe`);

    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto): Promise<any> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Laboratorio no encontrado');

    const data: any = { ...dto };
    if (dto.name && dto.name !== brand.name) {
      data.slug = this.generateSlug(dto.name);
    }

    return this.prisma.brand.update({ where: { id }, data });
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
