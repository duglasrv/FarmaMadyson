import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { published?: string }) {
    const where: Record<string, unknown> = {};
    if (query.published === 'true') where.isPublished = true;
    else if (query.published === 'false') where.isPublished = false;

    return this.prisma.page.findMany({
      where,
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({ where: { slug } });
    if (!page || !page.isPublished) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async create(dto: CreatePageDto) {
    const existing = await this.prisma.page.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Ya existe una página con ese slug');

    return this.prisma.page.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Página no encontrada');

    if (dto.slug && dto.slug !== page.slug) {
      const existing = await this.prisma.page.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('Ya existe una página con ese slug');
    }

    return this.prisma.page.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Página no encontrada');
    await this.prisma.page.delete({ where: { id } });
    return { message: 'Página eliminada' };
  }
}
