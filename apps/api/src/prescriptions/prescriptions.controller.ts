import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @RequirePermission('prescription', 'view_all')
  findAll(@Query() query: { status?: string }) {
    return this.prescriptionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('prescription', 'view_all')
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermission('prescription', 'update')
  approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.prescriptionsService.approve(id, req.user.id, body.notes);
  }

  @Patch(':id/reject')
  @RequirePermission('prescription', 'update')
  reject(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.prescriptionsService.reject(id, req.user.id, body.rejectionReason);
  }
}
