import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PagesService', () => {
  let service: PagesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      page: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
  });

  describe('findBySlug', () => {
    it('should return published page', async () => {
      prisma.page.findUnique.mockResolvedValue({ id: 'p-1', slug: 'about', isPublished: true });
      const result = await service.findBySlug('about');
      expect(result.id).toBe('p-1');
    });

    it('should throw for unpublished page', async () => {
      prisma.page.findUnique.mockResolvedValue({ id: 'p-1', isPublished: false });
      await expect(service.findBySlug('draft')).rejects.toThrow(NotFoundException);
    });

    it('should throw for nonexistent page', async () => {
      prisma.page.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create page with unique slug', async () => {
      prisma.page.findUnique.mockResolvedValue(null);
      prisma.page.create.mockResolvedValue({ id: 'p-1', title: 'About', slug: 'about' });

      const result = await service.create({ title: 'About', slug: 'about', content: '<p>hi</p>' });
      expect(result.slug).toBe('about');
    });

    it('should throw for duplicate slug', async () => {
      prisma.page.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ title: 'About', slug: 'about', content: '<p>hi</p>' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete page', async () => {
      prisma.page.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.page.delete.mockResolvedValue({});

      const result = await service.remove('p-1');
      expect(result.message).toBe('Página eliminada');
    });

    it('should throw NotFoundException', async () => {
      prisma.page.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
