import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

interface LocalUploadResult {
  key: string;
  publicUrl: string;
}

/**
 * Local disk storage for listing photos in development.
 *
 * When Cloudflare R2 is not configured, this service provides a drop-in
 * fallback so photo uploads persist across dev server restarts.
 *
 * Files are stored under `./storage/uploads/` relative to the project root.
 * Uploaded files are served via `GET /api/v1/uploads/:key`.
 */
@Injectable()
export class LocalDiskStorageService {
  private readonly logger = new Logger(LocalDiskStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    // Resolve relative to the NestJS app root (core-hub)
    this.uploadDir = join(process.cwd(), 'storage', 'uploads');
    this.baseUrl = process.env.LOCAL_UPLOAD_BASE_URL?.replace(/\/$/, '') ?? '';
  }

  /** Ensure the upload directory exists. */
  async ensureDir(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
  }

  /**
   * Save an uploaded file buffer to disk.
   * Returns a key and the public URL to access it.
   */
  async saveFile(
    userId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<LocalUploadResult> {
    await this.ensureDir();

    const key = this.buildKey(userId, filename);
    const filePath = this.resolvePath(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    this.logger.log(`Saved local upload: ${key} (${buffer.length} bytes, ${contentType})`);

    const publicUrl = this.baseUrl
      ? `${this.baseUrl}/api/v1/uploads/${key}`
      : `/api/v1/uploads/${key}`;

    return { key, publicUrl };
  }

  /** Stream a saved file to an Express response. */
  async serveFile(key: string, res: Response): Promise<void> {
    const filePath = this.resolvePath(key);
    try {
      await access(filePath);
    } catch {
      throw new NotFoundException(`Upload ${key} not found`);
    }

    const ext = extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
    };
    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  /** Resolve a storage key to an absolute filesystem path. */
  resolvePath(key: string): string {
    // Prevent directory traversal
    const safeKey = key.replace(/\.\./g, '').replace(/^\//, '');
    return join(this.uploadDir, safeKey);
  }

  private buildKey(userId: string, filename: string): string {
    const day = new Date().toISOString().slice(0, 10);
    const ext = (extname(filename) || '.jpg').toLowerCase();
    const random = randomBytes(8).toString('hex');
    return `uploads/${userId}/${day}/${random}${ext}`;
  }
}
