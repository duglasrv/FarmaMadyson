import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any> {
    return this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchaseOrders: true, batches: true },
        },
      },
    });
  }

  async create(dto: CreateSupplierDto): Promise<any> {
    return this.prisma.supplier.create({
      data: {
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        nit: dto.nit,
        paymentTerms: dto.paymentTerms,
        isActive: dto.isActive ?? true,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<any> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async getHistory(id: string): Promise<any> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      include: {
        items: {
          include: {
            purchaseOrder: false,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { supplier, purchaseOrders };
  }
}
