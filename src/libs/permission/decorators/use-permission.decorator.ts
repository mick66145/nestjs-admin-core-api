import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAuthGuard } from 'src/user/user-auth.guard';
import { Permission } from '../enums/permission.enum';
import { PermissionGuard } from '../permission.guard';

export const USE_PERMISSION = 'usePermission';
export const UsePermission = (...permission: (Permission | Permission[])[]) =>
  SetMetadata(USE_PERMISSION, permission.flat());

export function UseAuthAndPermission(
  ...permission: (Permission | Permission[])[]
) {
  return applyDecorators(
    ApiBearerAuth(),
    UsePermission(...permission),
    UseGuards(UserAuthGuard, PermissionGuard),
  );
}
