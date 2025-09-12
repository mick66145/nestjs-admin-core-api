import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { PermissionService } from 'src/libs/permission/permission.service';
import { UserAccountService } from 'src/user-account/user-account.service';
import { UserRoleService } from 'src/role/user-role.service';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto, CreateRootUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRolePermissionEntity } from './entities/profile.entity';
import { abort } from 'src/_libs/api-response/abort.util';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';

const entityName = '總後台管理員';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAccountService: UserAccountService,
    private readonly userRoleService: UserRoleService,
    private readonly userAuthService: UserAuthService,
    private readonly permissionService: PermissionService,
  ) {}

  async create(createUserDto: CreateUserDto, include?: Prisma.UserInclude) {
    const { account, password, name, email, phone, isValid, isEnabled, role } =
      createUserDto;

    await this.userAuthService.checkAccountExists(account);

    return this.prisma
      .$transaction(async (tx) => {
        const user = await this.userAccountService.create({
          account,
          password,
        });

        await this.userRoleService.updateRole({
          userAccountId: user.id,
          role: [role],
        });

        const data: Prisma.UserCreateInput = {
          phone,
          email,
          name,
          isValid,
          isEnabled,
          userAccount: { connect: user },
        };

        return tx.user.create({ data, include });
      })
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
  }

  async createRoot(dto: CreateRootUserDto, include?: Prisma.UserInclude) {
    const { account, password, name, email, phone, isValid, isEnabled } = dto;
    const isRoot = true;

    await this.userAuthService.checkAccountExists(account);

    return this.prisma
      .$transaction(async (tx) => {
        const user = await this.userAccountService.create({
          account,
          password,
        });

        const data: Prisma.UserCreateInput = {
          phone,
          email,
          name,
          isValid,
          isEnabled,
          isRoot,
          userAccount: { connect: user },
        };

        return tx.user.create({ data, include });
      })
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
  }

  findAll(params: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }) {
    const { where, orderBy, include } = params;

    return this.prisma.user.findMany({
      where,
      orderBy,
      include,
    });
  }

  pagination(params: {
    page?: number;
    limit?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }) {
    const { page, limit, where, orderBy, include } = params;

    return this.prisma.user.pagination({
      page,
      limit,
      where,
      orderBy,
      include,
    });
  }

  findOne(where: Prisma.UserWhereUniqueInput, include?: Prisma.UserInclude) {
    return this.prisma.user.findUnique({ where, include });
  }

  async findByAccountOrThrow(params: { account: string }) {
    const { account } = params;

    const user = await this.prisma.user.findFirst({
      where: {
        userAccount: { account },
      },
    });

    if (user === null) {
      abort('找無此總後台管理員', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async findFirstOrThrow(
    where: Prisma.UserWhereInput,
    include?: Prisma.UserInclude,
  ) {
    const user = await this.prisma.user.findFirst({ where, include });

    if (user === null) {
      abort(`找無此${entityName}`, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async update(
    where: Prisma.UserWhereUniqueInput,
    updateUserDto: UpdateUserDto,
    include?: Prisma.UserInclude,
  ) {
    const { name, email, phone, isValid, isEnabled, role } = updateUserDto;

    const data: Prisma.UserUpdateInput = {
      name,
      email,
      phone,
      isValid,
      isEnabled,
    };

    return this.prisma
      .$transaction(async (tx) => {
        const result = await tx.user.update({ where, data, include });

        if (role !== undefined) {
          await this.userRoleService.updateRole({
            userAccountId: where.userAccountId!,
            role: [role],
          });
        }

        return result;
      })
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
  }

  async remove(where: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({ where });

    if (user === null) {
      abort('找無此總後台管理員', HttpStatus.NOT_FOUND);
    }

    return await this.userAccountService
      .remove(user.userAccountId)
      .catch((err) => {
        dealWithPrismaClientError(err, entityName);
        throw err;
      });
  }

  exists(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.exists({ where });
  }

  async existsOrThrow(where: Prisma.UserWhereUniqueInput) {
    const isExists = await this.prisma.user.exists({ where });

    if (!isExists) {
      abort('找無此總後台管理員', HttpStatus.NOT_FOUND);
    }

    return isExists;
  }

  async getRolePermissions(
    userAccountId: number,
  ): Promise<UserRolePermissionEntity> {
    await this.existsOrThrow({ userAccountId });

    const user = (await this.findOne({ userAccountId }))!;

    const getPermissions = async () => {
      if (user.isRoot) {
        return (await this.permissionService.getRolePermission()).menu.flatMap(
          ({ permission }) => permission.map(({ name }) => name),
        );
      }

      return await this.permissionService.getByUser(userAccountId);
    };

    const permissions = await getPermissions();
    const roles = await this.userRoleService.getRole(userAccountId);

    return plainToInstance(UserRolePermissionEntity, {
      roles,
      permissions: permissions.map((permission) => ({ name: permission })),
    });
  }
}
