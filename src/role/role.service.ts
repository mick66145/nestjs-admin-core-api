import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { abort } from 'src/_libs/api-response/abort.util';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRoleDto: CreateRoleDto, include?: Prisma.RoleInclude) {
    const { name, isEnabled, permission } = createRoleDto;

    const data: Prisma.RoleCreateInput = {
      name,
      isEnabled,
      roleHasPermission: {
        create: permission.map(({ name }) => ({
          permission: name,
        })),
      },
    };

    return this.prisma.role.create({ data, include });
  }

  findAll(params: {
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
    include?: Prisma.RoleInclude;
  }) {
    const { where, orderBy, include } = params;

    return this.prisma.role.findMany({
      where,
      orderBy,
      include,
    });
  }

  pagination(params: {
    page?: number;
    limit?: number;
    cursor?: Prisma.RoleWhereUniqueInput;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
    include?: Prisma.RoleInclude;
  }) {
    const { page, limit, where, orderBy, include } = params;

    return this.prisma.role.pagination({
      page,
      limit,
      where,
      orderBy,
      include,
    });
  }

  findOne(where: Prisma.RoleWhereUniqueInput, include?: Prisma.RoleInclude) {
    return this.prisma.role.findUnique({ where, include });
  }

  update(
    where: Prisma.RoleWhereUniqueInput,
    updateRoleDto: UpdateRoleDto,
    include?: Prisma.RoleInclude,
  ) {
    const { name, isEnabled, permission } = updateRoleDto;

    const data: Prisma.RoleUpdateInput = {
      name,
      isEnabled,
    };

    if (permission !== undefined) {
      data.roleHasPermission = {
        deleteMany: {},
        create: permission.map(({ name }) => ({
          permission: name,
        })),
      };
    }

    return this.prisma.role.update({ where, data, include });
  }

  async remove(where: Prisma.RoleWhereUniqueInput) {
    if (await this.hasUser(where.id!)) {
      abort('此角色已被設定，無法刪除');
    }

    return this.prisma.role.delete({ where });
  }

  async softDelete(where: Prisma.RoleWhereUniqueInput) {
    if (await this.hasUser(where.id!)) {
      abort('此角色已被設定，無法刪除');
    }

    return this.prisma.role.softDelete({ where });
  }

  exists(where: Prisma.RoleWhereUniqueInput) {
    return this.prisma.role.exists({ where });
  }

  async existsOrThrow(where: Prisma.RoleWhereUniqueInput) {
    const isExists = await this.prisma.role.exists({ where });

    if (!isExists) {
      abort('找無此角色', HttpStatus.NOT_FOUND);
    }

    return isExists;
  }

  async hasUser(roleId: number) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, userAccountHasRole: { some: {} } },
    });

    return role !== null;
  }
}
