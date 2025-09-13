import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LocalFileStorageService {
  private readonly UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './storage';

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Error ensuring upload directory exists:', error);
    }
  }

  async save(
    filePath: string,
    buffer: Buffer,
    options?: { contentDisposition?: string },
  ): Promise<string> {
    const fullPath = join(this.UPLOAD_DIR, filePath);
    const dir = join(this.UPLOAD_DIR, ...filePath.split('/').slice(0, -1));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return fullPath;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = join(this.UPLOAD_DIR, filePath);
    return fs.readFile(fullPath);
  }

  getPublicDownloadUrl(filePath: string): string {
    return `${this.UPLOAD_DIR.replace('.', '')}/${filePath}`.replace('//', '/');
  }
}

