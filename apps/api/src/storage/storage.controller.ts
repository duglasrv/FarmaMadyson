import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Subir una imagen' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.storageService.upload(file, folder || 'general');
  }

  @Post('upload-multiple')
  @RequirePermission('product', 'create')
  @ApiOperation({ summary: 'Subir múltiples imágenes' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    return this.storageService.uploadMultiple(files, folder || 'general');
  }

  @Delete('delete')
  @RequirePermission('product', 'delete')
  @ApiOperation({ summary: 'Eliminar un archivo' })
  async deleteFile(@Body('path') filePath: string) {
    await this.storageService.delete(filePath);
    return { message: 'Archivo eliminado' };
  }
}
