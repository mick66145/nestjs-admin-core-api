import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiSchema } from 'src/_libs/swagger/api-schema';
import { UserAccountEntity } from './user.entity';
import { User } from '@prisma/client';

@Exclude()
export class ProfileEntityUserAccountEntity extends UserAccountEntity {}

@Exclude()
export class ProfileEntity implements User {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: '後台使用者名稱', example: '後台使用者名稱' })
  @Expose()
  name!: string;

  @ApiProperty({ description: '手機', example: '0912345678' })
  @Expose()
  phone!: string;

  @ApiProperty({ description: 'Email', example: 'example@mail.com' })
  @Expose()
  email!: string;

  @ApiProperty({ description: '是否已驗證' })
  @Expose()
  isValid!: boolean;

  @ApiProperty({ description: '是否為超級管理員帳號' })
  @Expose()
  isRoot!: boolean;

  @ApiProperty({ type: ProfileEntityUserAccountEntity })
  @Expose()
  @Type(() => ProfileEntityUserAccountEntity)
  userAccount!: ProfileEntityUserAccountEntity;

  isEnabled!: boolean;
  userAccountId!: number;
}

@ApiSchema({ prefix: 'UserRolePermissionEntity' })
@Exclude()
export class RoleEntity {
  @ApiProperty({ description: '角色ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: '角色名稱', example: '管理員' })
  @Expose()
  name!: string;
}

@ApiSchema({ prefix: 'UserRolePermissionEntity' })
@Exclude()
export class PermissionEntity {
  @ApiProperty({ description: '權限名稱', example: 'MEMBER__VIEW' })
  @Expose()
  name!: string;
}

@Exclude()
export class UserRolePermissionEntity {
  @ApiProperty({ type: RoleEntity, isArray: true })
  @Expose()
  @Type(() => RoleEntity)
  roles!: RoleEntity[];

  @ApiProperty({ type: PermissionEntity, isArray: true })
  @Expose()
  @Type(() => PermissionEntity)
  permissions!: PermissionEntity[];
}
