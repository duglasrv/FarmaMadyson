import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesToday, pendingOrders, lowStockCount, expiringSoonCount] =
      await Promise.all([
        // Sales today
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

    return {
      salesToday: {
        amount: Number(salesToday._sum.totalAmount || 0),
        count: salesToday._count,
      },
      pendingOrders,
      lowStockCount,
      expiringSoonCount,
    };
  }

  async getSalesChart() {
    const days = 7;
    const results: { date: string; total: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const agg = await this.prisma.order.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
          },
        },
        _sum: { totalAmount: true },
      });

      results.push({
        date: start.toISOString().slice(0, 10),
        total: Number(agg._sum.totalAmount || 0),
      });
    }
    return results;
  }

  async getTopProducts() {
    const items = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const variantIds = items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return items.map((item) => {
      const v = variantMap.get(item.variantId);
      return {
        variantId: item.variantId,
        productName: v?.product?.name || 'Desconocido',
        variantName: v?.name || '',
        quantity: item._sum.quantity || 0,
        revenue: Number(item._sum.totalPrice || 0),
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
    const [kpis, salesChart, topProducts, ordersByStatus, recentOrders, recentAlerts] =
      await Promise.all([
        this.getKpis(),
        this.getSalesChart(),
        this.getTopProducts(),
        this.getOrdersByStatus(),
        this.getRecentOrders(),
        this.getRecentAlerts(),
      ]);

    return {
      kpis,
      salesChart,
      topProducts,
      ordersByStatus,
      recentOrders,
      recentAlerts,
    };
  }
}
