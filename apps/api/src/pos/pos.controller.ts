import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('POS')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('products/search')
  @RequirePermission('pos', 'sell')
  @ApiOperation({ summary: 'Buscar productos para POS' })
  searchProducts(@Query('q') q: string) {
    return this.posService.searchProducts(q || '');
  }

  @Get('clients/search')
  @RequirePermission('pos', 'sell')
  @ApiOperation({ summary: 'Buscar cliente por NIT' })
  searchClient(@Query('nit') nit: string) {
    return this.posService.searchClient(nit);
  }

  @Post('sales')
  @RequirePermission('pos', 'sell')
  @ApiOperation({ summary: 'Registrar venta en POS' })
  createSale(
    @Body() dto: CreatePosSaleDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.posService.createSale(dto, user.sub);
  }

  @Get('sales')
  @RequirePermission('pos', 'view_sales')
  @ApiOperation({ summary: 'Listar ventas POS' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.posService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      dateFrom,
      dateTo,
      sellerId,
    });
  }

  @Get('sales/today')
  @RequirePermission('pos', 'sell')
  @ApiOperation({ summary: 'Resumen de ventas del día' })
  todaySummary() {
    return this.posService.todaySummary();
  }

  @Get('sales/:id')
  @RequirePermission('pos', 'sell')
  @ApiOperation({ summary: 'Detalle de venta (para reimprimir)' })
  findOne(@Param('id') id: string) {
    return this.posService.findOne(id);
  }
}
