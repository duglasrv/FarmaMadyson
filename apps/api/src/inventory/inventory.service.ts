import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { MovementQueryDto } from './dto/movement-query.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // DASHBOARD — summary stats
  // ============================================================
  async getDashboard(): Promise<any> {
    const [totalVariants, totalBatches, alerts, lowStockCount, expiringCount] =
      await Promise.all([
        this.prisma.productVariant.count({ where: { isActive: true } }),
        this.prisma.productBatch.count({
          where: { expirationDate: { gt: new Date() } },
        }),
        this.prisma.stockAlert.count({ where: { isResolved: false } }),
        this.prisma.stockAlert.count({
          where: { isResolved: false, type: 'LOW_STOCK' },
        }),
        this.prisma.stockAlert.count({
          where: { isResolved: false, type: 'EXPIRING_SOON' },
        }),
      ]);

    // Calculate total inventory value
    const batches = await this.prisma.productBatch.findMany({
      where: { expirationDate: { gt: new Date() } },
      include: {
        movements: { select: { quantity: true } },
      },
    });

    let totalValue = 0;
    let totalUnits = 0;
    for (const batch of batches) {
      const stock = batch.movements.reduce((sum, m) => sum + m.quantity, 0);
      if (stock > 0) {
        totalUnits += stock;
        totalValue += stock * Number(batch.costPrice);
      }
    }

    return {
      totalVariants,
      totalBatches,
      totalUnits,
      totalValue: Math.round(totalValue * 100) / 100,
      activeAlerts: alerts,
      lowStockCount,
      expiringCount,
    };
  }

  // ============================================================
  // VARIANT STOCK DETAIL — by batch
  // ============================================================
  async getVariantStock(variantId: string): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    const batches = await this.prisma.productBatch.findMany({
      where: { variantId },
      include: {
        movements: { select: { quantity: true, type: true, createdAt: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    const batchesWithStock = batches.map((batch) => {
      const stock = batch.movements.reduce((sum, m) => sum + m.quantity, 0);
      const isExpired = batch.expirationDate < new Date();
      return {
        id: batch.id,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate,
        quantityReceived: batch.quantityReceived,
        currentStock: stock,
        costPrice: batch.costPrice,
        supplier: batch.supplier?.name,
        receivedAt: batch.receivedAt,
        isExpired,
        movementCount: batch.movements.length,
      };
    });

    const totalStock = batchesWithStock
      .filter((b) => !b.isExpired)
      .reduce((sum, b) => sum + b.currentStock, 0);

    return {
      variantId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      totalStock,
      lowStockThreshold: variant.lowStockThreshold,
      batches: batchesWithStock,
    };
  }

  // ============================================================
  // RECEIVE INVENTORY — create batch + movement
  // ============================================================
  async receive(dto: ReceiveInventoryDto, userId?: string): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create batch
      const batch = await tx.productBatch.create({
        data: {
          variantId: dto.variantId,
          batchNumber: dto.batchNumber,
          expirationDate: new Date(dto.expirationDate),
          quantityReceived: dto.quantity,
          costPrice: dto.costPrice,
          supplierId: dto.supplierId,
          notes: dto.notes,
        },
      });

      // 2. Create inventory movement (PURCHASE = positive)
      await tx.inventoryMovement.create({
        data: {
          batchId: batch.id,
          type: 'PURCHASE',
          quantity: dto.quantity,
          reference: dto.batchNumber ? `Lote: ${dto.batchNumber}` : undefined,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      // 3. Update variant purchasePrice if different
      if (Number(variant.purchasePrice) !== dto.costPrice) {
        await tx.productVariant.update({
          where: { id: dto.variantId },
          data: { purchasePrice: dto.costPrice },
        });
      }

      // 4. Resolve LOW_STOCK/OUT_OF_STOCK alerts for this variant
      await tx.stockAlert.updateMany({
        where: {
          variantId: dto.variantId,
          isResolved: false,
          type: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
        },
        data: { isResolved: true, resolvedAt: new Date(), resolvedBy: userId },
      });

      this.logger.log(
        `Received ${dto.quantity} units of variant ${dto.variantId}, batch ${batch.id}`,
      );

      return batch;
    });
  }

  // ============================================================
  // ADJUST INVENTORY
  // ============================================================
  async adjust(dto: AdjustInventoryDto, userId?: string): Promise<any> {
    const batch = await this.prisma.productBatch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) throw new NotFoundException('Lote no encontrado');

    // Validate negative adjustments don't exceed stock
    if (dto.quantity < 0) {
      const currentStock = await this.getBatchStock(dto.batchId);
      if (currentStock + dto.quantity < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${currentStock}`,
        );
      }
    }

    const movement = await this.prisma.inventoryMovement.create({
      data: {
        batchId: dto.batchId,
        type: dto.type,
        quantity: dto.quantity,
        reference: dto.reference,
        notes: dto.notes,
        createdBy: userId,
      },
    });

    // Check if stock is now low
    await this.checkStockAlerts(batch.variantId);

    return movement;
  }

  // ============================================================
  // MOVEMENTS LIST
  // ============================================================
  async findMovements(query: MovementQueryDto): Promise<any> {
    const where: Prisma.InventoryMovementWhereInput = {};

    if (query.batchId) where.batchId = query.batchId;
    if (query.variantId) where.batch = { variantId: query.variantId };
    if (query.type) where.type = query.type as any;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          batch: {
            include: {
              variant: {
                include: { product: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // EXPIRING PRODUCTS
  // ============================================================
  async getExpiring(days: number = 30): Promise<any> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        expirationDate: {
          gt: new Date(),
          lte: threshold,
        },
      },
      include: {
        variant: {
          include: { product: { select: { name: true } } },
        },
        movements: { select: { quantity: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return batches
      .map((batch) => {
        const stock = batch.movements.reduce((sum, m) => sum + m.quantity, 0);
        const daysUntilExpiry = Math.ceil(
          (batch.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          productName: batch.variant.product.name,
          variantName: batch.variant.name,
          sku: batch.variant.sku,
          currentStock: stock,
          expirationDate: batch.expirationDate,
          daysUntilExpiry,
          supplier: batch.supplier?.name,
        };
      })
      .filter((b) => b.currentStock > 0);
  }

  // ============================================================
  // ALERTS
  // ============================================================
  async getAlerts(): Promise<any> {
    return this.prisma.stockAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAlert(alertId: string, userId?: string): Promise<any> {
    const alert = await this.prisma.stockAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: { isResolved: true, resolvedAt: new Date(), resolvedBy: userId },
    });
  }

  // ============================================================
  // FEFO — First Expired, First Out (used by OrdersModule later)
  // ============================================================
  async allocateStock(
    variantId: string,
    quantity: number,
    userId?: string,
  ): Promise<{ batchId: string; quantity: number }[]> {
    const batches = await this.prisma.productBatch.findMany({
      where: {
        variantId,
        expirationDate: { gt: new Date() },
      },
      include: { movements: { select: { quantity: true } } },
      orderBy: { expirationDate: 'asc' }, // FEFO: earliest expiry first
    });

    const allocations: { batchId: string; quantity: number }[] = [];
    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const stock = batch.movements.reduce((sum, m) => sum + m.quantity, 0);
      if (stock <= 0) continue;

      const toAllocate = Math.min(stock, remaining);
      allocations.push({ batchId: batch.id, quantity: toAllocate });
      remaining -= toAllocate;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `Stock insuficiente para ${variantId}. Faltan ${remaining} unidades.`,
      );
    }

    // Create negative movements for each allocation
    for (const alloc of allocations) {
      await this.prisma.inventoryMovement.create({
        data: {
          batchId: alloc.batchId,
          type: 'SALE',
          quantity: -alloc.quantity,
          reference: 'Venta',
          createdBy: userId,
        },
      });
    }

    // Check stock alerts after sale
    await this.checkStockAlerts(variantId);

    return allocations;
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private async getBatchStock(batchId: string): Promise<number> {
    const result = await this.prisma.inventoryMovement.aggregate({
      where: { batchId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async checkStockAlerts(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    });
    if (!variant) return;

    // Calculate total stock
    const result = await this.prisma.inventoryMovement.aggregate({
      where: {
        batch: { variantId, expirationDate: { gt: new Date() } },
      },
      _sum: { quantity: true },
    });
    const totalStock = result._sum.quantity ?? 0;

    if (totalStock <= 0) {
      // OUT_OF_STOCK
      const existing = await this.prisma.stockAlert.findFirst({
        where: { variantId, type: 'OUT_OF_STOCK', isResolved: false },
      });
      if (!existing) {
        await this.prisma.stockAlert.create({
          data: {
            variantId,
            type: 'OUT_OF_STOCK',
            message: `${variant.product.name} (${variant.sku}) está agotado`,
          },
        });
      }
    } else if (totalStock <= variant.lowStockThreshold) {
      // LOW_STOCK
      const existing = await this.prisma.stockAlert.findFirst({
        where: { variantId, type: 'LOW_STOCK', isResolved: false },
      });
      if (!existing) {
        await this.prisma.stockAlert.create({
          data: {
            variantId,
            type: 'LOW_STOCK',
            message: `${variant.product.name} (${variant.sku}) tiene stock bajo: ${totalStock} unidades`,
          },
        });
      }
    }
  }
}
