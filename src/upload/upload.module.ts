import { Module } from '@nestjs/common';
import { GoogleCloudStorageModule } from 'src/third-party/google-cloud-storage/google-cloud-storage.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [GoogleCloudStorageModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
