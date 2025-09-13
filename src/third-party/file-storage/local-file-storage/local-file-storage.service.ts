import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LocalFileStorageService {
  private readonly UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './storage/app';

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
    directory: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<string> {
    const finalDir = join(this.UPLOAD_DIR, directory);
    const fullPath = join(finalDir, fileName);
    await fs.mkdir(finalDir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return join(directory, fileName);
  }

  async download(directory: string, fileName: string): Promise<Buffer> {
    const fullPath = join(this.UPLOAD_DIR, directory, fileName);
    return fs.readFile(fullPath);
  }

  getPublicDownloadUrl(directory: string, fileName: string): string {
    const filePath = join(directory, fileName);
    return `${this.UPLOAD_DIR.replace('.', '')}/${filePath}`.replace('//', '/');
  }
}
