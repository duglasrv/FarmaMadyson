import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Generate next sale number: V-YYYYMMDD-XXXX
   */
  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `V-${dateStr}-`;

    const lastSale = await this.prisma.posSale.findFirst({
      where: { saleNumber: { startsWith: prefix } },
      orderBy: { saleNumber: 'desc' },
    });

    let seq = 1;
    if (lastSale) {
      const lastSeq = parseInt(lastSale.saleNumber.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Search POS clients by NIT
   */
  async searchClient(nit: string) {
    return this.prisma.posClient.findUnique({ where: { nit } });
  }

  /**
   * Create or update a POS client
   */
  async upsertClient(data: {
    nit: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    return this.prisma.posClient.upsert({
      where: { nit: data.nit },
      update: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
      },
      create: data,
    });
  }

  /**
   * Search products for POS — by name, SKU, or barcode
   */
  async searchProducts(query: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: query, mode: 'insensitive' } } } },
          { variants: { some: { barcode: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            salePrice: true,
            taxExempt: true,
          },
        },
      },
      take: 20,
    });

    // Add stock info
    const results = await Promise.all(
      products.map(async (p) => {
        const variantsWithStock = await Promise.all(
          p.variants.map(async (v) => {
            const stock = await this.getVariantStock(v.id);
            return { ...v, stock };
          }),
        );
        return {
          id: p.id,
          name: p.name,
          images: p.images,
          variants: variantsWithStock.filter((v) => v.stock > 0),
        };
      }),
    );

    return results.filter((p) => p.variants.length > 0);
  }

  /**
   * Create a POS sale — deducts inventory via FEFO
   */
  async createSale(dto: CreatePosSaleDto, sellerId: string) {
    if (!dto.items.length) {
      throw new BadRequestException('Debe agregar al menos un producto.');
    }

    // 1. Validate variants and get prices from DB
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { product: { select: { name: true } } },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Algunos productos no están disponibles.');
    }

    // 2. Validate stock
    for (const item of dto.items) {
      const stock = await this.getVariantStock(item.variantId);
      if (stock < item.quantity) {
        const variant = variants.find((v) => v.id === item.variantId);
        throw new BadRequestException(
          `Stock insuficiente para ${variant?.product.name} (${variant?.name}). Disponible: ${stock}`,
        );
      }
    }

    // 3. Compute totals from DB prices (never trust client)
    const saleItems = dto.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const price = Number(variant.salePrice);
      return {
        variantId: item.variantId,
        name: `${variant.product.name} - ${variant.name}`,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,
      };
    });

    const subtotal = saleItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = dto.discount ?? 0;
    const total = subtotal - discount;

    if (total < 0) {
      throw new BadRequestException('El descuento no puede superar el subtotal.');
    }

    // 4. Calculate change if cash payment
    const paymentMethod = dto.paymentMethod || 'CASH';
    let cashReceived: number | undefined;
    let change: number | undefined;

    if (paymentMethod === 'CASH' && dto.cashReceived) {
      if (dto.cashReceived < total) {
        throw new BadRequestException('El efectivo recibido es insuficiente.');
      }
      cashReceived = dto.cashReceived;
      change = dto.cashReceived - total;
    }

    // 5. Handle POS client (upsert if NIT provided)
    let clientId: string | undefined;
    const clientNit = dto.clientNit?.trim() || 'CF';
    const clientName = dto.clientName?.trim() || 'Consumidor Final';

    if (clientNit !== 'CF' && clientNit !== '') {
      const client = await this.upsertClient({
        nit: clientNit,
        name: clientName,
        address: dto.clientAddress,
        phone: dto.clientPhone,
        email: dto.clientEmail,
      });
      clientId = client.id;
    }

    // 6. Create sale + items in transaction
    const saleNumber = await this.generateSaleNumber();

    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.posSale.create({
        data: {
          saleNumber,
          clientId,
          clientNit,
          clientName,
          subtotal,
          discount,
          total,
          paymentMethod: paymentMethod as any,
          cashReceived,
          change,
          sellerId,
          notes: dto.notes,
          items: {
            create: saleItems.map((item) => ({
              variantId: item.variantId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          seller: { select: { firstName: true, lastName: true } },
          client: true,
        },
      });

      // 7. Deduct inventory via FEFO for each item
      for (const item of dto.items) {
        await this.inventoryService.allocateStock(
          item.variantId,
          item.quantity,
          sellerId,
        );
      }

      return created;
    });

    this.logger.log(`POS sale created: ${saleNumber} — Total: Q${total}`);
    return sale;
  }

  /**
   * Get a sale by ID (for receipt reprint)
   */
  async findOne(id: string) {
    const sale = await this.prisma.posSale.findUnique({
      where: { id },
      include: {
        items: true,
        seller: { select: { firstName: true, lastName: true } },
        client: true,
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  /**
   * List sales with date filters
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    sellerId?: string;
  }) {
    const where: any = {};

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (query.sellerId) where.sellerId = query.sellerId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [sales, total] = await Promise.all([
      this.prisma.posSale.findMany({
        where,
        include: {
          seller: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.posSale.count({ where }),
    ]);

    return {
      data: sales,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Today's sales summary
   */
  async todaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [salesCount, totals] = await Promise.all([
      this.prisma.posSale.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.posSale.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow } },
        _sum: { total: true, discount: true },
      }),
    ]);

    return {
      salesCount,
      totalSales: Number(totals._sum.total ?? 0),
      totalDiscount: Number(totals._sum.discount ?? 0),
    };
  }

  private async getVariantStock(variantId: string): Promise<number> {
    const result = await this.prisma.inventoryMovement.aggregate({
      where: {
        batch: { variantId, expirationDate: { gt: new Date() } },
      },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
