import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    imageUrl: string;
    patientName?: string;
    patientPhone?: string;
    notes?: string;
    orderId?: string;
  }) {
    return this.prisma.prescription.create({
      data: {
        userId: data.userId,
        imageUrl: data.imageUrl,
        patientName: data.patientName || undefined,
        patientPhone: data.patientPhone || undefined,
        notes: data.notes || undefined,
        orderId: data.orderId || undefined,
        status: 'PENDING',
      },
    });
  }

  async findAll(query: { status?: string }) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    return this.prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            items: {
              include: {
                variant: {
                  include: { product: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!prescription) throw new NotFoundException('Receta no encontrada');
    return prescription;
  }

  async approve(id: string, reviewerId: string, notes?: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!prescription) throw new NotFoundException('Receta no encontrada');
    if (prescription.status !== 'PENDING') {
      throw new BadRequestException('La receta ya fue revisada');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          notes,
        },
      });

      // If order exists and is pending prescription, advance to CONFIRMED
      if (prescription.orderId && prescription.order?.status === 'PENDING_PRESCRIPTION') {
        await tx.order.update({
          where: { id: prescription.orderId },
          data: { status: 'CONFIRMED' },
        });
      }

      return updated;
    });
  }

  async reject(id: string, reviewerId: string, rejectionReason: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException('Receta no encontrada');
    if (prescription.status !== 'PENDING') {
      throw new BadRequestException('La receta ya fue revisada');
    }

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });
  }
}
