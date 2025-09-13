import { Module } from '@nestjs/common';
import { LocalFileStorageModule } from './local-file-storage/local-file-storage.module';
import { GoogleCloudStorageModule } from './google-cloud-storage/google-cloud-storage.module';
import { LocalFileStorageStrategy } from './local-file-storage/local-file-storage.strategy';
import { GoogleCloudStorageStrategy } from './google-cloud-storage/google-cloud-storage.strategy';

@Module({
  imports: [LocalFileStorageModule, GoogleCloudStorageModule],
  providers: [LocalFileStorageStrategy, GoogleCloudStorageStrategy],
  exports: [LocalFileStorageStrategy, GoogleCloudStorageStrategy],
})
export class FileStorageModule {}
