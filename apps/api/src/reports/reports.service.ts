import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(query: { from?: string; to?: string }) {
    const where: Record<string, unknown> = {
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
    };

    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    where.createdAt = { gte: from, lte: to };

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true, category: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.variant.productId;
        const existing = productMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.totalPrice);
        } else {
          productMap.set(key, {
            name: item.variant.product.name,
            category: item.variant.product.category?.name || 'Sin categoría',
            quantity: item.quantity,
            revenue: Number(item.totalPrice),
          });
        }
      }
    }

    // Aggregate by category
    const categoryMap = new Map<string, { quantity: number; revenue: number }>();
    for (const p of productMap.values()) {
      const existing = categoryMap.get(p.category);
      if (existing) {
        existing.quantity += p.quantity;
        existing.revenue += p.revenue;
      } else {
        categoryMap.set(p.category, { quantity: p.quantity, revenue: p.revenue });
      }
    }

    // Daily totals
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(day);
      if (existing) {
        existing.orders += 1;
        existing.revenue += Number(order.totalAmount);
      } else {
        dailyMap.set(day, { orders: 1, revenue: Number(order.totalAmount) });
      }
    }

    return {
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length
            : 0,
      },
      byProduct: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
      byCategory: Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      daily: Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getInventoryReport() {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: { select: { name: true, category: { select: { name: true } } } },
        batches: {
          where: { expirationDate: { gte: new Date() } },
          include: { movements: true },
        },
      },
    });

    const items = variants.map((v) => {
      let totalStock = 0;
      let totalValue = 0;
      for (const b of v.batches) {
        const batchStock = b.movements.reduce((sum, m) => sum + m.quantity, 0);
        totalStock += batchStock;
        totalValue += batchStock * Number(b.costPrice);
      }

      return {
        sku: v.sku,
        product: v.product.name,
        variant: v.name,
        category: v.product.category?.name || 'Sin categoría',
        stock: totalStock,
        costPrice: Number(v.purchasePrice),
        salePrice: Number(v.salePrice),
        inventoryValue: totalValue,
        lowStockThreshold: v.lowStockThreshold,
        isLowStock: totalStock <= v.lowStockThreshold,
      };
    });

    const totalValue = items.reduce((sum, i) => sum + i.inventoryValue, 0);
    const lowStockCount = items.filter((i) => i.isLowStock).length;
    const zeroStockCount = items.filter((i) => i.stock === 0).length;

    return {
      summary: { totalValue, totalItems: items.length, lowStockCount, zeroStockCount },
      items: items.sort((a, b) => a.stock - b.stock),
    };
  }

  async getFinancialReport(query: { from?: string; to?: string }) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
      },
      include: {
        items: {
          include: {
            variant: { select: { purchasePrice: true, product: { select: { name: true } } } },
          },
        },
      },
    });

    const productMargins = new Map<string, { name: string; revenue: number; cost: number }>();

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);
      for (const item of order.items) {
        const cost = Number(item.variant.purchasePrice) * item.quantity;
        totalCost += cost;

        const key = item.variant.product.name;
        const existing = productMargins.get(key);
        if (existing) {
          existing.revenue += Number(item.totalPrice);
          existing.cost += cost;
        } else {
          productMargins.set(key, {
            name: key,
            revenue: Number(item.totalPrice),
            cost,
          });
        }
      }
    }

    return {
      summary: {
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      },
      byProduct: Array.from(productMargins.values())
        .map((p) => ({
          ...p,
          profit: p.revenue - p.cost,
          margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit),
    };
  }

  async getExpiringReport() {
    const now = new Date();
    const days30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const days60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const days90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const batches = await this.prisma.productBatch.findMany({
      where: {
        expirationDate: { gte: now, lte: days90 },
      },
      include: {
        variant: {
          include: { product: { select: { name: true } } },
        },
        movements: true,
      },
      orderBy: { expirationDate: 'asc' },
    });

    const items = batches
      .map((b) => {
        const stock = b.movements.reduce((sum, m) => sum + m.quantity, 0);
        return {
          batchNumber: b.batchNumber,
          product: b.variant.product.name,
          variant: b.variant.name,
          sku: b.variant.sku,
          quantity: stock,
          unitCost: Number(b.costPrice),
          totalValue: stock * Number(b.costPrice),
          expirationDate: b.expirationDate.toISOString(),
          daysUntilExpiry: Math.ceil((b.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          urgency: b.expirationDate <= days30 ? '30_DAYS' : b.expirationDate <= days60 ? '60_DAYS' : '90_DAYS',
        };
      })
      .filter((i) => i.quantity > 0);

    const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);

    return {
      summary: {
        totalItems: items.length,
        totalValue,
        within30Days: items.filter((i) => i.urgency === '30_DAYS').length,
        within60Days: items.filter((i) => i.urgency === '60_DAYS').length,
        within90Days: items.filter((i) => i.urgency === '90_DAYS').length,
      },
      items,
    };
  }
}
