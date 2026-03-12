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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Admin: list all reviews
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('review', 'read')
  @ApiOperation({ summary: 'Listar todas las reseñas (admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isApproved') isApproved?: string,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isApproved,
      rating: rating ? parseInt(rating, 10) : undefined,
      search,
    });
  }

  // Admin: stats
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('review', 'read')
  @ApiOperation({ summary: 'Estadísticas de reseñas' })
  getStats() {
    return this.reviewsService.getStats();
  }

  // Public: get reviews for a product
  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Obtener reseñas de un producto (público)' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  // Authenticated: create review
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear reseña (cliente autenticado)' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.sub, dto);
  }

  // Admin: approve
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('review', 'update')
  @ApiOperation({ summary: 'Aprobar reseña' })
  approve(@Param('id') id: string) {
    return this.reviewsService.approve(id);
  }

  // Admin: reject
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('review', 'update')
  @ApiOperation({ summary: 'Rechazar reseña' })
  reject(@Param('id') id: string) {
    return this.reviewsService.reject(id);
  }

  // Admin: delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RequirePermission('review', 'delete')
  @ApiOperation({ summary: 'Eliminar reseña' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
