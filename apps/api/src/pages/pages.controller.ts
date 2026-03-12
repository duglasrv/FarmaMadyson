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
import { PagesService } from './pages.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @Public()
  findAll(@Query() query: { published?: string }) {
    return this.pagesService.findAll(query);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Get(':id')
  @RequirePermission('settings', 'manage_pages')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Post()
  @RequirePermission('settings', 'manage_pages')
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('settings', 'manage_pages')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('settings', 'manage_pages')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }
}
