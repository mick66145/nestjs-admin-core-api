import { Injectable } from '@nestjs/common';
import { IFileStorageStrategy, IFileStorageDownloadStrategy } from '../file-storage.strategy';
import { LocalFileStorageService } from './local-file-storage.service';

@Injectable()
export class LocalFileStorageStrategy implements IFileStorageStrategy, IFileStorageDownloadStrategy {
  constructor(private readonly localFileStorageService: LocalFileStorageService) {}

  async save(
    filePath: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void> {
    await this.localFileStorageService.save(filePath, buffer, options);
  }

  getPublicDownloadUrl(filePath: string): string {
    return this.localFileStorageService.getPublicDownloadUrl(filePath);
  }

  async download(filePath: string): Promise<Buffer> {
    return this.localFileStorageService.download(filePath);
  }
}
