import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Banners activos (público)' })
  findPublic() {
    return this.bannersService.findPublic();
  }

  @Get()
  @RequirePermission('banner', 'read')
  @ApiOperation({ summary: 'Todos los banners (admin)' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @RequirePermission('banner', 'create')
  @ApiOperation({ summary: 'Crear banner' })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('banner', 'update')
  @ApiOperation({ summary: 'Actualizar banner' })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @RequirePermission('banner', 'update')
  @ApiOperation({ summary: 'Activar/desactivar banner' })
  toggle(@Param('id') id: string) {
    return this.bannersService.toggle(id);
  }

  @Delete(':id')
  @RequirePermission('banner', 'delete')
  @ApiOperation({ summary: 'Eliminar banner' })
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
