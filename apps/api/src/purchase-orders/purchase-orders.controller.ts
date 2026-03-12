import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  @Get()
  @RequirePermission('purchase_order', 'read')
  @ApiOperation({ summary: 'Lista de órdenes de compra' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.purchaseOrdersService.findAll(status, page ?? 1, limit ?? 20);
  }

  @Post()
  @RequirePermission('purchase_order', 'create')
  @ApiOperation({ summary: 'Crear orden de compra (DRAFT)' })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseOrdersService.create(dto, user.sub);
  }

  @Post(':id/send')
  @RequirePermission('purchase_order', 'update')
  @ApiOperation({ summary: 'Marcar orden como enviada' })
  markAsSent(@Param('id') id: string) {
    return this.purchaseOrdersService.markAsSent(id);
  }

  @Post(':id/receive')
  @RequirePermission('purchase_order', 'update')
  @ApiOperation({ summary: 'Recibir mercadería de la orden' })
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseOrdersService.receive(id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('purchase_order', 'delete')
  @ApiOperation({ summary: 'Cancelar orden (solo en DRAFT)' })
  cancel(@Param('id') id: string) {
    return this.purchaseOrdersService.cancel(id);
  }
}
