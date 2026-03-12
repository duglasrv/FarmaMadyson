import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: list all reviews with pagination + filters
  async findAll(params: {
    page?: number;
    limit?: number;
    isApproved?: string;
    rating?: number;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.isApproved === 'true') where.isApproved = true;
    else if (params.isApproved === 'false') where.isApproved = false;

    if (params.rating) where.rating = params.rating;

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { comment: { contains: params.search, mode: 'insensitive' } },
        { product: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true, images: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // Public: get approved reviews for a product
  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // Customer: create a review
  async create(userId: string, dto: CreateReviewDto) {
    // Check product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Check for duplicate
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) throw new ConflictException('Ya has dejado una reseña para este producto');

    return this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
    });
  }

  // Admin: approve
  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');

    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  // Admin: reject (unapprove)
  async reject(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');

    return this.prisma.review.update({
      where: { id },
      data: { isApproved: false },
    });
  }

  // Admin: delete
  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');

    return this.prisma.review.delete({ where: { id } });
  }

  // Stats for admin
  async getStats() {
    const [total, approved, pending, avgRating] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { isApproved: true } }),
      this.prisma.review.count({ where: { isApproved: false } }),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    return {
      total,
      approved,
      pending,
      avgRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : 0,
    };
  }
}
