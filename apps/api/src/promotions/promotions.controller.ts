import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // ── Promotions CRUD ──

  @Get('promotions')
  @RequirePermission('promotion', 'read')
  findAll(@Query() query: { active?: string; search?: string }) {
    return this.promotionsService.findAll(query);
  }

  @Get('promotions/:id')
  @RequirePermission('promotion', 'read')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post('promotions')
  @RequirePermission('promotion', 'create')
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch('promotions/:id')
  @RequirePermission('promotion', 'update')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete('promotions/:id')
  @RequirePermission('promotion', 'delete')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  // ── Coupons ──

  @Get('promotions/:id/coupons')
  @RequirePermission('promotion', 'read')
  getCoupons(@Param('id') id: string) {
    return this.promotionsService.findCouponsByPromotion(id);
  }

  @Post('coupons')
  @RequirePermission('promotion', 'create')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.promotionsService.createCoupon(dto);
  }

  @Patch('coupons/:id/toggle')
  @RequirePermission('promotion', 'update')
  toggleCoupon(@Param('id') id: string) {
    return this.promotionsService.toggleCoupon(id);
  }

  @Delete('coupons/:id')
  @RequirePermission('promotion', 'delete')
  deleteCoupon(@Param('id') id: string) {
    return this.promotionsService.deleteCoupon(id);
  }

  // ── Validate Coupon (public for checkout) ──

  @Post('coupons/validate')
  @Public()
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.promotionsService.validateCoupon(dto);
  }
}
