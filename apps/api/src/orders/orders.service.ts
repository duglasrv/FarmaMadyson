import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

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

  /**
   * Checkout — R2 compliant: prices from DB, stock deduction via FEFO
   */
  async checkout(userId: string, dto: CreateCheckoutDto): Promise<any> {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = dto;

    if (!items.length) {
      throw new BadRequestException('El carrito está vacío.');
    }

    // 1. Fetch variant prices from DB (NEVER trust client prices)
    const variantIds = items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
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

    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        'Algunos productos ya no están disponibles.',
      );
    }

    // 2. Calculate stock for each variant
    const stockMap = new Map<string, number>();
    for (const v of variants) {
      stockMap.set(v.id, await this.getVariantStock(v.id));
    }

    // 3. Validate stock and build order items
    const orderItems: {
      variantId: string;
      quantity: number;
      unitPrice: number;
      taxExempt: boolean;
      subtotal: number;
      taxAmount: number;
    }[] = [];

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const stock = stockMap.get(variant.id) || 0;

      if (stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${variant.product.name} - ${variant.name}". Disponible: ${Math.max(0, stock)}`,
        );
      }

      const unitPrice = Number(variant.salePrice);
      const itemSubtotal = unitPrice * item.quantity;
      const itemTax = variant.taxExempt ? 0 : Math.round(itemSubtotal * 0.12 * 100) / 100;

      orderItems.push({
        variantId: variant.id,
        quantity: item.quantity,
        unitPrice,
        taxExempt: variant.taxExempt,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
      });
    }

    // 4. Calculate totals
    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const taxAmount = orderItems.reduce((s, i) => s + i.taxAmount, 0);

    const FREE_SHIPPING = 200;
    const SHIPPING_COST = 25;
    const shippingCost = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;

    // Coupon (coupon → promotion holds the discount details)
    let discountAmount = 0;
    let couponId: string | null = null;
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
        if (promo.minPurchase && subtotal < Number(promo.minPurchase)) {
          throw new BadRequestException(
            `El cupón requiere un pedido mínimo de Q${promo.minPurchase}.`,
          );
        }
        if (promo.type === 'PERCENTAGE') {
          discountAmount = Math.round(subtotal * (Number(promo.value) / 100) * 100) / 100;
          if (promo.maxDiscount) discountAmount = Math.min(discountAmount, Number(promo.maxDiscount));
        } else if (promo.type === 'FIXED_AMOUNT') {
          discountAmount = Number(promo.value);
        } else if (promo.type === 'FREE_SHIPPING') {
          discountAmount = shippingCost;
        }
        couponId = coupon.id;
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount + shippingCost - discountAmount) * 100) / 100);

    // 5. Generate order number
    const orderCount = await this.prisma.order.count();
    const orderNumber = `FM-${String(orderCount + 1).padStart(6, '0')}`;

    // 6. Create order in transaction + deduct stock via FEFO
    const order = await this.prisma.$transaction(async (tx) => {
      // Create address if new
      let shippingAddressId = dto.addressId;
      if (!shippingAddressId) {
        const addr = await tx.address.create({
          data: {
            userId,
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            department: shippingAddress.department,
            instructions: shippingAddress.instructions,
          },
        });
        shippingAddressId = addr.id;
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId,
          notes,
          subtotal,
          taxAmount,
          shippingCost,
          discountAmount,
          totalAmount,
          couponId,
          paymentMethod: paymentMethod as PaymentMethod,
          status: OrderStatus.PENDING,
          items: {
            create: orderItems.map((oi) => ({
              variantId: oi.variantId,
              quantity: oi.quantity,
              unitPrice: oi.unitPrice,
              taxAmount: oi.taxAmount,
              taxExempt: oi.taxExempt,
              discountAmount: 0,
              totalPrice: oi.subtotal + oi.taxAmount,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              notes: 'Pedido creado',
              changedBy: userId,
            },
          },
        },
        include: { items: true },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod as PaymentMethod,
          amount: totalAmount,
          status: PaymentStatus.PENDING,
        },
      });

      return newOrder;
    });

    // 7. Deduct stock via FEFO (outside transaction for performance)
    try {
      for (const item of orderItems) {
        await this.inventoryService.allocateStock(
          item.variantId,
          item.quantity,
          userId,
        );
      }
    } catch (err) {
      this.logger.error(`Stock deduction failed for order ${orderNumber}`, err);
      // Mark order as needing manual review
      await this.prisma.order.update({
        where: { id: order.id },
        data: { notes: `${notes || ''}\n[ALERTA] Error deduciendo stock. Verificar manualmente.` },
      });
    }

    return {
      orderId: order.id,
      orderNumber,
      total: totalAmount,
      paymentMethod,
      status: 'PENDING',
    };
  }

  /**
   * Guest Checkout — creates or finds user, then places order
   */
  async guestCheckout(dto: GuestCheckoutDto): Promise<any> {
    const { email, firstName, lastName, phone, items, shippingAddress, paymentMethod, couponCode, notes } = dto;

    // Check if email already has an account
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Este correo ya tiene una cuenta registrada. Por favor inicia sesión para completar tu pedido.',
      );
    }

    // Create guest user with random password
    const randomPassword = crypto.randomBytes(10).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    const customerRole = await this.prisma.role.findUnique({
      where: { name: 'customer' },
    });

    if (!customerRole) {
      throw new BadRequestException('Rol de cliente no configurado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || shippingAddress.phone,
        userRoles: {
          create: { roleId: customerRole.id },
        },
      },
    });

    this.logger.log(`Guest checkout - user created: ${user.email}`);

    // Now place the order using the existing checkout logic
    const checkoutDto: CreateCheckoutDto = {
      items,
      shippingAddress,
      paymentMethod: paymentMethod as any,
      couponCode,
      notes,
    };

    const orderResult = await this.checkout(user.id, checkoutDto);

    return {
      ...orderResult,
      userId: user.id,
      guestEmail: user.email,
    };
  }

  /**
   * Get current user's orders
   */
  async getMyOrders(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: { take: 3 },
          payments: { select: { method: true, status: true }, take: 1 },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single order detail for current user
   */
  async getMyOrder(userId: string, orderId: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        shippingAddress: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    return order;
  }

  /**
   * Upload payment proof (bank transfer)
   */
  async uploadPaymentProof(
    userId: string,
    orderId: string,
    proofUrl: string,
  ): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');

    const payment = order.payments[0];
    if (!payment || payment.method !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Este pedido no usa transferencia bancaria.');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { proofImage: proofUrl, status: PaymentStatus.PROOF_UPLOADED },
    });

    return { message: 'Comprobante subido correctamente.' };
  }

  /**
   * Upload prescription for an order
   */
  async uploadPrescription(
    userId: string,
    orderId: string,
    prescriptionUrl: string,
  ): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');

    await this.prisma.prescription.create({
      data: {
        orderId,
        userId,
        imageUrl: prescriptionUrl,
        status: 'PENDING',
      },
    });

    return { message: 'Receta subida correctamente.' };
  }

  // ============================================================
  // ADMIN
  // ============================================================

  async findAll(page = 1, limit = 20, status?: string): Promise<any> {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { take: 2 },
          payments: { select: { method: true, status: true }, take: 1 },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: true,
        shippingAddress: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        prescriptions: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    return order;
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminId: string,
  ): Promise<any> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado.');

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: dto.status as OrderStatus },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: dto.status as OrderStatus,
          notes: dto.notes,
          changedBy: adminId,
        },
      }),
    ]);

    return { message: `Estado actualizado a ${dto.status}.` };
  }

  async verifyPayment(orderId: string, adminId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');

    const payment = order.payments[0];
    if (!payment) throw new BadRequestException('Sin pago asociado.');

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.VERIFIED, verifiedBy: adminId, verifiedAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CONFIRMED,
          notes: 'Pago verificado',
          changedBy: adminId,
        },
      }),
    ]);

    return { message: 'Pago verificado y pedido confirmado.' };
  }
}
