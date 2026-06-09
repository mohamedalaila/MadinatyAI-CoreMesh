import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Request, Response, NextFunction } from 'express';

/**
 * Express middleware that handles PUT/GET for local file uploads.
 *
 * Registered in main.ts BEFORE NestJS routing so raw binary PUTs
 * bypass NestJS JSON body parsing entirely.
 *
 * PUT /api/v1/uploads/<key>  → saves raw body to disk
 * GET /api/v1/uploads/<key>  → streams the file back
 */
const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');

export function uploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  const prefix = '/api/v1/uploads/';
  if (!req.path.startsWith(prefix)) {
    next();
    return;
  }

  const key = req.path.slice(prefix.length);
  if (!key || key.includes('..')) {
    res.status(400).json({ error: 'Invalid upload key' });
    return;
  }

  // GET — serve file
  if (req.method === 'GET') {
    const filePath = join(UPLOAD_DIR, key);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Not found' });
      }
    });
    return;
  }

  // PUT — save raw body to disk
  if (req.method === 'PUT') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const filePath = join(UPLOAD_DIR, key);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, buffer);
        res.status(200).json({ ok: true });
      } catch {
        res.status(500).json({ error: 'Save failed' });
      }
    });
    req.on('error', () => {
      res.status(500).json({ error: 'Upload stream error' });
    });
    return;
  }

  next();
}
