import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [onlineSalesToday, posSalesToday, pendingOrders, lowStockCount, expiringSoonCount] =
      await Promise.all([
        // Online sales today
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: todayStart },
            status: {
              notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
            },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        // POS sales today
        this.prisma.posSale.aggregate({
          where: { createdAt: { gte: todayStart } },
          _sum: { total: true },
          _count: true,
        }),
        // Pending orders
        this.prisma.order.count({
          where: {
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.PENDING_PAYMENT,
                OrderStatus.PENDING_PRESCRIPTION,
              ],
            },
          },
        }),
        // Low stock products
        this.prisma.stockAlert.count({
          where: { type: 'LOW_STOCK', isResolved: false },
        }),
        // Expiring in 30 days
        this.prisma.productBatch.count({
          where: {
            expirationDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
          },
        }),
      ]);

    const onlineAmount = Number(onlineSalesToday._sum.totalAmount || 0);
    const posAmount = Number(posSalesToday._sum.total || 0);

    return {
      salesToday: {
        amount: onlineAmount + posAmount,
        count: onlineSalesToday._count + posSalesToday._count,
      },
      onlineSalesToday: {
        amount: onlineAmount,
        count: onlineSalesToday._count,
      },
      posSalesToday: {
        amount: posAmount,
        count: posSalesToday._count,
      },
      pendingOrders,
      lowStockCount,
      expiringSoonCount,
    };
  }

  async getSalesChart() {
    const days = 7;
    const results: { date: string; online: number; pos: number; total: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [onlineAgg, posAgg] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            status: {
              notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
            },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.posSale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { total: true },
        }),
      ]);

      const online = Number(onlineAgg._sum.totalAmount || 0);
      const pos = Number(posAgg._sum.total || 0);

      results.push({
        date: start.toISOString().slice(0, 10),
        online,
        pos,
        total: online + pos,
      });
    }
    return results;
  }

  async getTopProducts() {
    // Combine online order items + POS sale items
    const [orderItems, posItems] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ['variantId'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 20,
      }),
      this.prisma.posSaleItem.groupBy({
        by: ['variantId'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 20,
      }),
    ]);

    // Merge quantities by variantId
    const merged = new Map<string, { quantity: number; revenue: number }>();
    for (const item of orderItems) {
      merged.set(item.variantId, {
        quantity: item._sum.quantity || 0,
        revenue: Number(item._sum.totalPrice || 0),
      });
    }
    for (const item of posItems) {
      const existing = merged.get(item.variantId) || { quantity: 0, revenue: 0 };
      merged.set(item.variantId, {
        quantity: existing.quantity + (item._sum.quantity || 0),
        revenue: existing.revenue + Number(item._sum.subtotal || 0),
      });
    }

    // Sort by quantity and take top 10
    const sorted = [...merged.entries()]
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10);

    const variantIds = sorted.map(([id]) => id);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return sorted.map(([variantId, data]) => {
      const v = variantMap.get(variantId);
      return {
        variantId,
        productName: v?.product?.name || 'Desconocido',
        variantName: v?.name || '',
        quantity: data.quantity,
        revenue: data.revenue,
      };
    });
  }

  async getOrdersByStatus() {
    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });
    return groups.map((g) => ({
      status: g.status,
      count: g._count,
    }));
  }

  async getRecentOrders() {
    return this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async getRecentPosSales() {
    return this.prisma.posSale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        saleNumber: true,
        total: true,
        paymentMethod: true,
        clientName: true,
        createdAt: true,
        seller: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async getRecentAlerts() {
    const alerts = await this.prisma.stockAlert.findMany({
      where: { isResolved: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with variant info
    const variantIds = [...new Set(alerts.map((a) => a.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return alerts.map((alert) => {
      const variant = variantMap.get(alert.variantId);
      return {
        ...alert,
        productName: variant?.product?.name || 'Desconocido',
        variantName: variant?.name || '',
        sku: variant?.sku || '',
      };
    });
  }

  async getFullDashboard() {
    const [kpis, salesChart, topProducts, ordersByStatus, recentOrders, recentPosSales, recentAlerts] =
      await Promise.all([
        this.getKpis(),
        this.getSalesChart(),
        this.getTopProducts(),
        this.getOrdersByStatus(),
        this.getRecentOrders(),
        this.getRecentPosSales(),
        this.getRecentAlerts(),
      ]);

    return {
      kpis,
      salesChart,
      topProducts,
      ordersByStatus,
      recentOrders,
      recentPosSales,
      recentAlerts,
    };
  }
}
