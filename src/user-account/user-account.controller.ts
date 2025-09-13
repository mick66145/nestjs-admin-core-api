import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { entityName } from './user-account.interface';
import { UserAccountService } from './user-account.service';
import { UserAccountEntity } from './entities/user-account.entity';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import {
  CreateUserAccountDto,
  LoginDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/user-account.dto';

@ApiTags(`${entityName}管理`)
@Controller('user-account')
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @ApiOperation({ summary: '註冊' })
  @ApiOkResponse({ type: UserAccountEntity })
  @Post('register')
  create(@Body() dto: CreateUserAccountDto) {
    return this.userAccountService.create(dto);
  }

  @ApiOperation({ summary: '登入' })
  @ApiOkResponse({ type: UserAccountEntity })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.userAccountService.login(dto);
  }

  @ApiOperation({ summary: '修改密碼' })
  @ApiOkResponse({ type: UserAccountEntity })
  @Patch(':id/password')
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userAccountService.updatePassword(id, dto);
  }

  @ApiOperation({ summary: '重設密碼' })
  @ApiOkResponse({ type: UserAccountEntity })
  @Put(':id/password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userAccountService.resetPassword(id, dto);
  }

  @ApiOperation({ summary: `取得所有${entityName}資料` })
  @ApiDataListResponse(UserAccountEntity, { hasMeta: true })
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { data, meta } = await this.userAccountService.findAll(query);
    return new ResourceListEntity(data, meta);
  }

  @ApiOperation({ summary: `取得單一${entityName}資料` })
  @ApiOkResponse({ type: UserAccountEntity })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userAccountService.findOne(id);
  }

  @ApiOperation({ summary: `刪除${entityName}資料` })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userAccountService.remove(id);
  }
}
