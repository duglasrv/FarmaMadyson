import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PharmaInfoDto } from './dto/pharma-info.dto';
import { ProductQueryDto, SortBy } from './dto/product-query.dto';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ============================================================
  // CREATE PRODUCT
  // ============================================================
  async create(dto: CreateProductDto): Promise<any> {
    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Ya existe un producto con slug: ${slug}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          shortDescription: dto.shortDescription,
          images: dto.images ?? [],
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          productType: dto.productType as any,
          isFeatured: dto.isFeatured ?? false,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
        },
      });

      // Create variants
      if (dto.variants?.length) {
        await tx.productVariant.createMany({
          data: dto.variants.map((v, i) => ({
            productId: product.id,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            supplierCode: v.supplierCode,
            purchasePrice: v.purchasePrice,
            suggestedPrice: v.suggestedPrice,
            salePrice: v.salePrice,
            compareAtPrice: v.compareAtPrice,
            unitsPerBox: v.unitsPerBox ?? 1,
            boxCost: v.boxCost,
            taxExempt: v.taxExempt ?? true,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            weight: v.weight,
            sortOrder: v.sortOrder ?? i,
          })),
        });
      }

      // Create pharma info
      if (dto.pharmaInfo) {
        await tx.pharmaceuticalInfo.create({
          data: {
            productId: product.id,
            ...dto.pharmaInfo,
          },
        });
      }

      // Create/link tags
      if (dto.tagNames?.length) {
        for (const tagName of dto.tagNames) {
          const tagSlug = this.generateSlug(tagName);
          const tag = await tx.tag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: { name: tagName, slug: tagSlug },
          });
          await tx.productTag.create({
            data: { productId: product.id, tagId: tag.id },
          });
        }
      }

      return this.findById(product.id);
    });

    await this.redis.delPattern('products:*');
    return result;
  }

  // ============================================================
  // LIST (PUBLIC) — with filters, pagination, stock
  // ============================================================
  async findAll(query: ProductQueryDto): Promise<any> {
    const cacheKey = `products:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      // Hide controlled products from public storefront
      // Products without pharmaInfo or with isControlled=false are shown
      NOT: { pharmaInfo: { isControlled: true } },
    };

    // Category filter
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    // Brand filter
    if (query.brandId) {
      where.brandId = query.brandId;
    }

    // Product type
    if (query.productType) {
      where.productType = query.productType as any;
    }

    // Prescription filter
    if (query.requiresPrescription !== undefined) {
      where.pharmaInfo = {
        requiresPrescription: query.requiresPrescription,
        isControlled: false,
      };
    }

    // Search
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        {
          pharmaInfo: {
            activeIngredient: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          variants: {
            some: { sku: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Price filter (on first variant)
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          salePrice: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        },
      };
    }

    // Ordering
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (query.sortBy) {
      case SortBy.NAME:
        orderBy = { name: 'asc' };
        break;
      case SortBy.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case SortBy.POPULAR:
        orderBy = { isFeatured: 'desc' };
        break;
      // price sorting handled post-query for accuracy
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              sku: true,
              salePrice: true,
              compareAtPrice: true,
              taxExempt: true,
            },
          },
          pharmaInfo: {
            select: {
              requiresPrescription: true,
              activeIngredient: true,
              dosageForm: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Add stock info for each product's variants
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const variantsWithStock = await Promise.all(
          product.variants.map(async (variant) => ({
            ...variant,
            stock: await this.getVariantStock(variant.id),
          })),
        );

        return {
          ...product,
          variants: variantsWithStock,
        };
      }),
    );

    // Filter by inStock if requested
    let result = productsWithStock;
    if (query.inStock) {
      result = result.filter((p) =>
        p.variants.some((v) => v.stock > 0),
      );
    }

    // Sort by price if needed
    if (query.sortBy === SortBy.PRICE_ASC) {
      result.sort((a, b) => {
        const priceA = Number(a.variants[0]?.salePrice ?? 0);
        const priceB = Number(b.variants[0]?.salePrice ?? 0);
        return priceA - priceB;
      });
    } else if (query.sortBy === SortBy.PRICE_DESC) {
      result.sort((a, b) => {
        const priceA = Number(a.variants[0]?.salePrice ?? 0);
        const priceB = Number(b.variants[0]?.salePrice ?? 0);
        return priceB - priceA;
      });
    }

    const response = {
      data: result,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    await this.redis.set(cacheKey, JSON.stringify(response), CACHE_TTL);
    return response;
  }

  // ============================================================
  // LIST (ADMIN) — includes costs, margins, full stock
  // ============================================================
  async findAllAdmin(query: ProductQueryDto): Promise<any> {
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          variants: {
            some: {
              OR: [
                { sku: { contains: query.search, mode: 'insensitive' } },
                { supplierCode: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (query.categorySlug) where.category = { slug: query.categorySlug };
    if (query.brandId) where.brandId = query.brandId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          variants: {
            orderBy: { sortOrder: 'asc' },
          },
          pharmaInfo: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const variantsWithStock = await Promise.all(
          product.variants.map(async (variant) => {
            const stock = await this.getVariantStock(variant.id);
            const margin =
              Number(variant.salePrice) > 0
                ? ((Number(variant.salePrice) - Number(variant.purchasePrice)) /
                    Number(variant.salePrice)) *
                  100
                : 0;
            return { ...variant, stock, margin: Math.round(margin * 100) / 100 };
          }),
        );
        return { ...product, variants: variantsWithStock };
      }),
    );

    return {
      data: productsWithStock,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // FIND BY SLUG (PUBLIC)
  // ============================================================
  async findBySlug(slug: string): Promise<any> {
    const cacheKey = `products:slug:${slug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        pharmaInfo: true,
        tags: { include: { tag: true } },
        reviews: {
          where: { isApproved: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    // Hide controlled products from public storefront
    if (product.pharmaInfo?.isControlled) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Add stock to variants
    const variantsWithStock = await Promise.all(
      product.variants.map(async (v) => ({
        ...v,
        stock: await this.getVariantStock(v.id),
      })),
    );

    const result = { ...product, variants: variantsWithStock };
    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  // ============================================================
  // FIND BY ID (ADMIN)
  // ============================================================
  async findById(id: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        brand: true,
        variants: { orderBy: { sortOrder: 'asc' } },
        pharmaInfo: true,
        tags: { include: { tag: true } },
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    const variantsWithStock = await Promise.all(
      product.variants.map(async (v) => ({
        ...v,
        stock: await this.getVariantStock(v.id),
      })),
    );

    return { ...product, variants: variantsWithStock };
  }

  // ============================================================
  // UPDATE PRODUCT
  // ============================================================
  async update(id: string, dto: UpdateProductDto): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name && dto.name !== product.name) {
      data.name = dto.name;
      data.slug = this.generateSlug(dto.name);
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.shortDescription !== undefined) data.shortDescription = dto.shortDescription;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.metaTitle !== undefined) data.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) data.metaDescription = dto.metaDescription;
    if (dto.productType !== undefined) data.productType = dto.productType as any;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.categoryId) data.category = { connect: { id: dto.categoryId } };
    if (dto.brandId) data.brand = { connect: { id: dto.brandId } };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      // Update pharma info
      if (dto.pharmaInfo) {
        await tx.pharmaceuticalInfo.upsert({
          where: { productId: id },
          update: dto.pharmaInfo,
          create: { productId: id, ...dto.pharmaInfo },
        });
      }

      // Update tags
      if (dto.tagNames) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        for (const tagName of dto.tagNames) {
          const tagSlug = this.generateSlug(tagName);
          const tag = await tx.tag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: { name: tagName, slug: tagSlug },
          });
          await tx.productTag.create({
            data: { productId: id, tagId: tag.id },
          });
        }
      }

      return this.findById(id);
    });
    await this.redis.delPattern('products:*');
    return result;
  }

  // ============================================================
  // SOFT DELETE
  // ============================================================
  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.redis.delPattern('products:*');
    return { message: 'Producto eliminado' };
  }

  // ============================================================
  // VARIANT OPERATIONS
  // ============================================================
  async addVariant(productId: string, dto: CreateVariantDto): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        supplierCode: dto.supplierCode,
        purchasePrice: dto.purchasePrice,
        suggestedPrice: dto.suggestedPrice,
        salePrice: dto.salePrice,
        compareAtPrice: dto.compareAtPrice,
        unitsPerBox: dto.unitsPerBox ?? 1,
        boxCost: dto.boxCost,
        taxExempt: dto.taxExempt ?? true,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        weight: dto.weight,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateVariantDto): Promise<any> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto as any,
    });
  }

  async updatePharmaInfo(productId: string, dto: PharmaInfoDto): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.pharmaceuticalInfo.upsert({
      where: { productId },
      update: dto,
      create: { productId, ...dto },
    });
  }

  // ============================================================
  // STOCK CALCULATION — NEVER a stored field, always computed
  // ============================================================
  async getVariantStock(variantId: string): Promise<number> {
    const result = await this.prisma.inventoryMovement.aggregate({
      where: {
        batch: {
          variantId,
          expirationDate: { gt: new Date() },
        },
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity ?? 0;
  }

  // ============================================================
  // SEARCH (full-text)
  // ============================================================
  async search(q: string): Promise<any> {
    return this.findAll({ search: q, page: 1, limit: 20 });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
