import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleCloudStorageService } from './google-cloud-storage.service';

@Module({
  imports: [HttpModule],
  providers: [GoogleCloudStorageService],
  exports: [GoogleCloudStorageService],
})
export class GoogleCloudStorageModule {}
