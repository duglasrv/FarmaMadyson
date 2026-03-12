import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { MovementQueryDto } from './dto/movement-query.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Resumen del inventario' })
  getDashboard() {
    return this.inventoryService.getDashboard();
  }

  @Get('variants/:id/stock')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Stock detallado de una variante' })
  getVariantStock(@Param('id') id: string) {
    return this.inventoryService.getVariantStock(id);
  }

  @Get('movements')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Lista de movimientos de inventario' })
  findMovements(@Query() query: MovementQueryDto) {
    return this.inventoryService.findMovements(query);
  }

  @Post('receive')
  @RequirePermission('inventory', 'create')
  @ApiOperation({ summary: 'Recibir mercadería' })
  receive(
    @Body() dto: ReceiveInventoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.receive(dto, user.sub);
  }

  @Post('adjust')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Ajuste manual de inventario' })
  adjust(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.adjust(dto, user.sub);
  }

  @Get('expiring')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Productos próximos a vencer' })
  getExpiring(@Query('days') days?: number) {
    return this.inventoryService.getExpiring(days ?? 30);
  }

  @Get('alerts')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Alertas activas de stock' })
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Patch('alerts/:id/resolve')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Resolver alerta' })
  resolveAlert(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.resolveAlert(id, user.sub);
  }
}
