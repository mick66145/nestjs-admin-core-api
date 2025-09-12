import { Injectable } from '@nestjs/common';
import { Permission } from './enums/permission.enum';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { uniq } from 'lodash';
import { Prisma } from '@prisma/client';
import { abort } from 'src/_libs/api-response/abort.util';
import {
  PermissionAction,
  PermissionActionName,
  PermissionSetList,
} from './permission-set-list';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  private async _getRolesPermission(
    role: Prisma.RoleGetPayload<{ include: { roleHasPermission: true } }>[],
  ): Promise<Permission[]> {
    return uniq(
      role
        .flatMap(({ roleHasPermission }) => roleHasPermission)
        .map(({ permission }) => <Permission>permission),
    );
  }

  async getByRole(roleId: number | number[]): Promise<Permission[]> {
    roleId = Array.isArray(roleId) ? roleId : [roleId];

    const role = await this.prisma.role.findMany({
      where: { id: { in: roleId } },
      include: { roleHasPermission: true },
    });

    return this._getRolesPermission(role);
  }

  async getByUser(userAccountId: number | number[]): Promise<Permission[]> {
    userAccountId = Array.isArray(userAccountId)
      ? userAccountId
      : [userAccountId];

    const userAccount = await this.prisma.userAccount.findMany({
      where: { id: { in: userAccountId } },
      include: {
        userAccountHasPermission: true,
        userAccountHasRole: {
          include: {
            role: {
              include: { roleHasPermission: true },
            },
          },
        },
      },
    });

    return uniq([
      ...userAccount
        .flatMap(({ userAccountHasPermission }) => userAccountHasPermission)
        .map(({ permission }) => <Permission>permission),
      ...(await this._getRolesPermission(
        userAccount.flatMap(({ userAccountHasRole }) =>
          userAccountHasRole.flatMap(({ role }) => role),
        ),
      )),
    ]);
  }

  async checkByRole(roleId: number | number[], needPermission: Permission[]) {
    const hasPermission = await this.getByRole(roleId);

    await this.checkPermission(hasPermission, needPermission);
  }

  async checkByUser(userId: number | number[], needPermission: Permission[]) {
    const hasPermission = await this.getByUser(userId);

    await this.checkPermission(hasPermission, needPermission);
  }

  async checkPermission(
    hasPermission: Permission[],
    needPermission: Permission[],
  ) {
    const lackPermission: Permission[] = [];

    for (const permission of needPermission) {
      if (!hasPermission.includes(permission)) {
        lackPermission.push(permission);
      }
    }

    if (lackPermission.length > 0) {
      abort(`權限不足，缺少${lackPermission.join(',')}權限`);
    }
  }

  async getRolePermission(): Promise<RolePermissionEntity> {
    const menu = PermissionSetList.map(
      ({ featureName, displayName, permission }) => {
        return {
          featureName,
          displayName,
          permission: permission.map((action) => {
            const ruleName = `${featureName}__${action}`.toLocaleUpperCase();

            if (Permission[ruleName] === undefined) {
              abort(`權限設定與權限列表不一致`);
            }

            return {
              action,
              displayName: PermissionActionName[action],
              name: Permission[ruleName],
            };
          }),
        };
      },
    );

    const action = Object.entries(PermissionAction).map(([value]) => {
      return {
        name: value,
        displayName: PermissionActionName[value],
      };
    });

    return plainToInstance(RolePermissionEntity, { action, menu });
  }
}
