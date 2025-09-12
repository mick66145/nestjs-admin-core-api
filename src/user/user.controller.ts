import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { $PrismaWhereInput } from 'src/libs/prisma/where-input';
import { PermissionService } from 'src/libs/permission/permission.service';
import { UserAccountService } from 'src/user-account/user-account.service';
import { ResetPasswordDto } from 'src/user-account/dto/user-account.dto';
import { RoleService } from 'src/role/role.service';
import { UserService } from './user.service';
import { CreateUserDto, CreateRootUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { UserEntity } from './entities/user.entity';
import { CheckPermissionDto } from './dto/check-permission.dto';
import { abortIf } from 'src/_libs/api-response/abort.util';

@ApiTags('總後台管理員管理')
@Controller('user')
export class UserController {
  private defaultInclude: Prisma.UserInclude;

  constructor(
    private readonly userAccountService: UserAccountService,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {
    this.defaultInclude = {
      userAccount: {
        include: {
          userAccountHasRole: {
            include: {
              role: {
                include: { roleHasPermission: true },
              },
            },
          },
        },
      },
    };
  }

  @ApiOperation({ summary: '建立總後台管理員資料' })
  @ApiOkResponse({ type: UserEntity })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const { role, phone, email } = createUserDto;

    // 檢查角色
    await this.roleService.existsOrThrow({ id: role.id, deletedAt: null });

    // 檢查手機跟信箱是否唯一
    const checkPhoneEmail = async () => {
      const user = await this.userService.findAll({
        where: { OR: [{ phone }, { email }] },
      });

      abortIf(user.length > 0, '此手機或信箱已被使用');
    };
    await checkPhoneEmail();

    return plainToInstance(
      UserEntity,
      await this.userService.create(createUserDto, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '建立根帳號總後台管理員資料' })
  @ApiOkResponse({ type: UserEntity })
  @Post('root')
  async createRoot(@Body() dto: CreateRootUserDto) {
    const { phone, email } = dto;

    // 檢查手機跟信箱是否唯一
    const checkPhoneEmail = async () => {
      const user = await this.userService.findAll({
        where: { OR: [{ phone }, { email }] },
      });

      abortIf(user.length > 0, '此手機或信箱已被使用');
    };
    await checkPhoneEmail();

    return plainToInstance(
      UserEntity,
      await this.userService.createRoot(dto, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '取得所有總後台管理員資料' })
  @ApiDataListResponse(UserEntity)
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { page, limit, ids, roleIds, keyword } = query;
    const where: Prisma.UserWhereInput = { userAccountId: { in: ids } };

    where.AND = [];
    if (keyword !== undefined) {
      const keywordWhere =
        $PrismaWhereInput.whereKeywordInput<Prisma.UserWhereInput>(
          ['name', 'email', 'phone'],
          keyword,
        );
      $PrismaWhereInput.mergeWhereInput(where.AND, {
        OR: [
          ...keywordWhere,
          { userAccount: { account: { contains: keyword } } },
        ],
      });
    }

    if (roleIds !== undefined) {
      where.userAccount = {
        userAccountHasRole: { some: { roleId: { in: roleIds } } },
      };
    }

    const { result, ...meta } = await this.userService.pagination({
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: this.defaultInclude,
    });

    return new ResourceListEntity(plainToInstance(UserEntity, result), meta);
  }

  @ApiOperation({ summary: '取得單一總後台管理員資料' })
  @ApiOkResponse({ type: UserEntity })
  @Get(':userAccountId')
  async findOne(@Param('userAccountId', ParseIntPipe) userAccountId: number) {
    const where: Prisma.UserWhereUniqueInput = {
      userAccountId,
    };

    await this.userService.existsOrThrow(where);

    return plainToInstance(
      UserEntity,
      await this.userService.findOne(where, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '修改總後台管理員資料' })
  @ApiOkResponse({ type: UserEntity })
  @Patch(':userAccountId')
  async update(
    @Param('userAccountId', ParseIntPipe) userAccountId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { phone, email, role } = updateUserDto;

    const where: Prisma.UserWhereUniqueInput = {
      userAccountId,
    };
    await this.userService.existsOrThrow(where);

    // 檢查角色
    if (role) {
      await this.roleService.existsOrThrow({ id: role.id, deletedAt: null });
    }

    // 檢查手機跟信箱是否唯一
    const checkPhoneEmail = async () => {
      const user = await this.userService.findAll({
        where: {
          userAccountId: { not: userAccountId },
          OR: [{ phone }, { email }],
        },
      });

      abortIf(user.length > 0, '此手機或信箱已被使用');
    };

    await checkPhoneEmail();

    return plainToInstance(
      UserEntity,
      await this.userService.update(where, updateUserDto, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '刪除總後台管理員資料' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':userAccountId')
  async remove(@Param('userAccountId', ParseIntPipe) userAccountId: number) {
    const where: Prisma.UserWhereUniqueInput = {
      userAccountId,
    };

    await this.userService.existsOrThrow(where);

    await this.userService.remove(where);
  }

  @ApiOperation({ summary: '重置總後台管理員密碼' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':userAccountId/action/reset-password')
  async resetPassword(
    @Param('userAccountId', ParseIntPipe) userAccountId: number,
    @Body() resetPassword: ResetPasswordDto,
  ) {
    const where: Prisma.UserWhereUniqueInput = {
      userAccountId,
    };

    await this.userService.existsOrThrow(where);

    await this.userAccountService.resetPassword(userAccountId, resetPassword);
  }

  @ApiOperation({ summary: '驗證使用者權限' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':userAccountId/action/check-permission')
  async checkPermission(
    @Param('userAccountId', ParseIntPipe) userAccountId: number,
    @Body() checkPermissionDto: CheckPermissionDto,
  ) {
    const { permissions } = checkPermissionDto;

    const user = await this.userService.findFirstOrThrow({ userAccountId });

    if (user.isRoot) return;

    await this.permissionService.checkByUser(userAccountId, permissions);
  }
}
