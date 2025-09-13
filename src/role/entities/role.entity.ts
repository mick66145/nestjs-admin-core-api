import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import * as $Prisma from '@prisma/client';
import { ApiSchema } from 'src/_libs/swagger/api-schema';
import { Permission } from 'src/libs/permission/enums/permission.enum';

@ApiSchema({ prefix: 'RoleEntity' })
@Exclude()
export class PermissionEntity {
  @Expose({ toClassOnly: true })
  permission!: Permission;

  @ApiProperty({ enum: Permission })
  @Expose()
  name() {
    return this.permission;
  }
}

@Exclude()
export class UserAccountHasRoleEntity {
  userAccountId!: number;
}

@Exclude()
export class RoleEntity implements $Prisma.Role {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  deletedAt!: Date | null;

  @ApiProperty({ example: '角色名稱' })
  @Expose()
  name!: string;

  @ApiProperty()
  @Expose()
  isEnabled!: boolean;

  @Expose({ toClassOnly: true })
  @Type(() => PermissionEntity)
  roleHasPermission!: PermissionEntity[];

  @ApiProperty({ type: PermissionEntity, isArray: true })
  @Expose()
  permission() {
    return this.roleHasPermission;
  }

  @Expose({ toClassOnly: true })
  @Type(() => UserAccountHasRoleEntity)
  userAccountHasRole!: UserAccountHasRoleEntity[];

  @ApiProperty({ type: 'number', example: 1 })
  @Expose()
  userCount() {
    return this.userAccountHasRole.length;
  }
}
