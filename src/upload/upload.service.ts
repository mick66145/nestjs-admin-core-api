import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { catchPrismaErrorOrThrow } from 'src/_libs/prisma/prisma-client-error';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { plainToInstance } from 'class-transformer';
import { Prisma, FileStorage } from '@prisma/client';
import { getDeafultFolder, formatFileName } from 'src/libs/helper/file-helper';
import { FileDriver, entityName } from './upload.interface';
import {
  IFileStorageStrategy,
  IFileStorageDownloadStrategy,
} from '../third-party/file-storage/file-storage.strategy';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { UploadEntity } from './entities/upload.entity';
import { ModuleRef } from '@nestjs/core';
import { LocalFileStorageStrategy } from '../third-party/file-storage/local-file-storage/local-file-storage.strategy';
import { GoogleCloudStorageStrategy } from '../third-party/file-storage/google-cloud-storage/google-cloud-storage.strategy';

@Injectable()
export class UploadService {
  private readonly strategyMap: Map<
    FileDriver,
    IFileStorageStrategy & IFileStorageDownloadStrategy
  >;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.strategyMap = new Map<
      FileDriver,
      IFileStorageStrategy & IFileStorageDownloadStrategy
    >()
      .set(
        FileDriver.LOCAL,
        this.moduleRef.get(LocalFileStorageStrategy, { strict: false }),
      )
      .set(
        FileDriver.GOOGLE_CLOUD_STORAGE,
        this.moduleRef.get(GoogleCloudStorageStrategy, { strict: false }),
      );
  }

  public async create(file: Express.Multer.File, dto: CreateUploadDto) {
    const { path } = dto;
    const { originalname, mimetype, buffer, size } = file;
    const driver = FileDriver.LOCAL;

    const originFileName = formatFileName(dto.fileName ?? originalname);
    const fileName = `${randomUUID()}${extname(originFileName)}`;
    const defaultPath = getDeafultFolder(fileName);
    const uploadFilePath = `${path ?? defaultPath}/${fileName}`;

    const data = await this.saveFile(
      driver,
      path ?? defaultPath,
      fileName,
      mimetype,
      buffer,
      originFileName,
      size,
      uploadFilePath,
    );
    return plainToInstance(UploadEntity, data);
  }

  public async saveFile(
    driver: FileDriver,
    directory: string,
    fileName: string,
    mimetype: string,
    buffer: Buffer,
    originFileName: string,
    size: number,
    filePath: string,
  ): Promise<FileStorage> {
    let fileUrl = '';

    const strategy = this.strategyMap.get(driver);
    if (!strategy) {
      throw new Error(`Unsupported file driver: ${driver}`);
    }

    await strategy.save(filePath, buffer, {
      contentDisposition: `attachment; filename*=utf-8''${encodeURI(originFileName)}`,
      contentType: mimetype,
    });
    fileUrl = strategy.getPublicDownloadUrl(filePath);

    const data: Prisma.FileStorageCreateInput = {
      path: directory,
      driver: driver,
      originFileName,
      fileName,
      filePath,
      fileType: mimetype,
      fileSize: size,
      fileUrl,
    };

    const orm = await this.prismaService
      .$transaction(async (tx) => {
        const orm = await tx.fileStorage.create({ data });
        return orm;
      })
      .catch(catchPrismaErrorOrThrow(entityName));
    return orm;
  }

  public async download(uuid: string) {
    const orm = await this.findOrThrow(uuid);
    const strategy = this.strategyMap.get(orm.driver as FileDriver);
    if (!strategy) {
      throw new Error(`Unsupported file driver for download: ${orm.driver}`);
    }
    const buffer = await strategy.download(orm.filePath);
    return { upload: orm, buffer };
  }

  public async findAll(
    query: FindAllQueryDto,
  ): Promise<[UploadEntity[], number]> {
    const { page, limit } = query;
    const { result, ...meta } = await this.prismaService.fileStorage.pagination(
      {
        page,
        limit,
        orderBy: {
          createdAt: 'desc',
        },
      },
    );
    return [plainToInstance(UploadEntity, result), meta.totalCount];
  }

  public async findOne(uuid: string): Promise<UploadEntity> {
    const orm = await this.findOrThrow(uuid);
    return plainToInstance(UploadEntity, orm);
  }

  public async findOrThrow(uuid: string) {
    const orm = await this.prismaService.fileStorage.findFirst({
      where: { uuid },
    });
    if (!orm) {
      const response = `無此${entityName}(uuid: ${uuid})`;
      throw new HttpException(response, HttpStatus.NOT_FOUND);
    }
    return orm;
  }
}
