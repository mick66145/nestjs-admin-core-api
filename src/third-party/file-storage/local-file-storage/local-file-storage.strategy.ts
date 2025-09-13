import { Injectable } from '@nestjs/common';
import {
  IFileStorageStrategy,
  IFileStorageDownloadStrategy,
} from '../file-storage.strategy';
import { LocalFileStorageService } from './local-file-storage.service';

@Injectable()
export class LocalFileStorageStrategy
  implements IFileStorageStrategy, IFileStorageDownloadStrategy
{
  constructor(
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  async save(
    directory: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<void> {
    await this.localFileStorageService.save(directory, fileName, buffer);
  }

  getPublicDownloadUrl(directory: string, fileName: string): string {
    return this.localFileStorageService.getPublicDownloadUrl(
      directory,
      fileName,
    );
  }

  async download(directory: string, fileName: string): Promise<Buffer> {
    return this.localFileStorageService.download(directory, fileName);
  }
}
