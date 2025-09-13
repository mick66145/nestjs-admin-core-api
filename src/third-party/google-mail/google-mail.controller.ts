import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GoogleMailService } from './google-mail.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { entityName } from './google-mail.interface';
import { SendMailLogEntity } from './entities/mail.entity';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { SendMailDto } from './dto/send-mail.dto';

@ApiTags(`信件管理`)
@Controller('3rd/mail')
export class GoogleMailController {
  constructor(private readonly googleMailService: GoogleMailService) {}

  @ApiOperation({ summary: '發送信件' })
  @ApiOkResponse({ type: SendMailLogEntity })
  @Post()
  sendMail(@Body() dto: SendMailDto) {
    return this.googleMailService.sendMail(dto);
  }

  @ApiOperation({ summary: `取得所有${entityName}資料` })
  @ApiDataListResponse(SendMailLogEntity, { hasMeta: true })
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { data, meta } = await this.googleMailService.findAll(query);
    return new ResourceListEntity(data, meta);
  }

  @ApiOperation({ summary: `取得單一${entityName}資料` })
  @ApiOkResponse({ type: SendMailLogEntity })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.googleMailService.findOne(id);
  }
}
