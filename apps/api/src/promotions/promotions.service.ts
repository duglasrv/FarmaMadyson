import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { active?: string; search?: string }) {
    const where: Record<string, unknown> = {};

    if (query.active === 'true') where.isActive = true;
    else if (query.active === 'false') where.isActive = false;

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { coupons: true } } },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        coupons: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    return promo;
  }

  async create(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type as never,
        value: dto.value,
        minPurchase: dto.minPurchase,
        maxDiscount: dto.maxDiscount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
        displayLocations: dto.displayLocations ?? [],
        applicableToAll: dto.applicableToAll ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minPurchase !== undefined) data.minPurchase = dto.minPurchase;
    if (dto.maxDiscount !== undefined) data.maxDiscount = dto.maxDiscount;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.displayLocations !== undefined) data.displayLocations = dto.displayLocations;
    if (dto.applicableToAll !== undefined) data.applicableToAll = dto.applicableToAll;

    return this.prisma.promotion.update({ where: { id }, data });
  }

  async remove(id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Promoción eliminada' };
  }

  // ── Coupons ──

  async findCouponsByPromotion(promotionId: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    return this.prisma.coupon.findMany({
      where: { promotionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(dto: CreateCouponDto) {
    const promo = await this.prisma.promotion.findUnique({ where: { id: dto.promotionId } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');

    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Ya existe un cupón con ese código');

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        promotionId: dto.promotionId,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async toggleCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: !coupon.isActive },
    });
  }

  async deleteCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    await this.prisma.coupon.delete({ where: { id: couponId } });
    return { message: 'Cupón eliminado' };
  }

  // ── Validate Coupon ──

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: { promotion: true },
    });

    if (!coupon || !coupon.isActive) {
      return { valid: false, discount: 0, message: 'Cupón no válido o inactivo' };
    }

    const promo = coupon.promotion;
    const now = new Date();

    if (!promo.isActive || now < promo.startDate || now > promo.endDate) {
      return { valid: false, discount: 0, message: 'Promoción expirada o inactiva' };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'Cupón ha alcanzado el límite de uso' };
    }

    // Calculate cart subtotal
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    let subtotal = new Decimal(0);
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (variant) {
        subtotal = subtotal.add(variant.salePrice.mul(item.quantity));
      }
    }

    if (promo.minPurchase && subtotal.lt(promo.minPurchase)) {
      return {
        valid: false,
        discount: 0,
        message: `Compra mínima de Q${promo.minPurchase.toFixed(2)} requerida`,
      };
    }

    let discount = new Decimal(0);
    switch (promo.type) {
      case 'PERCENTAGE':
        discount = subtotal.mul(promo.value).div(100);
        break;
      case 'FIXED_AMOUNT':
        discount = promo.value;
        break;
      case 'FREE_SHIPPING':
        discount = new Decimal(0); // handled at checkout
        return { valid: true, discount: 0, message: 'Envío gratis aplicado', freeShipping: true };
      default:
        discount = new Decimal(0);
    }

    if (promo.maxDiscount && discount.gt(promo.maxDiscount)) {
      discount = promo.maxDiscount;
    }

    return {
      valid: true,
      discount: Number(discount),
      message: 'Cupón válido',
    };
  }
}
