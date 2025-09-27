import { ApiProperty } from '@nestjs/swagger';
import { FileStorage } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UploadEntity implements FileStorage {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  uuid!: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: '原始檔案名稱', example: 'IMG_0876' })
  @Expose()
  originFileName!: string;

  @ApiProperty({ description: '檔案名稱', example: 'IMG_0876' })
  @Expose()
  fileName!: string;

  @ApiProperty({ description: '檔案類型', example: 'image/png' })
  @Expose()
  fileType!: string;

  @ApiProperty({ description: '檔案大小(bytes)', example: 1000 })
  @Expose()
  fileSize!: number;

  @ApiProperty({ description: '檔案 URL' })
  @Expose()
  fileUrl!: string;

  path!: string;
  driver!: string;
  filePath!: string;
  deletedAt!: Date | null;
}
