import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (antes de comprimir)
const MAX_DIMENSION = 1920; // px máximo en cualquier lado
const WEBP_QUALITY = 80; // calidad WebP (0-100)

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL', '');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY', '');
    this.bucket = this.config.get<string>('SUPABASE_BUCKET', 'farma-madyson');
    this.publicUrl = `${url}/storage/v1/object/public/${this.bucket}`;

    this.supabase = createClient(url, key);

    if (!url || !key) {
      this.logger.warn('Supabase not configured — uploads will fail');
    }
  }

  /**
   * Comprime y redimensiona la imagen a WebP.
   * - Máximo 1920px en cualquier lado (mantiene proporción)
   * - Convierte a WebP con calidad 80
   * - SVGs y GIFs se dejan intactos
   */
  private async compressImage(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ buffer: Buffer; mimetype: string; ext: string }> {
    // No comprimir SVGs ni GIFs animados
    if (mimetype === 'image/svg+xml') {
      return { buffer, mimetype, ext: '.svg' };
    }
    if (mimetype === 'image/gif') {
      return { buffer, mimetype, ext: '.gif' };
    }

    const compressed = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const savings = Math.round((1 - compressed.length / buffer.length) * 100);
    this.logger.log(
      `Imagen comprimida: ${(buffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (-${savings}%)`,
    );

    return { buffer: compressed, mimetype: 'image/webp', ext: '.webp' };
  }

  async upload(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; path: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo excede el límite de 10 MB');
    }

    // Comprimir y convertir a WebP
    const { buffer, mimetype, ext } = await this.compressImage(
      file.buffer,
      file.mimetype,
    );

    const fileName = `${randomUUID()}${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }

    return {
      url: `${this.publicUrl}/${filePath}`,
      path: filePath,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<{ url: string; path: string }[]> {
    return Promise.all(files.map((file) => this.upload(file, folder)));
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      this.logger.error(`Delete failed: ${error.message}`);
    }
  }
}
