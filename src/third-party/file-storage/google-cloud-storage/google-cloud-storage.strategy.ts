import { Injectable } from '@nestjs/common';
import {
  IFileStorageStrategy,
  IFileStorageDownloadStrategy,
} from '../file-storage.strategy';
import { GoogleCloudStorageService } from './google-cloud-storage.service';

@Injectable()
export class GoogleCloudStorageStrategy
  implements IFileStorageStrategy, IFileStorageDownloadStrategy
{
  constructor(
    private readonly googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  async save(
    filePath: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void> {
    await this.googleCloudStorageService.save(
      filePath,
      'application/octet-stream',
      buffer,
      options,
    );
  }

  getPublicDownloadUrl(filePath: string): string {
    return this.googleCloudStorageService.getPublicDownloadUrl(filePath);
  }

  async download(filePath: string): Promise<Buffer> {
    return this.googleCloudStorageService.downloadByPublicUrl(filePath);
  }
}
