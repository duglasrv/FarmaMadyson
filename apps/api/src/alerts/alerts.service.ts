import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock() {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true, product: { deletedAt: null } },
      include: {
        product: { select: { name: true } },
        batches: {
          where: { expirationDate: { gt: new Date() } },
          include: { movements: { select: { quantity: true } } },
        },
      },
    });

    for (const variant of variants) {
      const stock = variant.batches.reduce(
        (sum: number, b) =>
          sum + b.movements.reduce((s: number, m) => s + m.quantity, 0),
        0,
      );
      if (stock <= variant.lowStockThreshold) {
        this.logger.warn(
          `LOW STOCK: ${variant.product.name} (${variant.sku}) — ${stock} units remaining (threshold: ${variant.lowStockThreshold})`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkPendingOrders() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingOrders = await this.prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
    });

    if (pendingOrders > 0) {
      this.logger.warn(
        `PENDING ORDERS ALERT: ${pendingOrders} orders pending for more than 24 hours`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkExpiringBatches() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringSoon = await this.prisma.productBatch.findMany({
      where: {
        expirationDate: { lte: in30Days, gt: now },
        movements: { some: {} },
      },
      include: {
        variant: { include: { product: { select: { name: true } } } },
        movements: { select: { quantity: true } },
      },
    });

    const activeBatches = expiringSoon.filter(
      (b) => b.movements.reduce((s: number, m) => s + m.quantity, 0) > 0,
    );

    if (activeBatches.length > 0) {
      this.logger.warn(
        `EXPIRY ALERT (30 days): ${activeBatches.length} batches expiring soon`,
      );
      for (const batch of activeBatches) {
        const qty = batch.movements.reduce(
          (s: number, m) => s + m.quantity,
          0,
        );
        this.logger.warn(
          `  → ${batch.variant.product.name} (${batch.variant.sku}) Batch: ${batch.batchNumber ?? 'N/A'} Expires: ${batch.expirationDate.toISOString().slice(0, 10)} Qty: ${qty}`,
        );
      }
    }

    const expiring60 = await this.prisma.productBatch.count({
      where: {
        expirationDate: { lte: in60Days, gt: in30Days },
      },
    });

    const expiring90 = await this.prisma.productBatch.count({
      where: {
        expirationDate: { lte: in90Days, gt: in60Days },
      },
    });

    if (expiring60 > 0) {
      this.logger.warn(
        `EXPIRY NOTICE (30-60 days): ${expiring60} batches approaching expiry`,
      );
    }
    if (expiring90 > 0) {
      this.logger.log(
        `EXPIRY INFO (60-90 days): ${expiring90} batches within 90-day window`,
      );
    }
  }
}
