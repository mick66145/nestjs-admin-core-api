import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Res,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { entityName } from './upload.interface';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { UploadEntity } from './entities/upload.entity';

@ApiTags(`${entityName}管理`)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: `上傳${entityName}` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: UploadEntity })
  @Post()
  async upload(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Body() dto: CreateUploadDto,
  ) {
    return this.uploadService.upload(file, dto);
  }

  @ApiOperation({ summary: `下載${entityName}` })
  @ApiOkResponse({
    content: {
      'application/octet-stream': {
        schema: { type: 'object' },
      },
    },
  })
  @Get(':uuid/action/download')
  async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
    const { upload, buffer } = await this.uploadService.download(uuid);
    const downloadName = encodeURI(upload.originFileName);
    res
      .set({
        'Content-Type': upload.fileType,
        'Content-Disposition': `attachment; filename*=utf-8''${downloadName}`,
      })
      .end(buffer);
  }

  // **********
  // Read
  // **********

  @ApiOperation({ summary: `取得所有${entityName}` })
  @ApiDataListResponse(UploadEntity, { hasMeta: true })
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { data, meta } = await this.uploadService.findAll(query);
    return new ResourceListEntity(data, meta);
  }

  @ApiOperation({ summary: `取得單一${entityName}` })
  @ApiOkResponse({ type: UploadEntity })
  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.uploadService.findOne(uuid);
  }
}
