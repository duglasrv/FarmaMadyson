import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findTree', () => {
    it('should return cached tree if available', async () => {
      const cached = [{ id: 'c-1', name: 'Medicamentos' }];
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findTree();
      expect(result).toEqual(cached);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache when no cache', async () => {
      const categories = [{ id: 'c-1', name: 'Med', children: [] }];
      prisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findTree();
      expect(result).toEqual(categories);
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      const cat = { id: 'c-1', slug: 'medicamentos', name: 'Medicamentos' };
      prisma.category.findUnique.mockResolvedValue(cat);

      const result = await service.findBySlug('medicamentos');
      expect(result.id).toBe('c-1');
    });

    it('should throw NotFoundException for missing category', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({ id: 'c-1', name: 'Vitaminas', slug: 'vitaminas' });

      const result = await service.create({ name: 'Vitaminas' });
      expect(result.slug).toBe('vitaminas');
      expect(redis.delPattern).toHaveBeenCalledWith('categories:*');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Existing' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a category', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'c-1',
        _count: { products: 0, children: 0 },
      });
      prisma.category.update.mockResolvedValue({});

      const result = await service.remove('c-1');
      expect(result.message).toBe('Categoría eliminada');
    });

    it('should prevent deletion with associated products', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'c-1',
        _count: { products: 5, children: 0 },
      });

      await expect(service.remove('c-1')).rejects.toThrow(ConflictException);
    });
  });
});
