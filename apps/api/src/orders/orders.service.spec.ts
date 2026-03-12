import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let inventoryService: any;

  beforeEach(async () => {
    prisma = {
      productVariant: { findMany: jest.fn() },
      productBatch: { findMany: jest.fn() },
      inventoryMovement: { aggregate: jest.fn() },
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      coupon: { findFirst: jest.fn() },
      address: { create: jest.fn() },
      payment: { create: jest.fn(), update: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      prescription: { create: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    inventoryService = { allocateStock: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('checkout', () => {
    it('should throw BadRequestException for empty cart', async () => {
      await expect(
        service.checkout('user-1', {
          items: [],
          shippingAddress: {} as any,
          paymentMethod: 'CASH_ON_DELIVERY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if variant is unavailable', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);

      await expect(
        service.checkout('user-1', {
          items: [{ variantId: 'v-1', quantity: 1 }],
          shippingAddress: {} as any,
          paymentMethod: 'CASH_ON_DELIVERY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if stock insufficient', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        { id: 'v-1', salePrice: 50, taxExempt: true, product: { name: 'Test', isActive: true } },
      ]);
      prisma.productBatch.findMany.mockResolvedValue([]);
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });

      await expect(
        service.checkout('user-1', {
          items: [{ variantId: 'v-1', quantity: 5 }],
          shippingAddress: {} as any,
          paymentMethod: 'CASH_ON_DELIVERY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate prices server-side (never from client)', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v-1',
          salePrice: { toString: () => '100' },
          taxExempt: true,
          isActive: true,
          product: { id: 'p-1', name: 'Paracetamol', images: [], isActive: true },
        },
      ]);
      prisma.productBatch.findMany.mockResolvedValue([{ id: 'b-1' }]);
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 50 } });
      prisma.order.count.mockResolvedValue(0);
      prisma.coupon.findFirst.mockResolvedValue(null);
      prisma.address.create.mockResolvedValue({ id: 'addr-1' });
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'FM-000001',
        totalAmount: 125,
        items: [],
      });
      prisma.payment.create.mockResolvedValue({});

      const result = await service.checkout('user-1', {
        items: [{ variantId: 'v-1', quantity: 2 }],
        shippingAddress: {
          fullName: 'Test',
          phone: '12345',
          addressLine1: 'Calle 1',
          city: 'Guatemala',
          department: 'Guatemala',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      // Verify order was created with server-calculated prices
      expect(prisma.order.create).toHaveBeenCalled();
      const createCall = prisma.order.create.mock.calls[0][0];
      // unitPrice is taken from server-side salePrice, NOT from client
      expect(createCall.data.items.create[0].unitPrice).toBe(100);
    });

    it('should apply IVA 12% only to non-exempt products', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v-1',
          salePrice: { toString: () => '100' },
          taxExempt: false, // NOT exempt -> 12% IVA applies
          isActive: true,
          product: { id: 'p-1', name: 'Shampoo', images: [], isActive: true },
        },
      ]);
      prisma.productBatch.findMany.mockResolvedValue([{ id: 'b-1' }]);
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 50 } });
      prisma.order.count.mockResolvedValue(0);
      prisma.coupon.findFirst.mockResolvedValue(null);
      prisma.address.create.mockResolvedValue({ id: 'addr-1' });
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'FM-000001',
        items: [],
      });
      prisma.payment.create.mockResolvedValue({});

      await service.checkout('user-1', {
        items: [{ variantId: 'v-1', quantity: 1 }],
        shippingAddress: {
          fullName: 'Test',
          phone: '12345',
          addressLine1: 'Calle 1',
          city: 'Guatemala',
          department: 'Guatemala',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      const createCall = prisma.order.create.mock.calls[0][0];
      // Tax should be 12% of 100 = 12
      expect(createCall.data.taxAmount).toBe(12);
    });

    it('should give free shipping for orders >= Q200', async () => {
      prisma.productVariant.findMany.mockResolvedValue([
        {
          id: 'v-1',
          salePrice: { toString: () => '250' },
          taxExempt: true,
          isActive: true,
          product: { id: 'p-1', name: 'Medicine', images: [], isActive: true },
        },
      ]);
      prisma.productBatch.findMany.mockResolvedValue([{ id: 'b-1' }]);
      prisma.inventoryMovement.aggregate.mockResolvedValue({ _sum: { quantity: 50 } });
      prisma.order.count.mockResolvedValue(0);
      prisma.coupon.findFirst.mockResolvedValue(null);
      prisma.address.create.mockResolvedValue({ id: 'addr-1' });
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'FM-000001',
        items: [],
      });
      prisma.payment.create.mockResolvedValue({});

      await service.checkout('user-1', {
        items: [{ variantId: 'v-1', quantity: 1 }],
        shippingAddress: {
          fullName: 'Test',
          phone: '12345',
          addressLine1: 'Calle 1',
          city: 'Guatemala',
          department: 'Guatemala',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      const createCall = prisma.order.create.mock.calls[0][0];
      expect(createCall.data.shippingCost).toBe(0);
    });
  });

  describe('getMyOrders', () => {
    it('should return paginated orders for user', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      const result = await service.getMyOrders('user-1');
      expect(result.orders).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getMyOrder', () => {
    it('should throw NotFoundException for non-owned order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.getMyOrder('user-1', 'order-x')).rejects.toThrow(NotFoundException);
    });
  });
});
