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
    directory: string,
    fileName: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void> {
    await this.googleCloudStorageService.save(
      directory,
      fileName,
      options?.contentType || 'application/octet-stream',
      buffer,
      options,
    );
  }

  getPublicDownloadUrl(directory: string, fileName: string): string {
    return this.googleCloudStorageService.getPublicDownloadUrl(
      directory,
      fileName,
    );
  }

  async download(directory: string, fileName: string): Promise<Buffer> {
    return this.googleCloudStorageService.download(directory, fileName);
  }
}
