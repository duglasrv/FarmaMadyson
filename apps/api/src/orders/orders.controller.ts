import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================================
  // CUSTOMER
  // ============================================================

  @Post('checkout')
  async checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<any> {
    return this.ordersService.checkout(userId, dto);
  }

  @Public()
  @Post('guest-checkout')
  async guestCheckout(
    @Body() dto: GuestCheckoutDto,
  ): Promise<any> {
    return this.ordersService.guestCheckout(dto);
  }

  @Get('my')
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<any> {
    return this.ordersService.getMyOrders(userId, page, limit);
  }

  @Get('my/:id')
  async getMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<any> {
    return this.ordersService.getMyOrder(userId, orderId);
  }

  @Post(':id/upload-proof')
  async uploadPaymentProof(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body('proofUrl') proofUrl: string,
  ): Promise<any> {
    return this.ordersService.uploadPaymentProof(userId, orderId, proofUrl);
  }

  @Post(':id/upload-prescription')
  async uploadPrescription(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body('prescriptionUrl') prescriptionUrl: string,
  ): Promise<any> {
    return this.ordersService.uploadPrescription(userId, orderId, prescriptionUrl);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  @Get()
  @RequirePermission('order', 'read')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.ordersService.findAll(page, limit, status, search);
  }

  @Get(':id')
  @RequirePermission('order', 'read')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermission('order', 'update_status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') adminId: string,
  ): Promise<any> {
    return this.ordersService.updateStatus(orderId, dto, adminId);
  }

  @Post(':id/verify-payment')
  @RequirePermission('order', 'verify_payment')
  async verifyPayment(
    @Param('id') orderId: string,
    @CurrentUser('id') adminId: string,
  ): Promise<any> {
    return this.ordersService.verifyPayment(orderId, adminId);
  }
}
