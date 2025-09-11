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
import { Prisma } from '@prisma/client';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiDataListResponse } from 'src/_libs/api-response/api-data.decorator';
import { ResourceListEntity } from 'src/_libs/api-response/resource-list.entity';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import { RoleEntity } from './entities/role.entity';
import { PermissionService } from 'src/libs/permission/permission.service';
import { RolePermissionEntity } from 'src/libs/permission/entities/role-permission.entity';

@ApiTags('角色管理')
@Controller('role')
export class RoleController {
  private defaultInclude: Prisma.RoleInclude;

  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
  ) {
    this.defaultInclude = {
      roleHasPermission: true,
      userAccountHasRole: true,
    };
  }

  @ApiOperation({ summary: '建立角色資料' })
  @ApiOkResponse({ type: RoleEntity })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return plainToInstance(
      RoleEntity,
      await this.roleService.create(createRoleDto, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '取得所有角色資料' })
  @ApiDataListResponse(RoleEntity)
  @Get()
  async findAll(@Query() query: FindAllQueryDto) {
    const { page, limit } = query;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
    };

    const { result, ...meta } = await this.roleService.pagination({
      page,
      limit,
      where,
      orderBy: { id: 'desc' },
      include: this.defaultInclude,
    });

    return new ResourceListEntity(plainToInstance(RoleEntity, result), meta);
  }

  @ApiOperation({ summary: '取得單一角色資料' })
  @ApiOkResponse({ type: RoleEntity })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const where: Prisma.RoleWhereUniqueInput = {
      id,
      deletedAt: null,
    };

    await this.roleService.existsOrThrow(where);

    return plainToInstance(
      RoleEntity,
      await this.roleService.findOne(where, this.defaultInclude),
    );
  }

  @ApiOperation({ summary: '修改角色資料' })
  @ApiOkResponse({ type: RoleEntity })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const where: Prisma.RoleWhereUniqueInput = {
      id,
      deletedAt: null,
    };

    await this.roleService.existsOrThrow(where);

    return this.roleService.update(where, updateRoleDto, this.defaultInclude);
  }

  @ApiOperation({ summary: '刪除角色資料' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const where: Prisma.RoleWhereUniqueInput = {
      id,
      deletedAt: null,
    };

    await this.roleService.existsOrThrow(where);

    await this.roleService.softDelete(where);
  }

  @ApiOperation({ summary: '取得角色功能權限列表' })
  @ApiOkResponse({ type: RolePermissionEntity })
  @Get('action/get-role-permission')
  async getRolePermission() {
    return this.permissionService.getRolePermission();
  }
}
