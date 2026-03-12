import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrescriptionsService } from './prescriptions.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly storageService: StorageService,
  ) {}

  /** Customer uploads a prescription (logged-in) */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('patientName') patientName?: string,
    @Body('patientPhone') patientPhone?: string,
    @Body('notes') notes?: string,
  ) {
    const { url } = await this.storageService.upload(file, 'prescriptions');
    return this.prescriptionsService.create({
      userId,
      imageUrl: url,
      patientName,
      patientPhone,
      notes,
    });
  }

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
