import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string, page = 1, limit = 20): Promise<any> {
    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          items: true,
          _count: { select: { batches: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreatePurchaseOrderDto, userId?: string): Promise<any> {
    // Generate order number
    const count = await this.prisma.purchaseOrder.count();
    const orderNumber = `PO-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const totalCost = item.quantity * item.unitCost;
      subtotal += totalCost;
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        status: 'DRAFT',
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        notes: dto.notes,
        createdBy: userId,
        items: { create: itemsData },
      },
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
    });
  }

  async markAsSent(id: string): Promise<any> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden enviar órdenes en estado DRAFT');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SENT', orderedAt: new Date() },
    });
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto, userId?: string): Promise<any> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    if (order.status !== 'SENT' && order.status !== 'PARTIALLY_RECEIVED') {
      throw new BadRequestException(
        'Solo se pueden recibir órdenes enviadas o parcialmente recibidas',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const receiveItem of dto.items) {
        const poItem = order.items.find(
          (i) => i.id === receiveItem.purchaseOrderItemId,
        );
        if (!poItem) {
          throw new BadRequestException(
            `Item ${receiveItem.purchaseOrderItemId} no encontrado en la orden`,
          );
        }

        const remainingToReceive = poItem.quantity - poItem.quantityReceived;
        if (receiveItem.quantityReceived > remainingToReceive) {
          throw new BadRequestException(
            `No se pueden recibir más de ${remainingToReceive} unidades para este item`,
          );
        }

        // 1. Create batch
        const batch = await tx.productBatch.create({
          data: {
            variantId: poItem.variantId,
            batchNumber: receiveItem.batchNumber,
            expirationDate: new Date(receiveItem.expirationDate),
            quantityReceived: receiveItem.quantityReceived,
            costPrice: receiveItem.costPrice ?? poItem.unitCost,
            supplierId: order.supplierId,
            purchaseOrderId: order.id,
          },
        });

        // 2. Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            batchId: batch.id,
            type: 'PURCHASE',
            quantity: receiveItem.quantityReceived,
            reference: `PO: ${order.orderNumber}`,
            notes: dto.notes,
            createdBy: userId,
          },
        });

        // 3. Update PO item quantity received
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: poItem.quantityReceived + receiveItem.quantityReceived,
          },
        });

        // 4. Resolve stock alerts
        await tx.stockAlert.updateMany({
          where: {
            variantId: poItem.variantId,
            isResolved: false,
            type: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
          },
          data: { isResolved: true, resolvedAt: new Date(), resolvedBy: userId },
        });
      }

      // Determine new order status
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = updatedItems.every(
        (item) => item.quantityReceived >= item.quantity,
      );

      const newStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          receivedAt: allReceived ? new Date() : undefined,
        },
        include: { items: true, supplier: { select: { name: true } } },
      });

      this.logger.log(
        `PO ${order.orderNumber} updated to ${newStatus}`,
      );

      return updatedOrder;
    });
  }

  async cancel(id: string): Promise<any> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden cancelar órdenes en estado DRAFT');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
