import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Storage } from '@google-cloud/storage';
import { firstValueFrom } from 'rxjs';
import { GoogleCloudStorageConfigInterface } from 'src/config/third-party/third-party-config.interface';
import { FileMetadata } from './google-cloud-storage.interface';

@Injectable()
export class GoogleCloudStorageService {
  private storage: Storage;
  private bucketName: string;
  private storagePublicBaseUrl = 'https://storage.googleapis.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const { projectId, clientEmail, privateKey, bucketName } =
      this.configService.getOrThrow<GoogleCloudStorageConfigInterface>(
        'thirdParty.googleCloudStorage',
      );
    this.storage = new Storage({
      projectId,
      credentials: { client_email: clientEmail, private_key: privateKey },
    });
    this.bucketName = bucketName;
  }

  save(
    path: string,
    contentType: string,
    media: Buffer,
    fileMeta?: FileMetadata,
    customizedMetadata?: { [key: string]: string }[],
  ): Promise<void> {
    fileMeta = fileMeta ?? {};
    customizedMetadata = customizedMetadata ?? [];

    const metadata = customizedMetadata.reduce(
      (obj, item) => Object.assign(obj, item),
      {},
    );

    return new Promise((resolve, reject) => {
      const file = this.storage.bucket(this.bucketName).file(path);
      const stream = file.createWriteStream({ contentType });
      stream.on('finish', async () => {
        await file.setMetadata({ ...fileMeta, metadata });
        resolve(undefined);
      });
      stream.on('error', (err: Error) => reject(err));
      stream.write(media);
      stream.end();
    });
  }

  async exits(path: string) {
    return this.storage.bucket(this.bucketName).file(path).exists();
  }

  async getFile(path: string) {
    return this.storage.bucket(this.bucketName).file(path).get();
  }

  async download(path: string) {
    return new Promise<Buffer>((resolve, reject) => {
      const file = this.storage.bucket(this.bucketName).file(path);
      const bufferArray: any[] = [];
      const stream = file.createReadStream();
      stream.on('finish', async () => {
        resolve(Buffer.concat(bufferArray));
      });
      stream.on('error', (err: Error) => reject(err));
      stream.on('data', function (d) {
        bufferArray.push(d);
      });
    });
  }

  async downloadByPublicUrl(path: string) {
    const downloadUrl = this.getPublicDownloadUrl(path);
    const { data: arrayBuffer } = await firstValueFrom(
      this.httpService.get<ArrayBuffer>(downloadUrl, {
        responseType: 'arraybuffer',
      }),
    );
    return Buffer.from(arrayBuffer);
  }

  async delete(path: string) {
    await this.storage
      .bucket(this.bucketName)
      .file(path)
      .delete({ ignoreNotFound: true });
  }

  getPublicDownloadUrl(path: string) {
    return `${this.storagePublicBaseUrl}/${this.bucketName}/${path}`;
  }
}
