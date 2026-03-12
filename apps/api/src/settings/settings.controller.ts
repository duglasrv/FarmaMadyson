import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Configuración pública de la tienda' })
  findPublic() {
    return this.settingsService.findPublic();
  }

  @Get()
  @RequirePermission('settings', 'update_general')
  @ApiOperation({ summary: 'Todas las configuraciones (admin)' })
  findAll(@Query('group') group?: string) {
    return this.settingsService.findAll(group);
  }

  @Patch()
  @RequirePermission('settings', 'update_general')
  @ApiOperation({ summary: 'Guardar configuraciones' })
  upsertMany(@Body() items: UpsertSettingDto[]) {
    return this.settingsService.upsertMany(items);
  }
}
