import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { UserAccountService } from 'src/user-account/user-account.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UserRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAccountService: UserAccountService,
  ) {}

  async getRole(userAccountId: number) {
    return this.prisma.role.findMany({
      where: { userAccountHasRole: { some: { userAccountId } } },
    });
  }

  async updateRole(updateUserRoleDto: UpdateUserRoleDto) {
    const { userAccountId, role } = updateUserRoleDto;

    await this.userAccountService.findOne(userAccountId);

    const getCreateRoleData =
      (): Prisma.UserAccountHasRoleCreateWithoutUserAccountInput[] => {
        return role.map(({ id }) => ({
          role: { connect: { id } },
        }));
      };

    return await this.prisma.userAccount.update({
      where: { id: userAccountId },
      data: {
        userAccountHasRole: {
          deleteMany: {},
          create: getCreateRoleData(),
        },
      },
    });
  }
}
