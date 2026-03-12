import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('settings', 'manage_roles')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @RequirePermission('settings', 'manage_roles')
  getPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermission('settings', 'manage_roles')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermission('settings', 'manage_roles')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('settings', 'manage_roles')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('settings', 'manage_roles')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
