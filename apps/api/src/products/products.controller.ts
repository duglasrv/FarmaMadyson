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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PharmaInfoDto } from './dto/pharma-info.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // ============================================================

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista de productos (público)' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Búsqueda full-text (público)' })
  search(@Query('q') q: string) {
    return this.productsService.search(q || '');
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Detalle por slug (público)' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'read')
  @ApiOperation({ summary: 'Lista admin con stock y márgenes' })
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'read')
  @ApiOperation({ summary: 'Detalle por ID (admin)' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'update')
  @ApiOperation({ summary: 'Actualizar producto' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'delete')
  @ApiOperation({ summary: 'Eliminar producto (soft delete)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ============================================================
  // VARIANT ENDPOINTS
  // ============================================================

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Agregar variante' })
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.addVariant(id, dto);
  }

  @Patch(':id/variants/:vid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'update')
  @ApiOperation({ summary: 'Actualizar variante' })
  updateVariant(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(id, vid, dto);
  }

  @Patch(':id/pharma-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('product', 'update')
  @ApiOperation({ summary: 'Actualizar info farmacéutica' })
  updatePharmaInfo(@Param('id') id: string, @Body() dto: PharmaInfoDto) {
    return this.productsService.updatePharmaInfo(id, dto);
  }
}
