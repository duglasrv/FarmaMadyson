import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateCartDto } from './dto/calculate-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute stock for a variant by summing inventory movements across all its batches.
   */
  private async getVariantStock(variantId: string): Promise<number> {
    const batches = await this.prisma.productBatch.findMany({
      where: { variantId },
      select: { id: true },
    });
    if (!batches.length) return 0;

    const result = await this.prisma.inventoryMovement.aggregate({
      where: { batchId: { in: batches.map((b) => b.id) } },
      _sum: { quantity: true },
    });
    return result._sum.quantity || 0;
  }

  async calculate(dto: CalculateCartDto): Promise<any> {
    const { items, couponCode } = dto;

    if (!items.length) {
      return {
        items: [],
        subtotal: 0,
        taxAmount: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        outOfStockItems: [],
      };
    }

    const variantIds = items.map((i) => i.variantId);

    // Fetch variants with product info
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            isActive: true,
          },
        },
      },
    });

    // Calculate stock for each variant
    const stockMap = new Map<string, number>();
    for (const v of variants) {
      stockMap.set(v.id, await this.getVariantStock(v.id));
    }

    const calculatedItems: any[] = [];
    const outOfStockItems: any[] = [];

    for (const requestedItem of items) {
      const variant = variants.find((v) => v.id === requestedItem.variantId);
      if (!variant || !variant.product.isActive) continue;

      const stock = stockMap.get(variant.id) || 0;
      const requestedQty = requestedItem.quantity;

      if (stock < requestedQty) {
        outOfStockItems.push({
          variantId: variant.id,
          name: `${variant.product.name} - ${variant.name}`,
          requested: requestedQty,
          available: Math.max(0, stock),
        });
      }

      // Use actual available quantity (capped at stock)
      const qty = Math.min(requestedQty, Math.max(0, stock));
      if (qty <= 0) continue;

      const unitPrice = Number(variant.salePrice);
      const itemSubtotal = unitPrice * qty;

      calculatedItems.push({
        variantId: variant.id,
        name: `${variant.product.name} - ${variant.name}`,
        image: variant.product.images?.[0] || null,
        quantity: qty,
        unitPrice,
        taxExempt: variant.taxExempt,
        subtotal: itemSubtotal,
      });
    }

    // Subtotals
    const subtotal = calculatedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // IVA 12% only on non-exempt items (medicines are exempt in Guatemala)
    const taxableSubtotal = calculatedItems
      .filter((i) => !i.taxExempt)
      .reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = Math.round(taxableSubtotal * 0.12 * 100) / 100;

    // Shipping: free over Q200
    const FREE_SHIPPING_THRESHOLD = 200;
    const SHIPPING_COST = 25;
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // Coupon discount (coupon → promotion holds the discount details)
    let discount = 0;
    if (couponCode) {
      const now = new Date();
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          promotion: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
        include: { promotion: true },
      });

      if (coupon) {
        const promo = coupon.promotion;
        if (promo.type === 'PERCENTAGE') {
          discount = Math.round(subtotal * (Number(promo.value) / 100) * 100) / 100;
          if (promo.maxDiscount) {
            discount = Math.min(discount, Number(promo.maxDiscount));
          }
        } else if (promo.type === 'FIXED_AMOUNT') {
          discount = Number(promo.value);
        } else if (promo.type === 'FREE_SHIPPING') {
          discount = shippingCost;
        }

        if (promo.minPurchase && subtotal < Number(promo.minPurchase)) {
          discount = 0;
        }
      }
    }

    const total = Math.max(0, Math.round((subtotal + taxAmount + shippingCost - discount) * 100) / 100);

    return {
      items: calculatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount,
      shippingCost,
      discount,
      total,
      outOfStockItems,
    };
  }
}
