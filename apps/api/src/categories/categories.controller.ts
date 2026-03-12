import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Árbol de categorías (público)' })
  findTree() {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Categoría por slug con productos' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('category', 'create')
  @ApiOperation({ summary: 'Crear categoría' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('category', 'update')
  @ApiOperation({ summary: 'Reordenar categorías' })
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(dto.items);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('category', 'update')
  @ApiOperation({ summary: 'Actualizar categoría' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('category', 'delete')
  @ApiOperation({ summary: 'Eliminar categoría' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
