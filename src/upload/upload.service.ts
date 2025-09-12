import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { catchPrismaErrorOrThrow } from 'src/_libs/prisma/prisma-client-error';
import { formatFileName } from 'src/libs/helper/file-helper';
import { GoogleCloudStorageService } from 'src/third-party/google-cloud-storage/google-cloud-storage.service';
import { entityName } from './upload.interface';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { UploadEntity } from './entities/upload.entity';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  async upload(file: Express.Multer.File, dto: CreateUploadDto) {
    const { path } = dto;
    const { originalname, mimetype, buffer, size } = file;
    const originFileName = formatFileName(dto.fileName ?? originalname);
    const fileName = `${randomUUID()}${extname(originFileName)}`;
    const filePath = `${path}/${fileName}`;

    const data: Prisma.FileStorageCreateInput = {
      path,
      originFileName,
      fileName,
      filePath,
      fileSize: size,
      fileType: mimetype,
      fileUrl: this.googleCloudStorageService.getPublicDownloadUrl(filePath),
    };
    const orm = await this.prisma
      .$transaction(async (tx) => {
        const orm = await tx.fileStorage.create({ data });
        const downloadName = encodeURI(originFileName);
        await this.googleCloudStorageService.save(filePath, mimetype, buffer, {
          contentDisposition: `attachment; filename*=utf-8''${downloadName}`,
        });
        return orm;
      })
      .catch(catchPrismaErrorOrThrow(entityName));
    return plainToInstance(UploadEntity, orm);
  }

  async download(uuid: string) {
    const orm = await this.findOrThrow(uuid);
    const buffer = await this.googleCloudStorageService.downloadByPublicUrl(
      orm.filePath,
    );
    return { upload: orm, buffer };
  }

  // **********
  // Read
  // **********

  async findAll(query: FindAllQueryDto) {
    const { uuids, startAt, endAt } = query;

    const where: Prisma.FileStorageWhereInput = {
      createdAt: { gte: startAt, lte: endAt },
    };
    if (uuids?.length) where.uuid = { in: uuids };

    const { page, limit } = query;
    const { result, ...meta } = await this.prisma.fileStorage.pagination({
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: plainToInstance(UploadEntity, result),
      meta,
    };
  }

  async findOne(uuid: string) {
    const orm = await this.findOrThrow(uuid);
    return plainToInstance(UploadEntity, orm);
  }

  // **********
  // Support Methods
  // **********

  async findOrThrow(uuid: string) {
    const orm = await this.prisma.fileStorage.findFirst({
      where: { uuid },
    });
    if (!orm) {
      const response = `無此${entityName}(uuid: ${uuid})`;
      throw new HttpException(response, HttpStatus.NOT_FOUND);
    }
    return orm;
  }
}
