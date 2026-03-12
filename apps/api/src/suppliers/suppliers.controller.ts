import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermission('supplier', 'read')
  @ApiOperation({ summary: 'Lista de proveedores' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Post()
  @RequirePermission('supplier', 'create')
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('supplier', 'update')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Get(':id/history')
  @RequirePermission('supplier', 'read')
  @ApiOperation({ summary: 'Historial de compras del proveedor' })
  getHistory(@Param('id') id: string) {
    return this.suppliersService.getHistory(id);
  }
}
