import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { entityName } from './e8d-sms.interface';
import { E8dSmsService } from './e8d-sms.service';
import { SendSmsLogEntity } from './entities/e8d.entity';
import { SendSmsDto } from './dto/send-sms.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';

@ApiTags(`簡訊管理`)
@Controller('3rd/sms')
export class E8dSmsController {
  constructor(private readonly e8dSmsService: E8dSmsService) {}

  @ApiOperation({ summary: '查詢剩餘點數' })
  @ApiOkResponse({ type: Object })
  @Get('credit')
  getCredit() {
    return this.e8dSmsService.getCredit();
  }

  @ApiOperation({ summary: '發送簡訊' })
  @ApiOkResponse({ type: SendSmsLogEntity })
  @Post()
  sendSms(@Body() dto: SendSmsDto) {
    return this.e8dSmsService.sendSms(dto);
  }

  @ApiOperation({ summary: `取得所有${entityName}資料` })
  @ApiDataListResponse(SendSmsLogEntity, { hasMeta: true })
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { data, meta } = await this.e8dSmsService.findAll(query);
    return new ResourceListEntity(data, meta);
  }

  @ApiOperation({ summary: `取得單一${entityName}資料` })
  @ApiOkResponse({ type: SendSmsLogEntity })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.e8dSmsService.findOne(id);
  }
}
