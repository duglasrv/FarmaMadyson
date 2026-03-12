import { Controller, Post, Body } from '@nestjs/common';
import { CartService } from './cart.service';
import { CalculateCartDto } from './dto/calculate-cart.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('calculate')
  @Public()
  async calculate(@Body() dto: CalculateCartDto): Promise<any> {
    return this.cartService.calculate(dto);
  }
}
