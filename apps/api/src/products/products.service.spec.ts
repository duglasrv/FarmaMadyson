import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: { aggregate: jest.fn() },
      productTag: { create: jest.fn(), deleteMany: jest.fn() },
      tag: { upsert: jest.fn() },
      pharmaceuticalInfo: { create: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('should return cached data if available', async () => {
      const cached = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result).toEqual(cached);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache result if no cache', async () => {
      redis.get.mockResolvedValue(null);
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      const mockProduct = {
        id: 'p-1',
        slug: 'test-product',
        variants: [{ id: 'v-1', salePrice: 100 }],
      };
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 10 } });

      const result = await service.findBySlug('test-product');
      expect(result.id).toBe('p-1');
      expect(result.variants[0].stock).toBe(10);
    });

    it('should throw NotFoundException for missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should use cache when available', async () => {
      const cached = { id: 'p-1', slug: 'cached' };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findBySlug('cached');
      expect(result).toEqual(cached);
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft-delete a product', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.product.update.mockResolvedValue({});

      const result = await service.remove('p-1');
      expect(result.message).toBe('Producto eliminado');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should invalidate cache after delete', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.product.update.mockResolvedValue({});

      await service.remove('p-1');
      expect(redis.delPattern).toHaveBeenCalledWith('products:*');
    });

    it('should throw NotFoundException for missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVariantStock', () => {
    it('should compute stock from inventory movements (never a stored field)', async () => {
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 42 } });
      const stock = await service.getVariantStock('v-1');
      expect(stock).toBe(42);
    });

    it('should return 0 when no movements exist', async () => {
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: null } });
      const stock = await service.getVariantStock('v-1');
      expect(stock).toBe(0);
    });
  });
});
